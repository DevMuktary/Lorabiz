import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkIpeClearanceStatus, parseIpeStatusResponse } from "@/lib/agenthub";
import { sendNinIpeCompletedEmail, sendNinIpeFailedEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

async function handleSync(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const { searchParams } = new URL(req.url);
    const queryKey = searchParams.get("key");
    const cronSecret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;

    // Validate Cron Authorization
    const isAuthorized =
      (authHeader && authHeader === `Bearer ${cronSecret}`) ||
      (queryKey && queryKey === cronSecret);

    if (process.env.NODE_ENV === "production" && !isAuthorized) {
      return NextResponse.json({ success: false, message: "Unauthorized cron request." }, { status: 401 });
    }

    // Find up to 30 processing IPE requests
    const processingRequests = await prisma.ninIpeRequest.findMany({
      where: { status: "PROCESSING" },
      include: {
        user: {
          include: { wallet: true },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 30,
    });

    if (processingRequests.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No processing IPE requests found.",
        processedCount: 0,
      });
    }

    let completedCount = 0;
    let failedCount = 0;
    let stillProcessingCount = 0;

    for (const item of processingRequests) {
      try {
        const statusResult = await checkIpeClearanceStatus(item.reference);

        if (!statusResult.success || !statusResult.data) {
          stillProcessingCount++;
          continue;
        }

        const parsed = parseIpeStatusResponse(statusResult.data);

        if (parsed.normalizedStatus === "COMPLETED") {
          await prisma.ninIpeRequest.update({
            where: { id: item.id },
            data: {
              status: "COMPLETED",
              resolvedNin: parsed.resolvedNin || item.resolvedNin,
              fullName: parsed.fullName || item.fullName,
              dob: parsed.dob || item.dob,
              gender: parsed.gender || item.gender,
              photoUrl: parsed.photoUrl || item.photoUrl,
              apiMessage: parsed.message || "Clearance Successful",
              apiResponse: statusResult.data as any,
              completedAt: new Date(),
            },
          });

          // Dispatch Completion Email
          try {
            await sendNinIpeCompletedEmail({
              to: item.user.email,
              name: item.user.firstName,
              trackingId: item.trackingId,
              reference: item.reference,
            });
          } catch (emailErr) {
            console.error(`❌ [Cron] Email error for ${item.reference}:`, emailErr);
          }

          // Create In-App Notification
          try {
            await prisma.inAppNotification.create({
              data: {
                userId: item.user.id,
                title: "IPE Clearance Completed",
                message: `Your NIMC IPE clearance for Tracking ID ${item.trackingId} is ready.`,
                type: "success",
                link: "/dashboard/nin/ipe/history",
              },
            });
          } catch (notifErr) {
            console.error(`❌ [Cron] Notification error for ${item.reference}:`, notifErr);
          }

          completedCount++;
        } else if (parsed.normalizedStatus === "FAILED") {
          const failureReason = parsed.message || "Clearance rejected by provider.";
          const refundAmount = Number(item.amountCharged);

          await prisma.$transaction(async (tx) => {
            if (item.user.wallet && refundAmount > 0) {
              const currentBal = Number(item.user.wallet.balance);
              const refundedBal = currentBal + refundAmount;

              await tx.wallet.update({
                where: { id: item.user.wallet.id },
                data: { balance: refundedBal },
              });

              await tx.transaction.create({
                data: {
                  walletId: item.user.wallet.id,
                  amount: refundAmount,
                  balanceBefore: currentBal,
                  balanceAfter: refundedBal,
                  type: "CREDIT",
                  status: "SUCCESS",
                  reference: `REFUND_${item.reference}`,
                  serviceCategory: "IDENTITY",
                  description: `Refund: NIMC IPE Clearance Failed (${item.trackingId})`,
                },
              });
            }

            await tx.ninIpeRequest.update({
              where: { id: item.id },
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
              to: item.user.email,
              name: item.user.firstName,
              trackingId: item.trackingId,
              reference: item.reference,
              failureReason,
              refundAmount,
            });
          } catch (emailErr) {
            console.error(`❌ [Cron] Email error for ${item.reference}:`, emailErr);
          }

          // Create In-App Notification
          try {
            await prisma.inAppNotification.create({
              data: {
                userId: item.user.id,
                title: "IPE Clearance Failed",
                message: `Your IPE clearance request for Tracking ID ${item.trackingId} has failed. Refund processed.`,
                type: "warning",
                link: "/dashboard/nin/ipe/history",
              },
            });
          } catch (notifErr) {
            console.error(`❌ [Cron] Notification error for ${item.reference}:`, notifErr);
          }

          failedCount++;
        } else {
          stillProcessingCount++;
        }
      } catch (itemErr) {
        console.error(`❌ [Cron] Error syncing item ${item.reference}:`, itemErr);
      }
    }

    return NextResponse.json({
      success: true,
      totalChecked: processingRequests.length,
      completed: completedCount,
      failed: failedCount,
      stillProcessing: stillProcessingCount,
    });
  } catch (error: any) {
    console.error("❌ NIN IPE Cron Sync Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to execute cron sync." },
      { status: 500 }
    );
  }
}
