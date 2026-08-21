import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, email } = body;

    if (!token || !email || typeof token !== "string" || typeof email !== "string") {
      return NextResponse.json(
        { valid: false, message: "Token and email are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashedToken = crypto.createHash("sha256").update(token.trim()).digest("hex");

    const record = await prisma.passwordResetToken.findFirst({
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
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json({
        valid: false,
        message: "This password reset link is invalid, expired, or has already been used.",
      });
    }

    return NextResponse.json({
      valid: true,
      email: record.user.email,
      firstName: record.user.firstName,
    });
  } catch (error: any) {
    console.error("Verify Reset Token API Error:", error);
    return NextResponse.json(
      { valid: false, message: "Failed to verify reset token." },
      { status: 500 }
    );
  }
}
