import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ApiKeyType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  const userId = user.id;
  const encoder = new TextEncoder();

  let isAborted = false;
  req.signal.addEventListener("abort", () => {
    isAborted = true;
  });

  const stream = new ReadableStream({
    async start(controller) {
      let lastSnapshot = "";

      const sendUpdate = async () => {
        if (isAborted) return;

        try {
          // Fetch current user wallet & sandbox
          const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
              wallet: true,
              developerProfile: true,
            },
          });

          if (!currentUser || isAborted) return;

          // Today's start in UTC
          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);

          const [todayLogsCount, successfulLogsCount, spentAggregates] = await Promise.all([
            prisma.apiRequestLog.count({
              where: { userId, createdAt: { gte: today } },
            }),
            prisma.apiRequestLog.count({
              where: {
                userId,
                createdAt: { gte: today },
                statusCode: { gte: 200, lt: 300 },
              },
            }),
            prisma.apiRequestLog.groupBy({
              by: ["environment"],
              where: { userId },
              _sum: { amountCharged: true },
            }),
          ]);

          const totalSpentLive = Number(spentAggregates.find((s) => s.environment === "LIVE")?._sum.amountCharged || 0);
          const totalSpentTest = Number(spentAggregates.find((s) => s.environment === "TEST")?._sum.amountCharged || 0);

          const successRate =
            todayLogsCount > 0 ? parseFloat(((successfulLogsCount / todayLogsCount) * 100).toFixed(1)) : null;

          const snapshot = JSON.stringify({
            walletBalance: Number(currentUser.wallet?.balance || 0),
            sandboxBalance: Number(currentUser.sandboxBalance || 1000000),
            totalSpentLive,
            totalSpentTest,
            totalCallsToday: todayLogsCount,
            successfulCallsToday: successfulLogsCount,
            failedCallsToday: todayLogsCount - successfulLogsCount,
            successRate,
            developerProfileStatus: currentUser.developerProfile?.status || null,
          });

          // Only push to client if stats changed or on initial start
          if (snapshot !== lastSnapshot) {
            lastSnapshot = snapshot;
            const payload = `event: sync\ndata: ${snapshot}\n\n`;
            controller.enqueue(encoder.encode(payload));
          }
        } catch (err) {
          // Stream controller error handling
        }
      };

      // Immediate first sync
      await sendUpdate();

      // Check for real-time changes every 2.5 seconds
      const intervalId = setInterval(async () => {
        if (isAborted) {
          clearInterval(intervalId);
          try {
            controller.close();
          } catch {}
          return;
        }
        await sendUpdate();
      }, 2500);

      // Keepalive heartbeat comment every 15 seconds to prevent browser timeouts
      const keepaliveId = setInterval(() => {
        if (isAborted) {
          clearInterval(keepaliveId);
          return;
        }
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepaliveId);
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        clearInterval(keepaliveId);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
