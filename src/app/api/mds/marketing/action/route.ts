import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { actionType, ...data } = body;

    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    if (actionType === "CREATE") {
      const { code, type, value, usageLimit, perUserLimit, expiresAt } = data;
      
      if (!code || !type || !value) {
        return NextResponse.json({ error: "Code, Type, and Value are required." }, { status: 400 });
      }

      const formattedCode = String(code).trim().toUpperCase().replace(/\s+/g, '');
      const existing = await prisma.promoCode.findUnique({ where: { code: formattedCode } });
      if (existing) return NextResponse.json({ error: "This promo code already exists." }, { status: 400 });

      await prisma.$transaction(async (tx) => {
        await tx.promoCode.create({
          data: {
            code: formattedCode,
            discountPct: type === "PERCENTAGE" ? Number(value) : null,
            fixedAmount: type === "FIXED" ? Number(value) : null,
            usageLimit: usageLimit ? Number(usageLimit) : null,
            perUserLimit: perUserLimit ? Number(perUserLimit) : 1, // Default to 1 per user
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          }
        });

        await tx.staffActionLog.create({
          data: {
            userId: admin.id,
            action: "CREATED_PROMO_CODE",
            targetId: formattedCode,
            details: `Created ${type} promo code. Value: ${value}`
          }
        });
      });

      return NextResponse.json({ success: true, message: "Promo code generated." });
    }

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

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("Marketing Action Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
  }
}
