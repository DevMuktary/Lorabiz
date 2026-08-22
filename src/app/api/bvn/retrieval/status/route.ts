import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getEffectiveServicePrice } from "@/lib/discounts";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email
      ? (await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } }))?.id
      : undefined;

    const pricing = await prisma.servicePricing.findUnique({
      where: { serviceKey: "BVN_RETRIEVAL" },
    });

    const basePrice = pricing ? Number(pricing.price) : 2500;
    const discountInfo = await getEffectiveServicePrice(prisma, "BVN_RETRIEVAL", basePrice, userId);

    return NextResponse.json({
      success: true,
      price: discountInfo.finalPrice,
      originalPrice: discountInfo.originalPrice,
      hasDiscount: discountInfo.hasDiscount,
      discountBadge: discountInfo.badge,
      savedAmount: discountInfo.savedAmount,
      isActive: pricing ? pricing.isActive : true,
      maintenanceMsg: pricing?.maintenanceMsg || null,
    });
  } catch (error) {
    console.error("BVN Retrieval Status Error:", error);
    return NextResponse.json({
      success: true,
      price: 2500,
      isActive: true,
      maintenanceMsg: null,
    });
  }
}
