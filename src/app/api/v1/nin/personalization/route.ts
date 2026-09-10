import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiKey } from "@/lib/developer/api-auth";
import { recordApiRequestLog } from "@/lib/developer/logger";
import { submitDataVerifyPersonalization } from "@/lib/dataverify";
import { dispatchDeveloperWebhook } from "@/lib/developer/webhook-dispatcher";
import { ApiKeyType } from "@prisma/client";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/nin/personalization
 * Submits an applicant's official NIMC Tracking ID for NIN Personalization.
 * Generates/retrieves the citizen's official NIN and personalized National Identification Slip.
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/v1/nin/personalization";

  // 1. Authenticate Developer API Key & Enforce Rate Limiting
  const authResult = await authenticateApiKey(req);
  if (!authResult.authenticated || !authResult.keyPayload) {
    return authResult.errorResponse!;
  }

  const { keyPayload } = authResult;
  const environment = keyPayload.type === ApiKeyType.TEST ? "TEST" : "LIVE";
  const envString = keyPayload.type === ApiKeyType.TEST ? "test" : "live";

  // 2. Parse & Validate Request Body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        status: "error",
        code: "INVALID_JSON",
        message: "Invalid JSON payload provided in request body.",
      },
      { status: 400 }
    );
  }

  const { tracking_id, client_reference } = body || {};

  // 3. Validate Tracking ID
  const sanitizedTrackingId = typeof tracking_id === "string" ? tracking_id.trim().toUpperCase() : "";
  if (!sanitizedTrackingId) {
    return NextResponse.json(
      {
        status: "error",
        code: "VALIDATION_ERROR",
        message: "Please provide a valid NIMC Tracking ID.",
      },
      { status: 400 }
    );
  }

  // 4. Resolve Dynamic Wholesale Pricing
  const pricingSetting = await prisma.servicePricing.findFirst({
    where: {
      serviceKey: {
        in: ["API_NIN_PERSONALIZATION", "NIN_PERSONALIZATION"],
      },
      isActive: true,
    },
    orderBy: { serviceKey: "asc" }, // Prefers API_NIN_PERSONALIZATION if configured
  });

  const price = pricingSetting ? Number(pricingSetting.price) : 0;

  // 5. Idempotency Check via client_reference
  const cleanClientRef =
    typeof client_reference === "string" && client_reference.trim().length > 0
      ? client_reference.trim().substring(0, 128)
      : undefined;

  if (cleanClientRef) {
    if (keyPayload.type === ApiKeyType.TEST) {
      const existingTest = await prisma.testNinPersonalizationTicket.findFirst({
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
            message: "Existing NIN Personalization request retrieved via client_reference.",
            reference: existingTest.reference,
            tracking_id: existingTest.trackingId,
            client_reference: existingTest.clientReference,
            request_status: existingStatus,
            ...(existingTest.status === "COMPLETED"
              ? {
                  resolved_nin: existingTest.resolvedNin || "44297896804",
                  pdf_base64: existingTest.pdfUrl || null,
                  data: existingTest.userData || null,
                }
              : {}),
            ...(existingTest.status === "FAILED"
              ? {
                  error_detail: existingTest.failureReason || "Personalization request has failed.",
                }
              : {}),
            amount_charged: Number(existingTest.amountCharged),
            currency: "NGN",
            environment: "test",
          },
          { status: 200 }
        );
      }
    } else {
      const existingLive = await prisma.ninPersonalizationRequest.findFirst({
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
            message: "Existing NIN Personalization request retrieved via client_reference.",
            reference: existingLive.reference,
            tracking_id: existingLive.trackingId,
            client_reference: existingLive.clientReference,
            request_status: existingStatus,
            ...(existingLive.status === "COMPLETED"
              ? {
                  resolved_nin: existingLive.resolvedNin,
                  pdf_base64: existingLive.pdfUrl || null,
                  data: existingLive.userData || null,
                }
              : {}),
            ...(existingLive.status === "FAILED"
              ? {
                  error_detail: existingLive.failureReason || "Personalization request has failed.",
                }
              : {}),
            amount_charged: Number(existingLive.amountCharged),
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
          message: `An active personalization request is already in progress for Tracking ID ${sanitizedTrackingId}. Duplicate submission rejected to prevent double debits.`,
          reference: "lora_pzn_test_dup_active",
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
          message: `Insufficient virtual sandbox balance. Required: ₦${price}, Balance: ₦${currentSandboxBal}.`,
        },
        { status: 402 }
      );
    }

    // Deduct virtual sandbox balance
    await prisma.user.update({
      where: { id: keyPayload.userId },
      data: { sandboxBalance: { decrement: price } },
    });

    const testReference = `lora_pzn_test_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    await prisma.testNinPersonalizationTicket.create({
      data: {
        userId: keyPayload.userId,
        trackingId: sanitizedTrackingId,
        reference: testReference,
        clientReference: cleanClientRef || null,
        status: "PROCESSING",
        amountCharged: price,
      },
    });

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
      responseBody: { status: "success", reference: testReference, simulated: true },
    });

    // 5-Second Automated Background Transition & Test Webhook Dispatch
    setTimeout(async () => {
      try {
        if (sanitizedTrackingId === "0TBH26SQHQCR9F" || sanitizedTrackingId.endsWith("FAIL")) {
          // Simulation: Failure (STRICT NO-REFUND POLICY)
          await prisma.testNinPersonalizationTicket.update({
            where: { reference: testReference },
            data: {
              status: "FAILED",
              failureReason: "Tracking ID could not be resolved or was rejected by identity authority.",
            },
          });

          dispatchDeveloperWebhook(
            keyPayload.userId,
            "nin_personalization.failed",
            {
              reference: testReference,
              tracking_id: sanitizedTrackingId,
              client_reference: cleanClientRef || null,
              request_status: "failed",
              message: "Your NIN Personalization request has failed.",
              error_detail: "Tracking ID could not be resolved or was rejected by identity authority.",
              refunded: false,
              amount_charged: price,
              currency: "NGN",
            },
            "TEST"
          );
        } else {
          // Simulation: Success (0TEB51VS5RES4ZZ or general test number)
          const mockNin = "44297896804";
          const mockData = {
            nin: mockNin,
            firstname: "IBRAHIM",
            surname: "MUSA",
            middlename: "BELLO",
            birthdate: "1995-04-12",
            gender: "Male",
            telephoneno: "08012345678",
            residence_state: "Kano",
            photo: "/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBD...",
          };
          const mockPdfBase64 = "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDM2OTAvRmlsdGVyL0ZsYXRlRGVjb2RlPj5zdHJlYW0KeJzsvQlgHMdVJ...";

          await prisma.testNinPersonalizationTicket.update({
            where: { reference: testReference },
            data: {
              status: "COMPLETED",
              resolvedNin: mockNin,
              fullName: "IBRAHIM BELLO MUSA",
              dob: "1995-04-12",
              gender: "Male",
              phone: "08012345678",
              residenceState: "Kano",
              pdfUrl: mockPdfBase64,
              userData: mockData,
              completedAt: new Date(),
            },
          });

          dispatchDeveloperWebhook(
            keyPayload.userId,
            "nin_personalization.completed",
            {
              reference: testReference,
              tracking_id: sanitizedTrackingId,
              client_reference: cleanClientRef || null,
              resolved_nin: mockNin,
              pdf_base64: mockPdfBase64,
              data: mockData,
              request_status: "completed",
              message: "NIN Personalization completed successfully.",
              completed_at: new Date().toISOString(),
              amount_charged: price,
              currency: "NGN",
            },
            "TEST"
          );
        }
      } catch (simErr) {
        console.error("❌ [Test Personalization Async Error]:", simErr);
      }
    }, 5000);

    return NextResponse.json(
      {
        status: "success",
        message: "NIN Personalization request submitted successfully (Sandbox Simulation).",
        reference: testReference,
        tracking_id: sanitizedTrackingId,
        client_reference: cleanClientRef || null,
        request_status: "submitted",
        amount_charged: price,
        currency: "NGN",
        environment: "test",
      },
      { status: 201 }
    );
  }

  // 7. LIVE MODE: Active Request Conflict Check (409 Conflict)
  const existingActive = await prisma.ninPersonalizationRequest.findFirst({
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
        message: `An active personalization request is already in progress for Tracking ID ${sanitizedTrackingId}. Duplicate submission rejected to prevent double debits.`,
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
  const reference = `lora_pzn_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  const providerSetting = await prisma.globalSetting.findUnique({
    where: { key: "NIN_PERSONALIZATION_PROVIDER" },
  });
  const activeProvider = (providerSetting?.value || "DATAVERIFY").toUpperCase();

  let provider = "MANUAL";
  let externalTxId: string | null = null;
  let apiMessage = "Personalization request accepted. Processing in progress.";
  let rawApiResponse: any = null;

  if (activeProvider === "DATAVERIFY") {
    try {
      const dvRes = await submitDataVerifyPersonalization(sanitizedTrackingId);
      if (dvRes.success && dvRes.data?.status) {
        provider = "DATAVERIFY";
        externalTxId = dvRes.data.transaction_id || null;
        apiMessage = dvRes.data.message || apiMessage;
        rawApiResponse = dvRes.data;
      } else {
        // Upstream temporary issue -> Graceful fallback to MANUAL operator routing
        provider = "MANUAL";
        apiMessage = dvRes.error || "Gateway accepted order into queue for clearance.";
        rawApiResponse = dvRes.data || { error: dvRes.error };
      }
    } catch (netErr: any) {
      provider = "MANUAL";
      apiMessage = netErr.message || "Network timeout contacting verification gateway; queued internally.";
    }
  } else {
    provider = "MANUAL";
    apiMessage = "Request queued for manual verification and personalization processing.";
  }

  // 10. Atomic Balance Debit & Ticket Creation
  try {
    const createdTicket = await prisma.$transaction(async (tx) => {
      const balanceBefore = Number(user.wallet!.balance);
      const balanceAfter = balanceBefore - price;

      await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: price,
          balanceBefore,
          balanceAfter,
          type: "DEBIT",
          serviceCategory: "SERVICES",
          status: "SUCCESS",
          reference,
          description: `API NIN Personalization - Tracking ID: ${sanitizedTrackingId}`,
        },
      });

      return await tx.ninPersonalizationRequest.create({
        data: {
          userId: keyPayload.userId,
          trackingId: sanitizedTrackingId,
          reference,
          provider,
          externalTxId,
          status: "PROCESSING",
          amountCharged: price,
          apiMessage,
          apiResponse: rawApiResponse,
          isApiRequest: true,
          clientReference: cleanClientRef,
        },
      });
    });

    // Asynchronous Audit Log
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
      responseBody: { status: "success", reference, amount_charged: price },
    });

    // Developer Webhook Dispatch
    dispatchDeveloperWebhook(
      keyPayload.userId,
      "nin_personalization.submitted",
      {
        reference,
        tracking_id: sanitizedTrackingId,
        client_reference: cleanClientRef,
        request_status: "submitted",
        message: "NIN Personalization request submitted successfully.",
        amount_charged: price,
        currency: "NGN",
      },
      "LIVE"
    );

    return NextResponse.json(
      {
        status: "success",
        message: "NIN Personalization request submitted successfully.",
        reference,
        tracking_id: sanitizedTrackingId,
        client_reference: cleanClientRef,
        request_status: "submitted",
        amount_charged: price,
        currency: "NGN",
        environment: "live",
      },
      { status: 201 }
    );
  } catch (txErr: any) {
    console.error("❌ [NIN Personalization Submission Error]:", txErr);

    return NextResponse.json(
      {
        status: "error",
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while queuing your personalization request. Please retry.",
      },
      { status: 500 }
    );
  }
}
