// src/app/api/nin/validation/history/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { CATEGORY_PRICE_KEYS } from "../route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    // Fetch dynamic pricing for all categories
    const pricingRecords = await prisma.servicePricing.findMany({
      where: {
        serviceKey: {
          in: Object.values(CATEGORY_PRICE_KEYS).map((c) => c.key),
        },
      },
    });

    const categoryPricing: Record<string, { price: number; isActive: boolean; maintenanceMsg?: string | null }> = {};

    for (const [cat, config] of Object.entries(CATEGORY_PRICE_KEYS)) {
      const found = pricingRecords.find((r) => r.serviceKey === config.key);
      categoryPricing[cat] = {
        price: found ? Number(found.price) : config.defaultPrice,
        isActive: found ? found.isActive : true,
        maintenanceMsg: found?.maintenanceMsg || null,
      };
    }

    const history = await prisma.ninValidationRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      walletBalance: user.wallet ? Number(user.wallet.balance) : 0,
      pricing: categoryPricing,
      history,
    });
  } catch (error) {
    console.error("NIN Validation History Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch validation history." },
      { status: 500 }
    );
  }
}
