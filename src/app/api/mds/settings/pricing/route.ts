import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Ensure NIN_PERSONALIZATION and NIN_VALIDATION services exist in ServicePricing
    const defaultServices = [
      { serviceKey: "NIN_PERSONALIZATION", title: "NIN Personalization", price: 1500.0 },
      { serviceKey: "NIN_VALIDATION_NO_RECORD", title: "NIN Validation (No Record Found)", price: 2000.0 },
      { serviceKey: "NIN_VALIDATION_VNIN", title: "NIN Validation (VNIN Validation)", price: 2500.0 },
      { serviceKey: "NIN_VALIDATION_MOD", title: "NIN Validation (Update Record Mod)", price: 3000.0 },
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
