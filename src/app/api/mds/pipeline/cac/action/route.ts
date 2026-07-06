import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticketId, ticketType, actionType, reason } = body;
    // actionType expects: "APPROVE", "QUERY", "FAIL", or "UNASSIGN"
    // ticketType expects: "BUSINESS_NAME" or "LLC"

    if (!ticketId || !ticketType || !actionType || !reason) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 1. Authenticate MD (Find Admin)
    const mdsAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    });

    if (!mdsAdmin) {
      return NextResponse.json({ error: "No Admin account found to authorize this action." }, { status: 500 });
    }

    // 2. Prepare Database Updates based on Action
    let statusUpdate: any = undefined;
    let assignmentUpdate: any = undefined;

    switch (actionType) {
      case "APPROVE":
        statusUpdate = "APPROVED";
        break;
      case "QUERY":
        statusUpdate = "QUERIED";
        break;
      case "FAIL":
        statusUpdate = "FAILED";
        break;
      case "UNASSIGN":
        assignmentUpdate = null; // Removes the assigned staff
        break;
      default:
        return NextResponse.json({ error: "Invalid action type." }, { status: 400 });
    }

    // 3. Execute Transaction for exact Service Type
    await prisma.$transaction(async (tx) => {
      let targetRef = "";

      if (ticketType === "BUSINESS_NAME") {
        const updateData: any = {};
        if (statusUpdate) updateData.status = statusUpdate;
        if (assignmentUpdate !== undefined) updateData.assignedToId = assignmentUpdate;

        const updated = await tx.businessRegistration.update({
          where: { id: ticketId },
          data: updateData
        });
        targetRef = updated.trackingId || ticketId;
      } 
      else if (ticketType === "LLC") {
        const updateData: any = {};
        if (statusUpdate) updateData.status = statusUpdate;
        if (assignmentUpdate !== undefined) updateData.assignedToId = assignmentUpdate;

        const updated = await tx.llcRegistration.update({
          where: { id: ticketId },
          data: updateData
        });
        targetRef = updated.trackingId || ticketId;
      }

      // Log the MD's exact action for accountability
      await tx.staffActionLog.create({
        data: {
          userId: mdsAdmin.id,
          action: `MD_OVERRIDE_${actionType}`,
          targetId: targetRef,
          details: `MD executed ${actionType} on ${ticketType}. Reason provided: ${reason}`
        }
      });
    });

    return NextResponse.json({ success: true, message: `Application successfully updated.` });

  } catch (error) {
    console.error("MD Override Error:", error);
    return NextResponse.json({ error: "Internal server error during MD override." }, { status: 500 });
  }
}
