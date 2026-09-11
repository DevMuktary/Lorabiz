import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ApiKeyType, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const envParam = searchParams.get("environment")?.toUpperCase();
    const serviceFilter = searchParams.get("service")?.toUpperCase() || "ALL";
    const statusFilter = searchParams.get("statusCode") || "ALL";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    const environment = envParam === "LIVE" ? ApiKeyType.LIVE : ApiKeyType.TEST;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Build Prisma where conditions
    const where: Prisma.ApiRequestLogWhereInput = {
      userId: user.id,
      environment: environment,
    };

    // Granular Endpoint / Service Filtering
    if (serviceFilter === "NIN_SEARCH") {
      where.endpoint = { contains: "by-nin" };
    } else if (serviceFilter === "NIN_PHONE") {
      where.endpoint = { contains: "by-phone" };
    } else if (serviceFilter === "NIN_IPE") {
      where.endpoint = { contains: "/ipe" };
    } else if (serviceFilter === "NIN_VALIDATION") {
      where.endpoint = { contains: "/validation" };
    } else if (serviceFilter === "NIN_PERSONALIZATION") {
      where.endpoint = { contains: "/personalization" };
    } else if (serviceFilter === "BVN") {
      where.endpoint = { contains: "/bvn" };
    }

    // Filter by Status Code Class
    if (statusFilter === "2xx") {
      where.statusCode = { gte: 200, lt: 300 };
    } else if (statusFilter === "4xx") {
      where.statusCode = { gte: 400, lt: 500 };
    } else if (statusFilter === "5xx") {
      where.statusCode = { gte: 500 };
    }

    // Parallel fetch: total count + page slice
    const [totalLogs, logs] = await Promise.all([
      prisma.apiRequestLog.count({ where }),
      prisma.apiRequestLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          method: true,
          endpoint: true,
          statusCode: true,
          latencyMs: true,
          amountCharged: true,
          clientReference: true,
          errorMessage: true,
          createdAt: true,
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalLogs / limit));

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          totalLogs,
          totalPages,
        },
      },
    });
  } catch (err) {
    console.error("❌ [Developer Logs GET] Error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
