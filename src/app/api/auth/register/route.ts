import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { notificationQueue } from "@/lib/queue";
import { logUserActivity } from "@/lib/activity-logger";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
                      req.headers.get("x-real-ip") || 
                      "unknown";
    
    const { 
      firstName, middleName, lastName, email: rawEmail, 
      phone, whatsapp, password, gender, state, lga, 
      street, buildingNo, otpCode, referralCode 
    } = body;

    // 1. Strict Basic Validation
    if (!firstName || !lastName || !rawEmail || !password || !phone || !whatsapp || !gender || !state || !lga || !street || !otpCode) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // --- MASKED EMAIL FILTERING ---
    let email = rawEmail.toLowerCase().trim();
    if (email.includes('@')) {
      const [localPart, domain] = email.split('@');
      const cleanLocal = localPart.split('+')[0]; 
      email = `${cleanLocal}@${domain}`;
    }

    // 2. VERIFY THE OTP
    const validOtp = await prisma.otpCode.findUnique({
      where: { email },
    });

    if (!validOtp || validOtp.code !== otpCode) {
      return NextResponse.json({ message: "Invalid or missing verification code." }, { status: 400 });
    }

    if (validOtp.expiresAt < new Date()) {
      return NextResponse.json({ message: "Verification code has expired. Please request a new one." }, { status: 400 });
    }

    // 3. CHECK FOR DUPLICATES
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [ { email }, { phone }, { whatsapp } ]
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with these details already exists." }, 
        { status: 409 }
      );
    }

    // 4. PREPARE REFERRAL DATA (Who brought them in?)
    const cookieStore = await cookies();
    const cookieRef = cookieStore.get('lorabiz_ref')?.value;
    
    // Check if they manually typed a code, otherwise fallback to the silent cookie
    const rawRefCode = (referralCode || cookieRef || "")?.trim();
    const finalReferredBy = rawRefCode.length > 0 ? rawRefCode : null;

    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. INTERACTIVE TRANSACTION
    const newUser = await prisma.$transaction(async (tx) => {
      // Find matching referrer (case-insensitive & trimmed)
      let matchedReferrer: { id: string; referralCode: string | null } | null = null;
      if (finalReferredBy) {
        matchedReferrer = await tx.user.findFirst({
          where: {
            referralCode: {
              equals: finalReferredBy,
              mode: "insensitive"
            }
          },
          select: { id: true, referralCode: true }
        });
      }

      // A. Create the base user
      const createdUser = await tx.user.create({
        data: {
          firstName: firstName.trim(),
          middleName: middleName ? middleName.trim() : null, 
          lastName: lastName.trim(),
          email, 
          phone,
          whatsapp,
          passwordHash: hashedPassword,
          gender: gender.toUpperCase(), 
          state,
          lga,
          street,
          buildingNo: buildingNo || null, 
          ipAddress,
          referredBy: matchedReferrer?.referralCode || finalReferredBy,          
          wallet: { create: { balance: 0.00 } }
        },
      });

      // B. Clear the used OTP
      await tx.otpCode.delete({
        where: { email }, 
      });

      // C. Process Referral & Generate Welcome Promo Code
      if (matchedReferrer && matchedReferrer.id !== createdUser.id) {
        // Check if the referral system is active globally (Master Kill Switch)
        const isReferralActiveSetting = await tx.globalSetting.findUnique({ 
          where: { key: 'REFERRAL_ACTIVE' } 
        });
        
        // Default to true if setting doesn't exist yet, or check explicit string value
        const isReferralActive = !isReferralActiveSetting || isReferralActiveSetting.value === 'true';

        if (isReferralActive) {
          // 1. Create / Upsert the Referral Link Record (Valid for 12 months)
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

          await tx.referral.upsert({
            where: { referredUserId: createdUser.id },
            create: {
              referrerId: matchedReferrer.id,
              referredUserId: createdUser.id,
              expiresAt: oneYearFromNow
            },
            update: {
              referrerId: matchedReferrer.id,
              expiresAt: oneYearFromNow
            }
          });

          // 2. Generate the dynamic Welcome Promo Code for the new user
          const shortId = createdUser.id.slice(-6).toUpperCase();
          
          // Checking if admin set a custom discount percentage, otherwise fallback to 5%
          const discountSetting = await tx.globalSetting.findUnique({
            where: { key: 'REFERRAL_DISCOUNT_PCT' }
          });
          const discountPct = discountSetting ? Number(discountSetting.value) : 5;

          await tx.promoCode.create({
            data: {
              code: `WELCOME-${shortId}`,
              discountPct: discountPct,
              usageLimit: 1,              // Can only be used once globally
              perUserLimit: 1,            // Max one time per user
              restrictedServices: ["ALL"], // Available for all valid promo services
              isActive: true
            }
          });
        }
      }

      return createdUser;
    });

    // 6. Log User Registration Activity & Dispatch Welcome Email (Non-blocking)
    logUserActivity({
      userId: newUser.id,
      action: "USER_REGISTERED",
      category: "AUTH",
      description: "Account created and verified",
      req,
    });

    try {
      const host = req.headers.get("host") || "lorabiz.com";
      const protocol = host.includes("localhost") ? "http" : "https";
      const baseUrl = `${protocol}://${host}`;

      await notificationQueue.add(
        "send-welcome-email",
        {
          type: "WELCOME_EMAIL",
          userId: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName || "Valued Client",
          baseUrl,
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
          removeOnComplete: true,
        }
      );
    } catch (queueErr) {
      console.error("Failed to enqueue welcome email:", queueErr);
    }

    return NextResponse.json({ message: "User created successfully", userId: newUser.id }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "Internal server error while creating account." }, { status: 500 });
  }
}
