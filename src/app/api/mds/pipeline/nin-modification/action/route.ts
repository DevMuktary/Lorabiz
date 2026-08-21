import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import {
  sendNinModificationProcessingEmail,
  sendNinModificationCompletedEmail,
  sendNinModificationRejectedEmail,
} from "@/lib/email";
import { logUserActivity } from "@/lib/activity-logger";

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session?.user?.email || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
      return NextResponse.json({ success: false, message: "Unauthorized access." }, { status: 401 });
    }

    const body = await req.json();
    const {
      requestId,
      actionType,
      adminNotes,
      slipUrl,
      rejectionReason,
      issueRefund,
      refundAmount,
    } = body;

    if (!requestId || !actionType) {
      return NextResponse.json({ success: false, message: "Missing required request ID or action." }, { status: 400 });
    }

    const requestItem = await prisma.ninModificationRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          include: { wallet: true },
        },
      },
    });

    if (!requestItem) {
      return NextResponse.json({ success: false, message: "Modification request not found." }, { status: 404 });
    }

    // ACTION: MOVE TO PROCESSING
    if (actionType === "PROCESS") {
      const updated = await prisma.ninModificationRequest.update({
        where: { id: requestId },
        data: {
          status: "PROCESSING",
          adminNotes: adminNotes || requestItem.adminNotes,
        },
      });

      // Notification to user
      await prisma.inAppNotification.create({
        data: {
          userId: requestItem.userId,
          title: "NIN Modification In Processing",
          message: `Your request (${requestItem.trackingId}) is actively being processed.`,
          type: "info",
          link: "/dashboard/nin/modification",
        },
      });

      // Email dispatch
      if (requestItem.user?.email) {
        const clientDisplayName = `${requestItem.user.firstName || ""} ${requestItem.user.lastName || ""}`.trim() || "Customer";
        sendNinModificationProcessingEmail({
          to: requestItem.user.email,
          name: clientDisplayName,
          trackingId: requestItem.trackingId,
          type: requestItem.type,
        }).catch((err) => console.error("Failed to send processing email:", err));
      }

      return NextResponse.json({
        success: true,
        message: `Request ${requestItem.trackingId} moved to PROCESSING.`,
        request: updated,
      });
    }

    // ACTION: COMPLETE REQUEST
    if (actionType === "COMPLETE") {
      if (!slipUrl || !slipUrl.trim()) {
        return NextResponse.json({
          success: false,
          message: "Modification Transaction Slip is compulsory to complete the request.",
        }, { status: 400 });
      }

      const updated = await prisma.ninModificationRequest.update({
        where: { id: requestId },
        data: {
          status: "COMPLETED",
          slipUrl: slipUrl.trim(),
          adminNotes: adminNotes || requestItem.adminNotes,
        },
      });

      // Referral commission check
      const activeReferral = await prisma.referral.findUnique({
        where: { referredUserId: requestItem.userId },
      });

      if (activeReferral) {
        const isNotExpired = !activeReferral.expiresAt || new Date() < activeReferral.expiresAt;
        if (isNotExpired) {
          const existingCommission = await prisma.referralCommission.findUnique({
            where: { serviceId: requestId },
          });

          if (!existingCommission) {
            const rewardSetting = await prisma.globalSetting.findUnique({
              where: { key: 'REF_REWARD_NIN_MOD' }
            });
            const commissionAmount = rewardSetting ? Number(rewardSetting.value) : 250.00;

            if (commissionAmount > 0) {
              await prisma.referralCommission.create({
                data: {
                  referralId: activeReferral.id,
                  serviceType: "NIN_MODIFICATION",
                  serviceId: requestId,
                  amount: commissionAmount,
                },
              });

              await prisma.user.update({
                where: { id: activeReferral.referrerId },
                data: { referralBalance: { increment: commissionAmount } },
              });
            }
          }
        }
      }

      // In-app notification
      await prisma.inAppNotification.create({
        data: {
          userId: requestItem.userId,
          title: "NIN Modification Completed! 🎉",
          message: `Your NIN modification (${requestItem.trackingId}) is concluded. Slip is available for download.`,
          type: "success",
          link: "/dashboard/nin/modification",
        },
      });

      // Email dispatch
      if (requestItem.user?.email) {
        const clientDisplayName = `${requestItem.user.firstName || ""} ${requestItem.user.lastName || ""}`.trim() || "Customer";
        sendNinModificationCompletedEmail({
          to: requestItem.user.email,
          name: clientDisplayName,
          trackingId: requestItem.trackingId,
          type: requestItem.type,
          slipUrl: slipUrl.trim(),
        }).catch((err) => console.error("Failed to send completed email:", err));
      }

      return NextResponse.json({
        success: true,
        message: `Request ${requestItem.trackingId} marked as COMPLETED. Slip dispatched to customer.`,
        request: updated,
      });
    }

    // ACTION: REJECT REQUEST WITH LIBERTY REFUND
    if (actionType === "REJECT") {
      if (!rejectionReason || !rejectionReason.trim()) {
        return NextResponse.json({
          success: false,
          message: "Rejection reason is required.",
        }, { status: 400 });
      }

      const numericRefund = Number(refundAmount) || 0;
      const willRefund = Boolean(issueRefund) && numericRefund > 0;

      const updated = await prisma.$transaction(async (tx) => {
        // 1. Update Request record
        const reqUpdated = await tx.ninModificationRequest.update({
          where: { id: requestId },
          data: {
            status: "REJECTED",
            rejectionReason: rejectionReason.trim(),
            adminNotes: adminNotes || requestItem.adminNotes,
            isRefunded: willRefund,
            refundAmount: willRefund ? numericRefund : null,
          },
        });

        // 2. Perform wallet refund if requested
        if (willRefund && requestItem.user?.wallet) {
          const balanceBefore = Number(requestItem.user.wallet.balance);
          const balanceAfter = balanceBefore + numericRefund;
          const refundTxRef = `REF_NIN_MOD_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

          await tx.wallet.update({
            where: { id: requestItem.user.wallet.id },
            data: {
              balance: { increment: numericRefund },
            },
          });

          await tx.transaction.create({
            data: {
              walletId: requestItem.user.wallet.id,
              amount: numericRefund,
              balanceBefore,
              balanceAfter,
              type: "REFUND",
              status: "SUCCESS",
              reference: refundTxRef,
              serviceCategory: "SERVICES",
              description: `Refund: NIN Modification [${requestItem.trackingId}]. Reason: ${rejectionReason.trim()}`,
            },
          });
        }

        // 3. Create In-App Notification
        await tx.inAppNotification.create({
          data: {
            userId: requestItem.userId,
            title: "NIN Modification Rejected",
            message: `Your request (${requestItem.trackingId}) was rejected. ${willRefund ? `₦${numericRefund.toLocaleString()} refunded to your wallet.` : ""}`,
            type: "warning",
            link: "/dashboard/nin/modification",
          },
        });

        return reqUpdated;
      });

      // Email dispatch
      if (requestItem.user?.email) {
        const clientDisplayName = `${requestItem.user.firstName || ""} ${requestItem.user.lastName || ""}`.trim() || "Customer";
        sendNinModificationRejectedEmail({
          to: requestItem.user.email,
          name: clientDisplayName,
          trackingId: requestItem.trackingId,
          type: requestItem.type,
          reason: rejectionReason.trim(),
          refundAmount: willRefund ? numericRefund : 0,
        }).catch((err) => console.error("Failed to send rejection email:", err));
      }

      return NextResponse.json({
        success: true,
        message: `Request ${requestItem.trackingId} has been REJECTED.${willRefund ? ` ₦${numericRefund.toLocaleString()} refunded to user wallet.` : ""}`,
        request: updated,
      });
    }

    return NextResponse.json({ success: false, message: "Invalid action type." }, { status: 400 });
  } catch (error) {
    console.error("NIN Modification Action Error:", error);
    return NextResponse.json({ success: false, message: "An error occurred while processing action." }, { status: 500 });
  }
}
