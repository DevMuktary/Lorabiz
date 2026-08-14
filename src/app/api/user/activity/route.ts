import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    // BOLA Protection: Scope strictly to the authenticated user's ID
    const whereClause: any = {
      userId: user.id,
    };

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { referenceId: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [total, activities] = await Promise.all([
      prisma.userActivityLog.count({ where: whereClause }),
      prisma.userActivityLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          action: true,
          category: true,
          description: true,
          status: true,
          referenceId: true,
          metadata: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("User Activity API Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch activity history" },
      { status: 500 }
    );
  }
}
