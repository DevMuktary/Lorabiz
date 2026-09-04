import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkDataVerifyNinValidationStatus } from "@/lib/dataverify-validation";
import { dispatchNotification } from "@/services/notifications";
import { getReferrerRewardAmount } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  NO_RECORD_FOUND: "No Record Found",
  VNIN_VALIDATION: "SIM/Bank & VNIN Validation",
  UPDATE_RECORD_MOD: "Update Record (Mod Validation)",
  PHOTO_ERROR: "Photographic Error",
};

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

async function handleSync(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const { searchParams } = new URL(req.url);
    const queryKey = searchParams.get("key");
    const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;

    // Validate Cron Authorization
    const isAuthorized =
      (authHeader && authHeader === `Bearer ${cronSecret}`) ||
      (queryKey && queryKey === cronSecret);

    if (process.env.NODE_ENV === "production" && !isAuthorized) {
      return NextResponse.json({ success: false, message: "Unauthorized cron request." }, { status: 401 });
    }

    // Find up to 30 processing NIN validation requests pushed to DataVerify or legacy provider
    const processingRequests = await prisma.ninValidationRequest.findMany({
      where: {
        status: "PROCESSING",
        provider: { in: ["DATAVERIFY", "ABJIKTECH"] },
        OR: [
          { externalTicketId: { not: null } },
          { externalTxId: { not: null } },
        ],
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: "asc" },
      take: 30,
    });

    if (processingRequests.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active DataVerify validation requests to synchronize.",
        processedCount: 0,
      });
    }

    let completedCount = 0;
    let failedCount = 0;
    let stillProcessingCount = 0;

    for (const item of processingRequests) {
      try {
        const txId = item.externalTxId || item.externalTicketId || undefined;
        const statusRes = await checkDataVerifyNinValidationStatus({
          transactionId: txId,
          nin: item.nin,
        });

        if (!statusRes.success && statusRes.rawStatus === "NETWORK_ERROR") {
          stillProcessingCount++;
          continue;
        }

        const { normalizedStatus, rawStatus, message: apiMessage } = statusRes;
        const categoryLabel = CATEGORY_LABELS[item.category] || item.category;

        if (normalizedStatus === "COMPLETED") {
          const completionMsg = statusRes.response || apiMessage || "Record found and validated successfully.";

          await prisma.$transaction(async (tx) => {
            await tx.ninValidationRequest.update({
              where: { id: item.id },
              data: {
                status: "COMPLETED",
                externalStatus: rawStatus,
                apiMessage: completionMsg,
                apiResponse: statusRes.rawResponse as any,
                lastSyncedAt: new Date(),
                completedAt: new Date(),
              },
            });

            // Referral commission check
            const activeReferral = await tx.referral.findUnique({
              where: { referredUserId: item.userId },
            });

            if (activeReferral) {
              const isNotExpired = !activeReferral.expiresAt || new Date() < activeReferral.expiresAt;
              if (isNotExpired) {
                const existingCommission = await tx.referralCommission.findUnique({
                  where: { serviceId: item.id },
                });

                if (!existingCommission) {
                  const rewardSetting = await tx.globalSetting.findUnique({
                    where: { key: "REF_REWARD_NIN_VAL" },
                  });
                  const baseAmount = rewardSetting ? Number(rewardSetting.value) : 250.0;
                  const commissionAmount = await getReferrerRewardAmount(tx, activeReferral.referrerId, baseAmount);

                  if (commissionAmount > 0) {
                    await tx.referralCommission.create({
                      data: {
                        referralId: activeReferral.id,
                        serviceType: "NIN_VALIDATION",
                        serviceId: item.id,
                        amount: commissionAmount,
                      },
                    });

                    await tx.user.update({
                      where: { id: activeReferral.referrerId },
                      data: { referralBalance: { increment: commissionAmount } },
                    });
                  }
                }
              }
            }
          });

          // Dispatch in-app notification & completion email
          try {
            await dispatchNotification({
              type: "NIN_VALIDATION_COMPLETED",
              userId: item.userId,
              email: item.user.email,
              name: `${item.user.firstName} ${item.user.lastName}`.trim() || "Valued Client",
              category: categoryLabel,
              nin: item.nin,
              transactionRef: item.transactionRef,
            });
          } catch (notifErr) {
            console.error(`❌ [Cron NIN Validation] Notification error for ${item.transactionRef}:`, notifErr);
          }

          completedCount++;
        } else if (normalizedStatus === "FAILED") {
          const failureReason = statusRes.errorDetail || apiMessage || "NIN Validation request failed verification on DataVerify gateway.";

          await prisma.ninValidationRequest.update({
            where: { id: item.id },
            data: {
              status: "FAILED",
              externalStatus: rawStatus,
              failureReason,
              apiMessage: failureReason,
              apiResponse: statusRes.rawResponse as any,
              lastSyncedAt: new Date(),
            },
          });

          // STRICT NO-REFUND POLICY PER USER INSTRUCTION
          // Dispatch failure notification to user
          try {
            await dispatchNotification({
              type: "NIN_VALIDATION_FAILED",
              userId: item.userId,
              email: item.user.email,
              name: `${item.user.firstName} ${item.user.lastName}`.trim() || "Valued Client",
              category: categoryLabel,
              nin: item.nin,
              failureReason,
              refundAmount: 0,
              transactionRef: item.transactionRef,
            });
          } catch (notifErr) {
            console.error(`❌ [Cron NIN Validation] Notification error for ${item.transactionRef}:`, notifErr);
          }

          failedCount++;
        } else {
          // Still processing/pending on DataVerify
          await prisma.ninValidationRequest.update({
            where: { id: item.id },
            data: {
              externalStatus: rawStatus,
              apiMessage: apiMessage || "Validation in progress at DataVerify gateway.",
              apiResponse: statusRes.rawResponse as any,
              lastSyncedAt: new Date(),
            },
          });
          stillProcessingCount++;
        }
      } catch (itemErr) {
        console.error(`❌ [Cron NIN Validation] Error syncing ticket ${item.transactionRef}:`, itemErr);
        stillProcessingCount++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalFound: processingRequests.length,
        completed: completedCount,
        failed: failedCount,
        stillProcessing: stillProcessingCount,
      },
    });
  } catch (error: any) {
    console.error("❌ [Cron NIN Validation] Sync Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error during NIN validation sync." },
      { status: 500 }
    );
  }
}
