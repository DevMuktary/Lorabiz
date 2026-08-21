import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendBvnRetrievalCompletedEmail, sendBvnRetrievalFailedEmail } from "@/lib/email";
import { generateNumericId } from "@/utils/generateId";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: { email: session.user.email, role: { in: ["ADMIN", "STAFF"] } },
    });
    if (!admin) {
      return NextResponse.json({ success: false, error: "Forbidden. Admin or Staff access required." }, { status: 403 });
    }

    const body = await req.json();
    const { 
      ticketId, 
      actionType, 
      retrievedBvn, 
      slipUrl,
      failureReason, 
      adminNotes,
      issueRefund, 
      refundAmount 
    } = body;

    if (!ticketId || !actionType) {
      return NextResponse.json({ success: false, error: "Missing ticket ID or action type." }, { status: 400 });
    }

    const ticket = await prisma.bvnRetrievalRequest.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: "BVN Retrieval request not found." }, { status: 404 });
    }

    // Validation
    if (actionType === "COMPLETE") {
      const cleanBvn = retrievedBvn ? String(retrievedBvn).trim() : "";
      if (!cleanBvn || cleanBvn.length !== 11 || !/^\d{11}$/.test(cleanBvn)) {
        return NextResponse.json({
          success: false,
          error: "You must enter a valid 11-digit BVN to complete this retrieval.",
        }, { status: 400 });
      }
    }

    if (actionType === "FAIL") {
      if (!failureReason || !String(failureReason).trim()) {
        return NextResponse.json({
          success: false,
          error: "You must provide a clear failure reason to reject/fail this request.",
        }, { status: 400 });
      }
    }

    await prisma.$transaction(async (tx) => {
      if (actionType === "PROCESS") {
        await tx.bvnRetrievalRequest.update({
          where: { id: ticketId },
          data: { status: "PROCESSING", adminNotes: adminNotes || undefined },
        });
      }

      if (actionType === "COMPLETE") {
        const cleanBvn = String(retrievedBvn).trim();
        await tx.bvnRetrievalRequest.update({
          where: { id: ticketId },
          data: {
            status: "COMPLETED",
            retrievedBvn: cleanBvn,
            slipUrl: slipUrl || null,
            adminNotes: adminNotes || undefined,
            completedAt: new Date(),
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
                where: { key: 'REF_REWARD_BVN_RETRIEVAL' }
              });
              const commissionAmount = rewardSetting ? Number(rewardSetting.value) : 250.00;

              if (commissionAmount > 0) {
                await tx.referralCommission.create({
                  data: {
                    referralId: activeReferral.id,
                    serviceType: "BVN_RETRIEVAL",
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
        const shouldRefund = Boolean(issueRefund) && Number(refundAmount) > 0;
        const finalRefundAmount = shouldRefund ? Number(refundAmount) : 0;

        await tx.bvnRetrievalRequest.update({
          where: { id: ticketId },
          data: {
            status: "FAILED",
            failureReason: String(failureReason).trim(),
            adminNotes: adminNotes || undefined,
            isRefunded: shouldRefund,
            refundAmount: shouldRefund ? finalRefundAmount : null,
          },
        });

        if (shouldRefund) {
          const wallet = await tx.wallet.findUnique({ where: { userId: ticket.userId } });
          if (wallet) {
            const balanceBefore = Number(wallet.balance);
            const balanceAfter = balanceBefore + finalRefundAmount;
            const refundRef = `REF-RET-${generateNumericId(8)}`;

            await tx.wallet.update({
              where: { id: wallet.id },
              data: { balance: balanceAfter },
            });

            await tx.transaction.create({
              data: {
                walletId: wallet.id,
                amount: finalRefundAmount,
                balanceBefore,
                balanceAfter,
                type: "REFUND",
                status: "SUCCESS",
                reference: refundRef,
                serviceCategory: "BVN",
                description: `Refund for Failed BVN Retrieval [${ticket.trackingId}]. Reason: ${failureReason}`,
              },
            });
          }
        }
      }

      if (admin) {
        await tx.staffActionLog.create({
          data: {
            userId: admin.id,
            action: `BVN_RETRIEVAL_${actionType}`,
            targetId: ticketId,
            details: `Admin executed ${actionType} on BVN Retrieval ${ticket.trackingId}. Ref: ${ticket.transactionRef}`,
          },
        });
      }
    });

    // Send relevant email notification
    try {
      if (actionType === "COMPLETE") {
        await sendBvnRetrievalCompletedEmail({
          to: ticket.user.email,
          firstName: ticket.user.firstName || "Valued Client",
          trackingId: ticket.trackingId,
          fullName: ticket.fullName,
          retrievedBvn: String(retrievedBvn).trim(),
          slipUrl: slipUrl || null,
        });
      } else if (actionType === "FAIL") {
        await sendBvnRetrievalFailedEmail({
          to: ticket.user.email,
          firstName: ticket.user.firstName || "Valued Client",
          trackingId: ticket.trackingId,
          fullName: ticket.fullName,
          reason: String(failureReason).trim(),
          refundAmount: issueRefund ? Number(refundAmount) : null,
          isRefunded: Boolean(issueRefund) && Number(refundAmount) > 0,
        });
      }
    } catch (emailErr) {
      console.error("Failed to send BVN Retrieval action email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: `BVN Retrieval request marked as ${actionType === "COMPLETE" ? "COMPLETED" : actionType === "FAIL" ? "FAILED" : "PROCESSING"}.`,
    });
  } catch (error: any) {
    console.error("BVN Retrieval Action API Error:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Internal server error occurred.",
    }, { status: 500 });
  }
}
