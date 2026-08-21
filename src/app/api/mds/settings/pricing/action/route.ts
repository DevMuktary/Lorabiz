import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const staffUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!staffUser || staffUser.role === "USER") {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const body = await req.json();
    const { category, id, price, isActive, maintenanceMsg, title } = body;
    // category: "CAC" | "NIN"

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
          userId: staffUser.id,
          action: "UPDATED_SYSTEM_PRICING",
          targetId: id,
          details: `Staff updated [${title}]. Active: ${isActive}, Price: ₦${price}`
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Settings Action Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
  }
}
