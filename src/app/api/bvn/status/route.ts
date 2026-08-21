import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [standardPricing, premiumPricing] = await Promise.all([
      prisma.servicePricing.findUnique({ where: { serviceKey: "BVN_STANDARD" } }),
      prisma.servicePricing.findUnique({ where: { serviceKey: "BVN_PREMIUM" } }),
    ]);

    const pricing = {
      BVN_STANDARD: {
        price: standardPricing ? Number(standardPricing.price) : 700.0,
        isActive: standardPricing ? standardPricing.isActive : true,
        title: standardPricing?.title || "BVN Standard Slip",
        maintenanceMsg: standardPricing?.maintenanceMsg || null,
      },
      BVN_PREMIUM: {
        price: premiumPricing ? Number(premiumPricing.price) : 1000.0,
        isActive: premiumPricing ? premiumPricing.isActive : true,
        title: premiumPricing?.title || "BVN Premium Card Slip",
        maintenanceMsg: premiumPricing?.maintenanceMsg || null,
      },
    };

    const isAvailable = (pricing.BVN_STANDARD.isActive || pricing.BVN_PREMIUM.isActive);

    return NextResponse.json({
      success: true,
      status: {
        isAvailable,
        availableSlips: [
          ...(pricing.BVN_STANDARD.isActive ? ["bvn_standard"] : []),
          ...(pricing.BVN_PREMIUM.isActive ? ["bvn_premium"] : []),
        ],
      },
      pricing,
    });
  } catch (error: any) {
    console.error("❌ BVN Status API Error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to retrieve BVN gateway status",
    }, { status: 500 });
  }
}
