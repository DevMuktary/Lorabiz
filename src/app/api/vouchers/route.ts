import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const credits = await prisma.userRewardCredit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // Categorize
    const activePasses = credits.filter(
      (c) => c.status === "ACTIVE" && (!c.expiresAt || new Date(c.expiresAt) > new Date())
    );
    const redeemedPasses = credits.filter((c) => c.status === "REDEEMED");
    const expiredPasses = credits.filter(
      (c) => c.status === "EXPIRED" || (c.status === "ACTIVE" && c.expiresAt && new Date(c.expiresAt) <= new Date())
    );

    // Summary counts by type
    const passSummary = {
      ninSlip: activePasses.filter((c) => c.rewardType === "NIN_SLIP").length,
      ninValidation: activePasses.filter((c) => c.rewardType === "NIN_VALIDATION").length,
      ninPersonalization: activePasses.filter((c) => c.rewardType === "NIN_PERSONALIZATION").length,
      cacVouchers: activePasses.filter((c) => c.rewardType === "CAC_VOUCHER" || c.rewardType === "SCUML_VOUCHER").length,
      airtimeDiscounts: activePasses.filter((c) => c.rewardType === "AIRTIME").length,
      totalActive: activePasses.length,
    };

    return NextResponse.json({
      success: true,
      all: credits,
      active: activePasses,
      redeemed: redeemedPasses,
      expired: expiredPasses,
      summary: passSummary,
    });
  } catch (error: any) {
    console.error("❌ Error fetching user vouchers:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch vouchers" },
      { status: 500 }
    );
  }
}
