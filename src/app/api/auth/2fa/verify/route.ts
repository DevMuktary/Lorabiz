import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { verify } from "otplib";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized session state." }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json({ error: "Please input your full 6-digit passkey." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorMethod) {
      return NextResponse.json({ error: "Two-factor authentication is not configured for this account." }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown IP";
    const userAgent = req.headers.get("user-agent") || "Unknown Device";

    let isValid = false;

    // ========================================================================
    // VERIFY TOTP AUTHENTICATOR APP
    // ========================================================================
    if (user.twoFactorMethod === "AUTHENTICATOR") {
      if (!user.twoFactorSecret) {
        return NextResponse.json({ error: "Missing account authenticator secret." }, { status: 500 });
      }

      // Await verify to resolve async Promise return types in modern otplib
      const verificationResult = await verify({
        token: code,
        secret: user.twoFactorSecret,
      });

      isValid = typeof verificationResult === "boolean" ? verificationResult : !!verificationResult;
    }

    // ========================================================================
    // VERIFY EMAIL PASSKEY
    // ========================================================================
    if (user.twoFactorMethod === "EMAIL") {
      const matchedRecord = await prisma.twoFactorCode.findFirst({
        where: {
          userId: user.id,
          code: code,
          expiresAt: { gt: new Date() },
        },
      });

      if (matchedRecord) {
        isValid = true;
        await prisma.twoFactorCode.deleteMany({
          where: { userId: user.id },
        });
      }
    }

    if (!isValid) {
      await prisma.securityAuditLog.create({
        data: {
          email: user.email,
          role: user.role,
          event: "MFA_CHALLENGE_FAILED",
          ipAddress,
          userAgent,
          details: `Failed MFA verification challenge using ${user.twoFactorMethod}`,
        },
      });

      return NextResponse.json({ error: "Invalid verification passkey. Please try again." }, { status: 400 });
    }

    await prisma.securityAuditLog.create({
      data: {
        email: user.email,
        role: user.role,
        event: "MFA_CHALLENGE_SUCCESS",
        ipAddress,
        userAgent,
        details: `Passed MFA challenge using ${user.twoFactorMethod}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("2FA Login Verification Error:", error);
    return NextResponse.json(
      { error: "Server exception during identity verification." },
      { status: 500 }
    );
  }
}
