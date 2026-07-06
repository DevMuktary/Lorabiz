import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { startOfDay, subDays, format } from "date-fns";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 30);

    // 1. Fetch Transactions with User Data
    const transactions = await prisma.transaction.findMany({
      take: 200, // Fetch the last 200 for client-side filtering
      orderBy: { createdAt: "desc" },
      include: {
        wallet: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } }
          }
        }
      }
    });

    // 2. Calculate Revenue Splits (30 Days)
    let totalRevenue = 0;
    let cacRevenue = 0;
    let ninRevenue = 0;

    // Daily revenue for the chart
    const revenueByDay: Record<string, { name: string, CAC: number, NIN: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const dayStr = format(subDays(today, i), 'EEE');
      revenueByDay[dayStr] = { name: dayStr, CAC: 0, NIN: 0 };
    }

    transactions.forEach((tx) => {
      // Only count successful debits (payments for services) as revenue
      if (tx.type === "DEBIT" && tx.status === "SUCCESS" && tx.createdAt >= thirtyDaysAgo) {
        const amount = Number(tx.amount);
        totalRevenue += amount;
        
        const isNin = tx.description.toLowerCase().includes("nin");
        if (isNin) {
          ninRevenue += amount;
        } else {
          cacRevenue += amount; // Assumes anything not NIN is a CAC service
        }

        // Add to chart data if within last 7 days
        if (tx.createdAt >= subDays(today, 7)) {
          const dayStr = format(tx.createdAt, 'EEE');
          if (revenueByDay[dayStr]) {
            if (isNin) revenueByDay[dayStr].NIN += amount;
            else revenueByDay[dayStr].CAC += amount;
          }
        }
      }
    });

    const chartData = Object.values(revenueByDay);

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
      type: tx.type, // CREDIT, DEBIT, REFUND
      status: tx.status // SUCCESS, PENDING, FAILED
    }));

    return NextResponse.json({
      metrics: {
        totalRevenue,
        cacRevenue,
        ninRevenue,
      },
      chartData,
      ledger
    });

  } catch (error) {
    console.error("Financial API Error:", error);
    return NextResponse.json({ error: "Failed to fetch financial data" }, { status: 500 });
  }
}
