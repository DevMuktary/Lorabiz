import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkDataVerifyPersonalizationStatus,
  parseDataVerifyPersonalizationResult,
} from "@/lib/dataverify";
import { dispatchNotification } from "@/services/notifications";

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

    // Find up to 30 processing Personalization requests assigned to DATAVERIFY
    const processingRequests = await prisma.ninPersonalizationRequest.findMany({
      where: {
        status: "PROCESSING",
        provider: "DATAVERIFY",
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
        message: "No processing DataVerify Personalization requests found.",
        processedCount: 0,
      });
    }

    let completedCount = 0;
    let failedCount = 0;
    let stillProcessingCount = 0;

    for (const item of processingRequests) {
      try {
        const statusResult = await checkDataVerifyPersonalizationStatus(
          item.externalTxId || undefined,
          item.trackingId
        );

        if (!statusResult.success || !statusResult.data) {
          stillProcessingCount++;
          continue;
        }

        const parsed = parseDataVerifyPersonalizationResult(statusResult.data);

        if (parsed.normalizedStatus === "COMPLETED") {
          await prisma.ninPersonalizationRequest.update({
            where: { id: item.id },
            data: {
              status: "COMPLETED",
              resolvedNin: parsed.resolvedNin || item.resolvedNin,
              fullName: parsed.fullName || item.fullName,
              dob: parsed.dob || item.dob,
              gender: parsed.gender || item.gender,
              phone: parsed.phone || item.phone,
              residenceState: parsed.residenceState || item.residenceState,
              photoUrl: parsed.photoUrl || item.photoUrl,
              pdfUrl: parsed.pdfBase64 || item.pdfUrl,
              userData: (parsed.userData || item.userData) as any,
              apiMessage: parsed.message || "Personalization Successful",
              apiResponse: statusResult.data as any,
              completedAt: new Date(),
            },
          });

          // Dispatch notification
          try {
            await dispatchNotification({
              type: "NIN_PERSONALIZATION_COMPLETED",
              userId: item.user.id,
              email: item.user.email,
              name: item.user.firstName || "Valued Client",
              trackingId: item.trackingId,
              reference: item.reference,
            });
          } catch (notifErr) {
            console.error(`❌ [Cron Personalization] Notification error for ${item.reference}:`, notifErr);
          }

          completedCount++;
        } else if (parsed.normalizedStatus === "FAILED") {
          const refundAmount = Number(item.amountCharged);
          const failureReason =
            parsed.errorDetail ||
            parsed.message ||
            "Personalization request was rejected by identity gateway.";

          const refundRef = `REF_PZN_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

          await prisma.$transaction(async (tx) => {
            // Refund user wallet
            const updatedWallet = await tx.wallet.update({
              where: { userId: item.user.id },
              data: { balance: { increment: refundAmount } },
            });

            // Record refund ledger entry
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
                description: `Refund: NIN Personalization Failed (${item.trackingId})`,
              },
            });

            // Update request
            await tx.ninPersonalizationRequest.update({
              where: { id: item.id },
              data: {
                status: "FAILED",
                failureReason: failureReason,
                apiMessage: parsed.message || "Personalization Failed",
                apiResponse: statusResult.data as any,
              },
            });
          });

          // Dispatch failed notification
          try {
            await dispatchNotification({
              type: "NIN_PERSONALIZATION_FAILED",
              userId: item.user.id,
              email: item.user.email,
              name: item.user.firstName || "Valued Client",
              trackingId: item.trackingId,
              reference: item.reference,
              failureReason: failureReason,
              refundAmount: refundAmount,
            });
          } catch (notifErr) {
            console.error(`❌ [Cron Personalization] Notification error for ${item.reference}:`, notifErr);
          }

          failedCount++;
        } else {
          stillProcessingCount++;
        }
      } catch (itemErr) {
        console.error(`❌ [Cron Personalization] Error processing ${item.reference}:`, itemErr);
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
    console.error("❌ [Cron Personalization] Sync Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error during personalization sync." },
      { status: 500 }
    );
  }
}
