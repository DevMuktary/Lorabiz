import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { verify } from "otplib";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
    }

    const { code, method } = await req.json();

    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json({ error: "Invalid 6-digit passkey provided." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    // Extract network telemetry for audit logs
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown IP";
    const userAgent = req.headers.get("user-agent") || "Unknown Device";

    // ========================================================================
    // CONFIRM METHOD A: GOOGLE / AUTHY AUTHENTICATOR (TOTP)
    // ========================================================================
    if (method === "AUTHENTICATOR") {
      if (!user.twoFactorSecret) {
        return NextResponse.json({ error: "No authenticator secret pending verification." }, { status: 400 });
      }

      // Await verify to resolve async Promise return types in modern otplib
      const verificationResult = await verify({
        token: code,
        secret: user.twoFactorSecret,
      });

      // Handle both boolean true and object VerifyResult { delta: number } returns
      const isValid = typeof verificationResult === "boolean" ? verificationResult : !!verificationResult;

      if (!isValid) {
        return NextResponse.json({ error: "Invalid authenticator code. Please check your app clock." }, { status: 400 });
      }
    }

    // ========================================================================
    // CONFIRM METHOD B: CORPORATE EMAIL PASSKEY
    // ========================================================================
    if (method === "EMAIL") {
      const validCodeRecord = await prisma.twoFactorCode.findFirst({
        where: {
          userId: user.id,
          code: code,
          expiresAt: { gt: new Date() },
        },
      });

      if (!validCodeRecord) {
        return NextResponse.json({ error: "Verification passkey is invalid or has expired." }, { status: 400 });
      }

      // Cleanup used passkey
      await prisma.twoFactorCode.deleteMany({
        where: { userId: user.id },
      });
    }

    // ========================================================================
    // ACTIVATE TWO-FACTOR ENROLLMENT IN DATABASE
    // ========================================================================
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorMethod: method,
      },
    });

    // Write permanent audit trail record
    await prisma.securityAuditLog.create({
      data: {
        email: user.email,
        role: user.role,
        event: "MFA_ENROLLMENT_SUCCESS",
        ipAddress,
        userAgent,
        details: `Successfully enrolled and verified MFA via ${method}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("2FA Setup Confirmation Error:", error);
    return NextResponse.json(
      { error: "Server error confirming two-factor setup." },
      { status: 500 }
    );
  }
}
