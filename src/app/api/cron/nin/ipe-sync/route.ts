import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkIpeClearanceStatus, parseIpeStatusResponse } from "@/lib/agenthub";
import { checkDataVerifyIpeStatus, parseDataVerifyIpeResult } from "@/lib/dataverify";
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

    // Find up to 30 processing IPE requests from automated providers (DATAVERIFY & AGENTHUB)
    const processingRequests = await prisma.ninIpeRequest.findMany({
      where: {
        status: "PROCESSING",
        provider: { in: ["DATAVERIFY", "AGENTHUB"] },
      },
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
        message: "No processing automated IPE requests found.",
        processedCount: 0,
      });
    }

    let completedCount = 0;
    let failedCount = 0;
    let stillProcessingCount = 0;

    for (const item of processingRequests) {
      try {
        let isCompleted = false;
        let isFailed = false;
        let resolvedNin: string | undefined;
        let newTrackingId: string | undefined;
        let fullName: string | undefined;
        let dob: string | undefined;
        let gender: string | undefined;
        let photoUrl: string | undefined;
        let failureReason: string | undefined;
        let apiMsg: string | undefined;
        let rawResponse: unknown;

        if (item.provider === "DATAVERIFY") {
          const dvRes = await checkDataVerifyIpeStatus(item.trackingId);
          if (!dvRes.success || !dvRes.data) {
            stillProcessingCount++;
            continue;
          }
          rawResponse = dvRes.data;
          const parsed = parseDataVerifyIpeResult(dvRes.data);
          apiMsg = parsed.message;
          if (parsed.normalizedStatus === "COMPLETED") {
            isCompleted = true;
            resolvedNin = parsed.resolvedNin;
            newTrackingId = parsed.newTrackingId;
          } else if (parsed.normalizedStatus === "FAILED") {
            isFailed = true;
            failureReason = parsed.errorDetail || parsed.message || "Clearance failed.";
          } else {
            stillProcessingCount++;
            continue;
          }
        } else {
          // AGENTHUB
          const agentHubRes = await checkIpeClearanceStatus(item.reference);
          if (!agentHubRes.success || !agentHubRes.data) {
            stillProcessingCount++;
            continue;
          }
          rawResponse = agentHubRes.data;
          const parsed = parseIpeStatusResponse(agentHubRes.data);
          apiMsg = parsed.message;
          if (parsed.normalizedStatus === "COMPLETED") {
            isCompleted = true;
            resolvedNin = parsed.resolvedNin;
            fullName = parsed.fullName;
            dob = parsed.dob;
            gender = parsed.gender;
            photoUrl = parsed.photoUrl;
          } else if (parsed.normalizedStatus === "FAILED") {
            isFailed = true;
            failureReason = parsed.message || "Clearance failed.";
          } else {
            stillProcessingCount++;
            continue;
          }
        }

        if (isCompleted) {
          await prisma.ninIpeRequest.update({
            where: { id: item.id },
            data: {
              status: "COMPLETED",
              resolvedNin: resolvedNin || item.resolvedNin,
              newTrackingId: newTrackingId || item.newTrackingId,
              fullName: fullName || item.fullName,
              dob: dob || item.dob,
              gender: gender || item.gender,
              photoUrl: photoUrl || item.photoUrl,
              apiMessage: apiMsg || "Clearance Successful",
              apiResponse: rawResponse as any,
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
            console.error(`❌ [Cron IPE] Email error for ${item.reference}:`, emailErr);
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
            console.error(`❌ [Cron IPE] Notif error for ${item.reference}:`, notifErr);
          }

          completedCount++;
        } else if (isFailed) {
          const refundAmount = Number(item.amountCharged);
          const finalReason = failureReason || "IPE clearance was rejected by the identity gateway.";
          const refundRef = `REF_IPE_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

          await prisma.$transaction(async (tx) => {
            const updatedWallet = await tx.wallet.update({
              where: { userId: item.user.id },
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
                description: `Refund: NIMC IPE Clearance Failed (${item.trackingId})`,
              },
            });

            await tx.ninIpeRequest.update({
              where: { id: item.id },
              data: {
                status: "FAILED",
                failureReason: finalReason,
                apiMessage: apiMsg || "Clearance Failed",
                apiResponse: rawResponse as any,
              },
            });
          });

          try {
            await sendNinIpeFailedEmail({
              to: item.user.email,
              name: item.user.firstName,
              trackingId: item.trackingId,
              reference: item.reference,
              failureReason: finalReason,
              refundAmount: refundAmount,
            });
          } catch (emailErr) {
            console.error(`❌ [Cron IPE] Email error for ${item.reference}:`, emailErr);
          }

          try {
            await prisma.inAppNotification.create({
              data: {
                userId: item.user.id,
                title: "IPE Clearance Failed",
                message: `Your IPE clearance for Tracking ID ${item.trackingId} failed. Reason: ${finalReason}`,
                type: "warning",
                link: "/dashboard/nin/ipe/history",
              },
            });
          } catch (notifErr) {
            console.error(`❌ [Cron IPE] Notif error for ${item.reference}:`, notifErr);
          }

          failedCount++;
        }
      } catch (itemErr) {
        console.error(`❌ [Cron IPE] Error processing ${item.reference}:`, itemErr);
        stillProcessingCount++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalFound: processingRequests.length,
        completed: completedCount,
        failed: failedCount,
        stillProcessing: stillProcessingCount,
      },
    });
  } catch (error: any) {
    console.error("❌ [Cron IPE] Sync Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error during IPE sync." },
      { status: 500 }
    );
  }
}
