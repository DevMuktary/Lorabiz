// src/app/api/mds/pipeline/annual-returns/action/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendAnnualReturnsApprovedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

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
      acknowledgementLetterUrl,
      queryReason,
      rejectionReason,
      adminNotes,
    } = body;

    if (!ticketId || !actionType) {
      return NextResponse.json({ error: "Missing required parameters." }, { status: 400 });
    }

    const ticket = await prisma.cacAnnualReturnRequest.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Annual return filing ticket not found." }, { status: 404 });
    }

    // =========================================================================
    // ACTION: START_PROCESSING
    // =========================================================================
    if (actionType === "START_PROCESSING") {
      const updated = await prisma.cacAnnualReturnRequest.update({
        where: { id: ticketId },
        data: {
          status: "PROCESSING",
          adminNotes: adminNotes ? `${ticket.adminNotes ? ticket.adminNotes + "\n" : ""}${adminNotes}` : undefined,
        },
      });

      await prisma.staffActionLog.create({
        data: {
          userId: admin.id,
          action: "ANNUAL_RETURNS_START_PROCESSING",
          targetId: ticketId,
          details: `Staff moved ticket ${ticket.trackingId} (${ticket.companyName}) to PROCESSING`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Filing application is now PROCESSING.",
        data: updated,
      });
    }

    // =========================================================================
    // ACTION: QUERY_APPLICATION
    // =========================================================================
    if (actionType === "QUERY_APPLICATION") {
      if (!queryReason?.trim()) {
        return NextResponse.json({ error: "Please specify a query reason for the client." }, { status: 400 });
      }

      const updated = await prisma.cacAnnualReturnRequest.update({
        where: { id: ticketId },
        data: {
          status: "QUERIED",
          queryReason: queryReason.trim(),
          adminNotes: adminNotes ? `${ticket.adminNotes ? ticket.adminNotes + "\n" : ""}${adminNotes}` : undefined,
        },
      });

      // In-App Notification
      await prisma.inAppNotification.create({
        data: {
          userId: ticket.userId,
          title: "Annual Returns Queried ⚠️",
          message: `Query on ${ticket.companyName} (${ticket.trackingId}): ${queryReason.trim()}`,
          type: "warning",
          link: `/dashboard/cac/post-incorporation/annual-returns`,
        },
      });

      await prisma.staffActionLog.create({
        data: {
          userId: admin.id,
          action: "ANNUAL_RETURNS_QUERIED",
          targetId: ticketId,
          details: `Staff queried ${ticket.trackingId}: ${queryReason.trim()}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Application queried. Client notified.",
        data: updated,
      });
    }

    // =========================================================================
    // ACTION: APPROVE_APPLICATION
    // =========================================================================
    if (actionType === "APPROVE_APPLICATION") {
      if (!acknowledgementLetterUrl?.trim()) {
        return NextResponse.json(
          { error: "Official CAC Acknowledgement Letter URL is required to approve this filing." },
          { status: 400 }
        );
      }

      const updated = await prisma.cacAnnualReturnRequest.update({
        where: { id: ticketId },
        data: {
          status: "APPROVED",
          acknowledgementLetterUrl: acknowledgementLetterUrl.trim(),
          approvedAt: new Date(),
          queryReason: null,
          adminNotes: adminNotes ? `${ticket.adminNotes ? ticket.adminNotes + "\n" : ""}${adminNotes}` : undefined,
        },
      });

      // In-App Notification
      await prisma.inAppNotification.create({
        data: {
          userId: ticket.userId,
          title: "Annual Returns Approved & Completed! 🎉",
          message: `Your CAC Annual Returns for ${ticket.companyName} (${ticket.registrationNumber}) has been approved! Your official Acknowledgement Letter is ready for download.`,
          type: "success",
          link: `/dashboard/cac/post-incorporation/annual-returns`,
        },
      });

      // Email Dispatch with Acknowledgement PDF
      if (ticket.user?.email) {
        try {
          await sendAnnualReturnsApprovedEmail({
            to: ticket.user.email,
            firstName: ticket.user.firstName || "Customer",
            companyName: ticket.companyName,
            trackingId: ticket.trackingId,
            registrationNumber: ticket.registrationNumber,
            acknowledgementLetterUrl: acknowledgementLetterUrl.trim(),
            filingYears: ticket.filingYears || undefined,
          });
        } catch (emailErr) {
          console.error("Failed to send annual returns approval email:", emailErr);
        }
      }

      await prisma.staffActionLog.create({
        data: {
          userId: admin.id,
          action: "ANNUAL_RETURNS_APPROVED",
          targetId: ticketId,
          details: `Staff approved ${ticket.trackingId} (${ticket.companyName}) and uploaded Acknowledgement Letter.`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Application successfully APPROVED! Official Acknowledgement Letter delivered.",
        data: updated,
      });
    }

    // =========================================================================
    // ACTION: REJECT_APPLICATION
    // =========================================================================
    if (actionType === "REJECT_APPLICATION") {
      if (!rejectionReason?.trim()) {
        return NextResponse.json({ error: "Please specify a rejection reason." }, { status: 400 });
      }

      const updated = await prisma.cacAnnualReturnRequest.update({
        where: { id: ticketId },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason.trim(),
          adminNotes: adminNotes ? `${ticket.adminNotes ? ticket.adminNotes + "\n" : ""}${adminNotes}` : undefined,
        },
      });

      await prisma.inAppNotification.create({
        data: {
          userId: ticket.userId,
          title: "Annual Returns Rejected ❌",
          message: `Your filing for ${ticket.companyName} (${ticket.trackingId}) was rejected: ${rejectionReason.trim()}`,
          type: "error",
          link: `/dashboard/cac/post-incorporation/annual-returns`,
        },
      });

      await prisma.staffActionLog.create({
        data: {
          userId: admin.id,
          action: "ANNUAL_RETURNS_REJECTED",
          targetId: ticketId,
          details: `Staff rejected ${ticket.trackingId}: ${rejectionReason.trim()}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Application marked as REJECTED.",
        data: updated,
      });
    }

    return NextResponse.json({ error: "Unknown action type specified." }, { status: 400 });
  } catch (error: any) {
    console.error("MDS Annual Returns Action Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error performing action." },
      { status: 500 }
    );
  }
}
