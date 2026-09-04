import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { notificationQueue } from "@/lib/queue";
import { NotificationEvent, dispatchNotification } from "@/services/notifications";
import { getReferrerRewardAmount } from "@/lib/loyalty";
import { submitDataVerifyNinValidation, checkDataVerifyNinValidationStatus } from "@/lib/dataverify-validation";

const CATEGORY_LABELS: Record<string, string> = {
  NO_RECORD_FOUND: "No Record Found",
  VNIN_VALIDATION: "SIM/Bank & VNIN Validation",
  UPDATE_RECORD_MOD: "Update Record (Mod Validation)",
  PHOTO_ERROR: "Photographic Error",
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: { email: session.user.email, role: { in: ["ADMIN", "STAFF"] } },
    });
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin or Staff access required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      ticketId,
      actionType,
      failureReason,
      adminNotes,
      issueRefund,
      refundAmount,
    } = body;

    if (!ticketId || !actionType) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const ticket = await prisma.ninValidationRequest.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    const categoryLabel = CATEGORY_LABELS[ticket.category] || ticket.category;

    // =========================================================================
    // ACTION: PUSH_TO_PROVIDER (Admin manually pushes ticket to DataVerify API)
    // =========================================================================
    if (actionType === "PUSH_TO_PROVIDER") {
      // 1. Guard against completed/failed tickets to prevent double-charging or financial loss
      if (ticket.status === "COMPLETED") {
        return NextResponse.json(
          { error: "This request has already been marked as COMPLETED. Transmitting completed tickets is locked to prevent double-charging." },
          { status: 400 }
        );
      }
      if (ticket.status === "FAILED") {
        return NextResponse.json(
          { error: "This request is marked as FAILED. Please reopen the request or process manually." },
          { status: 400 }
        );
      }

      // 2. Guard: DataVerify ONLY supports 'no_record_found'
      if (ticket.category !== "NO_RECORD_FOUND") {
        return NextResponse.json(
          { error: `DataVerify automated validation only supports 'No Record Found' requests. '${categoryLabel}' tickets must be processed manually.` },
          { status: 400 }
        );
      }

      // 3. Guard: Prevent accidental double-push if already active on DataVerify
      if (ticket.externalTxId && (ticket.externalStatus === "pending" || ticket.externalStatus === "processing")) {
        return NextResponse.json(
          { error: `This ticket has already been transmitted to DataVerify (Tx ID: ${ticket.externalTxId}). Please use 'Check Live Status' instead of pushing again.` },
          { status: 400 }
        );
      }

      const submitRes = await submitDataVerifyNinValidation(ticket.nin, ticket.category);

      // Always persist the raw gateway response for auditability and debugging
      const updatedTicket = await prisma.ninValidationRequest.update({
        where: { id: ticketId },
        data: {
          provider: "DATAVERIFY",
          externalTicketId: submitRes.transactionId || ticket.externalTicketId || undefined,
          externalTxId: submitRes.transactionId || ticket.externalTxId || undefined,
          externalStatus: submitRes.requestStatus || (submitRes.success ? "pending" : "submission_error"),
          apiMessage: submitRes.message,
          apiResponse: (submitRes.rawResponse || submitRes) as any,
          lastSyncedAt: new Date(),
          adminNotes: adminNotes ? `${ticket.adminNotes ? ticket.adminNotes + "\n" : ""}${adminNotes}` : undefined,
        },
      });

      if (!submitRes.success && !submitRes.transactionId) {
        return NextResponse.json(
          {
            error: submitRes.message || "Failed to transmit request to DataVerify gateway.",
            details: submitRes.rawResponse,
            data: updatedTicket,
          },
          { status: 422 }
        );
      }

      await prisma.staffActionLog.create({
        data: {
          userId: admin.id,
          action: "NINVAL_PUSH_DATAVERIFY",
          targetId: ticketId,
          details: `Admin pushed ticket ${ticket.transactionRef} (NIN: ${ticket.nin}) to DataVerify. Received Tx ID: ${submitRes.transactionId || "N/A"}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: submitRes.message || `Successfully transmitted to DataVerify! Transaction ID: ${submitRes.transactionId || "Recorded"}`,
        data: updatedTicket,
      });
    }

    // =========================================================================
    // ACTION: SET_EXTERNAL_TICKET (Admin manually inputs/links DataVerify Transaction ID)
    // =========================================================================
    if (actionType === "SET_EXTERNAL_TICKET") {
      const rawInput = (body.manualId || body.manualTxId || body.manualTicketId || "").toString().trim();
      if (!rawInput) {
        return NextResponse.json({ error: "Please provide a valid DataVerify Transaction ID." }, { status: 400 });
      }

      const updatedTicket = await prisma.ninValidationRequest.update({
        where: { id: ticketId },
        data: {
          provider: "DATAVERIFY",
          externalTxId: rawInput,
          externalTicketId: rawInput,
          externalStatus: ticket.externalStatus || "pending",
          apiMessage: `Manually linked DataVerify Transaction ID: ${rawInput}`,
          lastSyncedAt: new Date(),
          adminNotes: adminNotes ? `${ticket.adminNotes ? ticket.adminNotes + "\n" : ""}${adminNotes}` : undefined,
        },
      });

      await prisma.staffActionLog.create({
        data: {
          userId: admin.id,
          action: "NINVAL_LINK_DATAVERIFY_TX",
          targetId: ticketId,
          details: `Admin manually linked DataVerify Transaction ID (${rawInput}) to Ref ${ticket.transactionRef}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully linked DataVerify Transaction ID: ${rawInput}`,
        data: updatedTicket,
      });
    }

    // =========================================================================
    // ACTION: SYNC_PROVIDER (Admin checks live status from DataVerify on demand)
    // =========================================================================
    if (actionType === "SYNC_PROVIDER") {
      if (!ticket.externalTicketId && !ticket.externalTxId) {
        return NextResponse.json(
          { error: "This ticket has not been pushed to DataVerify yet. Please push it first." },
          { status: 400 }
        );
      }

      const statusRes = await checkDataVerifyNinValidationStatus({
        transactionId: ticket.externalTxId || ticket.externalTicketId || undefined,
        nin: ticket.nin,
      });

      if (!statusRes.success && statusRes.normalizedStatus !== "FAILED" && statusRes.normalizedStatus !== "COMPLETED") {
        return NextResponse.json(
          { error: statusRes.message || "Failed to fetch live status from DataVerify." },
          { status: 422 }
        );
      }

      const { normalizedStatus, rawStatus, message: apiMessage } = statusRes;

      if (normalizedStatus === "COMPLETED") {
        await prisma.$transaction(async (tx) => {
          await tx.ninValidationRequest.update({
            where: { id: ticketId },
            data: {
              status: "COMPLETED",
              externalStatus: rawStatus,
              apiMessage: apiMessage || "Completed on DataVerify.",
              apiResponse: statusRes.rawResponse as any,
              lastSyncedAt: new Date(),
              completedAt: ticket.completedAt || new Date(),
            },
          });

          // Referral reward check (only if not already completed)
          if (!wasAlreadyCompleted) {
            const activeReferral = await tx.referral.findUnique({
              where: { referredUserId: ticket.userId },
            });

            if (activeReferral) {
              const isNotExpired = !activeReferral.expiresAt || new Date() < activeReferral.expiresAt;
              if (isNotExpired) {
                const existingCommission = await tx.referralCommission.findUnique({
                  where: { serviceId: ticketId },
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
                        serviceId: ticketId,
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
          }
        });

        // Dispatch User Completion Notification
        const userEmail = ticket.user?.email || "";
        const userName = `${ticket.user?.firstName || ""} ${ticket.user?.lastName || ""}`.trim() || "Valued Customer";
        const notifPayload: NotificationEvent = {
          type: "NIN_VALIDATION_COMPLETED",
          userId: ticket.userId,
          email: userEmail,
          name: userName,
          category: categoryLabel,
          nin: ticket.nin,
          transactionRef: ticket.transactionRef,
        };

        try {
          await notificationQueue.add("send-nin-validation-notification", notifPayload, {
            attempts: 3,
            backoff: { type: "exponential", delay: 5000 },
            removeOnComplete: true,
          });
        } catch (queueErr) {
          await dispatchNotification(notifPayload);
        }

        await prisma.staffActionLog.create({
          data: {
            userId: admin.id,
            action: "NINVAL_SYNC_DATAVERIFY_COMPLETED",
            targetId: ticketId,
            details: `Synced status from DataVerify for ${ticket.transactionRef}: COMPLETED (${rawStatus})`,
          },
        });

        return NextResponse.json({
          success: true,
          message: `Live status synced from DataVerify: COMPLETED (${rawStatus}). Client notified.`,
          status: "COMPLETED",
          rawStatus,
        });
      } else if (normalizedStatus === "FAILED") {
        const recordedReason = statusRes.errorDetail || apiMessage || "Validation failed verification requirements on DataVerify.";

        await prisma.ninValidationRequest.update({
          where: { id: ticketId },
          data: {
            status: "FAILED",
            externalStatus: rawStatus,
            failureReason: recordedReason,
            apiMessage: recordedReason,
            apiResponse: statusRes.rawResponse as any,
            lastSyncedAt: new Date(),
          },
        });

        // Dispatch failure notification ONLY IF it was NOT already failed before!
        if (!wasAlreadyFailed) {
          try {
            await dispatchNotification({
              type: "NIN_VALIDATION_FAILED",
              userId: ticket.userId,
              email: ticket.user.email,
              name: `${ticket.user.firstName} ${ticket.user.lastName}`.trim() || "Valued Client",
              category: categoryLabel,
              nin: ticket.nin,
              failureReason: recordedReason,
              refundAmount: 0,
              transactionRef: ticket.transactionRef,
            });
          } catch (notifErr) {
            console.error("Notification dispatch error:", notifErr);
          }
        }

        return NextResponse.json({
          success: true,
          message: `Live status synced from DataVerify: FAILED (${rawStatus}). Reason: ${recordedReason}`,
          status: "FAILED",
          rawStatus,
        });
      } else {
        // Still processing
        await prisma.ninValidationRequest.update({
          where: { id: ticketId },
          data: {
            externalStatus: rawStatus,
            apiMessage: apiMessage || "Validation in progress at DataVerify.",
            apiResponse: statusRes.rawResponse as any,
            lastSyncedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: `Live status synced from DataVerify: ${rawStatus.toUpperCase()} (${apiMessage || "In progress"})`,
          status: "PROCESSING",
          rawStatus,
        });
      }
    }

    // =========================================================================
    // MANUAL OPERATIONAL ACTIONS (PROCESS, COMPLETE, FAIL)
    // =========================================================================
    let notificationPayload: NotificationEvent | null = null;

    await prisma.$transaction(async (tx) => {
      if (actionType === "PROCESS") {
        await tx.ninValidationRequest.update({
          where: { id: ticketId },
          data: { status: "PROCESSING", adminNotes: adminNotes || undefined },
        });
      }

      if (actionType === "COMPLETE") {
        await tx.ninValidationRequest.update({
          where: { id: ticketId },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            adminNotes: adminNotes || undefined,
          },
        });

        // Referral commission check
        const activeReferral = await tx.referral.findUnique({
          where: { referredUserId: ticket.userId },
        });

        if (activeReferral) {
          const isNotExpired = !activeReferral.expiresAt || new Date() < activeReferral.expiresAt;
          if (isNotExpired) {
            const existingCommission = await tx.referralCommission.findUnique({
              where: { serviceId: ticketId },
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
                    serviceId: ticketId,
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
      }

      if (actionType === "FAIL") {
        await tx.ninValidationRequest.update({
          where: { id: ticketId },
          data: {
            status: "FAILED",
            failureReason: failureReason || "Validation failed verification requirements.",
            adminNotes: adminNotes || undefined,
          },
        });

        // If admin explicitly forces a refund
        if (issueRefund && refundAmount > 0) {
          const wallet = await tx.wallet.findUnique({ where: { userId: ticket.userId } });

          if (wallet) {
            const balanceBefore = Number(wallet.balance);
            const balanceAfter = balanceBefore + Number(refundAmount);
            const refundRef = `REF_NINVAL_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            await tx.wallet.update({
              where: { id: wallet.id },
              data: { balance: { increment: Number(refundAmount) } },
            });

            await tx.transaction.create({
              data: {
                walletId: wallet.id,
                amount: refundAmount,
                balanceBefore,
                balanceAfter,
                type: "REFUND",
                status: "SUCCESS",
                reference: refundRef,
                serviceCategory: "NIN",
                description: `Refund for Failed NIN Validation [${ticket.transactionRef}]. Reason: ${failureReason || "N/A"}`,
              },
            });
          }
        }
      }

      // Log Staff Action
      await tx.staffActionLog.create({
        data: {
          userId: admin.id,
          action: `NINVAL_${actionType}`,
          targetId: ticketId,
          details: `Admin executed ${actionType} on NIN Validation. Ref: ${ticket.transactionRef}`,
        },
      });

      const userEmail = ticket.user?.email || "";
      const userName = `${ticket.user?.firstName || ""} ${ticket.user?.lastName || ""}`.trim() || "Valued Customer";

      if (actionType === "COMPLETE" && ticket.status !== "COMPLETED") {
        notificationPayload = {
          type: "NIN_VALIDATION_COMPLETED",
          userId: ticket.userId,
          email: userEmail,
          name: userName,
          category: categoryLabel,
          nin: ticket.nin,
          transactionRef: ticket.transactionRef,
        };
      } else if (actionType === "FAIL" && ticket.status !== "FAILED") {
        notificationPayload = {
          type: "NIN_VALIDATION_FAILED",
          userId: ticket.userId,
          email: userEmail,
          name: userName,
          category: categoryLabel,
          nin: ticket.nin,
          failureReason: failureReason || "Validation failed verification checks.",
          refundAmount: issueRefund ? Number(refundAmount) : 0,
          transactionRef: ticket.transactionRef,
        };
      }
    });

    if (notificationPayload) {
      try {
        await notificationQueue.add("send-nin-validation-notification", notificationPayload, {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
          removeOnComplete: true,
        });
      } catch (queueErr) {
        console.warn("Queue unavailable, falling back to direct notification dispatch:", queueErr);
        await dispatchNotification(notificationPayload);
      }
    }

    return NextResponse.json({ success: true, message: `NIN Validation request successfully updated to ${actionType}.` });
  } catch (error: any) {
    console.error("NIN Validation Action API Error:", error);
    return NextResponse.json({ error: error?.message || "Internal server error." }, { status: 500 });
  }
}
