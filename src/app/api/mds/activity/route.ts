import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { scanAndEnqueueAbandonedCac } from "@/services/automations/abandoned-cac-scanner";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const userId = searchParams.get("userId")?.trim();
    const category = searchParams.get("category");
    const action = searchParams.get("action");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const whereClause: any = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (action && action !== "ALL") {
      whereClause.action = action;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    if (search) {
      whereClause.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { referenceId: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [total, activities, todayCount, failedCount] = await Promise.all([
      prisma.userActivityLog.count({ where: whereClause }),
      prisma.userActivityLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              image: true,
            },
          },
        },
      }),
      prisma.userActivityLog.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.userActivityLog.count({
        where: { status: "FAILED" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: activities,
      metrics: {
        totalAllTime: total,
        totalToday: todayCount,
        failedTotal: failedCount,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Admin Activity API Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}

/**
 * Admin action trigger (e.g. manually run abandoned CAC scan)
 */
export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "SCAN_ABANDONED_CAC") {
      const host = req.headers.get("host") || "lorabiz.com";
      const protocol = host.includes("localhost") ? "http" : "https";
      const baseUrl = `${protocol}://${host}`;

      const result = await scanAndEnqueueAbandonedCac(baseUrl);

      // Log in StaffActionLog
      await prisma.staffActionLog.create({
        data: {
          userId: session.user.id,
          action: "TRIGGERED_ABANDONED_CAC_SCAN",
          details: `Manual scan completed. Scanned: ${result.scanned}, Enqueued: ${result.enqueued}, Skipped: ${result.skipped}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Scan complete. Found ${result.scanned} draft(s), enqueued ${result.enqueued} reminder(s).`,
        result,
      });
    }

    return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin Activity Action Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to execute action" },
      { status: 500 }
    );
  }
}
