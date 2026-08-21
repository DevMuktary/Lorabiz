import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: { email: session.user.email, role: "ADMIN" }
    });
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }
    const thirtyDaysAgo = subDays(new Date(), 30);

    // 1. Fetch Global Metrics in Parallel
    const [totalClients, newSignups, walletAgg, activeClients] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "USER", createdAt: { gte: thirtyDaysAgo } } }),
      prisma.wallet.aggregate({ _sum: { balance: true } }),
      prisma.user.count({ 
        where: { 
          role: "USER", 
          // FIX: Query transactions through the wallet relation
          wallet: {
            transactions: { some: {} } 
          }
        } 
      })
    ]);

    // 2. Fetch Master Client List
    const clients = await prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: 'desc' },
      include: {
        // FIX: Include transactions nested inside the wallet
        wallet: {
          include: {
            transactions: { orderBy: { createdAt: 'desc' }, take: 10 }
          }
        },
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

    // FIX: Flatten the transactions array back to the root of the client object
    // so the UI drawer component doesn't break when looking for `client.transactions`
    const formattedClients = clients.map(client => ({
      ...client,
      transactions: client.wallet?.transactions || []
    }));

    return NextResponse.json({ metrics, clients: formattedClients });
  } catch (error) {
    console.error("Clients API Error:", error);
    return NextResponse.json({ error: "Failed to fetch clients data" }, { status: 500 });
  }
}
