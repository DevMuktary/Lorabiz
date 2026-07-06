import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { startOfDay, subDays, format } from "date-fns";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Parse the requested date range from the URL (default to 30 days)
    const { searchParams } = new URL(req.url);
    const days = searchParams.get("days") || "30";
    
    const today = startOfDay(new Date());
    let startDate = new Date(0); // Default to beginning of time if "all"
    if (days !== "all") {
      startDate = subDays(today, parseInt(days, 10));
    }

    // 1. Fetch Data in Parallel
    const [transactions, walletAgg] = await Promise.all([
      // Fetch Ledger
      prisma.transaction.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: "desc" },
        include: {
          wallet: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } }
          }
        }
      }),
      // Fetch Total Wallet Liabilities (Unspent user deposits)
      prisma.wallet.aggregate({
        _sum: { balance: true }
      })
    ]);

    // 2. Calculate Revenue Metrics
    let totalRevenue = 0;
    let cacRevenue = 0;
    let ninRevenue = 0;

    // Build Chart Data (Last 7 days of the selected range for a cleaner chart)
    const revenueByDay: Record<string, { name: string, CAC: number, NIN: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const dayStr = format(subDays(today, i), 'EEE');
      revenueByDay[dayStr] = { name: dayStr, CAC: 0, NIN: 0 };
    }

    transactions.forEach((tx) => {
      if (tx.type === "DEBIT" && tx.status === "SUCCESS") {
        const amount = Number(tx.amount);
        totalRevenue += amount;
        
        const isNin = tx.description.toLowerCase().includes("nin");
        if (isNin) ninRevenue += amount;
        else cacRevenue += amount;

        // Chart aggregation
        if (tx.createdAt >= subDays(today, 7)) {
          const dayStr = format(tx.createdAt, 'EEE');
          if (revenueByDay[dayStr]) {
            if (isNin) revenueByDay[dayStr].NIN += amount;
            else revenueByDay[dayStr].CAC += amount;
          }
        }
      }
    });

    // 3. Format the Ledger for the UI
    const ledger = transactions.map(tx => ({
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
        totalLiabilities: Number(walletAgg._sum.balance || 0) // New Metric
      },
      chartData: Object.values(revenueByDay),
      ledger
    });

  } catch (error) {
    console.error("Financial API Error:", error);
    return NextResponse.json({ error: "Failed to fetch financial data" }, { status: 500 });
  }
}
