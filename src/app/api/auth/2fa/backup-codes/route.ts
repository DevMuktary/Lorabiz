import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateBackupCodes } from "@/lib/backup-codes";

// GET: Check number of remaining unused backup codes
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { twoFactorEnabled: true, twoFactorBackupCodes: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    return NextResponse.json({
      twoFactorEnabled: user.twoFactorEnabled,
      remainingCodesCount: user.twoFactorBackupCodes?.length || 0,
    });
  } catch (error: any) {
    console.error("Fetch Backup Codes Error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// POST: Regenerate fresh 8 backup codes (requires password confirmation)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized request." }, { status: 401 });
    }

    const { password } = await req.json();
    if (!password) {
      return NextResponse.json({ error: "Password confirmation required to generate new recovery codes." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json({ error: "Two-Factor Authentication is not enabled on this account." }, { status: 400 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 400 });
    }

    const newBackupCodes = generateBackupCodes(8);

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorBackupCodes: newBackupCodes },
    });

    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown IP";
    const userAgent = req.headers.get("user-agent") || "Unknown Device";

    await prisma.securityAuditLog.create({
      data: {
        email: user.email,
        role: user.role,
        event: "BACKUP_CODES_REGENERATED",
        ipAddress,
        userAgent,
        details: "User generated fresh single-use backup recovery codes.",
      },
    });

    return NextResponse.json({ success: true, backupCodes: newBackupCodes });
  } catch (error: any) {
    console.error("Regenerate Backup Codes Error:", error);
    return NextResponse.json({ error: "Server error while regenerating codes." }, { status: 500 });
  }
}
