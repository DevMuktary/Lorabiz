import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { spinWheelServerSide, DEFAULT_WHEEL_SLICES } from "@/lib/rewards";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Get available spin tokens count
    const availableTokens = await prisma.spinToken.count({
      where: { userId: user.id, status: "AVAILABLE" },
    });

    // Get recent spin history
    const spinHistory = await prisma.spinToken.findMany({
      where: { userId: user.id, status: "USED" },
      orderBy: { spunAt: "desc" },
      take: 10,
    });

    // Get campaign status and threshold
    const [campaignSetting, thresholdSetting, slicesSetting] = await Promise.all([
      prisma.globalSetting.findUnique({ where: { key: "SPIN_CAMPAIGN_ACTIVE" } }),
      prisma.globalSetting.findUnique({ where: { key: "SPIN_MIN_DEPOSIT" } }),
      prisma.globalSetting.findUnique({ where: { key: "SPIN_SLICES_CONFIG" } }),
    ]);

    const isCampaignActive = !campaignSetting || campaignSetting.value !== "false";
    const minDeposit = thresholdSetting ? Number(thresholdSetting.value) : 20000;

    let slices = DEFAULT_WHEEL_SLICES;
    if (slicesSetting?.value) {
      try {
        slices = JSON.parse(slicesSetting.value);
      } catch {
        slices = DEFAULT_WHEEL_SLICES;
      }
    }

    return NextResponse.json({
      success: true,
      availableTokens,
      spinHistory,
      isCampaignActive,
      minDeposit,
      slices,
      walletBalance: user.wallet ? Number(user.wallet.balance) : 0,
    });
  } catch (error: any) {
    console.error("❌ Error fetching rewards status:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch reward status" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    // Check campaign active status
    const campaignSetting = await prisma.globalSetting.findUnique({
      where: { key: "SPIN_CAMPAIGN_ACTIVE" },
    });
    if (campaignSetting && campaignSetting.value === "false") {
      return NextResponse.json(
        { success: false, message: "The Lucky Spin campaign is currently paused." },
        { status: 400 }
      );
    }

    // Execute atomic, anti-concurrency server-side spin
    const result = await spinWheelServerSide(user.id);

    return NextResponse.json({
      success: true,
      winningSliceIndex: result.winningSliceIndex,
      prize: result.prize,
      tokenId: result.tokenId,
    });
  } catch (error: any) {
    console.error("❌ Error executing lucky spin:", error);

    if (error.message === "NO_SPIN_TOKEN_AVAILABLE") {
      return NextResponse.json(
        {
          success: false,
          code: "NO_SPIN_TOKEN_AVAILABLE",
          message: "You do not have any available Spin Tokens. Fund ₦20,000 or more to earn a Lucky Spin!",
        },
        { status: 400 }
      );
    }

    if (error.message === "RACE_CONDITION_DETECTED") {
      return NextResponse.json(
        {
          success: false,
          code: "RACE_CONDITION_DETECTED",
          message: "A spin request is already being processed on another device.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to spin wheel. Please try again." },
      { status: 500 }
    );
  }
}
