import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pricing = await prisma.servicePricing.findUnique({
      where: { serviceKey: "BVN_RETRIEVAL" },
    });

    return NextResponse.json({
      success: true,
      price: pricing ? Number(pricing.price) : 2500,
      isActive: pricing ? pricing.isActive : true,
      maintenanceMsg: pricing?.maintenanceMsg || null,
    });
  } catch (error) {
    console.error("BVN Retrieval Status Error:", error);
    return NextResponse.json({
      success: true,
      price: 2500,
      isActive: true,
      maintenanceMsg: null,
    });
  }
}
