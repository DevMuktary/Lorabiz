import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch live toggles from MDS Service Pricing
    const cacServices = await prisma.servicePricing.findMany();
    const ninServices = await prisma.ninSlipPricing.findMany();

    const getCac = (key: string) => cacServices.find(s => s.serviceKey === key);
    
    const bn = getCac("BUSINESS_NAME");
    const llc = getCac("LLC");
    const ninRegular = ninServices.find(s => s.slipType === "nin_regular");

    // 2. Map them to what ServiceGuard expects
    const settings = {
      bnEnabled: bn?.isActive ?? true,
      bnReason: bn?.maintenanceMsg || "Business Name registration is currently down for maintenance.",
      llcEnabled: llc?.isActive ?? true,
      llcReason: llc?.maintenanceMsg || "Company incorporation is currently down for maintenance.",
      ninEnabled: ninRegular?.isActive ?? true,
      ninReason: "NIN Slip generation is currently down for maintenance."
    };

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Failed to fetch global settings:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
