import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/developer/logs - Fetch telemetry logs for developer dashboard
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ status: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const environment = searchParams.get("environment"); // SANDBOX | LIVE | all
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  const whereClause: any = {
    userId: session.user.id,
  };

  if (environment === "SANDBOX" || environment === "LIVE") {
    whereClause.environment = environment;
  }

  try {
    const [logs, totalCount, sandboxWallet, liveWallet] = await Promise.all([
      prisma.apiRequestLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          endpoint: true,
          method: true,
          statusCode: true,
          latencyMs: true,
          environment: true,
          amountCharged: true,
          isRefunded: true,
          reference: true,
          ipAddress: true,
          requestBody: true,
          responseBody: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
      prisma.apiRequestLog.count({ where: whereClause }),
      prisma.developerSandboxWallet.findUnique({
        where: { userId: session.user.id },
      }),
      prisma.wallet.findUnique({
        where: { userId: session.user.id },
      }),
    ]);

    return NextResponse.json({
      status: true,
      logs,
      totalCount,
      wallets: {
        sandboxBalance: sandboxWallet ? Number(sandboxWallet.balance) : 1000000.0,
        liveBalance: liveWallet ? Number(liveWallet.balance) : 0.0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, error: error.message }, { status: 500 });
  }
}
