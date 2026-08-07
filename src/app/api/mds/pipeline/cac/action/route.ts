import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { notificationQueue } from "@/lib/queue";
import { NotificationEvent } from "@/services/notifications";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      ticketId, ticketType, actionType, reason, 
      registrationNumber, taxId, certificateUrl, statusReportUrl, memorandumUrl,
      issueRefund, refundAmount, staffId
    } = body;

    if (!ticketId || !ticketType || !actionType) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const mdsAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!mdsAdmin) return NextResponse.json({ error: "No Admin account found." }, { status: 500 });

    let notificationPayload: NotificationEvent | null = null;

    await prisma.$transaction(async (tx) => {
      let targetRef = "";
      let clientId = "";
      let regName = "";
      
      const updateData: any = { 
        status: actionType === "APPROVE" ? "APPROVED" : actionType === "FAIL" ? "FAILED" : actionType === "QUERY" ? "QUERIED" : undefined 
      };
      
      if (actionType === "UNASSIGN") updateData.assignedToId = null;
      if (actionType === "ASSIGN" && staffId) updateData.assignedToId = staffId;

      if (actionType === "APPROVE") {
        updateData.registrationNumber = registrationNumber;
        updateData.taxId = taxId;
        updateData.certificateUrl = certificateUrl;
        updateData.statusReportUrl = statusReportUrl;
        if (ticketType === "LLC") updateData.memorandumUrl = memorandumUrl;
      }

      if (actionType === "QUERY") {
        updateData.queryReason = reason;
        updateData.queryStatus = "UNRESOLVED";
        if (ticketType === "BUSINESS_NAME") {
          updateData.queryDate = new Date();
        }
      }

      let paidAmount = 0;

      if (ticketType === "BUSINESS_NAME") {
        const updated = await tx.businessRegistration.update({ where: { id: ticketId }, data: updateData });
        targetRef = updated.trackingId || ticketId;
        clientId = updated.userId;
        regName = updated.proposedName;

        if (actionType === "APPROVE") {
          const pricing = await tx.servicePricing.findUnique({ where: { serviceKey: "BUSINESS_NAME" } });
          paidAmount = pricing ? Number(pricing.price) : 25000; // fallback standard
        }
      } else if (ticketType === "LLC") {
        const updated = await tx.llcRegistration.update({ where: { id: ticketId }, data: updateData });
        targetRef = updated.trackingId || ticketId;
        clientId = updated.userId;
        regName = updated.proposedName || "LLC Application";

        if (actionType === "APPROVE") {
          const prices = await tx.servicePricing.findMany();
          const pricingMap = prices.reduce((acc: Record<string, number>, item) => { 
            acc[item.serviceKey] = Number(item.price); 
            return acc; 
          }, {});

          const baseLLCFee = pricingMap["LLC"] || 35000;
          const extraMillionFee = pricingMap["LLC_EXTRA_MILLION"] || 15000;
          const totalShares = Number(updated.totalShareCapital) || 1000000;
          const extraSharesFee = Math.max(0, Math.ceil((totalShares - 1000000) / 1000000)) * extraMillionFee;
          
          paidAmount = baseLLCFee + extraSharesFee;
        }
      }

      // --- NEW: REFERRAL SPEND TRACKING (ON CAC APPROVAL) ---
      if (actionType === "APPROVE" && paidAmount > 0 && clientId) {
        const updatedSpender = await tx.user.update({
          where: { id: clientId },
          data: { totalSpent: { increment: paidAmount } }
        });

        const thresholdSetting = await tx.globalSetting.findUnique({ 
          where: { key: 'REFERRAL_SPEND_THRESHOLD' } 
        });
        const thresholdAmount = thresholdSetting ? Number(thresholdSetting.value) : 5000;

        if (Number(updatedSpender.totalSpent) >= thresholdAmount) {
          const pendingReferral = await tx.referral.findUnique({
            where: { referredUserId: clientId }
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
      // ------------------------------------------------------

      const user = await tx.user.findUnique({ where: { id: clientId } });

      if (user && (actionType === "APPROVE" || actionType === "QUERY")) {
        const userPhone = user.phone || "";
        const userEmail = user.email || "";
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Valued Customer";

        if (actionType === "APPROVE") {
          notificationPayload = {
            type: "APPLICATION_APPROVED",
            userId: user.id,
            phone: userPhone,
            email: userEmail,
            name: userName,
            businessName: regName,
            rcNumber: registrationNumber || "N/A",
            certificateUrl: certificateUrl,
            statusReportUrl: statusReportUrl,
            memorandumUrl: memorandumUrl,
          };
        } else if (actionType === "QUERY") {
          notificationPayload = {
            type: "APPLICATION_QUERIED",
            userId: user.id,
            phone: userPhone,
            email: userEmail,
            name: userName,
            businessName: regName,
            queryReason: reason || "Action required on your application.",
            regId: ticketId,
            entitySlug: ticketType === "LLC" ? "llc" : "businesses"
          };
        }
      }

      if (actionType === "FAIL" && issueRefund && refundAmount) {
        const wallet = await tx.wallet.findUnique({ where: { userId: clientId } });
        if (wallet) {
          const balanceBefore = wallet.balance;
          const balanceAfter = Number(balanceBefore) + Number(refundAmount);
          const refundRef = `REF-${Math.floor(Math.random() * 1000000000)}`;

          await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter } });
          await tx.transaction.create({
            data: {
              walletId: wallet.id, amount: refundAmount, balanceBefore, balanceAfter,
              type: "REFUND", status: "SUCCESS", reference: refundRef,
              description: `Refund for Failed Application [${targetRef}]. Reason: ${reason}`
            }
          });
        }
      }

      await tx.staffActionLog.create({
        data: {
          userId: mdsAdmin.id,
          action: `ADMIN_${actionType}`,
          targetId: targetRef,
          details: `Admin executed ${actionType} on ${ticketType}. ${actionType === "ASSIGN" ? `Assigned to staff ${staffId}.` : ''} Reason: ${reason || 'N/A'}`
        }
      });
    });

    if (notificationPayload) {
      await notificationQueue.add("send-admin-action-notification", notificationPayload, {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: true,
      });
    }

    return NextResponse.json({ success: true, message: `Application successfully updated.` });
  } catch (error) {
    console.error("Action API Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
