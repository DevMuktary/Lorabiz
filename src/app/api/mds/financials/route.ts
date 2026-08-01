import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { startOfDay, subDays, format } from "date-fns";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = searchParams.get("days") || "30";
    
    const today = startOfDay(new Date());
    let startDate = new Date(0); 
    if (days !== "all") {
      startDate = subDays(today, parseInt(days, 10));
    }

    const baseWhere = {
      createdAt: { gte: startDate },
      type: "DEBIT" as const,
      status: "SUCCESS" as const
    };

    // 1. Fetch EVERYTHING in parallel. Let the Database do the math, not Node.js.
    const [
      totalAgg,
      ninAgg,
      cacAgg,
      walletAgg,
      recentTransactions // Only fetch the actual rows for the recent ledger
    ] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: baseWhere
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { ...baseWhere, description: { contains: "nin", mode: "insensitive" } }
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { ...baseWhere, description: { contains: "business", mode: "insensitive" } } // Adjust keyword if needed for CAC
      }),
      prisma.wallet.aggregate({
        _sum: { balance: true }
      }),
      // THE FIX: Only pull the latest 100 records for the table to prevent browser crashing
      prisma.transaction.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: "desc" },
        take: 100, 
        include: {
          wallet: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } }
          }
        }
      })
    ]);

    const totalRevenue = Number(totalAgg._sum.amount || 0);
    const ninRevenue = Number(ninAgg._sum.amount || 0);
    // Assuming whatever isn't NIN is roughly CAC for now (can be adjusted later)
    const cacRevenue = totalRevenue - ninRevenue; 

    // 2. Build Chart Data (Last 7 days strictly)
    const revenueByDay: Record<string, { name: string, CAC: number, NIN: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const dayStr = format(subDays(today, i), 'EEE');
      revenueByDay[dayStr] = { name: dayStr, CAC: 0, NIN: 0 };
    }

    // We only need to fetch chart data specifically for the last 7 days
    const chartTransactions = await prisma.transaction.findMany({
      where: { 
        createdAt: { gte: subDays(today, 7) },
        type: "DEBIT",
        status: "SUCCESS"
      },
      select: { amount: true, description: true, createdAt: true }
    });

    chartTransactions.forEach((tx) => {
      const amount = Number(tx.amount);
      const dayStr = format(tx.createdAt, 'EEE');
      const isNin = tx.description.toLowerCase().includes("nin");
      
      if (revenueByDay[dayStr]) {
        if (isNin) revenueByDay[dayStr].NIN += amount;
        else revenueByDay[dayStr].CAC += amount;
      }
    });

    // 3. Format the Ledger for the UI
    const ledger = recentTransactions.map(tx => ({
      id: tx.id,
      reference: tx.reference,
      date: tx.createdAt,
      clientName: `${tx.wallet.user.firstName} ${tx.wallet.user.lastName}`,
      clientEmail: tx.wallet.user.email,
      description: tx.description,
      amount: Number(tx.amount),
      balanceBefore: Number(tx.balanceBefore),
      balanceAfter: Number(tx.balanceAfter),
      type: tx.type, 
      status: tx.status 
    }));

    return NextResponse.json({
      metrics: {
        totalRevenue,
        cacRevenue,
        ninRevenue,
        totalLiabilities: Number(walletAgg._sum.balance || 0)
      },
      chartData: Object.values(revenueByDay),
      ledger
    });

  } catch (error) {
    console.error("Financial API Error:", error);
    return NextResponse.json({ error: "Failed to fetch financial data" }, { status: 500 });
  }
}
