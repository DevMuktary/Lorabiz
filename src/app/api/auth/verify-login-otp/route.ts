import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logUserActivity } from "@/lib/activity-logger";

export async function POST(req: Request) {
  try {
    const { email, otpCode } = await req.json();

    if (!email || !otpCode) {
      return NextResponse.json({ message: "Email and OTP code are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const validOtp = await prisma.otpCode.findUnique({
      where: { email: normalizedEmail },
    });

    if (!validOtp || validOtp.code !== otpCode) {
      return NextResponse.json({ message: "Invalid verification code." }, { status: 400 });
    }

    if (validOtp.expiresAt < new Date()) {
      return NextResponse.json({ message: "Code has expired. Please log in again." }, { status: 400 });
    }

    // Success! Delete the OTP so it cannot be reused
    await prisma.otpCode.delete({
      where: { email: normalizedEmail },
    });

    // Record User Login in UserActivityLog (Non-blocking)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    if (user) {
      logUserActivity({
        userId: user.id,
        action: "USER_LOGIN",
        category: "AUTH",
        description: `User signed in successfully (${user.email})`,
        status: "SUCCESS",
        req,
        metadata: {
          email: user.email,
          role: user.role,
          method: "EMAIL_OTP",
        },
      });
    }

    return NextResponse.json({ message: "OTP verified successfully" }, { status: 200 });
  } catch (error) {
    console.error("Login OTP Verification Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
