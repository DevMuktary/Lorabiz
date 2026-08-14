import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export const dynamic = "force-dynamic";

export function buildAudienceWhereClause(filters: any) {
  const segment = filters?.segment || "ALL";

  const baseWhere: any = {
    role: "USER",
    isSuspended: false,
    isSubscribedToMarketing: true,
  };

  switch (segment) {
    case "REGISTERED_ANY":
      return {
        ...baseWhere,
        OR: [
          { registrations: { some: {} } },
          { llcRegistrations: { some: {} } },
          { scumlRequests: { some: {} } },
          { taxIdRequests: { some: {} } },
          { ninRequests: { some: {} } },
        ],
      };

    case "REGISTERED_BIZ":
      return {
        ...baseWhere,
        registrations: { some: {} },
      };

    case "REGISTERED_LLC":
      return {
        ...baseWhere,
        llcRegistrations: { some: {} },
      };

    case "FUNDED_WALLET":
      return {
        ...baseWhere,
        wallet: { balance: { gt: 0 } },
      };

    case "NO_ORDERS":
      return {
        ...baseWhere,
        registrations: { none: {} },
        llcRegistrations: { none: {} },
        scumlRequests: { none: {} },
        taxIdRequests: { none: {} },
        ninRequests: { none: {} },
      };

    case "NEW_SIGNUPS_7D":
      return {
        ...baseWhere,
        createdAt: { gte: subDays(new Date(), 7) },
      };

    case "NEW_SIGNUPS_30D":
      return {
        ...baseWhere,
        createdAt: { gte: subDays(new Date(), 30) },
      };

    case "ALL":
    default:
      return baseWhere;
  }
}

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const where = buildAudienceWhereClause(body);

    const [totalCount, sampleUsers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      totalCount,
      sampleUsers,
    });
  } catch (error: any) {
    console.error("Audience Preview API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to calculate audience preview" },
      { status: 500 }
    );
  }
}
