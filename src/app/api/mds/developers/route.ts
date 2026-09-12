import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { DeveloperProfileStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: { email: session.user.email, role: "ADMIN" },
    });
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status")?.toUpperCase();

    const where: any = {};
    if (statusParam && statusParam !== "ALL") {
      where.status = statusParam as DeveloperProfileStatus;
    }

    const [profiles, pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.developerProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              wallet: {
                select: { balance: true },
              },
              _count: {
                select: { apiRequestLogs: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.developerProfile.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.developerProfile.count({ where: { status: "APPROVED" } }),
      prisma.developerProfile.count({ where: { status: "REJECTED" } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        profiles,
        stats: {
          total: pendingCount + approvedCount + rejectedCount,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
        },
      },
    });
  } catch (err) {
    console.error("❌ [MDS Developers GET] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
