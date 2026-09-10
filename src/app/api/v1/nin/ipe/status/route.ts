import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/developer/api-auth";
import { checkDataVerifyIpeStatus, parseDataVerifyIpeResult } from "@/lib/dataverify";
import { dispatchDeveloperWebhook } from "@/lib/developer/webhook-dispatcher";
import { ApiKeyType } from "@prisma/client";

/**
 * Sanitizes any internal or upstream provider branding from public messages.
 * Strips phrases like "AmbVerify", "DataVerify", "Abjiktech", etc.
 */
function sanitizePublicMessage(msg: string | null | undefined): string {
  if (!msg) return "";
  let clean = msg
    .replace(/ambverify/gi, "National Identity Database")
    .replace(/dataverify/gi, "Verification Gateway")
    .replace(/abjiktech/gi, "Processing Gateway");
  return clean.trim();
}

/**
 * GET /api/v1/nin/ipe/status
 * Queries real-time IPE Clearance status via ?reference=... or ?client_reference=...
 */
export async function GET(req: NextRequest) {
  // 1. Authenticate Developer API Key & Enforce Rate Limiting
  const authResult = await authenticateApiKey(req);
  if (!authResult.authenticated || !authResult.keyPayload) {
    return authResult.errorResponse!;
  }

  const { keyPayload } = authResult;

  // 2. Parse Query Parameters (reference OR client_reference)
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference")?.trim() || null;
  const clientReference = searchParams.get("client_reference")?.trim() || null;

  if (!reference && !clientReference) {
    return NextResponse.json(
      {
        status: "error",
        code: "INVALID_QUERY",
        message: "Provide reference or client_reference to look up status.",
      },
      { status: 400 }
    );
  }

  // 3. Test Mode: Lookup in Isolated Sandbox Table
  if (keyPayload.type === ApiKeyType.TEST) {
    const testTicket = await prisma.testNinIpeTicket.findFirst({
      where: {
        userId: keyPayload.userId,
        OR: [
          ...(reference ? [{ reference }] : []),
          ...(clientReference ? [{ clientReference }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (!testTicket) {
      return NextResponse.json(
        {
          status: "error",
          code: "RECORD_NOT_FOUND",
          message: "No IPE clearance ticket was found matching the provided reference under your account.",
        },
        { status: 404 }
      );
    }

    const isFailed = testTicket.status === "FAILED";
    const isCompleted = testTicket.status === "COMPLETED";

    const requestStatus = isCompleted
      ? "completed"
      : isFailed
      ? "failed"
      : "processing";

    const message = isCompleted
      ? "IPE Clearance completed successfully."
      : isFailed
      ? "Your IPE Clearance request has failed."
      : "Your IPE Clearance request is currently processing. Please check back later.";

    const isRefunded = Boolean(testTicket.refunded);
    const amountCharged = isRefunded ? 0.0 : Number(testTicket.amountCharged);

    return NextResponse.json({
      status: isFailed ? "error" : "success",
      reference: testTicket.reference,
      tracking_id: testTicket.trackingId,
      client_reference: testTicket.clientReference || null,
      request_status: requestStatus,
      message,
      ...(isCompleted
        ? {
            new_tracking_id: testTicket.newTrackingId || "0T448N2SR7OFAZC",
            resolved_nin: testTicket.resolvedNin || "44297896804",
          }
        : {}),
      ...(isFailed
        ? {
            error_detail:
              testTicket.failureReason ||
              "Your IPE clearance request has failed. Please contact support for more details.",
            refunded: true,
          }
        : {}),
      completed_at: testTicket.completedAt ? testTicket.completedAt.toISOString() : null,
      amount_charged: amountCharged,
      currency: "NGN",
      environment: "test",
      date: testTicket.createdAt.toISOString(),
    });
  }

  // 4. LIVE Mode: Lookup Ticket in Database
  let ticket = await prisma.ninIpeRequest.findFirst({
    where: {
      userId: keyPayload.userId,
      OR: [
        ...(reference ? [{ reference }] : []),
        ...(clientReference ? [{ clientReference }] : []),
      ],
    },
    include: {
      user: {
        include: { wallet: true },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json(
      {
        status: "error",
        code: "RECORD_NOT_FOUND",
        message: "No IPE clearance ticket was found matching the provided reference under your account.",
      },
      { status: 404 }
    );
  }

  // 5. Real-Time Active Ticket Upstream Sync Check (DataVerify)
  if (ticket.status === "PROCESSING" && ticket.provider === "DATAVERIFY") {
    const lastSyncMs = ticket.lastSyncedAt ? Date.now() - ticket.lastSyncedAt.getTime() : Infinity;
    // Query upstream if not checked in the last 20 seconds
    if (lastSyncMs > 20000) {
      try {
        const dvResult = await checkDataVerifyIpeStatus(ticket.trackingId);
        if (dvResult.success && dvResult.data) {
          const parsed = parseDataVerifyIpeResult(dvResult.data);

          if (parsed.normalizedStatus === "COMPLETED") {
            const completedRecord = await prisma.ninIpeRequest.update({
              where: { id: ticket.id },
              data: {
                status: "COMPLETED",
                resolvedNin: parsed.resolvedNin || ticket.resolvedNin,
                newTrackingId: parsed.newTrackingId || ticket.newTrackingId,
                apiMessage: parsed.message || "IPE Clearance completed successfully.",
                apiResponse: dvResult.data as any,
                completedAt: new Date(),
                lastSyncedAt: new Date(),
              },
              include: { user: { include: { wallet: true } } },
            });

            // Dispatch developer webhook
            dispatchDeveloperWebhook(ticket.userId, "nin_ipe.completed", {
              reference: completedRecord.reference,
              tracking_id: completedRecord.trackingId,
              client_reference: completedRecord.clientReference,
              new_tracking_id: completedRecord.newTrackingId,
              resolved_nin: completedRecord.resolvedNin,
              request_status: "completed",
              message: "IPE Clearance completed successfully.",
              completed_at: new Date().toISOString(),
              amount_charged: Number(completedRecord.amountCharged),
              currency: "NGN",
            });

            ticket = completedRecord;
          } else if (parsed.normalizedStatus === "FAILED") {
            const refundAmount = Number(ticket.amountCharged);
            const failureReason =
              parsed.errorDetail ||
              parsed.message ||
              "Your IPE clearance request has failed. Please contact support for more details.";

            const failedRecord = await prisma.$transaction(async (tx) => {
              const userWallet = ticket!.user.wallet;
              if (userWallet && refundAmount > 0) {
                const currentBal = Number(userWallet.balance);
                const refundedBal = currentBal + refundAmount;

                await tx.wallet.update({
                  where: { id: userWallet.id },
                  data: { balance: refundedBal },
                });

                await tx.transaction.create({
                  data: {
                    walletId: userWallet.id,
                    amount: refundAmount,
                    balanceBefore: currentBal,
                    balanceAfter: refundedBal,
                    type: "CREDIT",
                    status: "SUCCESS",
                    reference: `REFUND_${ticket!.reference}`,
                    serviceCategory: "REFUND",
                    description: `Refund: NIMC IPE Clearance Failed (${ticket!.trackingId})`,
                  },
                });
              }

              return await tx.ninIpeRequest.update({
                where: { id: ticket!.id },
                data: {
                  status: "FAILED",
                  failureReason,
                  refunded: true,
                  refundAmount,
                  apiMessage: parsed.message || "Clearance Failed",
                  apiResponse: dvResult.data as any,
                  lastSyncedAt: new Date(),
                },
                include: { user: { include: { wallet: true } } },
              });
            });

            // Dispatch developer webhook
            dispatchDeveloperWebhook(ticket.userId, "nin_ipe.failed", {
              reference: failedRecord.reference,
              tracking_id: failedRecord.trackingId,
              client_reference: failedRecord.clientReference,
              request_status: "failed",
              message: "Your IPE Clearance request has failed.",
              error_detail: sanitizePublicMessage(failureReason),
              refunded: true,
              refund_amount: refundAmount,
              amount_charged: 0,
              currency: "NGN",
            });

            ticket = failedRecord;
          } else {
            // Still processing: update lastSyncedAt
            await prisma.ninIpeRequest.update({
              where: { id: ticket.id },
              data: { lastSyncedAt: new Date() },
            });
          }
        }
      } catch (checkErr) {
        console.error(`❌ [Realtime IPE Check Error] Tracking ID ${ticket.trackingId}:`, checkErr);
      }
    }
  }

  const isFailed = ticket.status === "FAILED";
  const isCompleted = ticket.status === "COMPLETED";

  const requestStatus = isCompleted
    ? "completed"
    : isFailed
    ? "failed"
    : "processing";

  const message = isCompleted
    ? "IPE Clearance completed successfully."
    : isFailed
    ? "Your IPE Clearance request has failed."
    : "Your IPE Clearance request is currently processing. Please check back later.";

  const rawError =
    ticket.failureReason ||
    ticket.apiMessage ||
    "Your IPE clearance request has failed. Please contact support for more details.";
  const cleanErrorDetail = isFailed ? sanitizePublicMessage(rawError) : undefined;

  const isRefunded = Boolean(ticket.refunded);
  const amountCharged = isRefunded ? 0.0 : Number(ticket.amountCharged);

  return NextResponse.json({
    status: isFailed ? "error" : "success",
    reference: ticket.reference,
    tracking_id: ticket.trackingId,
    client_reference: ticket.clientReference || null,
    request_status: requestStatus,
    message,
    ...(isCompleted
      ? {
          new_tracking_id: ticket.newTrackingId,
          resolved_nin: ticket.resolvedNin,
        }
      : {}),
    ...(isFailed
      ? {
          error_detail: cleanErrorDetail,
          refunded: true,
        }
      : {}),
    completed_at: ticket.completedAt ? ticket.completedAt.toISOString() : null,
    amount_charged: amountCharged,
    currency: "NGN",
    environment: "live",
    date: ticket.createdAt.toISOString(),
  });
}
