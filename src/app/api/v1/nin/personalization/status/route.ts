import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/developer/api-auth";
import { checkDataVerifyPersonalizationStatus, parseDataVerifyPersonalizationResult } from "@/lib/dataverify";
import { dispatchDeveloperWebhook } from "@/lib/developer/webhook-dispatcher";
import { ApiKeyType } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Sanitizes internal/upstream gateway names from customer-facing messages.
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
 * GET /api/v1/nin/personalization/status
 * Queries real-time NIN Personalization status via ?reference=... or ?client_reference=...
 * 
 * Strict Directives:
 * 1. Queries by `tracking_id` are strictly prohibited to avoid collision across retries.
 * 2. `amount_charged` and `currency` are explicitly returned across ALL states (including processing).
 * 3. Strict NO REFUND policy: On failure, debited fee remains charged (no refund issued).
 * 4. Completed state delivers `pdf_base64` directly (no artificial pdf_url endpoint).
 */
export async function GET(req: NextRequest) {
  // 1. Authenticate Developer API Key & Enforce Rate Limiting
  const authResult = await authenticateApiKey(req);
  if (!authResult.authenticated || !authResult.keyPayload) {
    return authResult.errorResponse!;
  }

  const { keyPayload } = authResult;

  // 2. Parse Query Parameters (Strictly reference OR client_reference)
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference")?.trim() || null;
  const clientReference = searchParams.get("client_reference")?.trim() || null;

  if (!reference && !clientReference) {
    return NextResponse.json(
      {
        status: "error",
        code: "INVALID_QUERY",
        message: "Provide reference or client_reference to look up status. Polling by tracking_id is not permitted.",
      },
      { status: 400 }
    );
  }

  // 3. Test Mode: Lookup in Isolated Sandbox Table
  if (keyPayload.type === ApiKeyType.TEST) {
    const testTicket = await prisma.testNinPersonalizationTicket.findFirst({
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
          message: "No NIN personalization ticket was found matching the provided reference under your account.",
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
      ? "NIN Personalization completed successfully."
      : isFailed
      ? "Your NIN Personalization request has failed."
      : "Your NIN Personalization request is currently processing. Please check back later.";

    return NextResponse.json({
      status: isFailed ? "error" : "success",
      reference: testTicket.reference,
      tracking_id: testTicket.trackingId,
      client_reference: testTicket.clientReference || null,
      request_status: requestStatus,
      message,
      ...(isCompleted
        ? {
            resolved_nin: testTicket.resolvedNin || "44297896804",
            pdf_base64: testTicket.pdfUrl || null,
            data: (testTicket.userData as Record<string, unknown>) || null,
          }
        : {}),
      ...(isFailed
        ? {
            error_detail:
              testTicket.failureReason ||
              "Tracking ID could not be resolved or was rejected by identity authority.",
          }
        : {}),
      completed_at: testTicket.completedAt ? testTicket.completedAt.toISOString() : null,
      amount_charged: Number(testTicket.amountCharged),
      currency: "NGN",
      environment: "test",
      date: testTicket.createdAt.toISOString(),
    });
  }

  // 4. LIVE Mode: Lookup Ticket in Database
  let ticket = await prisma.ninPersonalizationRequest.findFirst({
    where: {
      userId: keyPayload.userId,
      OR: [
        ...(reference ? [{ reference }] : []),
        ...(clientReference ? [{ clientReference }] : []),
      ],
    },
  });

  if (!ticket) {
    return NextResponse.json(
      {
        status: "error",
        code: "RECORD_NOT_FOUND",
        message: "No NIN personalization ticket was found matching the provided reference under your account.",
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
        const dvResult = await checkDataVerifyPersonalizationStatus(
          ticket.externalTxId || undefined,
          ticket.trackingId
        );

        if (dvResult.success && dvResult.data) {
          const parsed = parseDataVerifyPersonalizationResult(dvResult.data);

          if (parsed.normalizedStatus === "COMPLETED") {
            const completedRecord = await prisma.ninPersonalizationRequest.update({
              where: { id: ticket.id },
              data: {
                status: "COMPLETED",
                resolvedNin: parsed.resolvedNin || ticket.resolvedNin,
                fullName: parsed.fullName || ticket.fullName,
                dob: parsed.dob || ticket.dob,
                gender: parsed.gender || ticket.gender,
                phone: parsed.phone || ticket.phone,
                residenceState: parsed.residenceState || ticket.residenceState,
                photoUrl: parsed.photoUrl || ticket.photoUrl,
                pdfUrl: parsed.pdfBase64 || ticket.pdfUrl,
                userData: (parsed.userData as any) || ticket.userData,
                apiMessage: parsed.message || "NIN Personalization completed successfully.",
                apiResponse: dvResult.data as any,
                completedAt: new Date(),
                lastSyncedAt: new Date(),
              },
            });

            // Dispatch developer webhook
            dispatchDeveloperWebhook(
              ticket.userId,
              "nin_personalization.completed",
              {
                reference: completedRecord.reference,
                tracking_id: completedRecord.trackingId,
                client_reference: completedRecord.clientReference,
                resolved_nin: completedRecord.resolvedNin,
                pdf_base64: completedRecord.pdfUrl,
                data: (completedRecord.userData as Record<string, unknown>) || null,
                request_status: "completed",
                message: "NIN Personalization completed successfully.",
                completed_at: new Date().toISOString(),
                amount_charged: Number(completedRecord.amountCharged),
                currency: "NGN",
              },
              "LIVE"
            );

            ticket = completedRecord;
          } else if (parsed.normalizedStatus === "FAILED") {
            // STRICT NO-REFUND POLICY: Fee remains charged
            const failureReason =
              parsed.errorDetail ||
              parsed.message ||
              "Tracking ID could not be resolved or was rejected by identity authority.";

            const failedRecord = await prisma.ninPersonalizationRequest.update({
              where: { id: ticket.id },
              data: {
                status: "FAILED",
                failureReason,
                refunded: false,
                refundAmount: 0,
                apiMessage: parsed.message || "Personalization Failed",
                apiResponse: dvResult.data as any,
                lastSyncedAt: new Date(),
              },
            });

            // Dispatch developer webhook (with amount_charged retained, refunded: false)
            dispatchDeveloperWebhook(
              ticket.userId,
              "nin_personalization.failed",
              {
                reference: failedRecord.reference,
                tracking_id: failedRecord.trackingId,
                client_reference: failedRecord.clientReference,
                request_status: "failed",
                message: "Your NIN Personalization request has failed.",
                error_detail: sanitizePublicMessage(failureReason),
                refunded: false,
                amount_charged: Number(failedRecord.amountCharged),
                currency: "NGN",
              },
              "LIVE"
            );

            ticket = failedRecord;
          }
        }
      } catch (syncErr) {
        console.error("❌ [Live Personalization Status Sync Error]:", syncErr);
      }
    }
  }

  // 6. Build Standard Output Response
  const isFailed = ticket.status === "FAILED";
  const isCompleted = ticket.status === "COMPLETED";

  const requestStatus = isCompleted
    ? "completed"
    : isFailed
    ? "failed"
    : "processing";

  const message = isCompleted
    ? "NIN Personalization completed successfully."
    : isFailed
    ? "Your NIN Personalization request has failed."
    : "Your NIN Personalization request is currently processing. Please check back later.";

  return NextResponse.json({
    status: isFailed ? "error" : "success",
    reference: ticket.reference,
    tracking_id: ticket.trackingId,
    client_reference: ticket.clientReference || null,
    request_status: requestStatus,
    message,
    ...(isCompleted
      ? {
          resolved_nin: ticket.resolvedNin,
          pdf_base64: ticket.pdfUrl || null,
          data: (ticket.userData as Record<string, unknown>) || null,
        }
      : {}),
    ...(isFailed
      ? {
          error_detail: sanitizePublicMessage(
            ticket.failureReason ||
            "Tracking ID could not be resolved or was rejected by identity authority."
          ),
        }
      : {}),
    completed_at: ticket.completedAt ? ticket.completedAt.toISOString() : null,
    amount_charged: Number(ticket.amountCharged),
    currency: "NGN",
    environment: "live",
    date: ticket.createdAt.toISOString(),
  });
}
