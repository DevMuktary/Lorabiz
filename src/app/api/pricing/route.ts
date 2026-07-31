// src/app/api/pricing/route.ts
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
      LLC: pricingMap.LLC || 35000,
      LLC_EXTRA_MILLION: pricingMap.LLC_EXTRA_MILLION || 15000,
      BUSINESS_NAME: pricingMap.BUSINESS_NAME || 29000,
      NGO: pricingMap.NGO || 120000,
      NAME_SUBSTITUTION: pricingMap.NAME_SUBSTITUTION || 5000,
      SCUML: pricingMap.SCUML || 15000,
      TAX_ID_INDIVIDUAL: pricingMap.TAX_ID_INDIVIDUAL || 500,
      TAX_ID_CORPORATE: pricingMap.TAX_ID_CORPORATE || 1000,
      // 🚨 NEW: NIN Slip Pricing added to the global fetch map
      NIN_REGULAR: pricingMap.NIN_REGULAR || 500,
      NIN_STANDARD: pricingMap.NIN_STANDARD || 700,
      NIN_PREMIUM: pricingMap.NIN_PREMIUM || 1000,
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

    const prices = await prisma.servicePricing.findMany();
    const pricingMap = prices.reduce((acc: any, item) => {
      acc[item.serviceKey] = Number(item.price);
      return acc;
    }, {});

    const baseLLCFee = pricingMap.LLC || 35000;
    const extraMillionFee = pricingMap.LLC_EXTRA_MILLION || 15000;

    if (service === 'llc') {
      const totalShares = Number(shares) || 1000000;
      const extraSharesCACFee = Math.max(0, Math.ceil((totalShares - 1000000) / 1000000)) * extraMillionFee;
      return NextResponse.json({ baseFee: baseLLCFee, extraSharesFee: extraSharesCACFee, total: baseLLCFee + extraSharesCACFee });
    }

    if (service === 'business-name') return NextResponse.json({ baseFee: pricingMap.BUSINESS_NAME || 29000, total: pricingMap.BUSINESS_NAME || 29000 });
    if (service === 'ngo') return NextResponse.json({ baseFee: pricingMap.NGO || 120000, total: pricingMap.NGO || 120000 });
    if (service === 'scuml') return NextResponse.json({ baseFee: pricingMap.SCUML || 15000, total: pricingMap.SCUML || 15000 });
    
    if (service === 'tax-id-individual') {
      return NextResponse.json({ baseFee: pricingMap.TAX_ID_INDIVIDUAL || 500, total: pricingMap.TAX_ID_INDIVIDUAL || 500 });
    }
    if (service === 'tax-id-corporate') {
      return NextResponse.json({ baseFee: pricingMap.TAX_ID_CORPORATE || 1000, total: pricingMap.TAX_ID_CORPORATE || 1000 });
    }

    // 🚨 NEW: Handlers for NIN Slip POST calculations
    if (service === 'nin_regular') {
      return NextResponse.json({ baseFee: pricingMap.NIN_REGULAR || 500, total: pricingMap.NIN_REGULAR || 500 });
    }
    if (service === 'nin_standard') {
      return NextResponse.json({ baseFee: pricingMap.NIN_STANDARD || 700, total: pricingMap.NIN_STANDARD || 700 });
    }
    if (service === 'nin_premium') {
      return NextResponse.json({ baseFee: pricingMap.NIN_PREMIUM || 1000, total: pricingMap.NIN_PREMIUM || 1000 });
    }

    return NextResponse.json({ message: "Invalid service type." }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to calculate pricing" }, { status: 500 });
  }
}
