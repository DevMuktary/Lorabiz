import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetLinkEmail } from "@/lib/email";
import { logUserActivity } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, captchaToken } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "A valid email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Validate Cloudflare Turnstile if token is provided or secret is present
    if (process.env.TURNSTILE_SECRET && captchaToken) {
      try {
        const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
        const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: process.env.TURNSTILE_SECRET,
            response: captchaToken,
            remoteip: clientIp,
          }),
        });

        const turnstileResult = await verifyRes.json();
        if (!turnstileResult.success) {
          return NextResponse.json(
            { success: false, message: "Security verification failed. Please refresh and try again." },
            { status: 400 }
          );
        }
      } catch (err) {
        console.error("Turnstile verification error:", err);
      }
    }

    // 2. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Uniform response message to prevent email enumeration
    const genericSuccessResponse = {
      success: true,
      message: "If an account exists with this email, a password reset link has been dispatched to your inbox.",
    };

    if (!user) {
      return NextResponse.json(genericSuccessResponse);
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { success: false, message: "This account has been suspended. Please contact support." },
        { status: 403 }
      );
    }

    // 3. Invalidate any existing active reset tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // 4. Generate a cryptographically secure 32-byte token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

    // 5. Store hashed token in database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
        used: false,
      },
    });

    // 6. Build the secure reset URL
    const host = req.headers.get("host") || "lorabiz.com";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    const resetUrl = `${baseUrl}/auth/reset-password?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(user.email)}`;

    // 7. Dispatch the password reset email
    await sendPasswordResetLinkEmail({
      to: user.email,
      name: user.firstName,
      resetUrl,
      expiresInMinutes: 60,
    });

    // 8. Log the activity for audit
    await logUserActivity({
      userId: user.id,
      category: "SECURITY",
      action: "PASSWORD_RESET_REQUESTED",
      description: `Password reset link requested for ${user.email}`,
      req,
    });

    return NextResponse.json(genericSuccessResponse);
  } catch (error: any) {
    console.error("Forgot Password API Error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
