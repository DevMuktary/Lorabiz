import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { notificationQueue } from "@/lib/queue";
import { NotificationEvent, dispatchNotification } from "@/services/notifications";
import { getReferrerRewardAmount } from "@/lib/loyalty";

const CATEGORY_LABELS: Record<string, string> = {
  NO_RECORD_FOUND: "No Record Found",
  VNIN_VALIDATION: "VNIN Validation",
  UPDATE_RECORD_MOD: "Update Record (Mod Validation)",
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

    let notificationPayload: NotificationEvent | null = null;
    const categoryLabel = CATEGORY_LABELS[ticket.category] || ticket.category;

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
                where: { key: 'REF_REWARD_NIN_VAL' }
              });
              const baseAmount = rewardSetting ? Number(rewardSetting.value) : 250.00;
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

      if (actionType === "COMPLETE") {
        notificationPayload = {
          type: "NIN_VALIDATION_COMPLETED",
          userId: ticket.userId,
          email: userEmail,
          name: userName,
          category: categoryLabel,
          nin: ticket.nin,
          transactionRef: ticket.transactionRef,
        };
      } else if (actionType === "FAIL") {
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
  } catch (error) {
    console.error("NIN Validation Action API Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
