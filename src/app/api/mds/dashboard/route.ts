import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { subDays, startOfDay, format, formatDistanceToNow } from "date-fns";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 30);
    const sevenDaysAgo = subDays(today, 7);

    // 1. Run independent queries in parallel for maximum performance
    const [
      usersCount,
      
      // CAC Metrics
      bizNamesPending, llcsPending,
      bizNamesQueried, llcsQueried,
      bizNamesApprovedToday, llcsApprovedToday,
      totalBizNames, totalLlcs,
      
      // NIN Metrics
      ninSlipsCompletedToday, totalNinSlips,
      
      // SCUML Metrics
      scumlPending, scumlCompletedToday, totalScuml,
      
      // Tax ID Metrics
      taxIdPending, taxIdCompletedToday, totalTaxId,

      recentAudits,
      recentProcessedFilings,
      recentTransactions
    ] = await Promise.all([
      prisma.user.count({ where: { role: "USER" } }),
      
      prisma.businessRegistration.count({ where: { status: "PENDING" } }),
      prisma.llcRegistration.count({ where: { status: "PENDING" } }),
      prisma.businessRegistration.count({ where: { status: "QUERIED" } }),
      prisma.llcRegistration.count({ where: { status: "QUERIED" } }),
      prisma.businessRegistration.count({ where: { status: "APPROVED", updatedAt: { gte: today } } }),
      prisma.llcRegistration.count({ where: { status: "APPROVED", updatedAt: { gte: today } } }),
      prisma.businessRegistration.count(),
      prisma.llcRegistration.count(),
      
      prisma.ninRequestLog.count({ where: { status: "SUCCESS", createdAt: { gte: today } } }),
      prisma.ninRequestLog.count({ where: { status: "SUCCESS" } }),
      
      prisma.scumlRegistration.count({ where: { status: "PENDING" } }),
      prisma.scumlRegistration.count({ where: { status: "COMPLETED", updatedAt: { gte: today } } }),
      prisma.scumlRegistration.count(),
      
      prisma.taxIdRequest.count({ where: { status: "PENDING" } }),
      prisma.taxIdRequest.count({ where: { status: "COMPLETED", updatedAt: { gte: today } } }),
      prisma.taxIdRequest.count(),
      
      prisma.staffActionLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { firstName: true, lastName: true } } }
      }),

      prisma.businessRegistration.findMany({
        where: { processedAt: { not: null } },
        select: { createdAt: true, processedAt: true },
        orderBy: { processedAt: 'desc' },
        take: 50
      }),

      prisma.transaction.findMany({
        where: {
          type: "DEBIT",
          status: "SUCCESS",
          createdAt: { gte: thirtyDaysAgo }
        },
        select: { amount: true, createdAt: true }
      })
    ]);

    // 2. Process Revenue Chart Data (Last 7 Days)
    const revenueByDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      revenueByDay[format(subDays(today, i), 'EEE')] = 0;
    }
    
    let revenue30d = 0;
    recentTransactions.forEach(tx => {
      const amount = Number(tx.amount);
      revenue30d += amount;
      if (tx.createdAt >= sevenDaysAgo) {
        const dayStr = format(tx.createdAt, 'EEE');
        if (revenueByDay[dayStr] !== undefined) revenueByDay[dayStr] += amount;
      }
    });

    const revenueChartData = Object.entries(revenueByDay).map(([name, total]) => ({ name, total }));

    // 3. Process Turnaround Time (TAT)
    let avgTatFormatted = "0h 0m";
    if (recentProcessedFilings.length > 0) {
      const totalMs = recentProcessedFilings.reduce((acc, item) => {
        return acc + (item.processedAt!.getTime() - item.createdAt.getTime());
      }, 0);
      const avgMs = totalMs / recentProcessedFilings.length;
      const hours = Math.floor(avgMs / (1000 * 60 * 60));
      const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
      avgTatFormatted = `${hours}h ${minutes}m`;
    }

    // 4. DYNAMIC Service Distribution Percentages
    const totalCacServices = totalBizNames + totalLlcs;
    const totalServices = totalCacServices + totalNinSlips + totalScuml + totalTaxId || 1; // Prevent division by zero
    
    const rawDistribution = [
      { name: 'CAC Registrations', count: totalCacServices },
      { name: 'NIMC Slips', count: totalNinSlips },
      { name: 'SCUML Certificates', count: totalScuml },
      { name: 'Tax ID (TIN)', count: totalTaxId },
    ];

    // Filter out services with 0 count, calculate exact percentages
    const serviceDistribution = rawDistribution
      .filter(service => service.count > 0)
      .map(service => ({
        name: service.name,
        value: Math.round((service.count / totalServices) * 100)
      }))
      .sort((a, b) => b.value - a.value); // Highest percentage first

    // 5. Format Audit Logs
    const formattedAudits = recentAudits.map(audit => ({
      id: audit.id,
      staff: `${audit.user.firstName} ${audit.user.lastName?.charAt(0) || ''}.`,
      action: audit.action,
      target: audit.targetId || "System",
      time: formatDistanceToNow(audit.createdAt, { addSuffix: true }),
      details: audit.details || "No additional details provided."
    }));

    return NextResponse.json({
      kpis: {
        revenue30d,
        pendingOrders: bizNamesPending + llcsPending + scumlPending + taxIdPending, // Global pending count
        avgTat: avgTatFormatted,
        activeUsers: usersCount
      },
      pipeline: {
        pending: bizNamesPending + llcsPending + scumlPending + taxIdPending,
        queried: bizNamesQueried + llcsQueried,
        completedToday: bizNamesApprovedToday + llcsApprovedToday + ninSlipsCompletedToday + scumlCompletedToday + taxIdCompletedToday
      },
      charts: {
        revenueData: revenueChartData,
        serviceDistribution
      },
      auditFeed: formattedAudits
    });

  } catch (error) {
    console.error("MDS Dashboard Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
