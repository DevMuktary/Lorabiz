import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ApiKeyType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        wallet: true,
        developerProfile: true,
        webhookConfigs: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Start of today (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [todayLogsCount, successfulLogsCount, spentAggregates, keyCounts] = await Promise.all([
      prisma.apiRequestLog.count({
        where: { userId: user.id, createdAt: { gte: today } },
      }),
      prisma.apiRequestLog.count({
        where: {
          userId: user.id,
          createdAt: { gte: today },
          statusCode: { gte: 200, lt: 300 },
        },
      }),
      prisma.apiRequestLog.groupBy({
        by: ["environment"],
        where: { userId: user.id },
        _sum: { amountCharged: true },
      }),
      prisma.apiKey.groupBy({
        by: ["type"],
        where: { userId: user.id, status: "ACTIVE" },
        _count: { _all: true },
      }),
    ]);

    const liveKeysCount = keyCounts.find((k) => k.type === "LIVE")?._count._all || 0;
    const testKeysCount = keyCounts.find((k) => k.type === "TEST")?._count._all || 0;

    const totalSpentLive = Number(spentAggregates.find((s) => s.environment === "LIVE")?._sum.amountCharged || 0);
    const totalSpentTest = Number(spentAggregates.find((s) => s.environment === "TEST")?._sum.amountCharged || 0);

    // Truth in Metrics: null when 0 calls to prevent false 100% success claims
    const successRate =
      todayLogsCount > 0 ? parseFloat(((successfulLogsCount / todayLogsCount) * 100).toFixed(1)) : null;

    // Mode resolution: Unapproved accounts must always be in TEST mode
    const isApproved = user.developerProfile?.status === "APPROVED";
    const effectiveMode: ApiKeyType = isApproved ? user.developerMode : ApiKeyType.TEST;

    return NextResponse.json({
      success: true,
      data: {
        activeMode: effectiveMode,
        walletBalance: Number(user.wallet?.balance || 0),
        sandboxBalance: Number(user.sandboxBalance || 1000000),
        totalSpentLive,
        totalSpentTest,
        totalCallsToday: todayLogsCount,
        successfulCallsToday: successfulLogsCount,
        failedCallsToday: todayLogsCount - successfulLogsCount,
        successRate, // null when no calls
        liveKeysCount,
        testKeysCount,
        developerProfile: user.developerProfile
          ? {
              status: user.developerProfile.status,
              businessName: user.developerProfile.businessName,
              rejectionReason: user.developerProfile.rejectionReason,
              approvedAt: user.developerProfile.approvedAt,
            }
          : null,
        hasWebhook: user.webhookConfigs?.some((w) => w.isActive) ?? false,
      },
    });
  } catch (err) {
    console.error("❌ [Developer Overview API] Error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

/**
 * Persists the user's active developer mode (LIVE vs TEST) in PostgreSQL
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { mode } = body;

    if (mode !== "LIVE" && mode !== "TEST") {
      return NextResponse.json({ success: false, message: "Invalid mode. Must be LIVE or TEST." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { developerProfile: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Security check: Live mode cannot be selected unless profile is APPROVED
    if (mode === "LIVE" && user.developerProfile?.status !== "APPROVED") {
      return NextResponse.json(
        {
          success: false,
          message: "Live mode requires an approved developer profile. Please request live activation first.",
        },
        { status: 403 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { developerMode: mode as ApiKeyType },
    });

    return NextResponse.json({
      success: true,
      message: `Developer mode updated to ${mode}`,
      data: { activeMode: mode },
    });
  } catch (err) {
    console.error("❌ [Developer Overview Mode POST] Error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
