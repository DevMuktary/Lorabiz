import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { ensureDataPlansSeeded } from "@/lib/data-plans-seed";

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    await ensureDataPlansSeeded(prisma);

    const plans = await prisma.mobileDataPlan.findMany({
      orderBy: [
        { network: "asc" },
        { category: "asc" },
        { planId: "asc" },
      ],
    });

    const stats = {
      total: plans.length,
      active: plans.filter((p) => p.isActive).length,
      inactive: plans.filter((p) => !p.isActive).length,
      mtn: plans.filter((p) => p.network === "MTN").length,
      airtel: plans.filter((p) => p.network === "AIRTEL").length,
      glo: plans.filter((p) => p.network === "GLO").length,
      "9mobile": plans.filter((p) => p.network === "9MOBILE").length,
    };

    return NextResponse.json({
      success: true,
      plans,
      stats,
    });
  } catch (error: any) {
    console.error("Admin Fetch Data Plans Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { action, planId, price, isActive, network, category } = body;

    // 1. Update single plan price
    if (action === "UPDATE_PRICE" && planId !== undefined && price !== undefined) {
      const updated = await prisma.mobileDataPlan.update({
        where: { planId: Number(planId) },
        data: { price: Number(price) },
      });
      return NextResponse.json({ success: true, plan: updated });
    }

    // 2. Toggle single plan active status
    if (action === "TOGGLE_ACTIVE" && planId !== undefined && isActive !== undefined) {
      const updated = await prisma.mobileDataPlan.update({
        where: { planId: Number(planId) },
        data: { isActive: Boolean(isActive) },
      });
      return NextResponse.json({ success: true, plan: updated });
    }

    // 3. Bulk toggle network
    if (action === "BULK_TOGGLE_NETWORK" && network && isActive !== undefined) {
      await prisma.mobileDataPlan.updateMany({
        where: { network: network.toUpperCase() },
        data: { isActive: Boolean(isActive) },
      });
      return NextResponse.json({ success: true, message: `All ${network} plans updated.` });
    }

    // 4. Bulk toggle category
    if (action === "BULK_TOGGLE_CATEGORY" && network && category && isActive !== undefined) {
      await prisma.mobileDataPlan.updateMany({
        where: { 
          network: network.toUpperCase(),
          category: category.toUpperCase(),
        },
        data: { isActive: Boolean(isActive) },
      });
      return NextResponse.json({ success: true, message: `${network} ${category} plans updated.` });
    }

    return NextResponse.json({ success: false, message: "Invalid action or parameters." }, { status: 400 });
  } catch (error: any) {
    console.error("Admin Update Data Plan Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
