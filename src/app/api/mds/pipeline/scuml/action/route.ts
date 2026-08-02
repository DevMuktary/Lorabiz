import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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

    await prisma.$transaction(async (tx) => {
      
      // Handle "PROCESS"
      if (actionType === "PROCESS") {
        await tx.scumlRegistration.update({
          where: { id: ticketId },
          data: { status: "PROCESSING" }
        });
      }

      // Handle "COMPLETE"
      if (actionType === "COMPLETE") {
        await tx.scumlRegistration.update({
          where: { id: ticketId },
          data: { 
            status: "COMPLETED",
            finalCertificateUrl: finalCertificateUrl 
          }
        });

        // Trigger Notification Logic Here (E.g. Queue "send-scuml-completed-notification")
      }

      // Handle "FAIL" (With Refund)
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
        
        // You can queue a simple failure email notification here 
        // to inform them it failed and to check their wallet.
      }

      // Log the action for security audit
      await tx.staffActionLog.create({
        data: {
          userId: admin.id,
          action: `SCUML_${actionType}`,
          targetId: ticketId,
          details: `Admin executed ${actionType} on SCUML app for ${scumlTicket.companyName}. Reason/Notes: ${failureReason || 'N/A'}`
        }
      });
    });

    return NextResponse.json({ success: true, message: `SCUML Application successfully updated.` });
  } catch (error) {
    console.error("SCUML Action API Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
