import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import {
  checkDataVerifyPersonalizationStatus,
  parseDataVerifyPersonalizationResult,
} from "@/lib/dataverify";
import { dispatchNotification } from "@/services/notifications";

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session?.user?.email || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const {
      action,
      id,
      reference,
      reason,
      resolvedNin,
      fullName,
      dob,
      gender,
      phone,
      residenceState,
      pdfUrl,
      adminNotes,
      issueRefund,
    } = await req.json();

    if (!id && !reference) {
      return NextResponse.json({ success: false, message: "Missing request ID or reference" }, { status: 400 });
    }

    const pznItem = await prisma.ninPersonalizationRequest.findFirst({
      where: id ? { id } : { reference },
      include: {
        user: {
          include: { wallet: true },
        },
      },
    });

    if (!pznItem) {
      return NextResponse.json({ success: false, message: "Personalization request record not found" }, { status: 404 });
    }

    // ACTION 1: Status Sync
    if (action === "SYNC_STATUS") {
      // If manual provider or no external transaction ID, do not query external gateway
      if (pznItem.provider === "MANUAL" || !pznItem.externalTxId) {
        return NextResponse.json({
          success: true,
          message: `Record status is ${pznItem.status} (Managed internally by staff).`,
          request: pznItem,
        });
      }

      const statusResult = await checkDataVerifyPersonalizationStatus(
        pznItem.externalTxId,
        pznItem.trackingId
      );

      if (!statusResult.success || !statusResult.data) {
        return NextResponse.json({
          success: false,
          message: statusResult.error || "Failed to query live status from upstream gateway",
        });
      }

      const parsed = parseDataVerifyPersonalizationResult(statusResult.data);

      if (parsed.normalizedStatus === "COMPLETED") {
        const updated = await prisma.ninPersonalizationRequest.update({
          where: { id: pznItem.id },
          data: {
            status: "COMPLETED",
            resolvedNin: parsed.resolvedNin || pznItem.resolvedNin,
            fullName: parsed.fullName || pznItem.fullName,
            dob: parsed.dob || pznItem.dob,
            gender: parsed.gender || pznItem.gender,
            phone: parsed.phone || pznItem.phone,
            residenceState: parsed.residenceState || pznItem.residenceState,
            photoUrl: parsed.photoUrl || pznItem.photoUrl,
            pdfUrl: parsed.pdfBase64 || pznItem.pdfUrl,
            userData: (parsed.userData || pznItem.userData) as any,
            apiMessage: parsed.message || "Personalization Successful",
            apiResponse: statusResult.data as any,
            completedAt: new Date(),
          },
        });

        // Notify client
        try {
          await dispatchNotification({
            type: "NIN_PERSONALIZATION_COMPLETED",
            userId: pznItem.user.id,
            email: pznItem.user.email,
            name: pznItem.user.firstName || "Valued Client",
            trackingId: pznItem.trackingId,
            reference: pznItem.reference,
          });
        } catch (e) {
          console.error("Personalization notification error:", e);
        }

        return NextResponse.json({
          success: true,
          message: "Personalization Completed and slip retrieved successfully!",
          request: updated,
        });
      } else if (parsed.normalizedStatus === "FAILED") {
        const failureReason = parsed.errorDetail || parsed.message || "Personalization rejected by identity gateway.";

        await prisma.ninPersonalizationRequest.update({
          where: { id: pznItem.id },
          data: {
            status: "FAILED",
            failureReason: failureReason,
            apiMessage: parsed.message,
            apiResponse: statusResult.data as any,
          },
        });

        // Notify client (Strictly no auto-refund)
        try {
          await dispatchNotification({
            type: "NIN_PERSONALIZATION_FAILED",
            userId: pznItem.user.id,
            email: pznItem.user.email,
            name: pznItem.user.firstName || "Valued Client",
            trackingId: pznItem.trackingId,
            reference: pznItem.reference,
            failureReason: failureReason,
            refundAmount: 0,
          });
        } catch (e) {}

        return NextResponse.json({
          success: true,
          message: "Request marked as Failed (No refund: non-refundable service).",
        });
      } else {
        return NextResponse.json({
          success: true,
          message: `Request is currently processing: ${parsed.message || "In progress"}`,
        });
      }
    }

    // ACTION 2: Manual Admin Reject / Fail Order (with optional manual refund checkbox)
    if (action === "MARK_FAILED_REFUND" || action === "REJECT" || action === "FAIL") {
      const failureReason = reason || "Tracking ID invalid or unresolvable by identity authority.";
      const shouldRefund = issueRefund === true;
      const refundAmount = shouldRefund ? Number(pznItem.amountCharged) : 0;

      await prisma.$transaction(async (tx) => {
        if (shouldRefund && pznItem.user.wallet && refundAmount > 0) {
          const currentBal = Number(pznItem.user.wallet.balance);
          const refundedBal = currentBal + refundAmount;

          await tx.wallet.update({
            where: { id: pznItem.user.wallet.id },
            data: { balance: refundedBal },
          });

          await tx.transaction.create({
            data: {
              walletId: pznItem.user.wallet.id,
              amount: refundAmount,
              balanceBefore: currentBal,
              balanceAfter: refundedBal,
              type: "CREDIT",
              status: "SUCCESS",
              reference: `REFUND_MANUAL_${pznItem.reference}`,
              serviceCategory: "REFUND",
              description: `Staff Manual Refund: NIN Personalization (${pznItem.trackingId})`,
            },
          });
        }

        await tx.ninPersonalizationRequest.update({
          where: { id: pznItem.id },
          data: {
            status: "FAILED",
            failureReason: failureReason,
            adminNotes: adminNotes || undefined,
          },
        });
      });

      // Staff Action Audit
      await prisma.staffActionLog.create({
        data: {
          userId: session.user.id,
          action: "REJECTED_NIN_PERSONALIZATION",
          targetId: pznItem.reference,
          details: `Staff marked Personalization Tracking ID ${pznItem.trackingId} as FAILED. Refund: ₦${refundAmount}. Reason: ${failureReason}`,
        },
      });

      try {
        await dispatchNotification({
          type: "NIN_PERSONALIZATION_FAILED",
          userId: pznItem.user.id,
          email: pznItem.user.email,
          name: pznItem.user.firstName || "Valued Client",
          trackingId: pznItem.trackingId,
          reference: pznItem.reference,
          failureReason: failureReason,
          refundAmount: refundAmount,
        });
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: shouldRefund
          ? `Request marked as Failed and ₦${refundAmount.toLocaleString()} refunded to client wallet.`
          : "Request marked as Failed (No refund issued).",
      });
    }

    // ACTION 3: Manual Staff Mark Completed
    if (action === "MARK_COMPLETED") {
      if (!resolvedNin || resolvedNin.trim().length !== 11) {
        return NextResponse.json({ success: false, message: "Please provide a valid 11-digit resolved NIN" }, { status: 400 });
      }

      const updated = await prisma.ninPersonalizationRequest.update({
        where: { id: pznItem.id },
        data: {
          status: "COMPLETED",
          resolvedNin: resolvedNin.trim(),
          fullName: fullName?.trim() || pznItem.fullName,
          dob: dob?.trim() || pznItem.dob,
          gender: gender?.trim() || pznItem.gender,
          phone: phone?.trim() || pznItem.phone,
          residenceState: residenceState?.trim() || pznItem.residenceState,
          pdfUrl: pdfUrl?.trim() || pznItem.pdfUrl,
          adminNotes: adminNotes || pznItem.adminNotes,
          completedAt: new Date(),
        },
      });

      // Staff Action Audit
      await prisma.staffActionLog.create({
        data: {
          userId: session.user.id,
          action: "RESOLVED_NIN_PERSONALIZATION_MANUAL",
          targetId: pznItem.reference,
          details: `Staff manually completed Personalization for Tracking ID ${pznItem.trackingId} with NIN ${resolvedNin}.`,
        },
      });

      // Notify client
      try {
        await dispatchNotification({
          type: "NIN_PERSONALIZATION_COMPLETED",
          userId: pznItem.user.id,
          email: pznItem.user.email,
          name: pznItem.user.firstName || "Valued Client",
          trackingId: pznItem.trackingId,
          reference: pznItem.reference,
        });
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: "Personalization marked as completed and client notified.",
        request: updated,
      });
    }

    return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("MDS Personalization Action Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to execute personalization action" },
      { status: 500 }
    );
  }
}
