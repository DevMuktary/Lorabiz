import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/developer/api-auth";
import { ApiKeyType, NinValidationCategory } from "@prisma/client";

const CATEGORY_TO_TYPE: Record<NinValidationCategory, string> = {
  NO_RECORD_FOUND: "no_record_found",
  VNIN_VALIDATION: "vnin_validation",
  UPDATE_RECORD_MOD: "modification",
  PHOTO_ERROR: "photo_error",
};

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
 * GET /api/v1/nin/validation/status
 * Queries real-time validation status via ?tracking_id=... or ?client_reference=...
 */
export async function GET(req: NextRequest) {
  // 1. Authenticate Developer API Key & Enforce Rate Limiting
  const authResult = await authenticateApiKey(req);
  if (!authResult.authenticated || !authResult.keyPayload) {
    return authResult.errorResponse!;
  }

  const { keyPayload } = authResult;

  // 3. Parse Query Parameters (tracking_id OR client_reference)
  const { searchParams } = new URL(req.url);
  const trackingId = searchParams.get("tracking_id")?.trim() || searchParams.get("trackingId")?.trim() || null;
  const clientReference = searchParams.get("client_reference")?.trim() || searchParams.get("reference")?.trim() || null;

  if (!trackingId && !clientReference) {
    return NextResponse.json(
      {
        status: "error",
        code: "INVALID_QUERY",
        message: "Provide either '?tracking_id=...' or '?client_reference=...' query parameter to look up status.",
      },
      { status: 400 }
    );
  }

  // 4. Test Mode Simulation
  if (keyPayload.type === ApiKeyType.TEST) {
    const isFailedSimulation = trackingId?.includes("fail") || clientReference?.includes("fail");
    const isCompletedSimulation = trackingId?.includes("val") || clientReference?.includes("val");

    if (isFailedSimulation) {
      return NextResponse.json({
        status: "error",
        tracking_id: trackingId || `nin_val_test_fail`,
        client_reference: clientReference,
        nin: "18867568313",
        validation_type: "no_record_found",
        request_status: "failed",
        message: "Your NIN Validation request has failed (Sandbox Simulation).",
        error_detail: "Validation failed due to bypass NIN, suspended, invalidated or wrong NIN.",
        refunded: true,
        amount_charged: 0.0,
        currency: "NGN",
        date: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      status: "success",
      tracking_id: trackingId || `nin_val_test_success`,
      client_reference: clientReference,
      nin: "18867568313",
      validation_type: "no_record_found",
      request_status: isCompletedSimulation ? "validated" : "processing",
      message: isCompletedSimulation
        ? "NIN Validation completed successfully (Sandbox Simulation)."
        : "Your NIN Validation request is currently processing. Please check back later.",
      completed_at: isCompletedSimulation ? new Date().toISOString() : null,
      refunded: false,
      amount_charged: 700.0,
      currency: "NGN",
      date: new Date().toISOString(),
    });
  }

  // 5. LIVE Mode: Lookup Ticket in Database
  const ticket = await prisma.ninValidationRequest.findFirst({
    where: {
      userId: keyPayload.userId,
      OR: [
        ...(trackingId ? [{ transactionRef: trackingId }] : []),
        ...(clientReference ? [{ clientReference }] : []),
      ],
    },
  });

  if (!ticket) {
    return NextResponse.json(
      {
        status: "error",
        code: "RECORD_NOT_FOUND",
        message: "No validation ticket was found matching the provided reference under your account.",
      },
      { status: 404 }
    );
  }

  const validationType = CATEGORY_TO_TYPE[ticket.category] || "no_record_found";
  const isFailed = ticket.status === "FAILED";
  const isCompleted = ticket.status === "COMPLETED";
  const isProcessing = ticket.status === "PROCESSING";

  const requestStatus = isCompleted
    ? "validated"
    : isFailed
    ? "failed"
    : "processing";

  const message = isCompleted
    ? "NIN Validation completed successfully."
    : isFailed
    ? "Your NIN Validation request has failed."
    : "Your NIN Validation request is currently processing. Please check back later.";

  const rawError = ticket.failureReason || ticket.apiMessage || "Validation failed verification requirements.";
  const cleanErrorDetail = isFailed ? sanitizePublicMessage(rawError) : undefined;

  const isRefunded = Boolean(ticket.refunded);
  const amountCharged = isRefunded ? 0.0 : Number(ticket.amountCharged);

  return NextResponse.json({
    status: isFailed ? "error" : "success",
    tracking_id: ticket.transactionRef,
    client_reference: ticket.clientReference || null,
    nin: ticket.nin,
    validation_type: validationType,
    request_status: requestStatus,
    message,
    error_detail: cleanErrorDetail,
    completed_at: ticket.completedAt ? ticket.completedAt.toISOString() : null,
    refunded: isRefunded,
    amount_charged: amountCharged,
    currency: "NGN",
    date: ticket.createdAt.toISOString(),
  });
}
