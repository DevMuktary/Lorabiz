import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      ticketId, ticketType, actionType, reason, 
      registrationNumber, taxId, certificateUrl, statusReportUrl, memorandumUrl,
      issueRefund, refundAmount // New Refund Fields
    } = body;

    if (!ticketId || !ticketType || !actionType) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const mdsAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!mdsAdmin) return NextResponse.json({ error: "No Admin account found." }, { status: 500 });

    await prisma.$transaction(async (tx) => {
      let targetRef = "";
      let clientId = "";
      
      const updateData: any = { 
        status: actionType === "APPROVE" ? "APPROVED" : actionType === "FAIL" ? "FAILED" : actionType === "QUERY" ? "QUERIED" : undefined 
      };
      
      if (actionType === "UNASSIGN") updateData.assignedToId = null;

      // Attach deliverables
      if (actionType === "APPROVE") {
        updateData.registrationNumber = registrationNumber;
        updateData.taxId = taxId;
        updateData.certificateUrl = certificateUrl;
        updateData.statusReportUrl = statusReportUrl;
        if (ticketType === "LLC") updateData.memorandumUrl = memorandumUrl;
      }

      // Update the specific ticket
      if (ticketType === "BUSINESS_NAME") {
        const updated = await tx.businessRegistration.update({ where: { id: ticketId }, data: updateData });
        targetRef = updated.trackingId || ticketId;
        clientId = updated.userId;
      } else if (ticketType === "LLC") {
        const updated = await tx.llcRegistration.update({ where: { id: ticketId }, data: updateData });
        targetRef = updated.trackingId || ticketId;
        clientId = updated.userId;
      }

      // PROCESS REFUND IF REQUESTED (Only on Fail)
      if (actionType === "FAIL" && issueRefund && refundAmount) {
        const wallet = await tx.wallet.findUnique({ where: { userId: clientId } });
        if (wallet) {
          const balanceBefore = wallet.balance;
          const balanceAfter = Number(balanceBefore) + Number(refundAmount);
          const refundRef = `REF-${Math.floor(Math.random() * 1000000000)}`;

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
              description: `Refund for Failed Application [${targetRef}]. Reason: ${reason}`
            }
          });
        }
      }

      // Log action
      await tx.staffActionLog.create({
        data: {
          userId: mdsAdmin.id,
          action: `ADMIN_${actionType}`,
          targetId: targetRef,
          details: `Admin executed ${actionType} on ${ticketType}. ${issueRefund ? `Issued ₦${refundAmount} refund.` : ''} Reason: ${reason}`
        }
      });
    });

    return NextResponse.json({ success: true, message: `Application successfully updated.` });
  } catch (error) {
    console.error("Action API Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
