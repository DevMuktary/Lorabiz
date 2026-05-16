import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, otpCode } = await req.json();

    if (!email || !otpCode) {
      return NextResponse.json({ message: "Email and OTP code are required" }, { status: 400 });
    }

    // Securely look up the OTP in the database
    const validOtp = await prisma.otpCode.findUnique({
      where: { email },
    });

    if (!validOtp) {
      return NextResponse.json({ message: "No active code found. Please resend." }, { status: 400 });
    }

    if (validOtp.code !== otpCode) {
      return NextResponse.json({ message: "Invalid verification code." }, { status: 400 });
    }

    if (validOtp.expiresAt < new Date()) {
      return NextResponse.json({ message: "Code has expired. Please request a new one." }, { status: 400 });
    }

    // Success! We DO NOT delete the code here. We leave it so the final 
    // /api/register route can safely consume it during the final user creation.
    return NextResponse.json({ message: "OTP verified successfully" }, { status: 200 });

  } catch (error) {
    console.error("OTP Verification Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
