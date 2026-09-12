import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export interface ApiServiceDefinition {
  serviceKey: string;
  title: string;
  category: "NIN_VERIFICATION" | "PHONE_VERIFICATION" | "NIN_VALIDATION" | "NIMC_SPECIAL_SERVICES";
  categoryLabel: string;
  defaultPrice: number;
  description: string;
}

export const KNOWN_API_SERVICES: ApiServiceDefinition[] = [
  // NIN Verification (By NIN)
  {
    serviceKey: "API_NIN_BASIC",
    title: "NIN Verification (Basic Slip)",
    category: "NIN_VERIFICATION",
    categoryLabel: "NIN Verification (by NIN)",
    defaultPrice: 100.0,
    description: "Generates basic black and white NIN slip layout with essential demographics.",
  },
  {
    serviceKey: "API_NIN_VNIN",
    title: "NIN Verification (vNIN Slip)",
    category: "NIN_VERIFICATION",
    categoryLabel: "NIN Verification (by NIN)",
    defaultPrice: 100.0,
    description: "Generates official virtual NIN slip layout.",
  },
  {
    serviceKey: "API_NIN_REGULAR",
    title: "NIN Verification (Regular Slip)",
    category: "NIN_VERIFICATION",
    categoryLabel: "NIN Verification (by NIN)",
    defaultPrice: 150.0,
    description: "Standard regular NIMC verification slip format.",
  },
  {
    serviceKey: "API_NIN_STANDARD",
    title: "NIN Verification (Standard Slip)",
    category: "NIN_VERIFICATION",
    categoryLabel: "NIN Verification (by NIN)",
    defaultPrice: 150.0,
    description: "Standard KYC biometric slip with applicant photograph and full verified demographics.",
  },
  {
    serviceKey: "API_NIN_PREMIUM",
    title: "NIN Verification (Premium Slip)",
    category: "NIN_VERIFICATION",
    categoryLabel: "NIN Verification (by NIN)",
    defaultPrice: 200.0,
    description: "Premium credit-card sized biometric ID card layout featuring front & back panels.",
  },

  // Phone Verification (By Phone)
  {
    serviceKey: "API_NIN_PHONE_REGULAR",
    title: "Phone Verification (Regular Slip)",
    category: "PHONE_VERIFICATION",
    categoryLabel: "NIN Verification (by Phone)",
    defaultPrice: 150.0,
    description: "Search national registry by 11-digit registered phone number (Regular Slip).",
  },
  {
    serviceKey: "API_NIN_PHONE_STANDARD",
    title: "Phone Verification (Standard Slip)",
    category: "PHONE_VERIFICATION",
    categoryLabel: "NIN Verification (by Phone)",
    defaultPrice: 150.0,
    description: "Search national registry by 11-digit phone number (Standard KYC Slip with photo).",
  },
  {
    serviceKey: "API_NIN_PHONE_PREMIUM",
    title: "Phone Verification (Premium Slip)",
    category: "PHONE_VERIFICATION",
    categoryLabel: "NIN Verification (by Phone)",
    defaultPrice: 200.0,
    description: "Search national registry by 11-digit phone number (Premium ID Card layout).",
  },

  // NIN Validation Pipeline
  {
    serviceKey: "NIN_VALIDATION_NO_RECORD",
    title: "NIN Validation (No Record Found)",
    category: "NIN_VALIDATION",
    categoryLabel: "NIN Validation Pipeline",
    defaultPrice: 700.0,
    description: "Validation pipeline resolving non-appearing or unindexed records on NIMC/telco portals.",
  },
  {
    serviceKey: "NIN_VALIDATION_VNIN",
    title: "NIN Validation (SIM/Bank & VNIN)",
    category: "NIN_VALIDATION",
    categoryLabel: "NIN Validation Pipeline",
    defaultPrice: 2500.0,
    description: "Validation for SIM registration, banking restrictions, and Virtual NIN linkage.",
  },
  {
    serviceKey: "NIN_VALIDATION_MOD",
    title: "NIN Validation (Modification)",
    category: "NIN_VALIDATION",
    categoryLabel: "NIN Validation Pipeline",
    defaultPrice: 3000.0,
    description: "Validation pipeline for legal name, date of birth, or demographic corrections.",
  },
  {
    serviceKey: "NIN_VALIDATION_PHOTO_ERROR",
    title: "NIN Validation (Photographic Error)",
    category: "NIN_VALIDATION",
    categoryLabel: "NIN Validation Pipeline",
    defaultPrice: 1600.0,
    description: "Validation correcting corrupted biometric images or photo capture mismatches.",
  },

  // NIMC Special Operations
  {
    serviceKey: "API_NIN_IPE_CLEARANCE",
    title: "NIMC IPE Clearance",
    category: "NIMC_SPECIAL_SERVICES",
    categoryLabel: "NIMC Special Operations",
    defaultPrice: 2500.0,
    description: "Submits tracking ID to resolve In-Processing Error and release cleared NIN.",
  },
  {
    serviceKey: "API_NIN_PERSONALIZATION",
    title: "NIMC NIN Personalization",
    category: "NIMC_SPECIAL_SERVICES",
    categoryLabel: "NIMC Special Operations",
    defaultPrice: 1500.0,
    description: "Submits tracking ID to retrieve personalized NIN profile and official digital slip.",
  },
];

