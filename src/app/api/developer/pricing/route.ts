import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export interface DeveloperApiServiceInfo {
  serviceKey: string;
  name: string;
  endpoint: string;
  method: "POST" | "GET";
  category: "NIN_VERIFICATION" | "PHONE_VERIFICATION" | "NIN_VALIDATION" | "NIMC_SPECIAL_SERVICES";
  categoryLabel: string;
  slipType?: string;
  validationType?: string;
  mode: "Synchronous (Instant)" | "Asynchronous (Webhook + Polling)";
  defaultPrice: number;
  description: string;
}

export const CANONICAL_DEVELOPER_SERVICES: DeveloperApiServiceInfo[] = [
  // 1. NIN Verification by NIN (POST /api/v1/nin/by-nin)
  {
    serviceKey: "API_NIN_BASIC",
    name: "Basic Slip",
    endpoint: "/api/v1/nin/by-nin",
    method: "POST",
    category: "NIN_VERIFICATION",
    categoryLabel: "NIN Verification (by NIN)",
    slipType: "nin_basic",
    mode: "Synchronous (Instant)",
    defaultPrice: 100.0,
    description: "Basic demographic slip in PDF format.",
  },
  {
    serviceKey: "API_NIN_VNIN",
    name: "VNIN Slip",
    endpoint: "/api/v1/nin/by-nin",
    method: "POST",
    category: "NIN_VERIFICATION",
    categoryLabel: "NIN Verification (by NIN)",
    slipType: "nin_vnin",
    mode: "Synchronous (Instant)",
    defaultPrice: 100.0,
    description: "Virtual NIN (vNIN) slip.",
  },
  {
    serviceKey: "API_NIN_REGULAR",
    name: "Regular Slip",
    endpoint: "/api/v1/nin/by-nin",
    method: "POST",
    category: "NIN_VERIFICATION",
    categoryLabel: "NIN Verification (by NIN)",
    slipType: "nin_regular",
    mode: "Synchronous (Instant)",
    defaultPrice: 150.0,
    description: "Standard regular NIMC verification slip.",
  },
  {
    serviceKey: "API_NIN_STANDARD",
    name: "Standard Slip",
    endpoint: "/api/v1/nin/by-nin",
    method: "POST",
    category: "NIN_VERIFICATION",
    categoryLabel: "NIN Verification (by NIN)",
    slipType: "nin_standard",
    mode: "Synchronous (Instant)",
    defaultPrice: 150.0,
    description: "Standard biometric KYC slip with photo.",
  },
  {
    serviceKey: "API_NIN_PREMIUM",
    name: "Premium Slip",
    endpoint: "/api/v1/nin/by-nin",
    method: "POST",
    category: "NIN_VERIFICATION",
    categoryLabel: "NIN Verification (by NIN)",
    slipType: "nin_premium",
    mode: "Synchronous (Instant)",
    defaultPrice: 200.0,
    description: "Premium card slip with front and back panels.",
  },

  // 2. NIN Verification by Phone (POST /api/v1/nin/by-phone)
  {
    serviceKey: "API_NIN_PHONE_REGULAR",
    name: "Regular Slip",
    endpoint: "/api/v1/nin/by-phone",
    method: "POST",
    category: "PHONE_VERIFICATION",
    categoryLabel: "NIN Verification (by Phone)",
    slipType: "nin_regular",
    mode: "Synchronous (Instant)",
    defaultPrice: 150.0,
    description: "Regular slip resolved by phone number.",
  },
  {
    serviceKey: "API_NIN_PHONE_STANDARD",
    name: "Standard Slip",
    endpoint: "/api/v1/nin/by-phone",
    method: "POST",
    category: "PHONE_VERIFICATION",
    categoryLabel: "NIN Verification (by Phone)",
    slipType: "nin_standard",
    mode: "Synchronous (Instant)",
    defaultPrice: 150.0,
    description: "Standard KYC slip with photo resolved by phone number.",
  },
  {
    serviceKey: "API_NIN_PHONE_PREMIUM",
    name: "Premium Slip",
    endpoint: "/api/v1/nin/by-phone",
    method: "POST",
    category: "PHONE_VERIFICATION",
    categoryLabel: "NIN Verification (by Phone)",
    slipType: "nin_premium",
    mode: "Synchronous (Instant)",
    defaultPrice: 200.0,
    description: "Premium card slip resolved by phone number.",
  },

  // 3. NIN Validation Pipeline (POST /api/v1/nin/validation)
  {
    serviceKey: "NIN_VALIDATION_NO_RECORD",
    name: "No Record Found",
    endpoint: "/api/v1/nin/validation",
    method: "POST",
    category: "NIN_VALIDATION",
    categoryLabel: "NIN Validation Pipeline",
    validationType: "no_record_found",
    mode: "Asynchronous (Webhook + Polling)",
    defaultPrice: 700.0,
    description: "Validates non-appearing records.",
  },
  {
    serviceKey: "NIN_VALIDATION_VNIN",
    name: "VNIN Validation",
    endpoint: "/api/v1/nin/validation",
    method: "POST",
    category: "NIN_VALIDATION",
    categoryLabel: "NIN Validation Pipeline",
    validationType: "vnin_validation",
    mode: "Asynchronous (Webhook + Polling)",
    defaultPrice: 2500.0,
    description: "Resolves banking and telecom restrictions.",
  },
  {
    serviceKey: "NIN_VALIDATION_MOD",
    name: "Modification",
    endpoint: "/api/v1/nin/validation",
    method: "POST",
    category: "NIN_VALIDATION",
    categoryLabel: "NIN Validation Pipeline",
    validationType: "modification",
    mode: "Asynchronous (Webhook + Polling)",
    defaultPrice: 3000.0,
    description: "Processes demographic modifications.",
  },
  {
    serviceKey: "NIN_VALIDATION_PHOTO_ERROR",
    name: "Photo Error",
    endpoint: "/api/v1/nin/validation",
    method: "POST",
    category: "NIN_VALIDATION",
    categoryLabel: "NIN Validation Pipeline",
    validationType: "photo_error",
    mode: "Asynchronous (Webhook + Polling)",
    defaultPrice: 1600.0,
    description: "Fixes biometric image mismatches.",
  },

  // 4. NIMC Special Operations (POST /api/v1/nin/ipe & /personalization)
  {
    serviceKey: "API_NIN_IPE_CLEARANCE",
    name: "IPE Clearance",
    endpoint: "/api/v1/nin/ipe",
    method: "POST",
    category: "NIMC_SPECIAL_SERVICES",
    categoryLabel: "Special Operations",
    mode: "Asynchronous (Webhook + Polling)",
    defaultPrice: 2500.0,
    description: "Clears In-Processing Error.",
  },
  {
    serviceKey: "API_NIN_PERSONALIZATION",
    name: "NIN Personalization",
    endpoint: "/api/v1/nin/personalization",
    method: "POST",
    category: "NIMC_SPECIAL_SERVICES",
    categoryLabel: "Special Operations",
    mode: "Asynchronous (Webhook + Polling)",
    defaultPrice: 1500.0,
    description: "Generates personalized NIN slip.",
  },
];

