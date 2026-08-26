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
      finalCertificateUrl, 
      failureReason, 
      issueRefund, 
      refundAmount 
    } = body;

    if (!ticketId || !actionType) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const scumlTicket = await prisma.scumlRegistration.findUnique({
      where: { id: ticketId },
      include: { user: true }
    });

    if (!scumlTicket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    let notificationPayload: NotificationEvent | null = null;

    await prisma.$transaction(async (tx) => {
      
      // ---------------------------------------------------------
      // 1. Process Logic
      // ---------------------------------------------------------
      if (actionType === "PROCESS") {
        await tx.scumlRegistration.update({
          where: { id: ticketId },
          data: { status: "PROCESSING" }
        });
      }

      // ---------------------------------------------------------
      // 2. Complete Logic
      // ---------------------------------------------------------
      if (actionType === "COMPLETE") {
        await tx.scumlRegistration.update({
          where: { id: ticketId },
          data: { 
            status: "COMPLETED",
            finalCertificateUrl: finalCertificateUrl 
          }
        });

        // --- NEW: BULLETPROOF REFERRAL LEDGER PAYOUT ---
        const activeReferral = await tx.referral.findUnique({
          where: { referredUserId: scumlTicket.userId }
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
                        where: { key: 'REF_REWARD_SCUML' }
                    });
                    
                    const baseAmount = rewardSetting ? Number(rewardSetting.value) : 500.00;
                    const commissionAmount = await getReferrerRewardAmount(tx, activeReferral.referrerId, baseAmount);

                    if (commissionAmount > 0) {
                        await tx.referralCommission.create({
                            data: {
                                referralId: activeReferral.id,
                                serviceType: "SCUML",
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

      // ---------------------------------------------------------
      // 3. Fail & Refund Logic
      // ---------------------------------------------------------
      if (actionType === "FAIL") {
        await tx.scumlRegistration.update({
          where: { id: ticketId },
          data: { 
            status: "FAILED",
            failureReason: failureReason 
          }
        });

        if (issueRefund && refundAmount > 0) {
          const wallet = await tx.wallet.findUnique({ where: { userId: scumlTicket.userId } });
          
          if (wallet) {
            const balanceBefore = Number(wallet.balance);
            const balanceAfter = balanceBefore + Number(refundAmount);
            const refundRef = `REF-SCUML-${Math.floor(Math.random() * 1000000000)}`;

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
                serviceCategory: "SCUML",
                description: `Refund for Failed SCUML Application [${scumlTicket.transactionRef}]. Reason: ${failureReason}`
              }
            });
          }
        }
      }

      // ---------------------------------------------------------
      // 4. Security Audit Logging
      // ---------------------------------------------------------
      await tx.staffActionLog.create({
        data: {
          userId: admin.id,
          action: `SCUML_${actionType}`,
          targetId: ticketId,
          details: `Admin executed ${actionType} on SCUML app for ${scumlTicket.companyName}. Reason/Notes: ${failureReason || 'N/A'}`
        }
      });

      // ---------------------------------------------------------
      // 5. Build Notification Payload
      // ---------------------------------------------------------
      const userEmail = scumlTicket.user.email || "";
      const userPhone = scumlTicket.user.phone || "";
      const userName = `${scumlTicket.user.firstName || ''} ${scumlTicket.user.lastName || ''}`.trim() || "Valued Customer";

      if (actionType === "PROCESS") {
        notificationPayload = {
          type: "SCUML_PROCESSING",
          userId: scumlTicket.userId, email: userEmail, name: userName,
          companyName: scumlTicket.companyName, transactionRef: scumlTicket.transactionRef
        };
      } else if (actionType === "COMPLETE" && finalCertificateUrl) {
        notificationPayload = {
          type: "SCUML_COMPLETED",
          userId: scumlTicket.userId, email: userEmail, phone: userPhone, name: userName,
          companyName: scumlTicket.companyName, transactionRef: scumlTicket.transactionRef,
          finalCertificateUrl: finalCertificateUrl
        };
      } else if (actionType === "FAIL") {
        notificationPayload = {
          type: "SCUML_FAILED",
          userId: scumlTicket.userId, email: userEmail, name: userName,
          companyName: scumlTicket.companyName, transactionRef: scumlTicket.transactionRef,
          failureReason: failureReason, refundAmount: issueRefund ? Number(refundAmount) : 0
        };
      }
    });

    // ---------------------------------------------------------
    // Queue the notification OUTSIDE the transaction for safety
    // ---------------------------------------------------------
    if (notificationPayload) {
      await notificationQueue.add("send-scuml-action-notification", notificationPayload, {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: true,
      });
    }

    return NextResponse.json({ success: true, message: `SCUML Application successfully updated.` });
  } catch (error) {
    console.error("SCUML Action API Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
