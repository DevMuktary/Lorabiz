import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/developer/api-auth";
import { recordApiRequestLog } from "@/lib/developer/logger";
import { ApiKeyType, NinValidationCategory } from "@prisma/client";
import { dispatchDeveloperWebhook } from "@/lib/developer/webhook-dispatcher";
import crypto from "crypto";

const VALIDATION_TYPE_MAP: Record<string, { category: NinValidationCategory; serviceKey: string; defaultPrice: number; label: string }> = {
  no_record_found: {
    category: NinValidationCategory.NO_RECORD_FOUND,
    serviceKey: "NIN_VALIDATION_NO_RECORD",
    defaultPrice: 700.0,
    label: "No Record Found",
  },
  no_record: {
    category: NinValidationCategory.NO_RECORD_FOUND,
    serviceKey: "NIN_VALIDATION_NO_RECORD",
    defaultPrice: 700.0,
    label: "No Record Found",
  },
  vnin_validation: {
    category: NinValidationCategory.VNIN_VALIDATION,
    serviceKey: "NIN_VALIDATION_VNIN",
    defaultPrice: 2500.0,
    label: "SIM/Bank & VNIN Validation",
  },
  vnin: {
    category: NinValidationCategory.VNIN_VALIDATION,
    serviceKey: "NIN_VALIDATION_VNIN",
    defaultPrice: 2500.0,
    label: "SIM/Bank & VNIN Validation",
  },
  modification: {
    category: NinValidationCategory.UPDATE_RECORD_MOD,
    serviceKey: "NIN_VALIDATION_MOD",
    defaultPrice: 3000.0,
    label: "Modification Validation",
  },
  update_record_mod: {
    category: NinValidationCategory.UPDATE_RECORD_MOD,
    serviceKey: "NIN_VALIDATION_MOD",
    defaultPrice: 3000.0,
    label: "Modification Validation",
  },
  photo_error: {
    category: NinValidationCategory.PHOTO_ERROR,
    serviceKey: "NIN_VALIDATION_PHOTO_ERROR",
    defaultPrice: 1600.0,
    label: "Photographic Error",
  },
};

