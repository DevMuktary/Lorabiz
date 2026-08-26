import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { notificationQueue } from "@/lib/queue";
import { NotificationEvent } from "@/services/notifications";
import { getReferrerRewardAmount } from "@/lib/loyalty";

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
      taxIdNumber, 
      taxIdImageUrl,
      failureReason, 
      issueRefund, 
      refundAmount 
    } = body;

    if (!ticketId || !actionType) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const ticket = await prisma.taxIdRequest.findUnique({
      where: { id: ticketId },
      include: { user: true }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    let notificationPayload: NotificationEvent | null = null;

    await prisma.$transaction(async (tx) => {
      
      if (actionType === "PROCESS") {
        await tx.taxIdRequest.update({
          where: { id: ticketId },
          data: { status: "PROCESSING" }
        });
      }

      if (actionType === "COMPLETE") {
        await tx.taxIdRequest.update({
          where: { id: ticketId },
          data: { 
            status: "COMPLETED",
            taxIdNumber: taxIdNumber,
            taxIdImageUrl: taxIdImageUrl
          }
        });

        // --- NEW: BULLETPROOF REFERRAL LEDGER PAYOUT ---
        const activeReferral = await tx.referral.findUnique({
          where: { referredUserId: ticket.userId }
        });

        if (activeReferral) {
            const isReferralActiveSetting = await tx.globalSetting.findUnique({ 
                where: { key: 'REFERRAL_ACTIVE' } 
            });
            const isReferralActive = !isReferralActiveSetting || isReferralActiveSetting.value === 'true';
            
            const isNotExpired = !activeReferral.expiresAt || new Date() < activeReferral.expiresAt;

            if (isReferralActive && isNotExpired) {
                // Prevent Double Payouts
                const existingCommission = await tx.referralCommission.findUnique({
                    where: { serviceId: ticketId }
                });

                if (!existingCommission) {
                    const rewardSetting = await tx.globalSetting.findUnique({
                        where: { key: 'REF_REWARD_TAX_ID' }
                    });
                    
                    const baseAmount = rewardSetting ? Number(rewardSetting.value) : 200.00;
                    const commissionAmount = await getReferrerRewardAmount(tx, activeReferral.referrerId, baseAmount);

                    if (commissionAmount > 0) {
                        await tx.referralCommission.create({
                            data: {
                                referralId: activeReferral.id,
                                serviceType: "TAX_ID",
                                serviceId: ticketId,
                                amount: commissionAmount
                            }
                        });

                        await tx.user.update({
                            where: { id: activeReferral.referrerId },
                            data: { referralBalance: { increment: commissionAmount } }
                        });
                    }
                }
            }
        }
        // ----------------------------------------------------
      }

      if (actionType === "FAIL") {
        await tx.taxIdRequest.update({
          where: { id: ticketId },
          data: { 
            status: "FAILED",
            failureReason: failureReason 
          }
        });

        if (issueRefund && refundAmount > 0) {
          const wallet = await tx.wallet.findUnique({ where: { userId: ticket.userId } });
          
          if (wallet) {
            const balanceBefore = Number(wallet.balance);
            const balanceAfter = balanceBefore + Number(refundAmount);
            const refundRef = `REF-TAXID-${Math.floor(Math.random() * 1000000000)}`;

            await tx.wallet.update({ 
              where: { id: wallet.id }, 
              data: { balance: balanceAfter } 
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
                serviceCategory: "TAX_ID",
                description: `Refund for Failed Tax ID Request [${ticket.transactionRef}]. Reason: ${failureReason}`
              }
            });
          }
        }
      }

      await tx.staffActionLog.create({
        data: {
          userId: admin.id,
          action: `TAXID_${actionType}`,
          targetId: ticketId,
          details: `Admin executed ${actionType} on Tax ID app. Ref: ${ticket.transactionRef}`
        }
      });

      const userEmail = ticket.user.email || "";
      const userName = `${ticket.user.firstName || ''} ${ticket.user.lastName || ''}`.trim() || "Valued Customer";

      if (actionType === "COMPLETE" && taxIdNumber) {
        notificationPayload = {
          type: "TAXID_COMPLETED",
          userId: ticket.userId, email: userEmail, name: userName,
          requestType: ticket.type === "CORPORATE" ? "Corporate" : "Individual",
          taxIdNumber: taxIdNumber, 
          taxIdImageUrl: taxIdImageUrl,
          transactionRef: ticket.transactionRef
        };
      } else if (actionType === "FAIL") {
        notificationPayload = {
          type: "TAXID_FAILED",
          userId: ticket.userId, email: userEmail, name: userName,
          requestType: ticket.type === "CORPORATE" ? "Corporate" : "Individual",
          failureReason: failureReason, refundAmount: issueRefund ? Number(refundAmount) : 0,
          transactionRef: ticket.transactionRef
        };
      }
    });

    if (notificationPayload) {
      await notificationQueue.add("send-taxid-action-notification", notificationPayload, {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: true,
      });
    }

    return NextResponse.json({ success: true, message: `Tax ID Request successfully updated.` });
  } catch (error) {
    console.error("Tax ID Action API Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
