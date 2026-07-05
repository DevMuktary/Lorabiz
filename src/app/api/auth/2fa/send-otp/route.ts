import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized session state." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    // Do not dispatch emails if they use offline Authenticator Apps
    if (user.twoFactorMethod === "AUTHENTICATOR") {
      return NextResponse.json({
        success: true,
        message: "Account utilizes Authenticator App. Check app for current code.",
      });
    }

    // 1. Generate 6-digit random code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes validity

    // 2. Clear old active codes
    await prisma.twoFactorCode.deleteMany({
      where: { userId: user.id },
    });

    // 3. Store new passkey
    await prisma.twoFactorCode.create({
      data: {
        userId: user.id,
        code: otpCode,
        expiresAt,
      },
    });

    // TODO: Connect your email sending helper / BullMQ worker here
    console.log(`[MFA DISPATCH] Sent daily passkey ${otpCode} to ${user.email}`);

    return NextResponse.json({
      success: true,
      message: "Passkey dispatched successfully.",
    });
  } catch (error: any) {
    console.error("MFA Dispatch Error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch verification passkey." },
      { status: 500 }
    );
  }
}
