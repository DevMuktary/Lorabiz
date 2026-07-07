import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      ticketId, ticketType, actionType, reason, 
      registrationNumber, taxId, certificateUrl, statusReportUrl, memorandumUrl 
    } = body;

    if (!ticketId || !ticketType || !actionType) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Require deliverables if approving
    if (actionType === "APPROVE") {
      if (!registrationNumber || !taxId || !certificateUrl || !statusReportUrl) {
        return NextResponse.json({ error: "Approval requires BN/RC Number, TIN, Certificate, and Status Report." }, { status: 400 });
      }
      if (ticketType === "LLC" && !memorandumUrl) {
        return NextResponse.json({ error: "LLC Approval requires a Memorandum of Association." }, { status: 400 });
      }
    }

    const mdsAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!mdsAdmin) return NextResponse.json({ error: "No Admin account found." }, { status: 500 });

    await prisma.$transaction(async (tx) => {
      let targetRef = "";
      const updateData: any = { status: actionType === "APPROVE" ? "APPROVED" : actionType === "FAIL" ? "FAILED" : actionType === "QUERY" ? "QUERIED" : undefined };
      
      if (actionType === "UNASSIGN") updateData.assignedToId = null;

      // Attach deliverables if approving
      if (actionType === "APPROVE") {
        updateData.registrationNumber = registrationNumber;
        updateData.taxId = taxId;
        updateData.certificateUrl = certificateUrl;
        updateData.statusReportUrl = statusReportUrl;
        if (ticketType === "LLC") updateData.memorandumUrl = memorandumUrl;
      }

      if (ticketType === "BUSINESS_NAME") {
        const updated = await tx.businessRegistration.update({ where: { id: ticketId }, data: updateData });
        targetRef = updated.trackingId || ticketId;
      } else if (ticketType === "LLC") {
        const updated = await tx.llcRegistration.update({ where: { id: ticketId }, data: updateData });
        targetRef = updated.trackingId || ticketId;
      }

      await tx.staffActionLog.create({
        data: {
          userId: mdsAdmin.id,
          action: `ADMIN_${actionType}`,
          targetId: targetRef,
          details: `Admin executed ${actionType} on ${ticketType}. ${reason ? `Reason: ${reason}` : 'No reason provided.'}`
        }
      });
    });

    return NextResponse.json({ success: true, message: `Application successfully updated.` });
  } catch (error) {
    console.error("Action API Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
