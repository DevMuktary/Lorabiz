import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getEffectiveServicePrice } from "@/lib/discounts";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        wallet: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User account not found." },
        { status: 404 }
      );
    }

    const requests = await prisma.ninIpeRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const pricing = await prisma.servicePricing.findUnique({
      where: { serviceKey: "NIN_IPE_CLEARANCE" },
    });

    const stats = {
      total: requests.length,
      processing: requests.filter((r) => r.status === "PROCESSING").length,
      completed: requests.filter((r) => r.status === "COMPLETED").length,
      failed: requests.filter((r) => r.status === "FAILED").length,
    };

    const basePrice = pricing ? Number(pricing.price) : 2500;
    const discountInfo = await getEffectiveServicePrice(prisma, "NIN_IPE_CLEARANCE", basePrice, user.id);

    return NextResponse.json({
      success: true,
      requests,
      stats,
      walletBalance: Number(user.wallet?.balance || 0),
      servicePrice: discountInfo.finalPrice,
      originalPrice: discountInfo.originalPrice,
      hasDiscount: discountInfo.hasDiscount,
      discountBadge: discountInfo.badge,
      savedAmount: discountInfo.savedAmount,
      isServiceActive: pricing ? pricing.isActive : true,
    });
  } catch (error: any) {
    console.error("❌ NIN IPE History Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load IPE history." },
      { status: 500 }
    );
  }
}
