import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import {
  sendCourtAffidavitProcessingEmail,
  sendCourtAffidavitCompletedEmail,
  sendCourtAffidavitQueriedEmail,
} from "@/lib/email";
import { logUserActivity } from "@/lib/activity-logger";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  CAC_CORPORATE: "CAC Corporate Affidavit",
  CHANGE_OF_NAME: "Change / Correction of Name",
  AGE_DECLARATION: "Declaration of Age",
  LOSS_OF_ITEM: "Loss of Document / SIM Card",
  PROOF_OF_OWNERSHIP: "Proof of Ownership",
  GENERAL_PURPOSE: "General Purpose Sworn Affidavit",
};

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
      actionType, // "PROCESS" | "COMPLETE" | "QUERY" | "REJECT"
      certificateUrl,
      courtName,
      commissionerName,
      queryReason,
      rejectionReason,
      adminNotes,
    } = body;

    if (!ticketId || !actionType) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const affidavit = await prisma.courtAffidavitRequest.findUnique({
      where: { id: ticketId },
      include: { user: true }
    });

    if (!affidavit) {
      return NextResponse.json({ error: "Affidavit request not found." }, { status: 404 });
    }

    const categoryLabel = CATEGORY_LABELS[affidavit.category] || "Court Affidavit";

    // 1. PROCESS ACTION
    if (actionType === "PROCESS") {
      const updated = await prisma.courtAffidavitRequest.update({
        where: { id: ticketId },
        data: {
          status: "PROCESSING",
          adminNotes: adminNotes || undefined,
        }
      });

      try {
        await sendCourtAffidavitProcessingEmail({
          to: affidavit.user.email,
          firstName: affidavit.user.firstName,
          trackingId: affidavit.trackingId,
          categoryLabel,
          deponentName: affidavit.deponentFullName,
        });
      } catch (err) {
        console.warn("Processing email error:", err);
      }

      await logUserActivity({
        userId: affidavit.userId,
        action: "COURT_AFFIDAVIT_PROCESSING",
        category: "SERVICES",
        description: `Affidavit ${affidavit.trackingId} moved to PROCESSING by staff (${admin.email})`,
        status: "SUCCESS",
        referenceId: affidavit.trackingId,
        req,
      });

      return NextResponse.json({
        success: true,
        message: `Affidavit ${affidavit.trackingId} marked as PROCESSING.`,
        affidavit: updated,
      });
    }

    // 2. COMPLETE ACTION
    if (actionType === "COMPLETE") {
      if (!certificateUrl || !certificateUrl.trim()) {
        return NextResponse.json({
          error: "Sealed Court Affidavit PDF URL is required to complete the request."
        }, { status: 400 });
      }

      const updated = await prisma.courtAffidavitRequest.update({
        where: { id: ticketId },
        data: {
          status: "COMPLETED",
          certificateUrl: certificateUrl.trim(),
          courtName: courtName ? courtName.trim() : "High Court Registry",
          commissionerName: commissionerName ? commissionerName.trim() : "Commissioner for Oaths",
          affidavitDate: new Date(),
          completedAt: new Date(),
          adminNotes: adminNotes || undefined,
        }
      });

      // Send completion email with the PDF attached
      try {
        await sendCourtAffidavitCompletedEmail({
          to: affidavit.user.email,
          firstName: affidavit.user.firstName,
          trackingId: affidavit.trackingId,
          categoryLabel,
          deponentName: affidavit.deponentFullName,
          certificateUrl: certificateUrl.trim(),
          courtName: courtName || undefined,
        });
      } catch (err) {
        console.warn("Completion email error:", err);
      }

      await logUserActivity({
        userId: affidavit.userId,
        action: "COURT_AFFIDAVIT_COMPLETED",
        category: "SERVICES",
        description: `Affidavit ${affidavit.trackingId} COMPLETED and sealed by ${admin.email}`,
        status: "SUCCESS",
        referenceId: affidavit.trackingId,
        req,
      });

      return NextResponse.json({
        success: true,
        message: `Affidavit ${affidavit.trackingId} COMPLETED successfully. User notified and PDF delivered.`,
        affidavit: updated,
      });
    }

    // 3. QUERY ACTION
    if (actionType === "QUERY") {
      if (!queryReason || !queryReason.trim()) {
        return NextResponse.json({
          error: "Query reason is required."
        }, { status: 400 });
      }

      const updated = await prisma.courtAffidavitRequest.update({
        where: { id: ticketId },
        data: {
          status: "QUERIED",
          queryReason: queryReason.trim(),
          adminNotes: adminNotes || undefined,
        }
      });

      try {
        await sendCourtAffidavitQueriedEmail({
          to: affidavit.user.email,
          firstName: affidavit.user.firstName,
          trackingId: affidavit.trackingId,
          categoryLabel,
          queryReason: queryReason.trim(),
        });
      } catch (err) {
        console.warn("Queried email error:", err);
      }

      await logUserActivity({
        userId: affidavit.userId,
        action: "COURT_AFFIDAVIT_QUERIED",
        category: "SERVICES",
        description: `Affidavit ${affidavit.trackingId} QUERIED: ${queryReason}`,
        status: "SUCCESS",
        referenceId: affidavit.trackingId,
        req,
      });

      return NextResponse.json({
        success: true,
        message: `Affidavit ${affidavit.trackingId} QUERIED successfully.`,
        affidavit: updated,
      });
    }

    // 4. REJECT ACTION (WITH WALLET REFUND)
    if (actionType === "REJECT") {
      const reason = rejectionReason || "Application did not meet court swearing guidelines.";
      const refundAmount = Number(affidavit.amountCharged);
      const refundRef = `REF_AFF_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const updated = await prisma.$transaction(async (tx) => {
        // 1. Credit wallet
        const userWallet = await tx.wallet.findUnique({ where: { userId: affidavit.userId } });
        if (userWallet) {
          const balanceBefore = Number(userWallet.balance);
          const updatedWallet = await tx.wallet.update({
            where: { id: userWallet.id },
            data: { balance: { increment: refundAmount } }
          });
          const balanceAfter = Number(updatedWallet.balance);

          await tx.transaction.create({
            data: {
              walletId: userWallet.id,
              amount: refundAmount,
              balanceBefore,
              balanceAfter,
              type: "CREDIT",
              status: "SUCCESS",
              reference: refundRef,
              serviceCategory: "SERVICES",
              description: `Refund for Rejected Court Affidavit (${affidavit.trackingId})`,
            }
          });
        }

        // 2. Update record
        const record = await tx.courtAffidavitRequest.update({
          where: { id: ticketId },
          data: {
            status: "REJECTED",
            adminNotes: adminNotes ? `${adminNotes} | Rejection: ${reason}` : `Rejection: ${reason}`,
            isRefunded: true,
            refundAmount: refundAmount,
          }
        });

        return record;
      });

      await logUserActivity({
        userId: affidavit.userId,
        action: "COURT_AFFIDAVIT_REJECTED",
        category: "SERVICES",
        description: `Affidavit ${affidavit.trackingId} REJECTED with refund of ₦${refundAmount.toLocaleString()}`,
        status: "SUCCESS",
        referenceId: affidavit.trackingId,
        req,
      });

      return NextResponse.json({
        success: true,
        message: `Affidavit ${affidavit.trackingId} REJECTED and ₦${refundAmount.toLocaleString()} refunded to user.`,
        affidavit: updated,
      });
    }

    return NextResponse.json({ error: "Invalid actionType provided." }, { status: 400 });

  } catch (error: any) {
    console.error("MDS Court Affidavit Action Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
