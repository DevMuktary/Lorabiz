import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { checkIpeClearanceStatus, parseIpeStatusResponse } from "@/lib/agenthub";
import { checkDataVerifyIpeStatus, parseDataVerifyIpeResult } from "@/lib/dataverify";
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

    // If Manual operator routing
    if (ipeRequest.provider === "MANUAL") {
      return NextResponse.json({
        success: true,
        request: ipeRequest,
        message: "Your IPE clearance application is currently queued with our operations team for manual processing.",
      });
    }

    // Route based on provider
    if (ipeRequest.provider === "DATAVERIFY") {
      const dvResult = await checkDataVerifyIpeStatus(ipeRequest.trackingId);

      if (!dvResult.success || !dvResult.data) {
        return NextResponse.json({
          success: true,
          request: ipeRequest,
          message: "Status check pending upstream response. Still processing.",
        });
      }

      const parsed = parseDataVerifyIpeResult(dvResult.data);

      if (parsed.normalizedStatus === "COMPLETED") {
        const updated = await prisma.ninIpeRequest.update({
          where: { id: ipeRequest.id },
          data: {
            status: "COMPLETED",
            resolvedNin: parsed.resolvedNin || ipeRequest.resolvedNin,
            newTrackingId: parsed.newTrackingId || ipeRequest.newTrackingId,
            apiMessage: parsed.message || "Clearance Successful",
            apiResponse: dvResult.data as any,
            completedAt: new Date(),
          },
        });

        // Dispatch Completion Email
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

        // In-App Notification
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

        // Referral commission check
        const activeReferral = await prisma.referral.findUnique({
          where: { referredUserId: ipeRequest.userId },
        });

        if (activeReferral) {
          const isNotExpired = !activeReferral.expiresAt || new Date() < activeReferral.expiresAt;
          if (isNotExpired) {
            const existingCommission = await prisma.referralCommission.findUnique({
              where: { serviceId: ipeRequest.id },
            });

            if (!existingCommission) {
              const commissionAmount = 250.00;
              await prisma.referralCommission.create({
                data: {
                  referralId: activeReferral.id,
                  serviceType: "NIN_IPE_CLEARANCE",
                  serviceId: ipeRequest.id,
                  amount: commissionAmount,
                },
              });

              await prisma.user.update({
                where: { id: activeReferral.referrerId },
                data: { referralBalance: { increment: commissionAmount } },
              });
            }
          }
        }

        await logUserActivity({
          userId: user.id,
          action: "NIN_IPE_CLEARANCE_COMPLETED",
          category: "SERVICES",
          description: `NIMC IPE clearance completed for Tracking ID: ${ipeRequest.trackingId}`,
          status: "SUCCESS",
          referenceId: ipeRequest.reference,
          req,
        });

        return NextResponse.json({
          success: true,
          request: updated,
          message: "IPE Clearance has been completed successfully! Your NIN has been resolved.",
        });
      }

      if (parsed.normalizedStatus === "FAILED") {
        const refundAmount = Number(ipeRequest.amountCharged);
        const failureReason = parsed.errorDetail || parsed.message || "IPE clearance was rejected by identity authority.";
        const refundRef = `REF_IPE_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const updated = await prisma.$transaction(async (tx) => {
          const updatedWallet = await tx.wallet.update({
            where: { userId: user.id },
            data: { balance: { increment: refundAmount } },
          });

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
              description: `Refund: NIMC IPE Clearance Request Failed (${ipeRequest.trackingId})`,
            },
          });

          return await tx.ninIpeRequest.update({
            where: { id: ipeRequest.id },
            data: {
              status: "FAILED",
              failureReason: failureReason,
              apiMessage: parsed.message || "Clearance Failed",
              apiResponse: dvResult.data as any,
            },
          });
        });

        try {
          await sendNinIpeFailedEmail({
            to: user.email,
            name: user.firstName,
            trackingId: ipeRequest.trackingId,
            reference: ipeRequest.reference,
            failureReason: failureReason,
            refundAmount: refundAmount,
          });
        } catch (emailErr) {
          console.error("❌ Failed to send IPE failed email:", emailErr);
        }

        try {
          await prisma.inAppNotification.create({
            data: {
              userId: user.id,
              title: "IPE Clearance Failed",
              message: `Your IPE clearance for Tracking ID ${ipeRequest.trackingId} could not be resolved. Reason: ${failureReason}`,
              type: "warning",
              link: "/dashboard/nin/ipe/history",
            },
          });
        } catch (notifErr) {
          console.error("❌ Failed to create in-app notification:", notifErr);
        }

        return NextResponse.json({
          success: false,
          request: updated,
          message: `IPE Clearance failed: ${failureReason}. ₦${refundAmount.toLocaleString()} has been refunded to your wallet.`,
        });
      }

      return NextResponse.json({
        success: true,
        request: ipeRequest,
        message: parsed.message || "IPE Clearance is currently processing with the identity gateway.",
      });
    }

    // Default: AGENTHUB Provider
    const statusResult = await checkIpeClearanceStatus(reference);

    if (!statusResult.success || !statusResult.data) {
      return NextResponse.json({
        success: true,
        request: ipeRequest,
        message: "Status check pending upstream response. Still processing.",
      });
    }

    const parsed = parseIpeStatusResponse(statusResult.data);

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

      await logUserActivity({
        userId: user.id,
        action: "NIN_IPE_CLEARANCE_COMPLETED",
        category: "SERVICES",
        description: `NIMC IPE clearance completed for Tracking ID: ${ipeRequest.trackingId}`,
        status: "SUCCESS",
        referenceId: ipeRequest.reference,
        req,
      });

      return NextResponse.json({
        success: true,
        request: updated,
        message: "IPE Clearance has been completed successfully! Your NIN has been resolved.",
      });
    }

    if (parsed.normalizedStatus === "FAILED") {
      const refundAmount = Number(ipeRequest.amountCharged);
      const failureReason = parsed.message || "IPE clearance was rejected by NIMC/AgentHub.";
      const refundRef = `REF_IPE_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const updated = await prisma.$transaction(async (tx) => {
        const updatedWallet = await tx.wallet.update({
          where: { userId: user.id },
          data: { balance: { increment: refundAmount } },
        });

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
            description: `Refund: NIMC IPE Clearance Request Failed (${ipeRequest.trackingId})`,
          },
        });

        return await tx.ninIpeRequest.update({
          where: { id: ipeRequest.id },
          data: {
            status: "FAILED",
            failureReason: failureReason,
            apiMessage: parsed.message || "Clearance Failed",
            apiResponse: statusResult.data as any,
          },
        });
      });

      try {
        await sendNinIpeFailedEmail({
          to: user.email,
          name: user.firstName,
          trackingId: ipeRequest.trackingId,
          reference: ipeRequest.reference,
          failureReason: failureReason,
          refundAmount: refundAmount,
        });
      } catch (emailErr) {
        console.error("❌ Failed to send IPE failed email:", emailErr);
      }

      try {
        await prisma.inAppNotification.create({
          data: {
            userId: user.id,
            title: "IPE Clearance Failed",
            message: `Your IPE clearance for Tracking ID ${ipeRequest.trackingId} could not be resolved. Reason: ${failureReason}`,
            type: "warning",
            link: "/dashboard/nin/ipe/history",
          },
        });
      } catch (notifErr) {
        console.error("❌ Failed to create in-app notification:", notifErr);
      }

      return NextResponse.json({
        success: false,
        request: updated,
        message: `IPE Clearance failed: ${failureReason}. ₦${refundAmount.toLocaleString()} has been refunded to your wallet.`,
      });
    }

    return NextResponse.json({
      success: true,
      request: ipeRequest,
      message: parsed.message || "IPE Clearance is currently processing with the identity gateway.",
    });
  } catch (error: any) {
    console.error("❌ NIN IPE Status Check Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An unexpected error occurred while checking status." },
      { status: 500 }
    );
  }
}
