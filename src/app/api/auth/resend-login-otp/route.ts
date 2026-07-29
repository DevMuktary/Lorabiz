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

    // 4. THE STICKY OTP LOGIC
    const isExpired = record.expiresAt < now;
    
    // Only generate a new OTP if the old one actually expired
    const activeOtpCode = isExpired 
      ? Math.floor(100000 + Math.random() * 900000).toString() 
      : record.code;

    // Only extend expiration if we generated a new code
    const activeExpiration = isExpired 
      ? new Date(now.getTime() + 10 * 60 * 1000) // 10 new mins
      : record.expiresAt;

    const nextCooldownSeconds = ESCALATING_TIMEOUTS[newCount];
    
    await prisma.otpCode.update({
      where: { email },
      data: {
        code: activeOtpCode,
        expiresAt: activeExpiration,
        resendCount: newCount,
        nextResendAllowedAt: new Date(now.getTime() + nextCooldownSeconds * 1000),
      }
    });

    // Send the code (either sticky old code or newly generated code)
    await sendUserLoginOTP(email, activeOtpCode);

    return NextResponse.json({ 
      message: "OTP resent successfully", 
      remainingSeconds: nextCooldownSeconds 
    }, { status: 200 });
    
  } catch (error) {
    console.error("Login OTP Resend Error:", error);
    return NextResponse.json({ message: "Failed to resend OTP" }, { status: 500 });
  }
}
