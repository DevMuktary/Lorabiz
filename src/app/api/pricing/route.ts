import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prices = await prisma.servicePricing.findMany();
    
    // Map DB rows to a clean object
    const pricingMap = prices.reduce((acc: any, item) => {
      acc[item.serviceKey] = Number(item.price);
      return acc;
    }, {});

    // Provide safe fallbacks in case DB hasn't been seeded yet
    const defaultPricing = {
      LLC: pricingMap.LLC || 35000,
      LLC_EXTRA_MILLION: pricingMap.LLC_EXTRA_MILLION || 15000,
      BUSINESS_NAME: pricingMap.BUSINESS_NAME || 29000,
      NGO: pricingMap.NGO || 120000,
    };

    return NextResponse.json({ success: true, data: defaultPricing });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch pricing" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { service, shares } = body;

    // Fetch dynamic pricing from DB
    const prices = await prisma.servicePricing.findMany();
    const pricingMap = prices.reduce((acc: any, item) => {
      acc[item.serviceKey] = Number(item.price);
      return acc;
    }, {});

    // 1. Unified Base Fee (Includes standard CAC, Stamp, and processing fee for up to 1M shares)
    const baseLLCFee = pricingMap.LLC || 35000;
    
    // 2. Extra Million Multiplier Fee
    const extraMillionFee = pricingMap.LLC_EXTRA_MILLION || 15000;

    if (service === 'llc') {
      const totalShares = Number(shares) || 1000000;

      // Math.ceil correctly handles exactly what you asked for:
      // 1M shares = 0 extra
      // 2M shares = 1 extra multiplier
      // 3M shares = 2 extra multipliers, etc.
      const extraSharesCACFee = Math.max(0, Math.ceil((totalShares - 1000000) / 1000000)) * extraMillionFee;

      // Grand Total
      const total = baseLLCFee + extraSharesCACFee;

      // Notice: We intentionally do NOT return stampDuty or serviceFee here.
      // This ensures the frontend doesn't render those rows, keeping the price clean to the user.
      return NextResponse.json({
        baseFee: baseLLCFee,
        extraSharesFee: extraSharesCACFee,
        total: total
      });
    }

    // Handlers for other services you offer
    if (service === 'business-name') {
      return NextResponse.json({
        baseFee: pricingMap.BUSINESS_NAME || 29000,
        total: pricingMap.BUSINESS_NAME || 29000
      });
    }
    
    if (service === 'ngo') {
      return NextResponse.json({
        baseFee: pricingMap.NGO || 120000,
        total: pricingMap.NGO || 120000
      });
    }

    return NextResponse.json({ message: "Invalid service type." }, { status: 400 });

  } catch (error) {
    console.error("Pricing POST error:", error);
    return NextResponse.json({ success: false, message: "Failed to calculate pricing" }, { status: 500 });
  }
}
