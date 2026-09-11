import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/developer/api-auth";
import { recordApiRequestLog } from "@/lib/developer/logger";
import { dispatchDeveloperWebhook } from "@/lib/developer/webhook-dispatcher";
import { submitDataVerifyIpe } from "@/lib/dataverify";
import { ApiKeyType } from "@prisma/client";
import crypto from "crypto";

const SERVICE_KEY = "API_NIN_IPE_CLEARANCE";
const DEFAULT_PRICE = 2500.0;

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/v1/nin/ipe";

  // 1. Dual-Mode Authentication & Sliding Window Rate Limiter
  const authResult = await authenticateApiKey(req);
  if (!authResult.authenticated || !authResult.keyPayload) {
    return authResult.errorResponse!;
  }

  const { keyPayload } = authResult;
  const environment = keyPayload.type;
  const envString = environment === ApiKeyType.TEST ? "test" : "live";

  // 2. Parse Request Body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        status: "error",
        code: "INVALID_JSON",
        message: "Invalid or malformed JSON payload in request body.",
      },
      { status: 400 }
    );
  }

  const { tracking_id, client_reference } = body || {};

  // 3. Validate Tracking ID
  const sanitizedTrackingId = typeof tracking_id === "string" ? tracking_id.trim().toUpperCase() : "";
  const trackingIdRegex = /^[A-Z0-9]{8,32}$/i;

  if (!sanitizedTrackingId || !trackingIdRegex.test(sanitizedTrackingId)) {
    return NextResponse.json(
      {
        status: "error",
        code: "INVALID_INPUT",
        message: "NIMC Tracking ID is required and must be an alphanumeric string between 8 and 32 characters (e.g., '0TEB51VS5RES4ZZ').",
      },
      { status: 400 }
    );
  }

  // 4. Fetch Dynamic Pricing & Service Availability
  const pricingRecord = await prisma.servicePricing.findUnique({
    where: { serviceKey: SERVICE_KEY },
  });

  const price = pricingRecord ? Number(pricingRecord.price) : DEFAULT_PRICE;
  const isOnline = pricingRecord ? pricingRecord.isActive : true;

  if (!isOnline) {
    const maintenanceMsg =
      pricingRecord?.maintenanceMsg ||
      "The NIMC IPE Clearance service is temporarily undergoing scheduled maintenance. Please retry shortly.";

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
  const cleanClientRef =
    typeof client_reference === "string" && client_reference.trim().length > 0
      ? client_reference.trim().substring(0, 128)
      : undefined;

  if (cleanClientRef) {
    if (keyPayload.type === ApiKeyType.TEST) {
      const existingTest = await prisma.testNinIpeTicket.findFirst({
        where: {
          userId: keyPayload.userId,
          clientReference: cleanClientRef,
        },
      });

      if (existingTest) {
        const existingStatus = existingTest.status.toLowerCase();
        return NextResponse.json(
          {
            status: "success",
            message: "Existing NIMC IPE Clearance request retrieved via client_reference.",
            reference: existingTest.reference,
            tracking_id: existingTest.trackingId,
            client_reference: existingTest.clientReference,
            request_status: existingStatus,
            ...(existingTest.status === "COMPLETED"
              ? {
                  new_tracking_id: existingTest.newTrackingId || "0T448N2SR7OFAZC",
                  resolved_nin: existingTest.resolvedNin || "44297896804",
                }
              : {}),
            ...(existingTest.status === "FAILED"
              ? {
                  refunded: true,
                  error_detail: existingTest.failureReason || "IPE clearance request has failed.",
                }
              : {}),
            amount_charged: existingTest.status === "FAILED" ? 0 : Number(existingTest.amountCharged),
            currency: "NGN",
            environment: "test",
          },
          { status: 200 }
        );
      }
    } else {
      const existingLive = await prisma.ninIpeRequest.findFirst({
        where: {
          userId: keyPayload.userId,
          clientReference: cleanClientRef,
        },
      });

      if (existingLive) {
        const existingStatus = existingLive.status.toLowerCase();
        return NextResponse.json(
          {
            status: "success",
            message: "Existing NIMC IPE Clearance request retrieved via client_reference.",
            reference: existingLive.reference,
            tracking_id: existingLive.trackingId,
            client_reference: existingLive.clientReference,
            request_status: existingStatus,
            ...(existingLive.status === "COMPLETED"
              ? {
                  new_tracking_id: existingLive.newTrackingId,
                  resolved_nin: existingLive.resolvedNin,
                }
              : {}),
            ...(existingLive.status === "FAILED"
              ? {
                  refunded: true,
                  error_detail: existingLive.failureReason || "IPE clearance request has failed.",
                }
              : {}),
            amount_charged: existingLive.status === "FAILED" ? 0 : Number(existingLive.amountCharged),
            currency: "NGN",
            environment: "live",
          },
          { status: 200 }
        );
      }
    }
  }

  // 6. SANDBOX / TEST MODE PIPELINE
  if (keyPayload.type === ApiKeyType.TEST) {
    // Check simulation conflict trigger
    if (sanitizedTrackingId === "0TDUPCONFLICT01" || sanitizedTrackingId.endsWith("CONFLICT")) {
      return NextResponse.json(
        {
          status: "error",
          code: "DUPLICATE_REQUEST",
          message: `An active IPE clearance request is already in progress for Tracking ID ${sanitizedTrackingId}. Duplicate submission rejected to prevent double debits.`,
          reference: "lora_ipe_test_dup_active",
          tracking_id: sanitizedTrackingId,
          client_reference: cleanClientRef || null,
          transaction: {
            amount_charged: 0.0,
            currency: "NGN",
          },
        },
        { status: 409 }
      );
    }

    // Check Test Sandbox Balance
    const user = await prisma.user.findUnique({
      where: { id: keyPayload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { status: "error", code: "ACCOUNT_ERROR", message: "Developer account not found." },
        { status: 404 }
      );
    }

    const currentSandboxBal = Number(user.sandboxBalance);
    if (currentSandboxBal < price) {
      return NextResponse.json(
        {
          status: "error",
          code: "INSUFFICIENT_FUNDS",
          message: `Insufficient sandbox balance. Required: ₦${price.toLocaleString()}, Current Balance: ₦${currentSandboxBal.toLocaleString()}. Reset sandbox balance in Developer Console.`,
          transaction: { amount_charged: 0.0, currency: "NGN" },
        },
        { status: 402 }
      );
    }

    // Deduct test balance
    await prisma.user.update({
      where: { id: keyPayload.userId },
      data: { sandboxBalance: { decrement: price } },
    });

    const testReference = `lora_ipe_test_${crypto.randomBytes(8).toString("hex")}`;
    const willFail = sanitizedTrackingId === "0TBH26SQHQCR9F" || sanitizedTrackingId.endsWith("FAILED");

    await prisma.testNinIpeTicket.create({
      data: {
        userId: keyPayload.userId,
        trackingId: sanitizedTrackingId,
        reference: testReference,
        clientReference: cleanClientRef || null,
        status: "PROCESSING",
        amountCharged: price,
      },
    });

    // Fire webhook: nin_ipe.submitted
    dispatchDeveloperWebhook(
      keyPayload.userId,
      "nin_ipe.submitted",
      {
        reference: testReference,
        tracking_id: sanitizedTrackingId,
        client_reference: cleanClientRef || null,
        request_status: "submitted",
        message: "NIMC IPE Clearance request submitted successfully (Sandbox Simulation).",
        amount_charged: price,
        currency: "NGN",
      },
      "TEST"
    );

    // Asynchronous sandbox transition (5 seconds)
    setTimeout(async () => {
      try {
        if (!willFail) {
          await prisma.testNinIpeTicket.update({
            where: { reference: testReference },
            data: {
              status: "COMPLETED",
              resolvedNin: "44297896804",
              newTrackingId: "0T448N2SR7OFAZC",
              completedAt: new Date(),
            },
          });

          dispatchDeveloperWebhook(
            keyPayload.userId,
            "nin_ipe.completed",
            {
              reference: testReference,
              tracking_id: sanitizedTrackingId,
              client_reference: cleanClientRef || null,
              new_tracking_id: "0T448N2SR7OFAZC",
              resolved_nin: "44297896804",
              request_status: "completed",
              message: "IPE Clearance completed successfully.",
              completed_at: new Date().toISOString(),
              amount_charged: price,
              currency: "NGN",
            },
            "TEST"
          );
        } else {
          // Failure scenario: refund virtual balance & notify
          await prisma.testNinIpeTicket.update({
            where: { reference: testReference },
            data: {
              status: "FAILED",
              failureReason: "Your IPE clearance request has failed. Please contact support for more details.",
              refunded: true,
            },
          });

          await prisma.user.update({
            where: { id: keyPayload.userId },
            data: { sandboxBalance: { increment: price } },
          });

          dispatchDeveloperWebhook(
            keyPayload.userId,
            "nin_ipe.failed",
            {
              reference: testReference,
              tracking_id: sanitizedTrackingId,
              client_reference: cleanClientRef || null,
              request_status: "failed",
              message: "Your IPE Clearance request has failed.",
              error_detail: "Your IPE clearance request has failed. Please contact support for more details.",
              refunded: true,
              refund_amount: price,
              amount_charged: 0,
              currency: "NGN",
            },
            "TEST"
          );
        }
      } catch (asyncErr) {
        console.error("❌ [Test Sandbox IPE Async Update Error]:", asyncErr);
      }
    }, 5000);

    const testResponseBody = {
      status: "success",
      message: "NIMC IPE Clearance request submitted successfully (Sandbox Simulation).",
      reference: testReference,
      tracking_id: sanitizedTrackingId,
      client_reference: cleanClientRef || null,
      request_status: "submitted",
      amount_charged: price,
      currency: "NGN",
      environment: "test",
    };

    // Log request
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
      responseBody: testResponseBody,
    });

    return NextResponse.json(testResponseBody, { status: 201 });
  }

  // 7. LIVE MODE: Active Request Conflict Check (409 Conflict)
  const existingActive = await prisma.ninIpeRequest.findFirst({
    where: {
      userId: keyPayload.userId,
      trackingId: sanitizedTrackingId,
      status: "PROCESSING",
    },
  });

  if (existingActive) {
    return NextResponse.json(
      {
        status: "error",
        code: "DUPLICATE_REQUEST",
        message: `An active IPE clearance request is already in progress for Tracking ID ${sanitizedTrackingId}. Duplicate submission rejected to prevent double debits.`,
        reference: existingActive.reference,
        tracking_id: existingActive.trackingId,
        client_reference: existingActive.clientReference || null,
        transaction: {
          amount_charged: 0.0,
          currency: "NGN",
        },
      },
      { status: 409 }
    );
  }

  // 8. LIVE MODE: Balance Verification
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

  // 9. Generate Reference & Upstream Gateway Submission with Graceful Queueing
  const reference = `lora_ipe_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  const providerSetting = await prisma.globalSetting.findUnique({
    where: { key: "NIN_IPE_PROVIDER" },
  });
  const activeProvider = (providerSetting?.value || "DATAVERIFY").toUpperCase();

  let provider = "MANUAL";
  let externalReqId: string | null = null;
  let apiMessage = "Request submitted and queued for clearance.";
  let rawApiResponse: any = null;

  if (activeProvider === "DATAVERIFY") {
    try {
      const dvRes = await submitDataVerifyIpe(sanitizedTrackingId);
      if (dvRes.success && dvRes.data?.status) {
        provider = "DATAVERIFY";
        externalReqId = dvRes.data.transaction_id || null;
        apiMessage = dvRes.data.message || "Request submitted to identity gateway.";
        rawApiResponse = dvRes.data;
      } else {
        // Upstream issue (e.g. gateway low balance): Gracefully queue for admin MDS pipeline
        provider = "MANUAL";
        apiMessage = "Request queued for automated processing.";
        rawApiResponse = dvRes.data || { error: dvRes.error };
        console.warn(
          `⚠️ [IPE API] DataVerify submission failed for Tracking ID ${sanitizedTrackingId}. Gracefully queued as MANUAL.`
        );
      }
    } catch (dvErr: any) {
      provider = "MANUAL";
      apiMessage = "Request queued for automated processing.";
      rawApiResponse = { error: dvErr?.message || "Gateway communication error" };
    }
  }

  // 10. Atomic Execution: Debit Wallet + Ledger Entry + Create IPE Request
  try {
    await prisma.$transaction(async (tx) => {
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
          reference: reference,
          serviceCategory: "IDENTITY_API",
          description: `NIMC IPE Clearance API - Tracking ID: ${sanitizedTrackingId}`,
        },
      });

      await tx.ninIpeRequest.create({
        data: {
          userId: user.id,
          trackingId: sanitizedTrackingId,
          reference: reference,
          provider: provider,
          externalReqId: externalReqId,
          status: "PROCESSING",
          amountCharged: price,
          apiMessage: apiMessage,
          apiResponse: rawApiResponse,
          isApiRequest: true,
          clientReference: cleanClientRef,
          adminNotes: cleanClientRef
            ? `Developer API Request (Client Ref: ${cleanClientRef})`
            : "Developer API Request",
        },
      });
    });

    const liveResponseBody = {
      status: "success",
      message: "NIMC IPE Clearance request submitted successfully.",
      reference: reference,
      tracking_id: sanitizedTrackingId,
      client_reference: cleanClientRef || null,
      request_status: "submitted",
      amount_charged: price,
      currency: "NGN",
      environment: "live",
    };

    // 11. Async Audit Logging
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
      responseBody: liveResponseBody,
    });

    // 12. Dispatch Webhook: nin_ipe.submitted
    dispatchDeveloperWebhook(
      keyPayload.userId,
      "nin_ipe.submitted",
      {
        reference,
        tracking_id: sanitizedTrackingId,
        client_reference: cleanClientRef || null,
        request_status: "submitted",
        message: "NIMC IPE Clearance request submitted successfully.",
        amount_charged: price,
        currency: "NGN",
      },
      "LIVE"
    );

    return NextResponse.json(liveResponseBody, { status: 201 });
  } catch (txErr: any) {
    console.error("❌ [NIMC IPE API Submission Error]:", txErr);

    return NextResponse.json(
      {
        status: "error",
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while queueing your IPE clearance request. Please try again.",
      },
      { status: 500 }
    );
  }
}
