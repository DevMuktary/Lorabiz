import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, otpCode } = await req.json();

    if (!email || !otpCode) {
      return NextResponse.json({ message: "Email and OTP code are required" }, { status: 400 });
    }

    const validOtp = await prisma.otpCode.findUnique({
      where: { email },
    });

    if (!validOtp || validOtp.code !== otpCode) {
      return NextResponse.json({ message: "Invalid verification code." }, { status: 400 });
    }

    if (validOtp.expiresAt < new Date()) {
      return NextResponse.json({ message: "Code has expired. Please log in again." }, { status: 400 });
    }

    // Success! Delete the OTP so it cannot be reused
    await prisma.otpCode.delete({
      where: { email },
    });

    return NextResponse.json({ message: "OTP verified successfully" }, { status: 200 });
  } catch (error) {
    console.error("Login OTP Verification Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
