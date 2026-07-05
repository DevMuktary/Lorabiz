import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { send2FAPasskeyEmail } from "@/lib/email";
import { generateSecret } from "otplib";
import qrcode from "qrcode";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
    }

    const { method } = await req.json();

    if (method !== "EMAIL" && method !== "AUTHENTICATOR") {
      return NextResponse.json({ error: "Invalid two-factor method specified." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    // ========================================================================
    // METHOD A: GOOGLE / AUTHY AUTHENTICATOR (TOTP)
    // ========================================================================
    if (method === "AUTHENTICATOR") {
      // 1. Generate a cryptographic Base32 secret directly
      const secret = generateSecret();

      // 2. Temporarily store secret in user record until onboarding is confirmed
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: secret },
      });

      // 3. Construct standard RFC 6238 OTPAuth URI cleanly without reliance on helper exports
      const issuer = "LoraBiz (Quadrox Ops)";
      const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(user.email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

      // 4. Generate base64 data URI QR code for frontend display
      const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);

      return NextResponse.json({
        success: true,
        secret,
        qrCode: qrCodeDataUrl,
      });
    }

    // ========================================================================
    // METHOD B: CORPORATE EMAIL PASSKEY (SMTP OTP)
    // ========================================================================
    if (method === "EMAIL") {
      // 1. Generate secure 6-digit verification code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes validity

      // 2. Clear any old pending setup codes for this user
      await prisma.twoFactorCode.deleteMany({
        where: { userId: user.id },
      });

      // 3. Save new verification passkey
      await prisma.twoFactorCode.create({
        data: {
          userId: user.id,
          code: otpCode,
          expiresAt,
        },
      });

      // 4. Dispatch executive 2FA setup passkey via ZeptoMail
      await send2FAPasskeyEmail(user.email, otpCode, user.role);
      console.log(`[SECURITY ENROLLMENT] Dispatched 2FA setup passkey to ${user.email}`);

      return NextResponse.json({
        success: true,
        message: "Verification passkey dispatched to corporate email.",
      });
    }

    return NextResponse.json({ error: "Invalid request state." }, { status: 400 });
  } catch (error: any) {
    console.error("2FA Setup Error:", error);
    return NextResponse.json(
      { error: "An unexpected server exception occurred during 2FA initialization." },
      { status: 500 }
    );
  }
}
