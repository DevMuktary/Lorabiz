import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // We still grab the IP just for your database audit logs, but we DO NOT block it.
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
                      req.headers.get("x-real-ip") || 
                      "unknown";
    
    const { 
      firstName, middleName, lastName, email: rawEmail, 
      phone, whatsapp, password, gender, state, lga, 
      street, buildingNo, otpCode 
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

    // 3. CHECK FOR DUPLICATES (Phone/WhatsApp crossover check)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [ { email }, { phone }, { whatsapp } ]
      },
    });

    if (existingUser) {
      // Generic error so we don't leak which field caused the conflict
      return NextResponse.json(
        { message: "An account with these details already exists." }, 
        { status: 409 }
      );
    }

    // 4. Hash & Transaction Create
    const hashedPassword = await bcrypt.hash(password, 10);

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
          wallet: { create: { balance: 0.00 } }
        },
      }),
      prisma.otpCode.delete({
        where: { email }, 
      }),
    ]);

    return NextResponse.json({ message: "User created successfully", userId: newUser.id }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "Internal server error while creating account." }, { status: 500 });
  }
}
