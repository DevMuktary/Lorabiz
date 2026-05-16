import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationOTP } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // 1. Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 2. Upsert securely (Prevents race conditions by guaranteeing 1 record per email)
    await prisma.otpCode.upsert({
      where: { email },
      update: { code: otp, expiresAt },
      create: { email, code: otp, expiresAt },
    });

    // 3. Dispatch email using our DRY library
    await sendVerificationOTP(email, otp);

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
    
  } catch (error) {
    console.error("OTP Generation Error:", error);
    return NextResponse.json({ message: "Failed to send OTP" }, { status: 500 });
  }
}
