// src/app/api/pricing/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prices = await prisma.servicePricing.findMany();
    
    const pricingMap = prices.reduce((acc: Record<string, number>, item) => {
      acc[item.serviceKey] = Number(item.price);
      return acc;
    }, {});

    const validationNoRecord = pricingMap.NIN_VALIDATION_NO_RECORD ?? pricingMap.NIN_VAL_NO_RECORD ?? 2000;
    const validationVnin = pricingMap.NIN_VALIDATION_VNIN ?? pricingMap.NIN_VAL_VNIN ?? 2500;
    const validationMod = pricingMap.NIN_VALIDATION_MOD ?? pricingMap.NIN_VAL_MOD_RECORD ?? 3000;

    const modName = pricingMap.NIN_MOD_NAME ?? 2500;
    const modPhone = pricingMap.NIN_MOD_PHONE ?? 2000;
    const modAddress = pricingMap.NIN_MOD_ADDRESS ?? 2000;
    const modDob = pricingMap.NIN_MOD_DOB ?? 15000;

    const defaultPricing: Record<string, number> = {
      // Pass-through all raw database prices first
      ...pricingMap,

      // CAC Services
      LLC: pricingMap.LLC ?? 35000,
      LLC_EXTRA_MILLION: pricingMap.LLC_EXTRA_MILLION ?? 15000,
      BUSINESS_NAME: pricingMap.BUSINESS_NAME ?? 29000,
      NGO: pricingMap.NGO ?? 120000,
      NAME_SUBSTITUTION: pricingMap.NAME_SUBSTITUTION ?? 5000,

      // Compliance & Tax
      SCUML: pricingMap.SCUML ?? 320000,
      TAX_ID_INDIVIDUAL: pricingMap.TAX_ID_INDIVIDUAL ?? 500,
      TAX_ID_CORPORATE: pricingMap.TAX_ID_CORPORATE ?? 1000,

      // NIN Slips (by NIN)
      NIN_BASIC: pricingMap.NIN_BASIC ?? 400,
      NIN_VNIN: pricingMap.NIN_VNIN ?? 500,
      NIN_REGULAR: pricingMap.NIN_REGULAR ?? 500,
      NIN_STANDARD: pricingMap.NIN_STANDARD ?? 700,
      NIN_PREMIUM: pricingMap.NIN_PREMIUM ?? 1000,

      // NIN Slips (by Phone)
      NIN_PHONE_REGULAR: pricingMap.NIN_PHONE_REGULAR ?? 500,
      NIN_PHONE_STANDARD: pricingMap.NIN_PHONE_STANDARD ?? 700,
      NIN_PHONE_PREMIUM: pricingMap.NIN_PHONE_PREMIUM ?? 1000,

      // NIN Validation (Canonical & Legacy Aliases)
      NIN_VALIDATION_NO_RECORD: validationNoRecord,
      NIN_VALIDATION_VNIN: validationVnin,
      NIN_VALIDATION_MOD: validationMod,
      NIN_VAL_NO_RECORD: validationNoRecord,
      NIN_VAL_VNIN: validationVnin,
      NIN_VAL_MOD_RECORD: validationMod,

      // NIN Modification
      NIN_MOD_NAME: modName,
      NIN_MOD_PHONE: modPhone,
      NIN_MOD_ADDRESS: modAddress,
      NIN_MOD_DOB: modDob,

      // Advanced NIMC
      NIN_PERSONALIZATION: pricingMap.NIN_PERSONALIZATION ?? 1500,
      NIN_IPE_CLEARANCE: pricingMap.NIN_IPE_CLEARANCE ?? 2500,

      // BVN Services
      BVN_STANDARD: pricingMap.BVN_STANDARD ?? 700,
      BVN_PREMIUM: pricingMap.BVN_PREMIUM ?? 1000,
      BVN_RETRIEVAL: pricingMap.BVN_RETRIEVAL ?? 2500,

      // BVN Modification Services
      BVN_MOD_NAME: pricingMap.BVN_MOD_NAME ?? 3000,
      BVN_MOD_PHONE: pricingMap.BVN_MOD_PHONE ?? 2500,
      BVN_MOD_DOB: pricingMap.BVN_MOD_DOB ?? 15000,
      BVN_MOD_DOB_SURCHARGE: pricingMap.BVN_MOD_DOB_SURCHARGE ?? 5000,

      // Utilities
      AIRTIME: 0,
      MOBILE_DATA: 0,
    };

    return NextResponse.json({ success: true, data: defaultPricing });
  } catch (error) {
    console.error("Failed to fetch pricing:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch pricing" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { service, shares } = body;

    const prices = await prisma.servicePricing.findMany();
    const pricingMap = prices.reduce((acc: Record<string, number>, item) => {
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

    // NIN Slips
    if (service === 'nin_regular' || service === 'NIN_REGULAR') {
      return NextResponse.json({ baseFee: pricingMap.NIN_REGULAR || 500, total: pricingMap.NIN_REGULAR || 500 });
    }
    if (service === 'nin_standard' || service === 'NIN_STANDARD') {
      return NextResponse.json({ baseFee: pricingMap.NIN_STANDARD || 700, total: pricingMap.NIN_STANDARD || 700 });
    }
    if (service === 'nin_premium' || service === 'NIN_PREMIUM') {
      return NextResponse.json({ baseFee: pricingMap.NIN_PREMIUM || 1000, total: pricingMap.NIN_PREMIUM || 1000 });
    }

    // BVN Slips & Retrieval
    if (service === 'bvn_standard' || service === 'BVN_STANDARD') {
      return NextResponse.json({ baseFee: pricingMap.BVN_STANDARD || 700, total: pricingMap.BVN_STANDARD || 700 });
    }
    if (service === 'bvn_premium' || service === 'BVN_PREMIUM') {
      return NextResponse.json({ baseFee: pricingMap.BVN_PREMIUM || 1000, total: pricingMap.BVN_PREMIUM || 1000 });
    }
    if (service === 'bvn_retrieval' || service === 'BVN_RETRIEVAL') {
      return NextResponse.json({ baseFee: pricingMap.BVN_RETRIEVAL || 2500, total: pricingMap.BVN_RETRIEVAL || 2500 });
    }

    // Generic lookup fallback for any serviceKey
    const normalizedKey = String(service).toUpperCase().replace(/-/g, '_');
    if (pricingMap[normalizedKey]) {
      return NextResponse.json({ baseFee: pricingMap[normalizedKey], total: pricingMap[normalizedKey] });
    }

    return NextResponse.json({ message: "Invalid service type." }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to calculate pricing" }, { status: 500 });
  }
}
