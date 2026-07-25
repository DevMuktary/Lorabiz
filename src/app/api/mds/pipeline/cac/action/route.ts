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

      // Attach deliverables
      if (actionType === "APPROVE") {
        updateData.registrationNumber = registrationNumber;
        updateData.taxId = taxId;
        updateData.certificateUrl = certificateUrl;
        updateData.statusReportUrl = statusReportUrl;
        if (ticketType === "LLC") updateData.memorandumUrl = memorandumUrl;
      }

      // Save Query Reason
      if (actionType === "QUERY") {
        updateData.queryReason = reason;
        updateData.queryStatus = "UNRESOLVED";
        if (ticketType === "BUSINESS_NAME") {
          updateData.queryDate = new Date();
        }
      }

      if (ticketType === "BUSINESS_NAME") {
        const updated = await tx.businessRegistration.update({ where: { id: ticketId }, data: updateData });
        targetRef = updated.trackingId || ticketId;
        clientId = updated.userId;
        regName = updated.proposedName;
      } else if (ticketType === "LLC") {
        const updated = await tx.llcRegistration.update({ where: { id: ticketId }, data: updateData });
        targetRef = updated.trackingId || ticketId;
        clientId = updated.userId;
        regName = updated.proposedName || "LLC Application";
      }

      // Fetch User details for notifications
      const user = await tx.user.findUnique({ where: { id: clientId } });

      // Prepare Notification Payload for Approved or Queried
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
            rcNumber: registrationNumber || "N/A"
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

      // PROCESS REFUND
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

    // Fire background notification if a payload was generated
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
