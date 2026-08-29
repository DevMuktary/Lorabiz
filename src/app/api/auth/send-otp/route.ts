import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationOTP, sendAccountExistsEmail } from "@/lib/email";
import { isDisposableEmail, normalizeEmail } from "@/lib/disposable-emails";

export async function POST(req: Request) {
  try {
    const { email: rawEmail } = await req.json();

    if (!rawEmail) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // 1. TEMP / DISPOSABLE MAIL BLOCKER
    if (isDisposableEmail(rawEmail)) {
      return NextResponse.json(
        { message: "Disposable or temporary email addresses are not permitted. Please use a permanent email address." }, 
        { status: 400 }
      );
    }

    // 2. NORMALIZE EMAIL (lowercase, trim, strip plus-aliases)
    const email = normalizeEmail(rawEmail);

    // 2. THE "SILENT CATCH" (Anti-Enumeration)
    // If the user already exists, pretend it worked to trick hackers.
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Send a warning email to the real owner instead of an OTP
      await sendAccountExistsEmail(email); 
      // FAKE SUCCESS to UI:
      return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
    }

    // 3. OTP REUSE & GENERATION
    const existingOtp = await prisma.otpCode.findUnique({
      where: { email },
    });

    let otp: string;
    let expiresAt: Date;

    if (existingOtp && existingOtp.expiresAt > new Date()) {
      // Rule 1: OTP exists and is not expired -> Reuse it
      otp = existingOtp.code;
      expiresAt = existingOtp.expiresAt;
    } else {
      // Rule 2: No OTP or it expired -> Generate a new one
      otp = Math.floor(100000 + Math.random() * 900000).toString();
      expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
      
      await prisma.otpCode.upsert({
        where: { email },
        update: { code: otp, expiresAt },
        create: { email, code: otp, expiresAt },
      });
    }

    // 4. Dispatch email
    await sendVerificationOTP(email, otp);

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
    
  } catch (error) {
    console.error("OTP Generation Error:", error);
    return NextResponse.json({ message: "Failed to send OTP" }, { status: 500 });
  }
}
