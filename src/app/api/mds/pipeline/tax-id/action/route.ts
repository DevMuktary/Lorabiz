import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { notificationQueue } from "@/lib/queue";
import { NotificationEvent } from "@/services/notifications";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
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

    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) return NextResponse.json({ error: "No Admin account found." }, { status: 500 });

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

        // --- NEW: REFERRAL SPEND TRACKING (ON COMPLETION) ---
        const amountPaid = Number(ticket.amountPaid || 0);
        
        if (amountPaid > 0) {
          const updatedSpender = await tx.user.update({
            where: { id: ticket.userId },
            data: { totalSpent: { increment: amountPaid } }
          });

          const thresholdSetting = await tx.globalSetting.findUnique({ 
            where: { key: 'REFERRAL_SPEND_THRESHOLD' } 
          });
          const thresholdAmount = thresholdSetting ? Number(thresholdSetting.value) : 5000;

          if (Number(updatedSpender.totalSpent) >= thresholdAmount) {
            const pendingReferral = await tx.referral.findUnique({
              where: { referredUserId: ticket.userId }
            });

            if (pendingReferral && pendingReferral.status === "PENDING") {
              await tx.referral.update({
                where: { id: pendingReferral.id },
                data: { status: "EARNED" }
              });

              await tx.user.update({
                where: { id: pendingReferral.referrerId },
                data: { referralBalance: { increment: pendingReferral.rewardAmount } }
              });
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
