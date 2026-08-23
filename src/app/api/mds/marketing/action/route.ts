import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
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

    const body = await req.json();
    const { actionType, ...data } = body;

    // 1. CREATE PROMO CODE / AUTO-APPLIED DISCOUNT
    if (actionType === "CREATE") {
      const { name, code, type, value, usageLimit, perUserLimit, expiresAt, restrictedServices, isAutoApplied } = data;
      
      if (!type || !value) {
        return NextResponse.json({ error: "Type and Value are required." }, { status: 400 });
      }

      let formattedCode = code ? String(code).trim().toUpperCase().replace(/\s+/g, '') : "";
      if (!formattedCode) {
        if (isAutoApplied) {
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          formattedCode = `AUTO_${type === "PERCENTAGE" ? `${value}PCT` : `${value}NGN`}_${randomSuffix}`;
        } else {
          return NextResponse.json({ error: "Promo Code name is required for manual voucher codes." }, { status: 400 });
        }
      }

      const existing = await prisma.promoCode.findUnique({ where: { code: formattedCode } });
      if (existing) return NextResponse.json({ error: "A promo or discount with this code already exists." }, { status: 400 });

      await prisma.$transaction(async (tx) => {
        await tx.promoCode.create({
          data: {
            code: formattedCode,
            name: name ? String(name).trim() : null,
            isAutoApplied: Boolean(isAutoApplied),
            discountPct: type === "PERCENTAGE" ? Number(value) : null,
            fixedAmount: type === "FIXED" ? Number(value) : null,
            usageLimit: usageLimit ? Number(usageLimit) : null,
            perUserLimit: perUserLimit ? Number(perUserLimit) : 1,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            restrictedServices: restrictedServices && restrictedServices.length > 0 ? restrictedServices : ["ALL"],
          }
        });

        await tx.staffActionLog.create({
          data: {
            userId: admin.id,
            action: isAutoApplied ? "CREATED_AUTO_DISCOUNT" : "CREATED_PROMO_CODE",
            targetId: formattedCode,
            details: `Created ${isAutoApplied ? 'Auto-Applied Discount' : 'Voucher'} (${type}: ${value}) for [${(restrictedServices || ['ALL']).join(', ')}]`
          }
        });
      });

      return NextResponse.json({ success: true, message: isAutoApplied ? "Auto-applied discount activated." : "Promo code generated." });
    }

    // 2. TOGGLE PROMO STATUS
    if (actionType === "TOGGLE_STATUS") {
      const { id, isActive, code } = data;
      await prisma.$transaction(async (tx) => {
        await tx.promoCode.update({ where: { id }, data: { isActive } });
        await tx.staffActionLog.create({
          data: {
            userId: admin.id,
            action: isActive ? "ACTIVATED_PROMO" : "DEACTIVATED_PROMO",
            targetId: code,
            details: `MD ${isActive ? 'activated' : 'deactivated'} promo code ${code}`
          }
        });
      });
      return NextResponse.json({ success: true });
    }

    // 3. DELETE PROMO CODE
    if (actionType === "DELETE") {
      const { id, code } = data;
      
      await prisma.$transaction(async (tx) => {
        await tx.promoCode.delete({
          where: { id }
        });

        await tx.staffActionLog.create({
          data: {
            userId: admin.id,
            action: "DELETED_PROMO",
            targetId: code,
            details: `MD permanently deleted promo code ${code}`
          }
        });
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("Marketing Action Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
  }
}
