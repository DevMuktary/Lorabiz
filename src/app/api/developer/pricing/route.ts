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
  // 1. NIN Slip Generation by NIN (POST /api/v1/nin/by-nin)
  {
    serviceKey: "API_NIN_BASIC",
    name: "NIN Verification (Basic Demographic Slip)",
    endpoint: "/api/v1/nin/by-nin",
    method: "POST",
    category: "NIN_VERIFICATION",
    categoryLabel: "NIN Verification (by NIN)",
    slipType: "nin_basic",
    mode: "Synchronous (Instant)",
    defaultPrice: 100.0,
    description: "Validates 11-digit NIN and returns standard basic demographic slip in PDF format.",
  },
  {
    serviceKey: "API_NIN_VNIN",
    name: "NIN Verification (Virtual NIN Slip)",
    endpoint: "/api/v1/nin/by-nin",
    method: "POST",
    category: "NIN_VERIFICATION",
    categoryLabel: "NIN Verification (by NIN)",
    slipType: "nin_vnin",
    mode: "Synchronous (Instant)",
    defaultPrice: 100.0,
    description: "Generates official Virtual NIN (vNIN) slip with masked identifiers.",
  },
  {
    serviceKey: "API_NIN_REGULAR",
    name: "NIN Verification (Regular Slip)",
    endpoint: "/api/v1/nin/by-nin",
    method: "POST",
    category: "NIN_VERIFICATION",
    categoryLabel: "NIN Verification (by NIN)",
    slipType: "nin_regular",
    mode: "Synchronous (Instant)",
    defaultPrice: 150.0,
    description: "Standard regular NIMC verification slip with official security watermark.",
  },
  {
    serviceKey: "API_NIN_STANDARD",
    name: "NIN Verification (Standard Biometric KYC Slip)",
    endpoint: "/api/v1/nin/by-nin",
    method: "POST",
    category: "NIN_VERIFICATION",
    categoryLabel: "NIN Verification (by NIN)",
    slipType: "nin_standard",
    mode: "Synchronous (Instant)",
    defaultPrice: 150.0,
    description: "Full biometric KYC identity slip with photograph, verified address, and demographics.",
  },
  {
    serviceKey: "API_NIN_PREMIUM",
    name: "NIN Verification (Premium Card Slip)",
    endpoint: "/api/v1/nin/by-nin",
    method: "POST",
    category: "NIN_VERIFICATION",
    categoryLabel: "NIN Verification (by NIN)",
    slipType: "nin_premium",
    mode: "Synchronous (Instant)",
    defaultPrice: 200.0,
    description: "Wallet-sized national ID card format with front & back biometric panels.",
  },

  // 2. NIN Slip Generation by Phone Number (POST /api/v1/nin/by-phone)
  {
    serviceKey: "API_NIN_PHONE_REGULAR",
    name: "Phone to NIN Verification (Regular Slip)",
    endpoint: "/api/v1/nin/by-phone",
    method: "POST",
    category: "PHONE_VERIFICATION",
    categoryLabel: "NIN Verification (by Phone)",
    slipType: "nin_regular",
    mode: "Synchronous (Instant)",
    defaultPrice: 150.0,
    description: "Resolves 11-digit registered phone number to citizen profile in Regular slip format.",
  },
  {
    serviceKey: "API_NIN_PHONE_STANDARD",
    name: "Phone to NIN Verification (Standard KYC Slip)",
    endpoint: "/api/v1/nin/by-phone",
    method: "POST",
    category: "PHONE_VERIFICATION",
    categoryLabel: "NIN Verification (by Phone)",
    slipType: "nin_standard",
    mode: "Synchronous (Instant)",
    defaultPrice: 150.0,
    description: "Resolves phone number to verified profile with applicant photograph and KYC demographics.",
  },
  {
    serviceKey: "API_NIN_PHONE_PREMIUM",
    name: "Phone to NIN Verification (Premium Card Slip)",
    endpoint: "/api/v1/nin/by-phone",
    method: "POST",
    category: "PHONE_VERIFICATION",
    categoryLabel: "NIN Verification (by Phone)",
    slipType: "nin_premium",
    mode: "Synchronous (Instant)",
    defaultPrice: 200.0,
    description: "Resolves phone number to premium wallet-sized national ID card slip format.",
  },

  // 3. NIN Validation Pipeline (POST /api/v1/nin/validation)
  {
    serviceKey: "NIN_VALIDATION_NO_RECORD",
    name: "NIN Validation (No Record Found)",
    endpoint: "/api/v1/nin/validation",
    method: "POST",
    category: "NIN_VALIDATION",
    categoryLabel: "NIN Validation Pipeline",
    validationType: "no_record_found",
    mode: "Asynchronous (Webhook + Polling)",
    defaultPrice: 700.0,
    description: "Queues background validation to index and link non-appearing NINs on national portals.",
  },
  {
    serviceKey: "NIN_VALIDATION_VNIN",
    name: "NIN Validation (SIM/Bank & VNIN)",
    endpoint: "/api/v1/nin/validation",
    method: "POST",
    category: "NIN_VALIDATION",
    categoryLabel: "NIN Validation Pipeline",
    validationType: "vnin_validation",
    mode: "Asynchronous (Webhook + Polling)",
    defaultPrice: 2500.0,
    description: "Resolves banking blocks, telecom restrictions, and vNIN linkage mismatches.",
  },
  {
    serviceKey: "NIN_VALIDATION_MOD",
    name: "NIN Validation (Modification)",
    endpoint: "/api/v1/nin/validation",
    method: "POST",
    category: "NIN_VALIDATION",
    categoryLabel: "NIN Validation Pipeline",
    validationType: "modification",
    mode: "Asynchronous (Webhook + Polling)",
    defaultPrice: 3000.0,
    description: "Validates and syncs approved modifications (name, date of birth, address).",
  },
  {
    serviceKey: "NIN_VALIDATION_PHOTO_ERROR",
    name: "NIN Validation (Photographic Error)",
    endpoint: "/api/v1/nin/validation",
    method: "POST",
    category: "NIN_VALIDATION",
    categoryLabel: "NIN Validation Pipeline",
    validationType: "photo_error",
    mode: "Asynchronous (Webhook + Polling)",
    defaultPrice: 1600.0,
    description: "Clears corrupted facial portrait records, blank images, or capture errors.",
  },

  // 4. NIMC Special Operations (POST /api/v1/nin/ipe & /personalization)
  {
    serviceKey: "API_NIN_IPE_CLEARANCE",
    name: "NIMC In-Processing Error (IPE) Clearance",
    endpoint: "/api/v1/nin/ipe",
    method: "POST",
    category: "NIMC_SPECIAL_SERVICES",
    categoryLabel: "NIMC Special Operations",
    mode: "Asynchronous (Webhook + Polling)",
    defaultPrice: 2500.0,
    description: "Clears stuck In-Processing Errors on tracking IDs and issues resolved NIN.",
  },
  {
    serviceKey: "API_NIN_PERSONALIZATION",
    name: "NIMC NIN Personalization",
    endpoint: "/api/v1/nin/personalization",
    method: "POST",
    category: "NIMC_SPECIAL_SERVICES",
    categoryLabel: "NIMC Special Operations",
    mode: "Asynchronous (Webhook + Polling)",
    defaultPrice: 1500.0,
    description: "Submits applicant tracking ID to generate and retrieve official digital NIN slip.",
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
