import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logUserActivity } from "@/lib/activity-logger";
import { verify } from "otplib";
import { normalizeBackupCode } from "@/lib/backup-codes";
import { normalizeEmail } from "@/lib/disposable-emails";
import { sendLoginAlertEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email: rawEmail, otpCode, isBackupCode } = await req.json();

    if (!rawEmail || !otpCode) {
      return NextResponse.json({ message: "Email and verification code are required." }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(rawEmail);
    const rawCode = otpCode.trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ message: "User account not found." }, { status: 404 });
    }

    let verified = false;
    let authMethodUsed = "EMAIL_OTP";

    // ========================================================================
    // CASE 1: BACKUP / RECOVERY CODE VERIFICATION
    // ========================================================================
    const cleanInputCode = normalizeBackupCode(rawCode);
    const existingBackupCodes = user.twoFactorBackupCodes || [];

    const matchedBackupCodeIndex = existingBackupCodes.findIndex(
      (savedCode) => normalizeBackupCode(savedCode) === cleanInputCode
    );

    if (isBackupCode || matchedBackupCodeIndex !== -1) {
      if (matchedBackupCodeIndex !== -1) {
        verified = true;
        authMethodUsed = "BACKUP_CODE";

        // Single-use: Consume and remove the used backup code from the user's account
        const updatedBackupCodes = [...existingBackupCodes];
        updatedBackupCodes.splice(matchedBackupCodeIndex, 1);

        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: updatedBackupCodes },
        });

        await prisma.securityAuditLog.create({
          data: {
            email: user.email,
            role: user.role,
            event: "BACKUP_CODE_CONSUMED",
            ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown IP",
            userAgent: req.headers.get("user-agent") || "Unknown Device",
            details: `Single-use recovery code used. Remaining codes: ${updatedBackupCodes.length}`,
          },
        });
      } else {
        return NextResponse.json({ message: "Invalid or previously used backup code." }, { status: 400 });
      }
    }

    // ========================================================================
    // CASE 2: AUTHENTICATOR APP (TOTP)
    // ========================================================================
    if (!verified && user.twoFactorMethod === "AUTHENTICATOR") {
      if (!user.twoFactorSecret) {
        return NextResponse.json({ message: "Authenticator secret missing. Please contact support." }, { status: 400 });
      }

      const verificationResult = await verify({
        token: rawCode,
        secret: user.twoFactorSecret,
      });

      let isTotpValid = false;
      if (typeof verificationResult === "boolean") {
        isTotpValid = verificationResult === true;
      } else if (verificationResult && typeof verificationResult === "object") {
        isTotpValid = Boolean((verificationResult as any).valid || (verificationResult as any).isValid);
      }

      if (isTotpValid) {
        verified = true;
        authMethodUsed = "AUTHENTICATOR_TOTP";
      } else {
        return NextResponse.json({ message: "Invalid code from Authenticator App. Please check your app clock." }, { status: 400 });
      }
    }

    // ========================================================================
    // CASE 3: EMAIL OTP
    // ========================================================================
    if (!verified) {
      const validOtp = await prisma.otpCode.findUnique({
        where: { email: normalizedEmail },
      });

      if (validOtp && validOtp.code === rawCode) {
        if (validOtp.expiresAt < new Date()) {
          return NextResponse.json({ message: "Verification code has expired. Please log in again." }, { status: 400 });
        }

        verified = true;
        authMethodUsed = "EMAIL_OTP";

        // Success: Delete the OTP so it cannot be reused
        await prisma.otpCode.delete({
          where: { email: normalizedEmail },
        });
      } else {
        return NextResponse.json({ message: "Invalid verification code." }, { status: 400 });
      }
    }

    if (!verified) {
      return NextResponse.json({ message: "Invalid verification code." }, { status: 400 });
    }

    // Log successful sign in
    logUserActivity({
      userId: user.id,
      action: "USER_LOGIN",
      category: "AUTH",
      description: `User signed in successfully via ${authMethodUsed} (${user.email})`,
      status: "SUCCESS",
      req,
      metadata: {
        email: user.email,
        role: user.role,
        method: authMethodUsed,
      },
    });

    // Dispatch New Sign-in Alert Email (Non-blocking)
    if (user.emailLoginAlerts !== false) {
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "Unknown IP";
      const clientDevice = req.headers.get("user-agent") || "Unknown Device";
      sendLoginAlertEmail(user.email, {
        name: user.firstName || undefined,
        ipAddress: clientIp,
        userAgent: clientDevice,
        loginTime: new Date(),
      }).catch((err) => console.error("Failed to send login alert email:", err));
    }

    return NextResponse.json({ message: "Verification successful." }, { status: 200 });
  } catch (error) {
    console.error("Login OTP Verification Error:", error);
    return NextResponse.json({ message: "Internal server error during verification." }, { status: 500 });
  }
}
