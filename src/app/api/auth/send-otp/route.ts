import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationOTP } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email: rawEmail } = await req.json();

    if (!rawEmail) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // --- MASKED EMAIL SUBADDRESS FILTERING ---
    // Ensure the OTP check matches the exact email format we will save during registration
    let email = rawEmail.toLowerCase().trim();
    if (email.includes('@')) {
      const [localPart, domain] = email.split('@');
      const cleanLocal = localPart.split('+')[0]; // Strip everything after '+'
      email = `${cleanLocal}@${domain}`;
    }

    // 1. PRE-CHECK: Prevent wasting emails if the account already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists. Please log in." }, 
        { status: 409 }
      );
    }

    // 2. Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 3. Upsert securely (Prevents race conditions by guaranteeing 1 record per email)
    await prisma.otpCode.upsert({
      where: { email },
      update: { code: otp, expiresAt },
      create: { email, code: otp, expiresAt },
    });

    // 4. Dispatch email using our DRY library
    await sendVerificationOTP(email, otp);

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
    
  } catch (error) {
    console.error("OTP Generation Error:", error);
    return NextResponse.json({ message: "Failed to send OTP" }, { status: 500 });
  }
}
