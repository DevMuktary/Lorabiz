import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format } from "date-fns";

// =========================================================================
// UNIFIED CATEGORIZATION ENGINE
// Groups explicit sub-services (like LLC & Business Name) into parent buckets
// and gracefully falls back to description parsing for legacy data.
// =========================================================================
const categorizeTransaction = (tx: { serviceCategory?: string | null, description: string }) => {
  // 1. USE EXPLICIT DATABASE CATEGORY (IF IT EXISTS AND ISN'T "OTHER")
  if (tx.serviceCategory && tx.serviceCategory !== "OTHER" && tx.serviceCategory !== "UNCATEGORIZED_LEGACY") {
    // Explicitly group all CAC related services into one "CAC" bucket
    if (["BUSINESS_NAME", "LLC", "NAME_SUBSTITUTION", "CAC"].includes(tx.serviceCategory)) {
      return "CAC";
    }
    return tx.serviceCategory; // Returns "SCUML", "NIN", "WALLET_FUNDING", etc.
  }

  // 2. FALLBACK FOR LEGACY TRANSACTIONS (Before we added serviceCategory to DB)
  const desc = tx.description.toLowerCase();
  if (desc.includes('nin')) return 'NIN';
  if (desc.includes('scuml')) return 'SCUML';
  if (desc.includes('tax') || desc.includes('tin')) return 'Tax ID';
  // Catch all old CAC services
  if (desc.includes('business') || desc.includes('llc') || desc.includes('incorporation') || desc.includes('cac') || desc.includes('name substitution')) {
    return 'CAC';
  }
  if (desc.includes('wallet') || desc.includes('funding')) return 'Wallet Funding';
  if (desc.includes('payout') || desc.includes('withdrawal')) return 'Partner Payout';
  
  return 'Other';
};

export async function GET(req: Request) {
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
    
    // Only fetch SUCCESSFUL DEBITS for revenue math
    const revenueWhere = { 
      createdAt: { gte: startDate },
      type: "DEBIT" as const,
      status: "SUCCESS" as const 
    };

    // =========================================================================
    // PARALLEL EXECUTION FOR EXTREME SPEED
    // =========================================================================
    const [walletAgg, totalLedgerCount, transactionsForMath, paginatedLedger] = await Promise.all([
      // A. Total Wallet Liabilities (User Deposits)
      prisma.wallet.aggregate({ _sum: { balance: true } }),
      
      // B. Total Ledger Count for Pagination
      prisma.transaction.count({ where: ledgerWhere }),
      
      // C. Lightweight fetch of JUST the columns needed for math (Fast & Memory Safe)
      prisma.transaction.findMany({
        where: revenueWhere,
        select: { amount: true, serviceCategory: true, description: true, createdAt: true }
      }),
      
      // D. Fetch actual paginated rows for the Ledger Table UI (Max 20 rows)
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

    // =========================================================================
    // DYNAMIC REVENUE CALCULATION & CHART AGGREGATION
    // =========================================================================
    let totalRevenue = 0;
    const revenueByService: Record<string, number> = {};
    const revenueByDay: Record<string, any> = {};

    // Initialize the 7-day chart structure
    const sevenDaysAgo = subDays(today, 7);
    for (let i = 6; i >= 0; i--) {
      revenueByDay[format(subDays(today, i), 'EEE')] = { name: format(subDays(today, i), 'EEE') };
    }

    // Process all mathematical aggregations in one swift loop
    transactionsForMath.forEach(tx => {
      const amount = Number(tx.amount);
      const unifiedCategory = categorizeTransaction(tx);
      
      // We explicitly exclude "WALLET_FUNDING" from Gross Service Revenue 
      // because wallet deposits are liabilities, not service earnings.
      if (unifiedCategory !== 'WALLET_FUNDING') {
        totalRevenue += amount;
        revenueByService[unifiedCategory] = (revenueByService[unifiedCategory] || 0) + amount;

        // Populate Chart if within the last 7 days
        if (tx.createdAt >= sevenDaysAgo) {
          const dayStr = format(tx.createdAt, 'EEE');
          if (revenueByDay[dayStr]) {
            revenueByDay[dayStr][unifiedCategory] = (revenueByDay[dayStr][unifiedCategory] || 0) + amount;
          }
        }
      }
    });

    // Ensure all identified categories exist on all chart days to prevent Recharts rendering bugs
    const activeCategories = Object.keys(revenueByService);
    Object.values(revenueByDay).forEach(day => {
      activeCategories.forEach(cat => {
        if (day[cat] === undefined) day[cat] = 0;
      });
    });

    // Sort highest earning categories first for the UI Cards
    const formattedRevenueBreakdown = Object.entries(revenueByService)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount); 

    // =========================================================================
    // FORMAT LEDGER OUTPUT
    // =========================================================================
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
