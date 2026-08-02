// src/app/api/mds/pipeline/scuml/action/route.ts

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
      finalCertificateUrl, 
      failureReason, 
      issueRefund, 
      refundAmount 
    } = body;

    if (!ticketId || !actionType) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) return NextResponse.json({ error: "No Admin account found." }, { status: 500 });

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
