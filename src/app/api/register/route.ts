import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Destructure all the fields coming from our advanced frontend form
    const { 
      firstName, 
      middleName, 
      lastName, 
      email, 
      phone, 
      whatsapp,
      password,
      gender,
      state,
      lga,
      street,
      buildingNo,
      otpCode // Required from the ZeptoMail verification step
    } = body;

    // 1. Strict Basic Validation (making sure no required field is empty)
    if (!firstName || !lastName || !email || !password || !phone || !whatsapp || !gender || !state || !lga || !street || !otpCode) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // 2. VERY SECURE: Check the OTP directly in the database
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

    // 3. Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // 4. Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. ATOMIC TRANSACTION: Create User AND Delete OTP simultaneously
    // This guarantees a single OTP can never be used twice (Zero Race Condition)
    const [newUser] = await prisma.$transaction([
      prisma.user.create({
        data: {
          firstName,
          middleName: middleName || null, // Handles optional field
          lastName,
          email,
          phone,
          whatsapp,
          passwordHash: hashedPassword,
          gender,
          state,
          lga,
          street,
          buildingNo: buildingNo || null, // Handles optional field
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
