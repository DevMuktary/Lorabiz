import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { DeveloperProfileStatus } from "@prisma/client";
import { logUserActivity } from "@/lib/activity-logger";
import {
  sendDeveloperLiveApprovedEmail,
  sendDeveloperLiveRejectedEmail,
} from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: { email: session.user.email, role: "ADMIN" },
    });
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, rejectionReason } = body;

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json({ error: "Invalid action. Must be APPROVE or REJECT." }, { status: 400 });
    }

    const profile = await prisma.developerProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "Developer profile not found." }, { status: 404 });
    }

    if (action === "APPROVE") {
      await prisma.developerProfile.update({
        where: { id },
        data: {
          status: DeveloperProfileStatus.APPROVED,
          approvedAt: new Date(),
          rejectionReason: null,
        },
      });

      // Log activity
      logUserActivity({
        userId: profile.userId,
        action: "DEVELOPER_LIVE_ACCESS_APPROVED",
        category: "SERVICES",
        description: `Live API access approved by admin for ${profile.businessName}`,
        status: "SUCCESS",
      }).catch(() => {});

      // Send approval notification email to developer
      if (profile.user?.email) {
        const developerName = [profile.user.firstName, profile.user.lastName].filter(Boolean).join(" ").trim() || undefined;
        sendDeveloperLiveApprovedEmail({
          to: profile.user.email,
          name: developerName,
          businessName: profile.businessName,
        }).catch((err) => {
          console.error("❌ Failed to send developer live approved email:", err);
        });
      }

      return NextResponse.json({
        success: true,
        message: `Developer profile for "${profile.businessName}" approved successfully. Live keys are now enabled.`,
      });
    } else {
      const reason =
        typeof rejectionReason === "string" && rejectionReason.trim()
          ? rejectionReason.trim()
          : "Application did not meet compliance criteria. Please review and resubmit.";

      await prisma.developerProfile.update({
        where: { id },
        data: {
          status: DeveloperProfileStatus.REJECTED,
          rejectionReason: reason,
        },
      });

      // Log activity
      logUserActivity({
        userId: profile.userId,
        action: "DEVELOPER_LIVE_ACCESS_REJECTED",
        category: "SERVICES",
        description: `Live API access rejected: ${reason}`,
        status: "FAILED",
      }).catch(() => {});

      // Send rejection notification email to developer
      if (profile.user?.email) {
        const developerName = [profile.user.firstName, profile.user.lastName].filter(Boolean).join(" ").trim() || undefined;
        sendDeveloperLiveRejectedEmail({
          to: profile.user.email,
          name: developerName,
          businessName: profile.businessName,
          rejectionReason: reason,
        }).catch((err) => {
          console.error("❌ Failed to send developer live rejected email:", err);
        });
      }

      return NextResponse.json({
        success: true,
        message: `Developer profile for "${profile.businessName}" was rejected.`,
      });
    }
  } catch (err) {
    console.error("❌ [MDS Developer Action POST] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
