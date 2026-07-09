import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. FETCH ALL SETTINGS DIRECTLY (No auto-creation)
    const cacPricing = await prisma.servicePricing.findMany({ 
      orderBy: { serviceKey: 'asc' } 
    });
    
    const ninPricing = await prisma.ninSlipPricing.findMany({ 
      orderBy: { slipType: 'asc' } 
    });

    return NextResponse.json({ cacPricing, ninPricing });
  } catch (error) {
    console.error("Settings API Error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
