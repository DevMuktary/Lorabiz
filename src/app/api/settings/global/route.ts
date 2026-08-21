import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cacServices = await prisma.servicePricing.findMany();
    const ninServices = await prisma.ninSlipPricing.findMany();

    const getCac = (key: string) => cacServices.find(s => s.serviceKey === key);
    
    const bn = getCac("BUSINESS_NAME");
    const llc = getCac("LLC");
    const scuml = getCac("SCUML");
    const taxIdInd = getCac("TAX_ID_INDIVIDUAL");
    const taxIdCorp = getCac("TAX_ID_CORPORATE");
    const ninIpe = getCac("NIN_IPE_CLEARANCE");
    
    // Fetch individual NIN toggles and prices
    const ninRegular = ninServices.find(s => s.slipType === "nin_regular");
    const ninStandard = ninServices.find(s => s.slipType === "nin_standard");
    const ninPremium = ninServices.find(s => s.slipType === "nin_premium");

    const isAnyNinActive = (ninRegular?.isActive || ninStandard?.isActive || ninPremium?.isActive);
    const isAnyTaxIdActive = (taxIdInd?.isActive ?? true) || (taxIdCorp?.isActive ?? true);

    const settings = {
      bnEnabled: bn?.isActive ?? true,
      bnReason: bn?.maintenanceMsg || "Business Name registration is currently down for maintenance.",
      llcEnabled: llc?.isActive ?? true,
      llcReason: llc?.maintenanceMsg || "Company incorporation is currently down for maintenance.",
      
      scumlEnabled: scuml?.isActive ?? true,
      scumlReason: scuml?.maintenanceMsg || "SCUML registration is currently down for maintenance.",

      taxIdEnabled: isAnyTaxIdActive,
      taxIdReason: taxIdInd?.maintenanceMsg || taxIdCorp?.maintenanceMsg || "Tax ID processing is currently down for maintenance.",
      taxIdIndividualEnabled: taxIdInd?.isActive ?? true,
      taxIdCorporateEnabled: taxIdCorp?.isActive ?? true,

      ninIpeEnabled: ninIpe?.isActive ?? true,
      ninIpeReason: ninIpe?.maintenanceMsg || "NIMC IPE Clearance is currently down for maintenance.",

      ninEnabled: isAnyNinActive ?? true,
      ninReason: "NIN Slip generation is currently down for maintenance.",
      ninOptions: {
        nin_regular: ninRegular?.isActive ?? true,
        nin_standard: ninStandard?.isActive ?? true,
        nin_premium: ninPremium?.isActive ?? true,
      },
      ninPrices: {
        nin_regular: Number(ninRegular?.price || 0),
        nin_standard: Number(ninStandard?.price || 0),
        nin_premium: Number(ninPremium?.price || 0),
      }
    };

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Failed to fetch global settings:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
