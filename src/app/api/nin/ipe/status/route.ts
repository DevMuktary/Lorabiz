import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { checkIpeClearanceStatus, parseIpeStatusResponse } from "@/lib/agenthub";
import { sendNinIpeCompletedEmail, sendNinIpeFailedEmail } from "@/lib/email";
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

    const ipeRequest = await prisma.ninIpeRequest.findFirst({
      where: {
        reference: reference.trim(),
        userId: user.id,
      },
    });

    if (!ipeRequest) {
      return NextResponse.json(
        { success: false, message: "IPE Clearance record not found." },
        { status: 404 }
      );
    }

    // If already finalized, return the saved record directly
    if (ipeRequest.status === "COMPLETED" || ipeRequest.status === "FAILED") {
      return NextResponse.json({
        success: true,
        request: ipeRequest,
        message: `Request is already ${ipeRequest.status.toLowerCase()}.`,
        alreadyFinalized: true,
      });
    }

    // Query AgentHub for live status
    const statusResult = await checkIpeClearanceStatus(reference);

    if (!statusResult.success || !statusResult.data) {
      return NextResponse.json({
        success: true,
        request: ipeRequest,
        message: "Status check pending upstream response. Still processing.",
      });
    }

    const parsed = parseIpeStatusResponse(statusResult.data);

    // If status has transitioned to COMPLETED
    if (parsed.normalizedStatus === "COMPLETED") {
      const updated = await prisma.ninIpeRequest.update({
        where: { id: ipeRequest.id },
        data: {
          status: "COMPLETED",
          resolvedNin: parsed.resolvedNin || ipeRequest.resolvedNin,
          fullName: parsed.fullName || ipeRequest.fullName,
          dob: parsed.dob || ipeRequest.dob,
          gender: parsed.gender || ipeRequest.gender,
          photoUrl: parsed.photoUrl || ipeRequest.photoUrl,
          apiMessage: parsed.message || "Clearance Successful",
          apiResponse: statusResult.data as any,
          completedAt: new Date(),
        },
      });

      // Dispatch Completion Email (omitting raw NIN for privacy)
      try {
        await sendNinIpeCompletedEmail({
          to: user.email,
          name: user.firstName,
          trackingId: ipeRequest.trackingId,
          reference: ipeRequest.reference,
        });
      } catch (emailErr) {
        console.error("❌ Failed to send IPE completion email:", emailErr);
      }

      // Create In-App Notification
      try {
        await prisma.inAppNotification.create({
          data: {
            userId: user.id,
            title: "IPE Clearance Completed",
            message: `Your NIMC IPE clearance for Tracking ID ${ipeRequest.trackingId} is ready.`,
            type: "success",
            link: "/dashboard/nin/ipe/history",
          },
        });
      } catch (notifErr) {
        console.error("❌ Failed to create in-app notification:", notifErr);
      }

      // Log User Activity
      await logUserActivity({
        userId: user.id,
        action: "NIN_IPE_CLEARANCE_COMPLETED",
        category: "SERVICES",
        description: `NIMC IPE Clearance completed for ${ipeRequest.trackingId}`,
        status: "SUCCESS",
        referenceId: ipeRequest.reference,
        req,
      });

      return NextResponse.json({
        success: true,
        request: updated,
        message: "IPE Clearance completed successfully!",
      });
    }

    // If status has transitioned to FAILED
    if (parsed.normalizedStatus === "FAILED") {
      const failureReason = parsed.message || "Exception resolution rejected or failed at provider.";
      const refundAmount = Number(ipeRequest.amountCharged);

      const updated = await prisma.$transaction(async (tx) => {
        // Refund wallet
        const currentBal = Number(user.wallet?.balance || 0);
        const refundedBal = currentBal + refundAmount;

        if (user.wallet && refundAmount > 0) {
          await tx.wallet.update({
            where: { id: user.wallet.id },
            data: { balance: refundedBal },
          });

          await tx.transaction.create({
            data: {
              walletId: user.wallet.id,
              amount: refundAmount,
              balanceBefore: currentBal,
              balanceAfter: refundedBal,
              type: "CREDIT",
              status: "SUCCESS",
              reference: `REFUND_${ipeRequest.reference}`,
              serviceCategory: "IDENTITY",
              description: `Refund: NIMC IPE Clearance Failed (${ipeRequest.trackingId})`,
            },
          });
        }

        return tx.ninIpeRequest.update({
          where: { id: ipeRequest.id },
          data: {
            status: "FAILED",
            failureReason: failureReason,
            apiMessage: parsed.message,
            apiResponse: statusResult.data as any,
          },
        });
      });

      // Dispatch Failure Email
      try {
        await sendNinIpeFailedEmail({
          to: user.email,
          name: user.firstName,
          trackingId: ipeRequest.trackingId,
          reference: ipeRequest.reference,
          failureReason,
          refundAmount,
        });
      } catch (emailErr) {
        console.error("❌ Failed to send IPE failure email:", emailErr);
      }

      // Create In-App Notification
      try {
        await prisma.inAppNotification.create({
          data: {
            userId: user.id,
            title: "IPE Clearance Unsuccessful",
            message: `Your IPE clearance request for Tracking ID ${ipeRequest.trackingId} was not successful. Refund processed.`,
            type: "warning",
            link: "/dashboard/nin/ipe/history",
          },
        });
      } catch (notifErr) {
        console.error("❌ Failed to create in-app notification:", notifErr);
      }

      return NextResponse.json({
        success: true,
        request: updated,
        message: "Request marked as failed and refund processed.",
      });
    }

    // Still processing
    return NextResponse.json({
      success: true,
      request: ipeRequest,
      message: "Request is currently being processed by NIMC.",
    });
  } catch (error: any) {
    console.error("❌ Live IPE Status Check Error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while checking status." },
      { status: 500 }
    );
  }
}
