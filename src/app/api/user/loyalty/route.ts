import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { getUserLoyaltyProfile, LOYALTY_TIERS } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const profile = await getUserLoyaltyProfile(prisma, user.id);

    return NextResponse.json({
      success: true,
      profile,
      allTiers: Object.values(LOYALTY_TIERS),
    });
  } catch (error: any) {
    console.error("Fetch User Loyalty Profile Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
