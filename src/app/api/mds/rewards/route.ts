import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { DEFAULT_WHEEL_SLICES } from "@/lib/rewards";
import { logUserActivity } from "@/lib/activity-logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const staffUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!staffUser || (staffUser.role !== "ADMIN" && staffUser.role !== "STAFF")) {
      return NextResponse.json({ success: false, message: "Forbidden: Staff access only." }, { status: 403 });
    }

    // 1. Fetch Campaign Settings
    const [campaignSetting, thresholdSetting, slicesSetting, whatsappPopupSetting, spinPopupSetting] = await Promise.all([
      prisma.globalSetting.findUnique({ where: { key: "SPIN_CAMPAIGN_ACTIVE" } }),
      prisma.globalSetting.findUnique({ where: { key: "SPIN_MIN_DEPOSIT" } }),
      prisma.globalSetting.findUnique({ where: { key: "SPIN_SLICES_CONFIG" } }),
      prisma.globalSetting.findUnique({ where: { key: "ENABLE_WHATSAPP_POPUP" } }),
      prisma.globalSetting.findUnique({ where: { key: "ENABLE_SPIN_POPUP" } }),
    ]);

    const isCampaignActive = !campaignSetting || campaignSetting.value !== "false";
    const minDeposit = thresholdSetting ? Number(thresholdSetting.value) : 15000;
    const enableWhatsAppPopup = !whatsappPopupSetting || whatsappPopupSetting.value !== "false";
    const enableSpinPopup = !spinPopupSetting || spinPopupSetting.value !== "false";

    let slices = DEFAULT_WHEEL_SLICES;
    if (slicesSetting?.value) {
      try {
        slices = JSON.parse(slicesSetting.value);
      } catch {
        slices = DEFAULT_WHEEL_SLICES;
      }
    }

    // 2. Fetch Aggregated Statistics
    const [totalSpinsUsed, totalTokensAvailable, totalCreditsIssued] = await Promise.all([
      prisma.spinToken.count({ where: { status: "USED" } }),
      prisma.spinToken.count({ where: { status: "AVAILABLE" } }),
      prisma.userRewardCredit.count(),
    ]);

    // 3. Fetch Recent Audit Logs
    const recentAuditLogs = await prisma.spinToken.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        isCampaignActive,
        minDeposit,
        slices,
        enableWhatsAppPopup,
        enableSpinPopup,
      },
      stats: {
        totalSpinsUsed,
        totalTokensAvailable,
        totalCreditsIssued,
      },
      auditLogs: recentAuditLogs,
    });
  } catch (error: any) {
    console.error("❌ MDS Rewards GET Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load rewards data" },
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

    const staffUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, firstName: true, lastName: true },
    });

    if (!staffUser || staffUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden: Admin access only." }, { status: 403 });
    }

    const body = await req.json();
    const { action, payload } = body;

    if (action === "TOGGLE_CAMPAIGN") {
      const { isActive } = payload;
      await prisma.globalSetting.upsert({
        where: { key: "SPIN_CAMPAIGN_ACTIVE" },
        update: { value: isActive ? "true" : "false" },
        create: { key: "SPIN_CAMPAIGN_ACTIVE", value: isActive ? "true" : "false" },
      });

      await logUserActivity({
        userId: staffUser.id,
        action: isActive ? "ACTIVATE_SPIN_CAMPAIGN" : "PAUSE_SPIN_CAMPAIGN",
        category: "SECURITY",
        description: `Admin ${isActive ? "activated" : "paused"} the Lucky Spin Rewards campaign.`,
        metadata: { isActive },
        req,
      });

      return NextResponse.json({ success: true, message: `Lucky Spin Campaign ${isActive ? "Activated" : "Paused"}` });
    }

    if (action === "UPDATE_THRESHOLD") {
      const { minDeposit } = payload;
      const num = Number(minDeposit);
      if (isNaN(num) || num <= 0) {
        return NextResponse.json({ success: false, message: "Invalid threshold amount" }, { status: 400 });
      }

      await prisma.globalSetting.upsert({
        where: { key: "SPIN_MIN_DEPOSIT" },
        update: { value: String(num) },
        create: { key: "SPIN_MIN_DEPOSIT", value: String(num) },
      });

      await logUserActivity({
        userId: staffUser.id,
        action: "UPDATE_SPIN_THRESHOLD",
        category: "SECURITY",
        description: `Admin updated Lucky Spin deposit threshold to ₦${num.toLocaleString()}`,
        metadata: { minDeposit: num },
        req,
      });

      return NextResponse.json({ success: true, message: `Minimum deposit threshold updated to ₦${num.toLocaleString()}` });
    }

    if (action === "UPDATE_SLICES") {
      const { slices } = payload;
      if (!Array.isArray(slices)) {
        return NextResponse.json({ success: false, message: "Invalid slices array" }, { status: 400 });
      }

      await prisma.globalSetting.upsert({
        where: { key: "SPIN_SLICES_CONFIG" },
        update: { value: JSON.stringify(slices) },
        create: { key: "SPIN_SLICES_CONFIG", value: JSON.stringify(slices) },
      });

      await logUserActivity({
        userId: staffUser.id,
        action: "UPDATE_SPIN_SLICES_CONFIG",
        category: "SECURITY",
        description: `Admin updated Lucky Spin probability slices matrix (${slices.length} slices).`,
        metadata: { sliceCount: slices.length },
        req,
      });

      return NextResponse.json({ success: true, message: "Reward slices and weights updated successfully" });
    }

    if (action === "TOGGLE_WHATSAPP_POPUP") {
      const { enabled } = payload;
      await prisma.globalSetting.upsert({
        where: { key: "ENABLE_WHATSAPP_POPUP" },
        update: { value: enabled ? "true" : "false" },
        create: { key: "ENABLE_WHATSAPP_POPUP", value: enabled ? "true" : "false" },
      });

      return NextResponse.json({ success: true, message: `WhatsApp announcement popup ${enabled ? "enabled" : "disabled"}` });
    }

    if (action === "TOGGLE_SPIN_POPUP") {
      const { enabled } = payload;
      await prisma.globalSetting.upsert({
        where: { key: "ENABLE_SPIN_POPUP" },
        update: { value: enabled ? "true" : "false" },
        create: { key: "ENABLE_SPIN_POPUP", value: enabled ? "true" : "false" },
      });

      return NextResponse.json({ success: true, message: `Spin & Win promo popup ${enabled ? "enabled" : "disabled"}` });
    }

    if (action === "GRANT_MANUAL_SPIN") {
      const { targetUserId, count = 1, reason } = payload;
      if (!targetUserId) {
        return NextResponse.json({ success: false, message: "Target user ID required" }, { status: 400 });
      }

      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (!targetUser) {
        return NextResponse.json({ success: false, message: "Target user not found" }, { status: 404 });
      }

      for (let i = 0; i < count; i++) {
        await prisma.spinToken.create({
          data: {
            userId: targetUser.id,
            sourceTxRef: `MANUAL_GRANT_${Date.now()}_${i + 1}`,
            depositAmount: 0,
            status: "AVAILABLE",
          },
        });
      }

      await logUserActivity({
        userId: staffUser.id,
        action: "MANUAL_SPIN_TOKEN_GRANT",
        category: "SECURITY",
        description: `Admin manually granted ${count} Spin Token(s) to ${targetUser.firstName} ${targetUser.lastName}`,
        metadata: { count, targetUserId: targetUser.id, reason: reason || "Admin manual grant" },
        req,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully granted ${count} Spin Token(s) to ${targetUser.firstName} ${targetUser.lastName}`,
      });
    }

    return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("❌ MDS Rewards POST Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update reward settings" },
      { status: 500 }
    );
  }
}
