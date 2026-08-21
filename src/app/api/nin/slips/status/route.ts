import { NextResponse } from "next/server";
import { getNinSlipProviderStatus } from "@/lib/nin-slips-provider";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getNinSlipProviderStatus();

    // Fetch live pricing for all NIN & Phone search slips
    const slipKeys = [
      "NIN_BASIC",
      "NIN_VNIN",
      "NIN_REGULAR",
      "NIN_STANDARD",
      "NIN_PREMIUM",
      "NIN_PHONE_REGULAR",
      "NIN_PHONE_STANDARD",
      "NIN_PHONE_PREMIUM",
    ];

    const pricingList = await prisma.servicePricing.findMany({
      where: {
        serviceKey: { in: slipKeys },
      },
    });

    const pricingMap: Record<string, { price: number; isActive: boolean; maintenanceMsg?: string | null; title: string }> = {};
    for (const p of pricingList) {
      pricingMap[p.serviceKey] = {
        price: Number(p.price),
        isActive: p.isActive,
        maintenanceMsg: p.maintenanceMsg,
        title: p.title,
      };
    }

    return NextResponse.json({
      success: true,
      status,
      pricing: pricingMap,
    });
  } catch (error: any) {
    console.error("❌ Error fetching NIN slip provider status:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch NIN provider status" },
      { status: 500 }
    );
  }
}
