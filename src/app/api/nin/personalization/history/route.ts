import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim().toUpperCase() || "";

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    const whereClause: any = {
      userId: user.id,
    };

    if (status && ["PROCESSING", "COMPLETED", "FAILED"].includes(status)) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { trackingId: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
        { resolvedNin: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [requests, totalCount, processingCount, completedCount, failedCount] =
      await Promise.all([
        prisma.ninPersonalizationRequest.findMany({
          where: whereClause,
          orderBy: { createdAt: "desc" },
        }),
        prisma.ninPersonalizationRequest.count({
          where: { userId: user.id },
        }),
        prisma.ninPersonalizationRequest.count({
          where: { userId: user.id, status: "PROCESSING" },
        }),
        prisma.ninPersonalizationRequest.count({
          where: { userId: user.id, status: "COMPLETED" },
        }),
        prisma.ninPersonalizationRequest.count({
          where: { userId: user.id, status: "FAILED" },
        }),
      ]);

    return NextResponse.json({
      success: true,
      requests,
      metrics: {
        total: totalCount,
        processing: processingCount,
        completed: completedCount,
        failed: failedCount,
      },
      walletBalance: user.wallet ? Number(user.wallet.balance) : 0,
    });
  } catch (error: any) {
    console.error("❌ NIN Personalization History GET Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch personalization history." },
      { status: 500 }
    );
  }
}
