import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { invalidateKeyCache } from "@/lib/developer/keys";
import { ApiKeyType, ApiKeyStatus } from "@prisma/client";
import { logUserActivity } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/developer/sandbox/reset
 * Restores the developer's virtual sandbox balance to ₦1,000,000.00,
 * clears Redis cache for active test keys to refresh instant authorization,
 * and logs user activity.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // 1. Reset user's virtual sandbox balance to ₦1,000,000.00
    await prisma.user.update({
      where: { id: user.id },
      data: { sandboxBalance: 1000000.0 },
    });

    // 2. Fetch all active TEST API keys to invalidate Redis cache
    const activeTestKeys = await prisma.apiKey.findMany({
      where: {
        userId: user.id,
        type: ApiKeyType.TEST,
        status: ApiKeyStatus.ACTIVE,
      },
      select: { keyHash: true },
    });

    await Promise.all(activeTestKeys.map((k) => invalidateKeyCache(k.keyHash)));

    // 3. Log user activity
    logUserActivity({
      userId: user.id,
      action: "DEVELOPER_SANDBOX_RESET",
      category: "SERVICES",
      description: "Reset sandbox test balance to ₦1,000,000.00",
      status: "SUCCESS",
    }).catch((err) => {
      console.warn("⚠️ Failed to record sandbox reset activity log:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Sandbox test balance has been reset to ₦1,000,000.00 successfully.",
      data: {
        sandboxBalance: 1000000.0,
      },
    });
  } catch (err: any) {
    console.error("❌ [Developer Sandbox Reset POST Error]:", err);
    return NextResponse.json(
      { success: false, message: "Failed to reset sandbox balance" },
      { status: 500 }
    );
  }
}
