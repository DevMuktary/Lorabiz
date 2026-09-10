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
 * Queries real-time validation status via ?reference=... or ?client_reference=...
 */
export async function GET(req: NextRequest) {
  // 1. Authenticate Developer API Key & Enforce Rate Limiting
  const authResult = await authenticateApiKey(req);
  if (!authResult.authenticated || !authResult.keyPayload) {
    return authResult.errorResponse!;
  }

  const { keyPayload } = authResult;

  // 3. Parse Query Parameters (reference OR client_reference)
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference")?.trim() || searchParams.get("tracking_id")?.trim() || searchParams.get("trackingId")?.trim() || null;
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

  // 4. Test Mode: Lookup in Isolated Test Table (Never touches live NinValidationRequest)
  if (keyPayload.type === ApiKeyType.TEST) {
    const testTicket = await prisma.testNinValidationTicket.findFirst({
      where: {
        userId: keyPayload.userId,
        OR: [
          ...(reference ? [{ trackingId: reference }] : []),
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
          message: "No validation ticket was found matching the provided reference under your account.",
        },
        { status: 404 }
      );
    }

    const isFailed = testTicket.status === "FAILED";
    const isCompleted = testTicket.status === "COMPLETED";

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

    const isRefunded = Boolean(testTicket.refunded);
    const amountCharged = isRefunded ? 0.0 : Number(testTicket.amountCharged);

    return NextResponse.json({
      status: isFailed ? "error" : "success",
      reference: testTicket.trackingId,
      client_reference: testTicket.clientReference || null,
      nin: testTicket.nin,
      validation_type: testTicket.validationType,
      request_status: requestStatus,
      message,
      ...(isFailed ? { error_detail: testTicket.failureReason || "Validation failed verification requirements." } : {}),
      completed_at: testTicket.completedAt ? testTicket.completedAt.toISOString() : null,
      ...(isFailed ? { refunded: isRefunded } : {}),
      amount_charged: amountCharged,
      currency: "NGN",
      environment: "test",
      date: testTicket.createdAt.toISOString(),
    });
  }

  // 5. LIVE Mode: Lookup Ticket in Database
  const ticket = await prisma.ninValidationRequest.findFirst({
    where: {
      userId: keyPayload.userId,
      OR: [
        ...(reference ? [{ transactionRef: reference }] : []),
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
    reference: ticket.transactionRef,
    client_reference: ticket.clientReference || null,
    nin: ticket.nin,
    validation_type: validationType,
    request_status: requestStatus,
    message,
    ...(isFailed ? { error_detail: cleanErrorDetail } : {}),
    completed_at: ticket.completedAt ? ticket.completedAt.toISOString() : null,
    ...(isFailed ? { refunded: isRefunded } : {}),
    amount_charged: amountCharged,
    currency: "NGN",
    environment: "live",
    date: ticket.createdAt.toISOString(),
  });
}
