import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, id, price, isActive, maintenanceMsg, title } = body;
    // category: "CAC" | "NIN"

    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    await prisma.$transaction(async (tx) => {
      if (category === "CAC") {
        await tx.servicePricing.update({
          where: { id },
          data: { 
            price: Number(price), 
            isActive: Boolean(isActive),
            maintenanceMsg: maintenanceMsg || null
          }
        });
      } else if (category === "NIN") {
        await tx.ninSlipPricing.update({
          where: { id },
          data: { 
            price: Number(price), 
            isActive: Boolean(isActive) 
          }
        });
      } else {
        throw new Error("Invalid category.");
      }

      // Log the change
      await tx.staffActionLog.create({
        data: {
          userId: admin.id,
          action: "UPDATED_SYSTEM_PRICING",
          targetId: id,
          details: `MD updated [${title}]. Active: ${isActive}, Price: ₦${price}`
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Settings Action Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
  }
}