/**
 * GET /api/mds/api-services
 * Returns all API services, prices, live uptime status, and maintenance outage notices.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: { email: session.user.email, role: { in: ["ADMIN", "STAFF"] } },
    });
    if (!admin) {
      return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
    }

    // Fetch existing records from ServicePricing
    const existing = await prisma.servicePricing.findMany({
      where: {
        serviceKey: {
          in: KNOWN_API_SERVICES.map((s) => s.serviceKey),
        },
      },
    });

    const existingMap = new Map(existing.map((e) => [e.serviceKey, e]));

    // Synchronize or bootstrap missing records
    const services = KNOWN_API_SERVICES.map((def) => {
      const record = existingMap.get(def.serviceKey);
      return {
        serviceKey: def.serviceKey,
        title: record?.title || def.title,
        category: def.category,
        categoryLabel: def.categoryLabel,
        description: def.description,
        price: record ? Number(record.price) : def.defaultPrice,
        isActive: record ? record.isActive : true,
        maintenanceMsg: record?.maintenanceMsg || null,
        updatedAt: record?.updatedAt || null,
      };
    });

    return NextResponse.json({
      success: true,
      services,
    });
  } catch (error: any) {
    console.error("❌ [Admin API Services GET Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to load API services." }, { status: 500 });
  }
}

/**
 * PATCH /api/mds/api-services
 * Updates an API service's price, active toggle, or custom maintenance notice.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: { email: session.user.email, role: { in: ["ADMIN", "STAFF"] } },
    });
    if (!admin) {
      return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { serviceKey, price, isActive, maintenanceMsg } = body;

    if (!serviceKey || typeof serviceKey !== "string") {
      return NextResponse.json({ success: false, error: "Missing required serviceKey." }, { status: 400 });
    }

    const definition = KNOWN_API_SERVICES.find((s) => s.serviceKey === serviceKey);
    if (!definition) {
      return NextResponse.json({ success: false, error: "Unknown API service key." }, { status: 400 });
    }

    const newPrice = price !== undefined ? Number(price) : definition.defaultPrice;
    if (isNaN(newPrice) || newPrice < 0) {
      return NextResponse.json({ success: false, error: "Price must be a valid positive number." }, { status: 400 });
    }

    const updated = await prisma.servicePricing.upsert({
      where: { serviceKey },
      create: {
        serviceKey,
        title: definition.title,
        price: newPrice,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        maintenanceMsg: maintenanceMsg !== undefined ? (maintenanceMsg?.trim() || null) : null,
      },
      update: {
        price: newPrice,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        maintenanceMsg: maintenanceMsg !== undefined ? (maintenanceMsg?.trim() || null) : undefined,
      },
    });

    // Log admin action for auditability
    await prisma.staffActionLog.create({
      data: {
        userId: admin.id,
        action: "UPDATE_API_SERVICE_PRICING",
        targetId: serviceKey,
        details: `Updated ${serviceKey}: Price=₦${newPrice}, Active=${updated.isActive}, MaintenanceNotice="${updated.maintenanceMsg || 'None'}"`,
      },
    });

    return NextResponse.json({
      success: true,
      service: {
        serviceKey: updated.serviceKey,
        title: updated.title,
        price: Number(updated.price),
        isActive: updated.isActive,
        maintenanceMsg: updated.maintenanceMsg,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("❌ [Admin API Services PATCH Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update API service." }, { status: 500 });
  }
}
