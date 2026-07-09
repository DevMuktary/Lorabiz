import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUserLoginOTP } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Generate a secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Upsert securely
    await prisma.otpCode.upsert({
      where: { email },
      update: { code: otpCode, expiresAt },
      create: { email, code: otpCode, expiresAt },
    });

    // Dispatch email
    await sendUserLoginOTP(email, otpCode);

    return NextResponse.json({ message: "OTP resent successfully" }, { status: 200 });
    
  } catch (error) {
    console.error("Login OTP Resend Error:", error);
    return NextResponse.json({ message: "Failed to resend OTP" }, { status: 500 });
  }
}
