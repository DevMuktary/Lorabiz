import { prisma } from "@/lib/prisma";
import { notificationQueue } from "@/lib/queue";

export interface ScanAbandonedCacResult {
  scanned: number;
  enqueued: number;
  skipped: number;
}

/**
 * Scans the database for unsubmitted CAC registrations that have been inactive
 * beyond the configured inactivity window (default 24h) and enqueues reminder emails.
 */
export async function scanAndEnqueueAbandonedCac(
  baseUrl = "https://lorabiz.com"
): Promise<ScanAbandonedCacResult> {
  let scanned = 0;
  let enqueued = 0;
  let skipped = 0;

  try {
    // 1. Fetch configurable threshold from GlobalSetting
    const hoursSetting = await prisma.globalSetting.findUnique({
      where: { key: "CAC_ABANDONED_HOURS" },
    });

    const hours = hoursSetting && !isNaN(Number(hoursSetting.value))
      ? Math.max(1, Number(hoursSetting.value))
      : 24;

    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    // 2. Fetch Unsubmitted Business Name Registrations older than cutoff
    const unsubmittedBiz = await prisma.businessRegistration.findMany({
      where: {
        status: "UNSUBMITTED",
        updatedAt: { lte: cutoffDate },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isSuspended: true,
          },
        },
      },
    });

    // 3. Fetch Unsubmitted LLC Registrations older than cutoff
    const unsubmittedLlc = await prisma.llcRegistration.findMany({
      where: {
        status: "UNSUBMITTED",
        updatedAt: { lte: cutoffDate },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isSuspended: true,
          },
        },
      },
    });

    const allDrafts = [
      ...unsubmittedBiz.map((b) => ({
        id: b.id,
        trackingId: b.trackingId || b.id.slice(-6).toUpperCase(),
        proposedName: b.proposedName,
        entityType: "Business Name",
        userId: b.user.id,
        userEmail: b.user.email,
        userName: b.user.firstName,
        isSuspended: b.user.isSuspended,
        continueUrl: `${baseUrl.replace(/\/$/, "")}/dashboard/cac/register/business-name/details/${b.id}`,
      })),
      ...unsubmittedLlc.map((l) => ({
        id: l.id,
        trackingId: l.trackingId || l.id.slice(-6).toUpperCase(),
        proposedName: l.proposedName || "LLC Application",
        entityType: "Company (LLC)",
        userId: l.user.id,
        userEmail: l.user.email,
        userName: l.user.firstName,
        isSuspended: l.user.isSuspended,
        continueUrl: `${baseUrl.replace(/\/$/, "")}/dashboard/cac/register/llc/details/${l.id}`,
      })),
    ];

    scanned = allDrafts.length;

    for (const draft of allDrafts) {
      if (draft.isSuspended || !draft.userEmail) {
        skipped++;
        continue;
      }

      // Check if already reminded for this specific draft
      const alreadySent = await prisma.automatedEmailLog.findFirst({
        where: {
          userId: draft.userId,
          emailType: "ABANDONED_CAC",
          entityId: draft.id,
        },
      });

      if (alreadySent) {
        skipped++;
        continue;
      }

      // Enqueue the notification job
      await notificationQueue.add(
        "send-abandoned-cac-reminder",
        {
          type: "ABANDONED_CAC_EMAIL",
          userId: draft.userId,
          email: draft.userEmail,
          firstName: draft.userName || "Valued Client",
          businessName: draft.proposedName,
          entityType: draft.entityType,
          trackingId: draft.trackingId,
          registrationId: draft.id,
          continueUrl: draft.continueUrl,
        },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
          removeOnComplete: true,
        }
      );

      enqueued++;
    }

    console.log(
      `[Abandoned CAC Scanner] Scanned: ${scanned} | Enqueued: ${enqueued} | Skipped: ${skipped}`
    );
  } catch (err) {
    console.error("[Abandoned CAC Scanner Error]:", err);
  }

  return { scanned, enqueued, skipped };
}
