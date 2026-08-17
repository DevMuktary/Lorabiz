import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { checkIpeClearanceStatus, parseIpeStatusResponse } from "@/lib/agenthub";
import { sendNinIpeCompletedEmail, sendNinIpeFailedEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { action, id, reference, reason, resolvedNin, fullName } = await req.json();

    if (!id && !reference) {
      return NextResponse.json({ success: false, message: "Missing request ID or reference" }, { status: 400 });
    }

    const ipeItem = await prisma.ninIpeRequest.findFirst({
      where: id ? { id } : { reference },
      include: {
        user: {
          include: { wallet: true },
        },
      },
    });

    if (!ipeItem) {
      return NextResponse.json({ success: false, message: "IPE request record not found" }, { status: 404 });
    }

    // ACTION 1: Live Status Sync with AgentHub
    if (action === "SYNC_STATUS") {
      const statusResult = await checkIpeClearanceStatus(ipeItem.reference);

      if (!statusResult.success || !statusResult.data) {
        return NextResponse.json({
          success: false,
          message: statusResult.error || "Failed to query status from AgentHub",
        });
      }

      const parsed = parseIpeStatusResponse(statusResult.data);

      if (parsed.normalizedStatus === "COMPLETED") {
        const updated = await prisma.ninIpeRequest.update({
          where: { id: ipeItem.id },
          data: {
            status: "COMPLETED",
            resolvedNin: parsed.resolvedNin || ipeItem.resolvedNin,
            fullName: parsed.fullName || ipeItem.fullName,
            dob: parsed.dob || ipeItem.dob,
            gender: parsed.gender || ipeItem.gender,
            photoUrl: parsed.photoUrl || ipeItem.photoUrl,
            apiMessage: parsed.message || "Clearance Successful",
            apiResponse: statusResult.data as any,
            completedAt: new Date(),
          },
        });

        // Email
        try {
          await sendNinIpeCompletedEmail({
            to: ipeItem.user.email,
            name: ipeItem.user.firstName,
            trackingId: ipeItem.trackingId,
            reference: ipeItem.reference,
          });
        } catch (e) {
          console.error("Email dispatch failed:", e);
        }

        // Notification
        try {
          await prisma.inAppNotification.create({
            data: {
              userId: ipeItem.user.id,
              title: "IPE Clearance Completed",
              message: `Your NIMC IPE clearance for Tracking ID ${ipeItem.trackingId} is ready.`,
              type: "success",
              link: "/dashboard/nin/ipe/history",
            },
          });
        } catch (e) {}

        return NextResponse.json({
          success: true,
          message: "IPE Clearance Completed and NIN released!",
          request: updated,
        });
      } else if (parsed.normalizedStatus === "FAILED") {
        const failureReason = parsed.message || "Clearance rejected by identity provider.";
        const refundAmount = Number(ipeItem.amountCharged);

        await prisma.$transaction(async (tx) => {
          if (ipeItem.user.wallet && refundAmount > 0) {
            const currentBal = Number(ipeItem.user.wallet.balance);
            const refundedBal = currentBal + refundAmount;

            await tx.wallet.update({
              where: { id: ipeItem.user.wallet.id },
              data: { balance: refundedBal },
            });

            await tx.transaction.create({
              data: {
                walletId: ipeItem.user.wallet.id,
                amount: refundAmount,
                balanceBefore: currentBal,
                balanceAfter: refundedBal,
                type: "CREDIT",
                status: "SUCCESS",
                reference: `REFUND_${ipeItem.reference}`,
                serviceCategory: "IDENTITY",
                description: `Refund: NIMC IPE Clearance Failed (${ipeItem.trackingId})`,
              },
            });
          }

          await tx.ninIpeRequest.update({
            where: { id: ipeItem.id },
            data: {
              status: "FAILED",
              failureReason: failureReason,
              apiMessage: parsed.message,
              apiResponse: statusResult.data as any,
            },
          });
        });

        // Email
        try {
          await sendNinIpeFailedEmail({
            to: ipeItem.user.email,
            name: ipeItem.user.firstName,
            trackingId: ipeItem.trackingId,
            reference: ipeItem.reference,
            failureReason,
            refundAmount,
          });
        } catch (e) {}

        // Notification
        try {
          await prisma.inAppNotification.create({
            data: {
              userId: ipeItem.user.id,
              title: "IPE Clearance Failed",
              message: `Your IPE clearance request for Tracking ID ${ipeItem.trackingId} has failed. Refund processed.`,
              type: "warning",
              link: "/dashboard/nin/ipe/history",
            },
          });
        } catch (e) {}

        return NextResponse.json({
          success: true,
          message: "Request marked as Failed and refund credited to user wallet.",
        });
      } else {
        return NextResponse.json({
          success: true,
          message: `Request is currently ${parsed.normalizedStatus} on AgentHub: ${parsed.message || "Still in progress"}`,
        });
      }
    }

    // ACTION 2: Manual Admin Refund & Mark Failed
    if (action === "MARK_FAILED_REFUND") {
      const failureReason = reason || "Admin manual rejection: Tracking ID invalid or unresolvable.";
      const refundAmount = Number(ipeItem.amountCharged);

      await prisma.$transaction(async (tx) => {
        if (ipeItem.user.wallet && refundAmount > 0) {
          const currentBal = Number(ipeItem.user.wallet.balance);
          const refundedBal = currentBal + refundAmount;

          await tx.wallet.update({
            where: { id: ipeItem.user.wallet.id },
            data: { balance: refundedBal },
          });

          await tx.transaction.create({
            data: {
              walletId: ipeItem.user.wallet.id,
              amount: refundAmount,
              balanceBefore: currentBal,
              balanceAfter: refundedBal,
              type: "CREDIT",
              status: "SUCCESS",
              reference: `REFUND_MANUAL_${ipeItem.reference}`,
              serviceCategory: "IDENTITY",
              description: `Admin Refund: NIMC IPE Clearance (${ipeItem.trackingId})`,
            },
          });
        }

        await tx.ninIpeRequest.update({
          where: { id: ipeItem.id },
          data: {
            status: "FAILED",
            failureReason: failureReason,
          },
        });
      });

      // Staff Action Audit
      await prisma.staffActionLog.create({
        data: {
          userId: session.user.id,
          action: "REJECTED_IPE_CLEARANCE",
          targetId: ipeItem.reference,
          details: `Admin refunded ₦${refundAmount} for Tracking ID ${ipeItem.trackingId}. Reason: ${failureReason}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Request successfully marked as Failed and ₦" + refundAmount.toLocaleString() + " refunded to client.",
      });
    }

    // ACTION 3: Manual Admin Mark Completed
    if (action === "MARK_COMPLETED") {
      if (!resolvedNin) {
        return NextResponse.json({ success: false, message: "Please provide the 11-digit resolved NIN" }, { status: 400 });
      }

      await prisma.ninIpeRequest.update({
        where: { id: ipeItem.id },
        data: {
          status: "COMPLETED",
          resolvedNin: resolvedNin.trim(),
          fullName: fullName?.trim() || ipeItem.fullName,
          completedAt: new Date(),
        },
      });

      // Staff Action Audit
      await prisma.staffActionLog.create({
        data: {
          userId: session.user.id,
          action: "RESOLVED_IPE_CLEARANCE_MANUAL",
          targetId: ipeItem.reference,
          details: `Admin manually completed IPE clearance for Tracking ID ${ipeItem.trackingId} with NIN ${resolvedNin}.`,
        },
      });

      // Email
      try {
        await sendNinIpeCompletedEmail({
          to: ipeItem.user.email,
          name: ipeItem.user.firstName,
          trackingId: ipeItem.trackingId,
          reference: ipeItem.reference,
        });
      } catch (e) {}

      return NextResponse.json({
        success: true,
        message: "IPE Clearance marked as completed and client notified.",
      });
    }

    return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("MDS IPE Action Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to execute IPE action" },
      { status: 500 }
    );
  }
}
