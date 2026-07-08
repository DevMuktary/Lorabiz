import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { subDays } from "date-fns";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);

    // 1. Fetch Global Metrics in Parallel
    const [totalClients, newSignups, walletAgg, activeClients] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "USER", createdAt: { gte: thirtyDaysAgo } } }),
      prisma.wallet.aggregate({ _sum: { balance: true } }),
      prisma.user.count({ 
        where: { role: "USER", transactions: { some: {} } } // Active = has at least 1 transaction
      })
    ]);

    // 2. Fetch Master Client List (with nested data for the Drawer)
    const clients = await prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: true,
        transactions: { orderBy: { createdAt: 'desc' }, take: 10 }, // Last 10 txns
        registrations: { orderBy: { createdAt: 'desc' } }, // Biz Names
        llcRegistrations: { orderBy: { createdAt: 'desc' } }, // LLCs
        ninRequests: { orderBy: { createdAt: 'desc' } } // NINs
      }
    });

    const metrics = {
      total: totalClients,
      newSignups: newSignups,
      totalLiabilities: Number(walletAgg._sum.balance || 0),
      active: activeClients
    };

    return NextResponse.json({ metrics, clients });
  } catch (error) {
    console.error("Clients API Error:", error);
    return NextResponse.json({ error: "Failed to fetch clients data" }, { status: 500 });
  }
}
