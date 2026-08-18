import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import {
  checkDataVerifyPersonalizationStatus,
  parseDataVerifyPersonalizationResult,
} from "@/lib/dataverify";
import { dispatchNotification } from "@/services/notifications";
import { logUserActivity } from "@/lib/activity-logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { success: false, message: "Reference is required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User account not found." },
        { status: 404 }
      );
    }

    const personalizationRequest = await prisma.ninPersonalizationRequest.findFirst({
      where: {
        reference: reference.trim(),
        userId: user.id,
      },
    });

    if (!personalizationRequest) {
      return NextResponse.json(
        { success: false, message: "Personalization record not found." },
        { status: 404 }
      );
    }

    // If already finalized, return the saved record directly
    if (
      personalizationRequest.status === "COMPLETED" ||
      personalizationRequest.status === "FAILED"
    ) {
      return NextResponse.json({
        success: true,
        request: personalizationRequest,
        message: `Request is already ${personalizationRequest.status.toLowerCase()}.`,
        alreadyFinalized: true,
      });
    }

    // If manual operator routing, status updates are performed by staff
    if (personalizationRequest.provider === "MANUAL") {
      return NextResponse.json({
        success: true,
        request: personalizationRequest,
        message: "Your application is currently queued with our verification team for manual processing.",
      });
    }

    // Query DataVerify for live status
    const statusResult = await checkDataVerifyPersonalizationStatus(
      personalizationRequest.externalTxId || undefined,
      personalizationRequest.trackingId
    );

    if (!statusResult.success || !statusResult.data) {
      return NextResponse.json({
        success: true,
        request: personalizationRequest,
        message: "Status check pending upstream response. Still processing.",
      });
    }

    const parsed = parseDataVerifyPersonalizationResult(statusResult.data);

    // If status has transitioned to COMPLETED
    if (parsed.normalizedStatus === "COMPLETED") {
      const updated = await prisma.ninPersonalizationRequest.update({
        where: { id: personalizationRequest.id },
        data: {
          status: "COMPLETED",
          resolvedNin: parsed.resolvedNin || personalizationRequest.resolvedNin,
          fullName: parsed.fullName || personalizationRequest.fullName,
          dob: parsed.dob || personalizationRequest.dob,
          gender: parsed.gender || personalizationRequest.gender,
          phone: parsed.phone || personalizationRequest.phone,
          residenceState: parsed.residenceState || personalizationRequest.residenceState,
          photoUrl: parsed.photoUrl || personalizationRequest.photoUrl,
          pdfUrl: parsed.pdfBase64 || personalizationRequest.pdfUrl,
          userData: (parsed.userData || personalizationRequest.userData) as any,
          apiMessage: parsed.message || "Personalization Successful",
          apiResponse: statusResult.data as any,
          completedAt: new Date(),
        },
      });

      // Dispatch Completion Notification & Email
      try {
        await dispatchNotification({
          type: "NIN_PERSONALIZATION_COMPLETED",
          userId: user.id,
          email: user.email,
          name: user.firstName || "Valued Client",
          trackingId: personalizationRequest.trackingId,
          reference: personalizationRequest.reference,
        });
      } catch (notifErr) {
        console.error("❌ Failed to send personalization completion notification:", notifErr);
      }

      await logUserActivity({
        userId: user.id,
        action: "NIN_PERSONALIZATION_COMPLETED",
        category: "SERVICES",
        description: `NIN Personalization completed for Tracking ID: ${personalizationRequest.trackingId}`,
        status: "SUCCESS",
        referenceId: personalizationRequest.reference,
        req,
      });

      return NextResponse.json({
        success: true,
        request: updated,
        message: "Personalization has been completed successfully! Your NIN and record are ready.",
      });
    }

    // If status has transitioned to FAILED -> Auto-Refund and forward exact reason
    if (parsed.normalizedStatus === "FAILED") {
      const refundAmount = Number(personalizationRequest.amountCharged);
      const failureReason =
        parsed.errorDetail ||
        parsed.message ||
        "Personalization request was rejected by identity authority.";

      const refundRef = `REF_PZN_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const updated = await prisma.$transaction(async (tx) => {
        // Refund Wallet
        const updatedWallet = await tx.wallet.update({
          where: { userId: user.id },
          data: { balance: { increment: refundAmount } },
        });

        // Create Refund Ledger Transaction
        await tx.transaction.create({
          data: {
            walletId: updatedWallet.id,
            amount: refundAmount,
            balanceBefore: Number(updatedWallet.balance) - refundAmount,
            balanceAfter: Number(updatedWallet.balance),
            type: "CREDIT",
            status: "SUCCESS",
            reference: refundRef,
            serviceCategory: "REFUND",
            description: `Refund: NIN Personalization Request Failed (${personalizationRequest.trackingId})`,
          },
        });

        // Update Personalization Request
        return await tx.ninPersonalizationRequest.update({
          where: { id: personalizationRequest.id },
          data: {
            status: "FAILED",
            failureReason: failureReason,
            apiMessage: parsed.message || "Personalization Failed",
            apiResponse: statusResult.data as any,
          },
        });
      });

      // Dispatch Failed Notification & Email
      try {
        await dispatchNotification({
          type: "NIN_PERSONALIZATION_FAILED",
          userId: user.id,
          email: user.email,
          name: user.firstName || "Valued Client",
          trackingId: personalizationRequest.trackingId,
          reference: personalizationRequest.reference,
          failureReason: failureReason,
          refundAmount: refundAmount,
        });
      } catch (notifErr) {
        console.error("❌ Failed to send personalization failed notification:", notifErr);
      }

      await logUserActivity({
        userId: user.id,
        action: "NIN_PERSONALIZATION_FAILED",
        category: "SERVICES",
        description: `NIN Personalization failed for Tracking ID: ${personalizationRequest.trackingId}. Reason: ${failureReason}`,
        status: "FAILED",
        referenceId: personalizationRequest.reference,
        req,
      });

      return NextResponse.json({
        success: false,
        request: updated,
        message: `Personalization failed: ${failureReason}. ₦${refundAmount.toLocaleString()} has been refunded to your wallet.`,
      });
    }

    // Still processing
    return NextResponse.json({
      success: true,
      request: personalizationRequest,
      message: parsed.message || "Personalization is currently processing with the identity gateway.",
    });
  } catch (error: any) {
    console.error("❌ NIN Personalization Status Check Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An unexpected error occurred while checking status." },
      { status: 500 }
    );
  }
}
