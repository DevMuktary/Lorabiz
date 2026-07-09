import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. GUARANTEE CAC SERVICES EXIST
    const cacDefaults = [
      { key: "BUSINESS_NAME", title: "Business Name Registration", price: 20000 },
      { key: "LLC_BASE", title: "LLC Formation (Base 1M Shares)", price: 50000 },
      { key: "LLC_EXTRA_1M", title: "LLC Additional (Per Extra 1M Shares)", price: 15000 },
    ];

    for (const srv of cacDefaults) {
      await prisma.servicePricing.upsert({
        where: { serviceKey: srv.key },
        update: {}, // Do nothing if it exists, preserve MD's custom price
        create: {
          serviceKey: srv.key,
          title: srv.title,
          price: srv.price,
          isActive: true,
          maintenanceMsg: "This service is currently undergoing maintenance. Check back shortly."
        }
      });
    }

    // 2. GUARANTEE NIN SERVICES EXIST
    const ninDefaults = [
      { key: "nin_regular", title: "Regular NIN Slip", price: 1500 },
      { key: "nin_standard", title: "Standard NIN Slip", price: 2500 },
      { key: "nin_premium", title: "Premium Card Slip", price: 4000 },
    ];

    for (const nin of ninDefaults) {
      await prisma.ninSlipPricing.upsert({
        where: { slipType: nin.key },
        update: {},
        create: {
          slipType: nin.key,
          displayName: nin.title,
          price: nin.price,
          isActive: true
        }
      });
    }

    // 3. FETCH ALL SETTINGS
    const cacPricing = await prisma.servicePricing.findMany({ orderBy: { serviceKey: 'asc' } });
    const ninPricing = await prisma.ninSlipPricing.findMany({ orderBy: { slipType: 'asc' } });

    return NextResponse.json({ cacPricing, ninPricing });
  } catch (error) {
    console.error("Settings API Error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
