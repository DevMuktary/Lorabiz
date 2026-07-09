import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // --- IP TRACKING & SECURITY ---
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
                      req.headers.get("x-real-ip") || 
                      "unknown";

    if (ipAddress !== "unknown") {
      // 1. Check permanent blocklist
      const isBlocked = await prisma.blockedIp.findUnique({ where: { ip: ipAddress } });
      if (isBlocked) {
        return NextResponse.json(
          { message: "Access denied from this network. Please contact customer support." }, 
          { status: 403 }
        );
      }

      // 2. Check 7-Day Registration Cooldown
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentRegistration = await prisma.user.findFirst({
        where: {
          ipAddress,
          createdAt: { gte: sevenDaysAgo },
        },
      });

      if (recentRegistration) {
        return NextResponse.json(
          { message: "Recent registration detected from your network. Please wait 7 days or contact support to open another account." }, 
          { status: 429 }
        );
      }
    }
    
    // Destructure fields, renaming email to rawEmail so we can sanitize it
    const { 
      firstName, 
      middleName, 
      lastName, 
      email: rawEmail, 
      phone, 
      whatsapp,
      password,
      gender,
      state,
      lga,
      street,
      buildingNo,
      otpCode 
    } = body;

    // 1. Strict Basic Validation
    if (!firstName || !lastName || !rawEmail || !password || !phone || !whatsapp || !gender || !state || !lga || !street || !otpCode) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // --- MASKED EMAIL SUBADDRESS FILTERING ---
    // Converts "user+alias@gmail.com" to "user@gmail.com" and forces lowercase
    let email = rawEmail.toLowerCase().trim();
    if (email.includes('@')) {
      const [localPart, domain] = email.split('@');
      const cleanLocal = localPart.split('+')[0]; // Strip everything after '+'
      email = `${cleanLocal}@${domain}`;
    }

    // 2. VERY SECURE: Check the OTP directly in the database using the sanitized email
    const validOtp = await prisma.otpCode.findUnique({
      where: { email },
    });

    if (!validOtp) {
      return NextResponse.json(
        { message: "Please request a verification code first." }, 
        { status: 400 }
      );
    }
    
    if (validOtp.code !== otpCode) {
      return NextResponse.json(
        { message: "Invalid verification code." }, 
        { status: 400 }
      );
    }

    if (validOtp.expiresAt < new Date()) {
      return NextResponse.json(
        { message: "Verification code has expired. Please request a new one." }, 
        { status: 400 }
      );
    }

    // 3. Check if the user already exists with this clean email, phone, or whatsapp
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone },
          { whatsapp }
        ]
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
      }
      return NextResponse.json({ message: "An account with this phone or WhatsApp number already exists." }, { status: 409 });
    }

    // 4. Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. ATOMIC TRANSACTION: Create User, Initialize Wallet, AND Delete OTP simultaneously
    const [newUser] = await prisma.$transaction([
      prisma.user.create({
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
          wallet: {
            create: { balance: 0.00 } 
          }
        },
      }),
      prisma.otpCode.delete({
        where: { email }, 
      }),
    ]);

    return NextResponse.json(
      { message: "User created successfully", userId: newUser.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error while creating account." },
      { status: 500 }
    );
  }
}
