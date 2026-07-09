import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUserLoginOTP } from "@/lib/email";

// Server-side escalating timeouts in seconds
const ESCALATING_TIMEOUTS = [30, 60, 300, 600, 1800]; 

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });

    const record = await prisma.otpCode.findUnique({ where: { email } });
    if (!record) return NextResponse.json({ message: "Invalid request." }, { status: 400 });

    const now = new Date();

    // 1. Check if they are in a hard 1-hour lockout
    if (record.lockedUntil && record.lockedUntil > now) {
      return NextResponse.json({ 
        message: "Too many attempts. Account temporarily blocked from requesting codes.", 
        isLocked: true 
      }, { status: 429 });
    }

    // 2. Check if they are still inside their escalating cooldown window
    if (record.nextResendAllowedAt && record.nextResendAllowedAt > now) {
      const remainingSeconds = Math.ceil((record.nextResendAllowedAt.getTime() - now.getTime()) / 1000);
      return NextResponse.json({ 
        message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
        remainingSeconds
      }, { status: 429 });
    }

    // 3. Process the Resend & Escalate the Timer
    const newCount = record.resendCount + 1;
    
    // If they exceeded the max array levels (5 attempts), lock them for 1 hour
    if (newCount >= ESCALATING_TIMEOUTS.length) {
      await prisma.otpCode.update({
        where: { email },
        data: { lockedUntil: new Date(now.getTime() + 3600 * 1000) }
      });
      return NextResponse.json({ 
        message: "Maximum attempts reached. You are locked out for 1 hour.", 
        isLocked: true 
      }, { status: 429 });
    }

    // Generate new OTP and apply the next escalating cooldown
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const nextCooldownSeconds = ESCALATING_TIMEOUTS[newCount];
    
    await prisma.otpCode.update({
      where: { email },
      data: {
        code: otpCode,
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000), // 10 mins
        resendCount: newCount,
        nextResendAllowedAt: new Date(now.getTime() + nextCooldownSeconds * 1000),
      }
    });

    await sendUserLoginOTP(email, otpCode);

    return NextResponse.json({ 
      message: "OTP resent successfully", 
      remainingSeconds: nextCooldownSeconds 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Login OTP Resend Error:", error);
    return NextResponse.json({ message: "Failed to resend OTP" }, { status: 500 });
  }
}
