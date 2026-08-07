import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
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
    const finalReferredBy = referralCode || cookieRef || null;

    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. INTERACTIVE TRANSACTION
    const newUser = await prisma.$transaction(async (tx) => {
      
      // A. Create the base user (No referral code generated for them yet)
      const createdUser = await tx.user.create({
        data: {
          firstName,
          middleName: middleName || null, 
          lastName,
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
          referredBy: finalReferredBy,          
          wallet: { create: { balance: 0.00 } }
        },
      });

      // B. Clear the used OTP
      await tx.otpCode.delete({
        where: { email }, 
      });

      // C. Process Referral Reward if a code was provided
      if (finalReferredBy) {
        const referrer = await tx.user.findUnique({ 
          where: { referralCode: finalReferredBy } 
        });

        // Only create the pending reward if the referrer actually exists in the DB
        if (referrer) {
          const rewardSetting = await tx.globalSetting.findUnique({ 
            where: { key: 'REFERRAL_REWARD_AMOUNT' } 
          });
          const dynamicReward = rewardSetting ? Number(rewardSetting.value) : 1000.00;

          await tx.referral.create({
            data: {
              referrerId: referrer.id,
              referredUserId: createdUser.id,
              status: "PENDING",
              rewardAmount: dynamicReward
            }
          });
        }
      }

      return createdUser;
    });

    return NextResponse.json({ message: "User created successfully", userId: newUser.id }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "Internal server error while creating account." }, { status: 500 });
  }
}
