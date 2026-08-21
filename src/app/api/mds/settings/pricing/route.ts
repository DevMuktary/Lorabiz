import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: { email: session.user.email, role: "ADMIN" }
    });
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }
    // Ensure NIN services exist in ServicePricing
    const defaultServices = [
      { serviceKey: "NIN_BASIC", title: "Basic NIN Slip", price: 400.0 },
      { serviceKey: "NIN_VNIN", title: "VNIN Verification Slip", price: 500.0 },
      { serviceKey: "NIN_REGULAR", title: "Regular Official Slip", price: 500.0 },
      { serviceKey: "NIN_STANDARD", title: "Standard Biometric Slip", price: 700.0 },
      { serviceKey: "NIN_PREMIUM", title: "Premium Card Layout", price: 1000.0 },
      // Phone Query Slips
      { serviceKey: "NIN_PHONE_REGULAR", title: "Phone Query - Regular Slip", price: 500.0 },
      { serviceKey: "NIN_PHONE_STANDARD", title: "Phone Query - Standard Slip", price: 700.0 },
      { serviceKey: "NIN_PHONE_PREMIUM", title: "Phone Query - Premium Slip", price: 1000.0 },
      { serviceKey: "NIN_PERSONALIZATION", title: "NIN Personalization", price: 1500.0 },
      { serviceKey: "NIN_IPE_CLEARANCE", title: "IPE Clearance (Exception Resolution)", price: 2500.0 },
      { serviceKey: "NIN_VALIDATION_NO_RECORD", title: "NIN Validation (No Record Found)", price: 2000.0 },
      { serviceKey: "NIN_VALIDATION_VNIN", title: "NIN Validation (VNIN Validation)", price: 2500.0 },
      { serviceKey: "NIN_VALIDATION_MOD", title: "NIN Validation (Update Record Mod)", price: 3000.0 },
      // NIN Modification Services
      { serviceKey: "NIN_MOD_NAME", title: "NIN Modification - Change of Name", price: 2500.0 },
      { serviceKey: "NIN_MOD_PHONE", title: "NIN Modification - Change of Phone Number", price: 2000.0 },
      { serviceKey: "NIN_MOD_ADDRESS", title: "NIN Modification - Change of Address", price: 2000.0 },
      // BVN Services
      { serviceKey: "BVN_STANDARD", title: "BVN Verification - Standard Slip", price: 700.0 },
      { serviceKey: "BVN_PREMIUM", title: "BVN Verification - Premium Card Slip", price: 1000.0 },
      { serviceKey: "BVN_RETRIEVAL", title: "BVN Number Retrieval", price: 2500.0 },
      // BVN Modification Services
      { serviceKey: "BVN_MOD_NAME", title: "BVN Modification - Change of Name", price: 3000.0 },
      { serviceKey: "BVN_MOD_PHONE", title: "BVN Modification - Change of Phone Number", price: 2500.0 },
      { serviceKey: "BVN_MOD_DOB", title: "BVN Modification - Change of Date of Birth", price: 15000.0 },
      { serviceKey: "BVN_MOD_DOB_SURCHARGE", title: "BVN Modification - 5-Year DOB Surcharge", price: 5000.0 },
    ];

    for (const svc of defaultServices) {
      const existing = await prisma.servicePricing.findUnique({
        where: { serviceKey: svc.serviceKey },
      });
      if (!existing) {
        await prisma.servicePricing.create({
          data: {
            serviceKey: svc.serviceKey,
            title: svc.title,
            price: svc.price,
            isActive: true,
          },
        });
      }
    }

    // 1. FETCH ALL SETTINGS DIRECTLY
    const cacPricing = await prisma.servicePricing.findMany({ 
      orderBy: { serviceKey: 'asc' } 
    });
    
    const ninPricing = await prisma.ninSlipPricing.findMany({ 
      orderBy: { slipType: 'asc' } 
    });

    return NextResponse.json({ cacPricing, ninPricing });
  } catch (error) {
    console.error("Settings API Error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
