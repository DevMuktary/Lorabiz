import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { campaignQueue } from "@/lib/queue";
import { buildAudienceWhereClause } from "../../audience-preview/route";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status === "SENDING") {
      return NextResponse.json(
        { error: "Campaign is already being dispatched." },
        { status: 400 }
      );
    }

    // 1. Fetch matching audience
    const where = buildAudienceWhereClause(campaign.targetAudience);
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        referralCode: true,
      },
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: "No eligible recipients matched this campaign's target audience filters." },
        { status: 400 }
      );
    }

    // Clean up existing logs if retrying/resending
    await prisma.emailCampaignLog.deleteMany({
      where: { campaignId: id },
    });

    // 2. Bulk create initial PENDING logs
    const logData = users.map((u) => ({
      campaignId: id,
      userId: u.id,
      email: u.email,
      recipientName: [u.firstName, u.lastName].filter(Boolean).join(" ") || "Valued Client",
      status: "PENDING" as const,
    }));

    await prisma.emailCampaignLog.createMany({
      data: logData,
    });

    // Fetch created logs to get their IDs
    const createdLogs = await prisma.emailCampaignLog.findMany({
      where: { campaignId: id },
      select: { id: true, userId: true, email: true },
    });

    const logMap = new Map<string, string>();
    for (const log of createdLogs) {
      logMap.set(log.email.toLowerCase(), log.id);
    }

    // 3. Mark campaign as SENDING
    await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: "SENDING",
        totalRecipients: users.length,
        sentCount: 0,
        failedCount: 0,
        sentAt: null,
      },
    });

    // 4. Batch recipients and enqueue BullMQ jobs
    const host = req.headers.get("host") || "lorabiz.com";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const BATCH_SIZE = 25;
    const jobs = [];

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const chunk = users.slice(i, i + BATCH_SIZE);
      const recipientBatch = chunk.map((u) => ({
        userId: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        referralCode: u.referralCode,
        logId: logMap.get(u.email.toLowerCase()) || "",
      }));

      jobs.push({
        name: `broadcast-${id}-batch-${Math.floor(i / BATCH_SIZE)}`,
        data: {
          campaignId: id,
          recipients: recipientBatch,
          subject: campaign.subject,
          previewText: campaign.previewText || undefined,
          content: campaign.content,
          baseUrl,
        },
      });
    }

    await campaignQueue.addBulk(jobs);

    // 5. Audit Log
    await prisma.staffActionLog.create({
      data: {
        userId: session.user.id,
        action: "DISPATCHED_EMAIL_CAMPAIGN",
        targetId: id,
        details: `Dispatched campaign "${campaign.title}" to ${users.length} recipients across ${jobs.length} batches`,
      },
    });

    return NextResponse.json({
      success: true,
      totalRecipients: users.length,
      batches: jobs.length,
      message: `Campaign dispatched to ${users.length} recipients.`,
    });
  } catch (error: any) {
    console.error("Send Campaign Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to dispatch campaign" },
      { status: 500 }
    );
  }
}
