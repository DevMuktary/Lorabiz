import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
    }

    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: "Current password is required to disable 2FA." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 400 });
    }

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown IP";
    const userAgent = req.headers.get("user-agent") || "Unknown Device";

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorMethod: null,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
      },
    });

    await prisma.securityAuditLog.create({
      data: {
        email: user.email,
        role: user.role,
        event: "MFA_DISABLED",
        ipAddress,
        userAgent,
        details: "User successfully disabled Two-Factor Authentication.",
      },
    });

    return NextResponse.json({ success: true, message: "Two-Factor Authentication disabled." });
  } catch (error: any) {
    console.error("2FA Disable Error:", error);
    return NextResponse.json(
      { error: "Server error while disabling two-factor authentication." },
      { status: 500 }
    );
  }
}
