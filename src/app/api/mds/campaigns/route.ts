import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const totalCampaigns = campaigns.length;
    const completedCampaigns = campaigns.filter((c) => c.status === "COMPLETED").length;
    const sendingCampaigns = campaigns.filter((c) => c.status === "SENDING").length;
    const draftCampaigns = campaigns.filter((c) => c.status === "DRAFT").length;
    const totalSentEmails = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
    const totalFailedEmails = campaigns.reduce((acc, c) => acc + c.failedCount, 0);

    return NextResponse.json({
      metrics: {
        totalCampaigns,
        completedCampaigns,
        sendingCampaigns,
        draftCampaigns,
        totalSentEmails,
        totalFailedEmails,
      },
      campaigns,
    });
  } catch (error: any) {
    console.error("Fetch Campaigns Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, subject, previewText, content, senderName, targetAudience } = body;

    if (!title || !subject || !content) {
      return NextResponse.json(
        { error: "Title, Subject, and Content are required to create a campaign." },
        { status: 400 }
      );
    }

    const campaign = await prisma.$transaction(async (tx) => {
      const created = await tx.emailCampaign.create({
        data: {
          title: title.trim(),
          subject: subject.trim(),
          previewText: previewText ? previewText.trim() : null,
          content,
          senderName: senderName ? senderName.trim() : "LoraBiz",
          targetAudience: targetAudience || { segment: "ALL" },
          status: "DRAFT",
          createdById: session.user.id,
        },
      });

      await tx.staffActionLog.create({
        data: {
          userId: session.user.id,
          action: "CREATED_EMAIL_CAMPAIGN",
          targetId: created.id,
          details: `Created email campaign draft "${title}" with subject "${subject}"`,
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error: any) {
    console.error("Create Campaign Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create campaign" },
      { status: 500 }
    );
  }
}
