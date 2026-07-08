import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const promos = await prisma.promoCode.findMany({
      // FIXED: Using 'id' for chronological sorting since 'createdAt' doesn't exist on this model
      orderBy: { id: 'desc' } 
    });

    // Calculate Metrics
    const now = new Date();
    const activePromos = promos.filter(p => 
      p.isActive && 
      (!p.expiresAt || new Date(p.expiresAt) > now) && 
      (!p.usageLimit || p.timesUsed < p.usageLimit)
    ).length;

    const totalUses = promos.reduce((sum, p) => sum + p.timesUsed, 0);

    return NextResponse.json({ 
      metrics: { total: promos.length, active: activePromos, totalUses },
      promos 
    });
  } catch (error) {
    console.error("Marketing API Error:", error);
    return NextResponse.json({ error: "Failed to fetch marketing data" }, { status: 500 });
  }
}
