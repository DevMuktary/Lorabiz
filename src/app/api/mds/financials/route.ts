import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { startOfDay, subDays, format } from "date-fns";

const prisma = new PrismaClient();

// DYNAMIC CATEGORIZER: Extracts service names intelligently.
// Update this dictionary in the future if descriptions change, 
// and the entire dashboard will adapt automatically.
const getServiceCategory = (description: string) => {
  const desc = description.toLowerCase();
  if (desc.includes('nin')) return 'NIMC';
  if (desc.includes('scuml')) return 'SCUML';
  if (desc.includes('tax') || desc.includes('tin')) return 'Tax ID';
  if (desc.includes('airtime') || desc.includes('data') || desc.includes('utility')) return 'Utilities';
  if (desc.includes('business') || desc.includes('llc') || desc.includes('incorporation') || desc.includes('cac')) return 'CAC';
  if (desc.includes('wallet') || desc.includes('fund')) return 'Wallet Funding';
  return 'Other';
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = searchParams.get("days") || "30";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;
    
    const today = startOfDay(new Date());
    let startDate = new Date(0); 
    if (days !== "all") {
      startDate = subDays(today, parseInt(days, 10));
    }

    const ledgerWhere = { createdAt: { gte: startDate } };

    // 1. Parallel execution: Fetch Math Data and Paginated Ledger
    const [walletAgg, totalLedgerCount, transactionsForMath, paginatedLedger] = await Promise.all([
      prisma.wallet.aggregate({ _sum: { balance: true } }),
      prisma.transaction.count({ where: ledgerWhere }),
      // Fetch ONLY what is needed for Math (prevents memory overload)
      prisma.transaction.findMany({
        where: { createdAt: { gte: startDate }, type: "DEBIT", status: "SUCCESS" },
        select: { amount: true, description: true, createdAt: true }
      }),
      // Fetch the actual paginated table rows
      prisma.transaction.findMany({
        where: ledgerWhere,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          wallet: { include: { user: { select: { firstName: true, lastName: true, email: true } } } }
        }
      })
    ]);

    // 2. Dynamic Revenue Calculations
    let totalRevenue = 0;
    const revenueByService: Record<string, number> = {};
    const revenueByDay: Record<string, any> = {};

    // Initialize 7-day chart structure
    const sevenDaysAgo = subDays(today, 7);
    for (let i = 6; i >= 0; i--) {
      revenueByDay[format(subDays(today, i), 'EEE')] = { name: format(subDays(today, i), 'EEE') };
    }

    transactionsForMath.forEach(tx => {
      const amount = Number(tx.amount);
      const category = getServiceCategory(tx.description);
      
      // We don't count wallet funding as pure service revenue here, just actual service debits
      if (category !== 'Wallet Funding') {
        totalRevenue += amount;
        revenueByService[category] = (revenueByService[category] || 0) + amount;

        // Chart aggregation
        if (tx.createdAt >= sevenDaysAgo) {
          const dayStr = format(tx.createdAt, 'EEE');
          if (revenueByDay[dayStr]) {
            revenueByDay[dayStr][category] = (revenueByDay[dayStr][category] || 0) + amount;
          }
        }
      }
    });

    // Ensure all detected categories exist on all chart days to prevent Recharts errors
    const activeCategories = Object.keys(revenueByService);
    Object.values(revenueByDay).forEach(day => {
      activeCategories.forEach(cat => {
        if (day[cat] === undefined) day[cat] = 0;
      });
    });

    // 3. Format Outputs
    const formattedRevenueBreakdown = Object.entries(revenueByService)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount); // Highest earners first

    const ledger = paginatedLedger.map(tx => ({
      id: tx.id,
      reference: tx.reference,
      date: tx.createdAt,
      clientName: tx.wallet?.user ? `${tx.wallet.user.firstName} ${tx.wallet.user.lastName}` : "Unknown",
      clientEmail: tx.wallet?.user?.email || "Unknown",
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
        totalLiabilities: Number(walletAgg._sum.balance || 0)
      },
      revenueBreakdown: formattedRevenueBreakdown,
      chartData: Object.values(revenueByDay),
      ledger,
      pagination: {
        totalItems: totalLedgerCount,
        totalPages: Math.ceil(totalLedgerCount / limit),
        currentPage: page,
        limit
      }
    });

  } catch (error) {
    console.error("Financial API Error:", error);
    return NextResponse.json({ error: "Failed to fetch financial data" }, { status: 500 });
  }
}
