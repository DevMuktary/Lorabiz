import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prices = await prisma.servicePricing.findMany();
    
    // Convert array of database rows into a simple key-value object
    // e.g., { LLC_BASE: 35000, LLC_EXTRA_MILLION: 21000, SERVICE_CHARGE: 15000 }
    const pricingMap = prices.reduce((acc: any, item) => {
      acc[item.serviceKey] = Number(item.price);
      return acc;
    }, {});

    // Fallbacks just in case the database is empty during early testing
    const defaultPricing = {
      LLC_BASE: pricingMap.LLC_BASE || 35000,
      LLC_EXTRA_MILLION: pricingMap.LLC_EXTRA_MILLION || 21000,
      SERVICE_CHARGE: pricingMap.SERVICE_CHARGE || 15000,
    };

    return NextResponse.json({ success: true, data: defaultPricing });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch pricing" }, { status: 500 });
  }
}
