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
      buildingNo
    } = body;

    // 1. Strict Basic Validation (making sure no required field is empty)
    if (!firstName || !lastName || !email || !password || !phone || !whatsapp || !gender || !state || !lga || !street) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // 2. Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // 3. Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Save the user to the PostgreSQL database
    const newUser = await prisma.user.create({
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
    });

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
