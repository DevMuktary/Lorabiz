import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// POST /api/developer/sandbox-wallet/reset - Reset Sandbox Wallet balance to ₦1,000,000.00
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ status: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const sandboxWallet = await prisma.developerSandboxWallet.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        balance: new Prisma.Decimal(1000000.0),
      },
      update: {
        balance: new Prisma.Decimal(1000000.0),
      },
    });

    return NextResponse.json({
      status: true,
      message: "Sandbox test wallet reset to ₦1,000,000.00 successfully.",
      balance: Number(sandboxWallet.balance),
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, error: error.message }, { status: 500 });
  }
}
