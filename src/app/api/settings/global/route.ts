import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Ensure this isn't statically cached

export async function GET() {
  try {
    // 1. Fetch the actual service toggle states from the Pricing tables
    const cacServices = await prisma.servicePricing.findMany();
    const ninServices = await prisma.ninSlipPricing.findMany();

    // 2. Helper to find specific services
    const getCac = (key: string) => cacServices.find(s => s.serviceKey === key);
    
    const bn = getCac("BUSINESS_NAME");
    const llc = getCac("LLC");
    
    // Check if ALL NIN services are disabled, or just check the regular one as the master switch
    const ninRegular = ninServices.find(s => s.slipType === "nin_regular");

    // 3. Map them to the format ServiceGuard expects
    const settings = {
      // Business Name
      bnEnabled: bn?.isActive ?? true,
      bnReason: bn?.maintenanceMsg || "Business Name registration is currently down for maintenance.",
      
      // LLC
      llcEnabled: llc?.isActive ?? true,
      llcReason: llc?.maintenanceMsg || "Company incorporation is currently down for maintenance.",
      
      // NIN
      ninEnabled: ninRegular?.isActive ?? true,
      ninReason: "NIN Slip generation is currently down for maintenance." // NIN table doesn't have maintenanceMsg in your schema, so we hardcode a fallback
    };

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Failed to fetch global settings:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
