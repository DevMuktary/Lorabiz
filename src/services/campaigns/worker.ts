import { Worker, Job } from "bullmq";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { sendCampaignBroadcastEmail } from "@/lib/email";

export interface CampaignRecipient {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  referralCode: string | null;
  logId: string;
}

export interface CampaignJobData {
  campaignId: string;
  recipients: CampaignRecipient[];
  subject: string;
  previewText?: string;
  content: string;
  baseUrl?: string;
}

export const campaignWorker = new Worker<CampaignJobData>(
  "email-campaigns",
  async (job: Job<CampaignJobData>) => {
    const { campaignId, recipients, subject, previewText, content, baseUrl } = job.data;
    console.log(`🚀 [Campaign Worker] Starting batch of ${recipients.length} recipients for Campaign [${campaignId}] (Job: ${job.id})`);

    let batchSuccess = 0;
    let batchFail = 0;

    for (const recipient of recipients) {
      try {
        await sendCampaignBroadcastEmail({
          to: recipient.email,
          userId: recipient.userId,
          subject,
          previewText,
          rawContent: content,
          userMetadata: {
            firstName: recipient.firstName,
            lastName: recipient.lastName,
            email: recipient.email,
            referralCode: recipient.referralCode,
          },
          baseUrl,
        });

        // Mark recipient log as SENT
        await prisma.emailCampaignLog.update({
          where: { id: recipient.logId },
          data: {
            status: "SENT",
            sentAt: new Date(),
          },
        });

        // Increment campaign sent count
        await prisma.emailCampaign.update({
          where: { id: campaignId },
          data: { sentCount: { increment: 1 } },
        });

        batchSuccess++;
      } catch (err: any) {
        console.error(`❌ [Campaign Worker] Failed sending to ${recipient.email}:`, err?.message || err);

        // Mark recipient log as FAILED with error message
        await prisma.emailCampaignLog.update({
          where: { id: recipient.logId },
          data: {
            status: "FAILED",
            errorMessage: err?.message ? String(err.message).slice(0, 500) : "Failed to deliver via email gateway",
          },
        });

        // Increment campaign failed count
        await prisma.emailCampaign.update({
          where: { id: campaignId },
          data: { failedCount: { increment: 1 } },
        });

        batchFail++;
      }

      // Small throttling gap between emails to respect provider bursts
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    // Check if entire campaign has completed all pending recipient logs
    const remainingPending = await prisma.emailCampaignLog.count({
      where: {
        campaignId,
        status: "PENDING",
      },
    });

    if (remainingPending === 0) {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId },
        select: { sentCount: true, failedCount: true },
      });

      const finalStatus = (campaign?.sentCount || 0) > 0 ? "COMPLETED" : "FAILED";

      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: finalStatus,
          sentAt: new Date(),
        },
      });

      console.log(`✅ [Campaign Worker] Campaign [${campaignId}] marked as ${finalStatus}`);
    }

    console.log(`📊 [Campaign Worker] Batch complete. Success: ${batchSuccess}, Failures: ${batchFail}`);
  },
  {
    connection: redis as any,
    concurrency: 4, // Controlled concurrency to respect ZeptoMail API thresholds
  }
);

campaignWorker.on("failed", (job, err) => {
  console.error(`❌ [Campaign Worker] Job [${job?.id}] failed:`, err?.message || err);
});
