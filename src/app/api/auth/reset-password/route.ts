import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetSuccessEmail } from "@/lib/email";
import { logUserActivity } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email, password, confirmPassword } = body;

    if (!token || !email || !password) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Passwords do not match." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedToken = crypto.createHash("sha256").update(token.trim()).digest("hex");

    // 1. Atomically verify token, update password, and mark token as used
    const updatedUser = await prisma.$transaction(async (tx) => {
      const resetRecord = await tx.passwordResetToken.findFirst({
        where: {
          token: hashedToken,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
          user: {
            email: normalizedEmail,
          },
        },
        include: {
          user: true,
        },
      });

      if (!resetRecord) {
        throw new Error("This password reset link is invalid, expired, or has already been used.");
      }

      // Hash new password securely
      const newPasswordHash = await bcrypt.hash(password, 12);

      // Update user password
      const user = await tx.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash: newPasswordHash,
        },
      });

      // Mark token as used
      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: {
          used: true,
        },
      });

      // Clean up any other active reset tokens for this user
      await tx.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          used: false,
        },
        data: {
          used: true,
        },
      });

      // Invalidate any lingering 2FA codes
      await tx.twoFactorCode.deleteMany({
        where: { userId: user.id },
      });

      return user;
    });

    // 2. Dispatch security confirmation email
    try {
      await sendPasswordResetSuccessEmail({
        to: updatedUser.email,
        name: updatedUser.firstName,
      });
    } catch (emailErr) {
      console.error("Failed to dispatch password reset confirmation email:", emailErr);
    }

    // 3. Log user activity
    await logUserActivity({
      userId: updatedUser.id,
      category: "SECURITY",
      action: "PASSWORD_CHANGED",
      description: `Password was successfully reset for ${updatedUser.email}`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully reset. You can now log in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset Password API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to reset password. Please try again." },
      { status: 400 }
    );
  }
}
