import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: { email: session.user.email, role: "ADMIN" }
    });
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }
    const promos = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' }, // We added createdAt to schema!
      include: {
        usages: {
          orderBy: { usedAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true, email: true } } // Fetch the user data
          }
        }
      }
    });

    const now = new Date();
    const activePromos = promos.filter(p => 
      p.isActive && 
      (!p.expiresAt || new Date(p.expiresAt) > now) && 
      (!p.usageLimit || p.timesUsed < p.usageLimit)
    );

    const autoPromos = promos.filter(p => p.isAutoApplied);
    const voucherPromos = promos.filter(p => !p.isAutoApplied);

    const metrics = {
      total: promos.length,
      active: activePromos.length,
      totalUses: promos.reduce((sum, p) => sum + p.timesUsed, 0),
      autoAppliedTotal: autoPromos.length,
      autoAppliedActive: autoPromos.filter(p => p.isActive && (!p.expiresAt || new Date(p.expiresAt) > now) && (!p.usageLimit || p.timesUsed < p.usageLimit)).length,
      autoAppliedUses: autoPromos.reduce((sum, p) => sum + p.timesUsed, 0),
      voucherTotal: voucherPromos.length,
      voucherActive: voucherPromos.filter(p => p.isActive && (!p.expiresAt || new Date(p.expiresAt) > now) && (!p.usageLimit || p.timesUsed < p.usageLimit)).length,
      voucherUses: voucherPromos.reduce((sum, p) => sum + p.timesUsed, 0),
    };

    return NextResponse.json({ 
      metrics,
      promos 
    });
  } catch (error) {
    console.error("Marketing API Error:", error);
    return NextResponse.json({ error: "Failed to fetch marketing data" }, { status: 500 });
  }
}