/**
 * GET /api/developer/pricing
 * Dynamic public/developer endpoint returning real-time wholesale pricing,
 * endpoints, and availability directly from PostgreSQL ServicePricing.
 */
export async function GET() {
  try {
    const keys = CANONICAL_DEVELOPER_SERVICES.map((s) => s.serviceKey);
    // Include fallback alias NIN_PERSONALIZATION
    const existing = await prisma.servicePricing.findMany({
      where: {
        serviceKey: {
          in: [...keys, "NIN_PERSONALIZATION"],
        },
      },
    });

    const priceMap = new Map(existing.map((e) => [e.serviceKey, e]));

    const services = CANONICAL_DEVELOPER_SERVICES.map((def) => {
      let record = priceMap.get(def.serviceKey);
      if (!record && def.serviceKey === "API_NIN_PERSONALIZATION") {
        record = priceMap.get("NIN_PERSONALIZATION");
      }

      return {
        serviceKey: def.serviceKey,
        name: def.name,
        endpoint: def.endpoint,
        method: def.method,
        category: def.category,
        categoryLabel: def.categoryLabel,
        slipType: def.slipType || null,
        validationType: def.validationType || null,
        mode: def.mode,
        description: def.description,
        price: record ? Number(record.price) : def.defaultPrice,
        currency: "NGN",
        isActive: record ? record.isActive : true,
        maintenanceMsg: record?.maintenanceMsg || null,
        updatedAt: record?.updatedAt?.toISOString() || null,
      };
    });

    return NextResponse.json({
      success: true,
      services,
      count: services.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ [Developer Pricing GET Error]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load developer API pricing." },
      { status: 500 }
    );
  }
}
