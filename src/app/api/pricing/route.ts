import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prices = await prisma.servicePricing.findMany();
    
    const pricingMap = prices.reduce((acc: any, item) => {
      acc[item.serviceKey] = Number(item.price);
      return acc;
    }, {});

    const defaultPricing = {
      LLC_BASE: pricingMap.LLC_BASE || 10000,
      LLC_EXTRA_MILLION: pricingMap.LLC_EXTRA_MILLION || 5000,
      SERVICE_CHARGE: pricingMap.SERVICE_CHARGE || 20000,
    };

    return NextResponse.json({ success: true, data: defaultPricing });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch pricing" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { service, shares, companyType } = body;

    // Fetch dynamic pricing from DB
    const prices = await prisma.servicePricing.findMany();
    const pricingMap = prices.reduce((acc: any, item) => {
      acc[item.serviceKey] = Number(item.price);
      return acc;
    }, {});

    // Set prices with strict fallbacks
    const baseCACFee = pricingMap.LLC_BASE || 10000;
    const extraMillionFee = pricingMap.LLC_EXTRA_MILLION || 5000;
    const serviceCharge = pricingMap.SERVICE_CHARGE || 20000;

    if (service === 'llc') {
      const totalShares = Number(shares) || 1000000;

      // Calculate Extra Shares Fee (e.g., 5000 for every additional 1,000,000 shares)
      const extraSharesCACFee = Math.max(0, Math.ceil((totalShares - 1000000) / 1000000)) * extraMillionFee;

      // Calculate Stamp Duty (0.75% of total share capital)
      const stampDuty = totalShares * 0.0075;

      // Grand Total
      const total = baseCACFee + extraSharesCACFee + stampDuty + serviceCharge;

      // Send the exact structure the PreviewStep is waiting for
      return NextResponse.json({
        baseFee: baseCACFee,
        extraSharesFee: extraSharesCACFee,
        stampDuty: stampDuty,
        serviceFee: serviceCharge,
        total: total
      });
    }

    return NextResponse.json({ message: "Invalid service type." }, { status: 400 });

  } catch (error) {
    console.error("Pricing POST error:", error);
    return NextResponse.json({ success: false, message: "Failed to calculate pricing" }, { status: 500 });
  }
}