/**
 * POST /api/v1/nin/validation
 * Submits an 11-digit NIN for background validation pipeline processing.
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/v1/nin/validation";

  // 1. Authenticate Developer API Key & Enforce Rate Limiting
  const authResult = await authenticateApiKey(req);
  if (!authResult.authenticated || !authResult.keyPayload) {
    return authResult.errorResponse!;
  }

  const { keyPayload } = authResult;
  const environment = keyPayload.type;
  const envString = environment === ApiKeyType.LIVE ? "live" : "test";

  // 3. Parse and Validate Request Payload
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        status: "error",
        code: "INVALID_INPUT",
        message: "Invalid JSON payload in request body.",
      },
      { status: 400 }
    );
  }

  const { nin, validation_type, client_reference } = body || {};

  // Validate NIN format
  const sanitizedNin = typeof nin === "string" ? nin.trim().replace(/\D/g, "") : "";
  if (!sanitizedNin || sanitizedNin.length !== 11) {
    return NextResponse.json(
      {
        status: "error",
        code: "INVALID_INPUT",
        message: "National Identification Number (NIN) must be an 11-digit numeric string.",
      },
      { status: 400 }
    );
  }

  // Validate validation_type
  const normalizedTypeKey = String(validation_type || "no_record_found").toLowerCase().trim();
  const typeConfig = VALIDATION_TYPE_MAP[normalizedTypeKey];

  if (!typeConfig) {
    return NextResponse.json(
      {
        status: "error",
        code: "INVALID_INPUT",
        message: `Invalid validation_type '${validation_type}'. Must be one of: 'no_record_found', 'vnin_validation', 'modification', 'photo_error'.`,
      },
      { status: 400 }
    );
  }

  // 4. Fetch Dynamic Pricing & Availability from ServicePricing
  const pricingRecord = await prisma.servicePricing.findUnique({
    where: { serviceKey: typeConfig.serviceKey },
  });

  const price = pricingRecord ? Number(pricingRecord.price) : typeConfig.defaultPrice;
  const isOnline = pricingRecord ? pricingRecord.isActive : true;

  if (!isOnline) {
    const maintenanceMsg =
      pricingRecord?.maintenanceMsg ||
      `The '${typeConfig.label}' validation service is temporarily undergoing scheduled maintenance. Please retry shortly.`;

    return NextResponse.json(
      {
        status: "error",
        code: "SERVICE_UNAVAILABLE",
        message: maintenanceMsg,
      },
      { status: 503 }
    );
  }

  // 5. Idempotency Check via client_reference
  const cleanClientRef = typeof client_reference === "string" && client_reference.trim().length > 0
    ? client_reference.trim()
    : undefined;

  if (cleanClientRef) {
    const existingByRef = await prisma.ninValidationRequest.findFirst({
      where: {
        userId: keyPayload.userId,
        clientReference: cleanClientRef,
      },
    });

    if (existingByRef) {
      // Return existing ticket data idempotently
      const existingStatus = existingByRef.status === "COMPLETED"
        ? "validated"
        : existingByRef.status === "FAILED"
        ? "failed"
        : "processing";

      return NextResponse.json(
        {
          status: "success",
          message: "Existing NIN validation request retrieved via client_reference.",
          tracking_id: existingByRef.transactionRef,
          client_reference: existingByRef.clientReference,
          nin: existingByRef.nin,
          validation_type: normalizedTypeKey,
          request_status: existingStatus,
          amount_charged: Number(existingByRef.amountCharged),
          currency: "NGN",
          refunded: existingByRef.refunded,
        },
        { status: 200 }
      );
    }
  }

  // 6. Fast Duplicate Active Request Check (409 Conflict)
  const existingActive = await prisma.ninValidationRequest.findFirst({
    where: {
      userId: keyPayload.userId,
      nin: sanitizedNin,
      category: typeConfig.category,
      status: "PROCESSING",
    },
  });

  if (existingActive) {
    return NextResponse.json(
      {
        status: "error",
        code: "DUPLICATE_REQUEST",
        message: `An active validation request is already in progress for NIN ${sanitizedNin}. Please check its status.`,
        tracking_id: existingActive.transactionRef,
        client_reference: existingActive.clientReference || null,
        transaction: {
          amount_charged: 0.0,
          currency: "NGN",
        },
      },
      { status: 409 }
    );
  }

  // 7. SANDBOX / TEST Mode Simulation
  if (keyPayload.type === ApiKeyType.TEST) {
    const testTrackingId = `nin_val_test_${crypto.randomBytes(10).toString("hex")}`;

    recordApiRequestLog({
      userId: keyPayload.userId,
      apiKeyId: keyPayload.id,
      environment,
      method: "POST",
      endpoint,
      statusCode: 201,
      latencyMs: Date.now() - startTime,
      amountCharged: 0,
      clientReference: cleanClientRef,
      requestBody: body,
      responseBody: { status: "success", tracking_id: testTrackingId, simulated: true },
    });

    return NextResponse.json(
      {
        status: "success",
        message: "NIN validation request submitted successfully (Sandbox Simulation).",
        tracking_id: testTrackingId,
        client_reference: cleanClientRef,
        nin: sanitizedNin,
        validation_type: normalizedTypeKey,
        request_status: "submitted",
        amount_charged: price,
        currency: "NGN",
        refunded: false,
        environment: "test",
      },
      { status: 201 }
    );
  }

  // 8. LIVE Mode: Balance Check & Atomic Execution
  const user = await prisma.user.findUnique({
    where: { id: keyPayload.userId },
    include: { wallet: true },
  });

  if (!user || !user.wallet) {
    return NextResponse.json(
      {
        status: "error",
        code: "ACCOUNT_ERROR",
        message: "Developer account or wallet not found.",
      },
      { status: 404 }
    );
  }

  const currentBalance = Number(user.wallet.balance);
  if (currentBalance < price) {
    recordApiRequestLog({
      userId: keyPayload.userId,
      apiKeyId: keyPayload.id,
      environment,
      method: "POST",
      endpoint,
      statusCode: 402,
      latencyMs: Date.now() - startTime,
      amountCharged: 0,
      clientReference: cleanClientRef,
      requestBody: body,
      errorMessage: `Insufficient balance (Balance: ₦${currentBalance}, Required: ₦${price})`,
    });

    return NextResponse.json(
      {
        status: "error",
        code: "INSUFFICIENT_FUNDS",
        message: `Insufficient wallet balance. Required: ₦${price.toLocaleString()}, Current Balance: ₦${currentBalance.toLocaleString()}. Please fund your developer wallet.`,
        transaction: {
          amount_charged: 0.0,
          currency: "NGN",
        },
      },
      { status: 402 }
    );
  }

  const trackingId = `nin_val_${crypto.randomBytes(11).toString("hex")}`;

  // 9. Atomic Transaction: Debit Wallet + Create Request
  try {
    const createdTicket = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { id: user.wallet!.id } });
      if (!wallet || Number(wallet.balance) < price) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore - price;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: price } },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: price,
          balanceBefore,
          balanceAfter,
          type: "DEBIT",
          status: "SUCCESS",
          reference: trackingId,
          serviceCategory: "IDENTITY_API",
          description: `NIN Validation API (${typeConfig.label}) - ${sanitizedNin}`,
        },
      });

      const ticket = await tx.ninValidationRequest.create({
        data: {
          userId: user.id,
          category: typeConfig.category,
          nin: sanitizedNin,
          provider: "MANUAL",
          status: "PROCESSING",
          amountCharged: price,
          transactionRef: trackingId,
          clientReference: cleanClientRef,
          isApiRequest: true,
          refunded: false,
          adminNotes: cleanClientRef ? `API Request (Client Ref: ${cleanClientRef})` : "API Request",
        },
      });

      return ticket;
    });

    // 10. Audit Log & Async Webhook Dispatch
    recordApiRequestLog({
      userId: keyPayload.userId,
      apiKeyId: keyPayload.id,
      environment,
      method: "POST",
      endpoint,
      statusCode: 201,
      latencyMs: Date.now() - startTime,
      amountCharged: price,
      clientReference: cleanClientRef,
      requestBody: body,
      responseBody: { status: "success", tracking_id: trackingId, amount_charged: price },
    });

    // Dispatch webhook event to developer if configured
    dispatchDeveloperWebhook(keyPayload.userId, "nin_validation.submitted", {
      tracking_id: trackingId,
      client_reference: cleanClientRef,
      nin: sanitizedNin,
      validation_type: normalizedTypeKey,
      request_status: "submitted",
      message: "NIN validation request submitted successfully.",
      amount_charged: price,
      currency: "NGN",
      refunded: false,
    });

    return NextResponse.json(
      {
        status: "success",
        message: "NIN validation request submitted successfully.",
        tracking_id: trackingId,
        client_reference: cleanClientRef,
        nin: sanitizedNin,
        validation_type: normalizedTypeKey,
        request_status: "submitted",
        amount_charged: price,
        currency: "NGN",
        refunded: false,
        environment: envString,
      },
      { status: 201 }
    );
  } catch (txErr: any) {
    console.error("❌ [NIN Validation API Submission Error]:", txErr);

    return NextResponse.json(
      {
        status: "error",
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while queueing your validation request. Please try again.",
      },
      { status: 500 }
    );
  }
}
