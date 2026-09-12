import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { verify as verifyTotp } from "otplib";
import { sendUserLoginOTP, sendLoginAlertEmail } from "@/lib/email";
import { normalizeEmail } from "@/lib/disposable-emails";
import { normalizeBackupCode } from "@/lib/backup-codes";
import { createMobileSessionToken } from "@/lib/mobile-auth";

const DUMMY_HASH = "$2a$10$X7U.z5G8W8mH1L4y9vP/eeKjK9kYgG3d6fM9a6L7w1h3X9Z2Q5xO6";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 Minutes

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: rawEmail, password, otpCode, isBackupCode } = body;

    if (!rawEmail || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(rawEmail);
    const rawIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "Unknown IP";
    const userAgent = req.headers.get("user-agent") || "Lorabiz Mobile App";

    // 1. Redis Lockout Check
    const lockoutTTL = await redis.ttl(`lockout:email:${normalizedEmail}`);
    if (lockoutTTL > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Account temporarily locked for security. Try again in ${Math.ceil(lockoutTTL / 60)} minute(s).`,
        },
        { status: 429 }
      );
    }

    // 2. Fetch User & Wallet
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { wallet: true },
    });

    if (!user || !user.passwordHash) {
      await bcrypt.compare(password, DUMMY_HASH);
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Security: Reject suspended accounts immediately
    if (user.isSuspended) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Role check: Only regular user client
    if (user.role !== "USER") {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 3. Verify Password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const emailKey = `attempts:email:${normalizedEmail}`;
      const attempts = await redis.incr(emailKey);
      if (attempts === 1) await redis.expire(emailKey, LOCKOUT_DURATION_SECONDS);

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        await redis.set(`lockout:email:${normalizedEmail}`, "LOCKED", "EX", LOCKOUT_DURATION_SECONDS);
        await redis.del(emailKey);
      }

      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Clear failed attempts on password success
    await redis.del(`attempts:email:${normalizedEmail}`);

    // 4. Two-Factor Authentication (2FA) Check
    const isMfaRequired = user.twoFactorEnabled === true;

    if (isMfaRequired) {
      // If client didn't supply an OTP code yet, generate & return requireOtp: true
      if (!otpCode) {
        if (user.twoFactorMethod === "EMAIL") {
          const now = new Date();
          const existingOtp = await prisma.otpCode.findUnique({
            where: { email: normalizedEmail },
          });

          if (!existingOtp?.nextResendAllowedAt || existingOtp.nextResendAllowedAt <= now) {
            const freshOtp = crypto.randomInt(100000, 1000000).toString();
            const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
            const nextResend = new Date(now.getTime() + 30 * 1000);

            await prisma.otpCode.upsert({
              where: { email: normalizedEmail },
              update: { code: freshOtp, expiresAt, resendCount: 0, nextResendAllowedAt: nextResend },
              create: { email: normalizedEmail, code: freshOtp, expiresAt, resendCount: 0, nextResendAllowedAt: nextResend },
            });

            sendUserLoginOTP(normalizedEmail, freshOtp).catch((err) =>
              console.error("Failed to send 2FA OTP via email:", err)
            );
          }
        }

        return NextResponse.json({
          success: false,
          requireOtp: true,
          twoFactorMethod: user.twoFactorMethod || "EMAIL",
          message: "Please enter the verification code to complete sign in.",
        });
      }

      // If client provided OTP code, verify it
      let verified = false;
      const rawCode = String(otpCode).trim();

      // Case A: Backup Code
      const cleanInputCode = normalizeBackupCode(rawCode);
      const existingBackupCodes = user.twoFactorBackupCodes || [];
      const matchedIndex = existingBackupCodes.findIndex(
        (saved) => normalizeBackupCode(saved) === cleanInputCode
      );

      if (isBackupCode || matchedIndex !== -1) {
        if (matchedIndex !== -1) {
          verified = true;
          const updated = [...existingBackupCodes];
          updated.splice(matchedIndex, 1);
          await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorBackupCodes: updated },
          });
        }
      }

      // Case B: Authenticator TOTP
      if (!verified && user.twoFactorMethod === "AUTHENTICATOR") {
        if (user.twoFactorSecret) {
          const totpResult = await verifyTotp({
            token: rawCode,
            secret: user.twoFactorSecret,
          });
          if ((totpResult as any) === true || Boolean((totpResult as any)?.valid)) {
            verified = true;
          }
        }
      }

      // Case C: Email OTP
      if (!verified) {
        const validOtp = await prisma.otpCode.findUnique({
          where: { email: normalizedEmail },
        });

        if (validOtp && validOtp.code === rawCode && validOtp.expiresAt >= new Date()) {
          verified = true;
          await prisma.otpCode.delete({ where: { email: normalizedEmail } }).catch(() => null);
        }
      }

      if (!verified) {
        return NextResponse.json(
          { success: false, message: "Invalid or expired verification code." },
          { status: 400 }
        );
      }
    }

    // 5. Auto-heal missing wallet
    let wallet = user.wallet;
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0.0,
        },
      });
    }

    // 6. Generate NextAuth-compatible Mobile Session Token
    const token = await createMobileSessionToken({
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role,
      picture: user.image,
      isProfileComplete: user.isProfileComplete,
      twoFactorEnabled: user.twoFactorEnabled,
      twoFactorMethod: user.twoFactorMethod,
    });

    // Send login alert email if enabled
    if (user.emailLoginAlerts !== false) {
      sendLoginAlertEmail(user.email, {
        name: user.firstName || undefined,
        ipAddress: rawIp,
        userAgent,
        loginTime: new Date(),
      }).catch((err) => console.error("Failed to send login alert email:", err));
    }

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
        phone: user.phone,
        role: user.role,
        image: user.image,
        isProfileComplete: user.isProfileComplete,
        twoFactorEnabled: user.twoFactorEnabled,
        referralCode: user.referralCode,
        wallet: {
          id: wallet.id,
          balance: Number(wallet.balance),
        },
      },
    });

    // Set cookie on response for maximum compatibility
    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error("Mobile Login API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error during mobile login." },
      { status: 500 }
    );
  }
}
