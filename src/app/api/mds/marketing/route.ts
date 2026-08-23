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
    const [promos, servicePricingRows] = await Promise.all([
      prisma.promoCode.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          usages: {
            orderBy: { usedAt: 'desc' },
            include: {
              user: { select: { firstName: true, lastName: true, email: true } }
            }
          }
        }
      }),
      prisma.servicePricing.findMany({
        select: { serviceKey: true, price: true, title: true, isActive: true }
      })
    ]);

    // Build dynamic service pricing dictionary with robust defaults
    const servicePricingMap: Record<string, number> = {
      BVN_RETRIEVAL: 2500,
      BVN_MOD_NAME: 3000,
      BVN_MOD_PHONE: 2500,
      BVN_MOD_DOB: 15000,
      BVN_MOD_NAME_PHONE: 5000,
      BVN_MOD_DOB_PHONE: 17000,
      BVN_MOD_NAME_DOB: 17500,
      BVN_MOD_ALL: 19500,
      NIN_IPE_CLEARANCE: 2500,
      NIN_VALIDATION_NO_RECORD: 2000,
      NIN_VALIDATION_VNIN: 2500,
      NIN_VALIDATION_MOD: 3000,
      NIN_MOD_NAME: 2500,
      NIN_MOD_PHONE: 2000,
      NIN_MOD_ADDRESS: 2000,
      BUSINESS_NAME: 22500,
      LLC: 55000,
      SCUML: 40000,
      TAX_ID: 5000,
    };

    for (const row of servicePricingRows) {
      servicePricingMap[row.serviceKey] = Number(row.price);
    }

    const now = new Date();
    const activePromos = promos.filter(p => 
      p.isActive && 
      (!p.expiresAt || new Date(p.expiresAt) > now) && 
      (!p.usageLimit || p.timesUsed < p.usageLimit)
    );

    const autoPromos = promos.filter(p => p.isAutoApplied);
    const voucherPromos = promos.filter(p => !p.isAutoApplied);

    const totalDiscountGiven = promos.reduce((total, p) => {
      return total + p.usages.reduce((sub, u) => sub + Number(u.discountAmount || 0), 0);
    }, 0);

    const autoDiscountGiven = autoPromos.reduce((total, p) => {
      return total + p.usages.reduce((sub, u) => sub + Number(u.discountAmount || 0), 0);
    }, 0);

    const voucherDiscountGiven = voucherPromos.reduce((total, p) => {
      return total + p.usages.reduce((sub, u) => sub + Number(u.discountAmount || 0), 0);
    }, 0);

    const metrics = {
      total: promos.length,
      active: activePromos.length,
      totalUses: promos.reduce((sum, p) => sum + p.timesUsed, 0),
      totalDiscountGiven,
      autoAppliedTotal: autoPromos.length,
      autoAppliedActive: autoPromos.filter(p => p.isActive && (!p.expiresAt || new Date(p.expiresAt) > now) && (!p.usageLimit || p.timesUsed < p.usageLimit)).length,
      autoAppliedUses: autoPromos.reduce((sum, p) => sum + p.timesUsed, 0),
      autoDiscountGiven,
      voucherTotal: voucherPromos.length,
      voucherActive: voucherPromos.filter(p => p.isActive && (!p.expiresAt || new Date(p.expiresAt) > now) && (!p.usageLimit || p.timesUsed < p.usageLimit)).length,
      voucherUses: voucherPromos.reduce((sum, p) => sum + p.timesUsed, 0),
      voucherDiscountGiven,
    };

    return NextResponse.json({ 
      metrics,
      promos,
      servicePricingMap
    });
  } catch (error) {
    console.error("Marketing API Error:", error);
    return NextResponse.json({ error: "Failed to fetch marketing data" }, { status: 500 });
  }
}
