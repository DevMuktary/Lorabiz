import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const record = await prisma.otpCode.findUnique({
      where: { email },
    });

    if (!record) {
      // No active OTP record found
      return NextResponse.json({ remainingSeconds: 0, isLocked: false }, { status: 200 });
    }

    const now = new Date();

    // 1. Check if they are in a hard 1-hour lockout
    if (record.lockedUntil && record.lockedUntil > now) {
      const remainingSeconds = Math.ceil((record.lockedUntil.getTime() - now.getTime()) / 1000);
      return NextResponse.json({ remainingSeconds, isLocked: true }, { status: 200 });
    }

    // 2. Check if they are in a standard escalating cooldown
    if (record.nextResendAllowedAt && record.nextResendAllowedAt > now) {
      const remainingSeconds = Math.ceil((record.nextResendAllowedAt.getTime() - now.getTime()) / 1000);
      return NextResponse.json({ remainingSeconds, isLocked: false }, { status: 200 });
    }

    // 3. No active cooldowns
    return NextResponse.json({ remainingSeconds: 0, isLocked: false }, { status: 200 });

  } catch (error) {
    console.error("OTP Status Check Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
