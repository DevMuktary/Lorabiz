import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/developer/api-auth";
import { getStrictApiPrice, executeDeveloperBilling } from "@/lib/developer/api-pricing";
import { recordApiRequestLog } from "@/lib/developer/logger";
import { executeNinSlipGeneration } from "@/lib/nin-slips-provider";
import { prisma } from "@/lib/prisma";
import {
  VALID_PHONE_SLIP_TYPES,
  API_PRICING_KEYS_PHONE,
  SANDBOX_NOT_FOUND_PHONES,
  normalizeNinSlipResponse,
  generateMockNinResponse,
} from "@/lib/developer/nin-normalizer";
import { ApiKeyType } from "@prisma/client";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/v1/nin/by-phone";

  // 1. Authenticate API Key (Dual-Mode: Bearer / Direct / x-api-key)
  const authResult = await authenticateApiKey(req);
  if (!authResult.authenticated || !authResult.keyPayload) {
    return authResult.errorResponse!;
  }

  const { keyPayload } = authResult;
  const environment = keyPayload.type;

  let requestBody: any = null;

  try {
    requestBody = await req.json();
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

  const { phone, slip_type, client_reference } = requestBody || {};

  // 2. Validate Phone Number format (Must be exactly 11 digits)
  if (!phone || !/^\d{11}$/.test(String(phone).trim())) {
    const errorMsg = "Please provide a valid 11-digit registered phone number.";
    recordApiRequestLog({
      userId: keyPayload.userId,
      apiKeyId: keyPayload.id,
      environment,
      method: "POST",
      endpoint,
      statusCode: 400,
      latencyMs: Date.now() - startTime,
      amountCharged: 0,
      clientReference: client_reference || null,
      requestBody,
      errorMessage: errorMsg,
    });

    return NextResponse.json(
      {
        status: "error",
        code: "VALIDATION_ERROR",
        message: errorMsg,
      },
      { status: 400 }
    );
  }

  // 3. Validate Slip Type (Must be one of the 3 supported phone slip types)
  if (!slip_type || !VALID_PHONE_SLIP_TYPES.includes(slip_type)) {
    const errorMsg = `Invalid slip_type for phone lookup. Supported types are: ${VALID_PHONE_SLIP_TYPES.join(", ")}.`;
    recordApiRequestLog({
      userId: keyPayload.userId,
      apiKeyId: keyPayload.id,
      environment,
      method: "POST",
      endpoint,
      statusCode: 400,
      latencyMs: Date.now() - startTime,
      amountCharged: 0,
      clientReference: client_reference || null,
      requestBody,
      errorMessage: errorMsg,
    });

    return NextResponse.json(
      {
        status: "error",
        code: "VALIDATION_ERROR",
        message: errorMsg,
      },
      { status: 400 }
    );
  }

  // 4. Check Global Master Toggle for Phone Lookup
  try {
    const phoneToggle = await prisma.globalSetting.findUnique({
      where: { key: "NIN_PHONE_SEARCH_ACTIVE" },
    });
    if (phoneToggle && phoneToggle.value.toLowerCase() === "false") {
      const errorMsg = "NIN phone number lookup service is temporarily offline for scheduled gateway maintenance.";
      recordApiRequestLog({
        userId: keyPayload.userId,
        apiKeyId: keyPayload.id,
        environment,
        method: "POST",
        endpoint,
        statusCode: 503,
        latencyMs: Date.now() - startTime,
        amountCharged: 0,
        clientReference: client_reference || null,
        requestBody,
        errorMessage: errorMsg,
      });

      return NextResponse.json(
        {
          status: "error",
          code: "SERVICE_MAINTENANCE",
          message: errorMsg,
        },
        { status: 503 }
      );
    }
  } catch (dbErr) {
    console.warn("⚠️ Failed to check NIN_PHONE_SEARCH_ACTIVE setting:", dbErr);
  }

  // 5. Strict Database-Driven Pricing (Zero Fallback Constants)
  const serviceKey = API_PRICING_KEYS_PHONE[slip_type];
  const priceResult = await getStrictApiPrice(serviceKey);

  if (!priceResult.configured) {
    const errorMsg = priceResult.error || "Service pricing is not configured for this phone slip format.";
    recordApiRequestLog({
      userId: keyPayload.userId,
      apiKeyId: keyPayload.id,
      environment,
      method: "POST",
      endpoint,
      statusCode: 503,
      latencyMs: Date.now() - startTime,
      amountCharged: 0,
      clientReference: client_reference || null,
      requestBody,
      errorMessage: errorMsg,
    });

    return NextResponse.json(
      {
        status: "error",
        code: "SERVICE_UNCONFIGURED",
        message: errorMsg,
      },
      { status: 503 }
    );
  }

  const requiredAmount = priceResult.price;
  const currentBalance =
    environment === ApiKeyType.LIVE
      ? keyPayload.user.walletBalance
      : keyPayload.user.sandboxBalance;

  // 6. Pre-execution Balance Verification (Charged ₦0.00 if insufficient)
  if (currentBalance < requiredAmount) {
    const errorMsg = `Insufficient ${environment.toLowerCase()} balance. Service costs ₦${requiredAmount.toFixed(
      2
    )}, but current balance is ₦${currentBalance.toFixed(2)}.`;

    recordApiRequestLog({
      userId: keyPayload.userId,
      apiKeyId: keyPayload.id,
      environment,
      method: "POST",
      endpoint,
      statusCode: 402,
      latencyMs: Date.now() - startTime,
      amountCharged: 0,
      clientReference: client_reference || null,
      requestBody,
      errorMessage: errorMsg,
    });

    return NextResponse.json(
      {
        status: "error",
        code: "INSUFFICIENT_BALANCE",
        message: errorMsg,
        environment: environment.toLowerCase(),
        transaction: {
          required_amount: requiredAmount,
          current_balance: currentBalance,
          amount_charged: 0.0,
          currency: "NGN",
        },
      },
      { status: 402 }
    );
  }

  const cleanPhone = String(phone).trim();
  const reference = `TEL_${slip_type.toUpperCase()}_${Date.now()}`;

  // 7. TEST Mode: High-fidelity simulation (No real DataVerify credits burned)
  if (environment === ApiKeyType.TEST) {
    // 7a. Explicit Sandbox Test Case: Record Not Found (422) simulation
    if (SANDBOX_NOT_FOUND_PHONES.includes(cleanPhone)) {
      const errorMsg = "No linked National Identification Number (NIN) record was found matching the provided phone number.";
      recordApiRequestLog({
        userId: keyPayload.userId,
        apiKeyId: keyPayload.id,
        environment,
        method: "POST",
        endpoint,
        statusCode: 422,
        latencyMs: Date.now() - startTime,
        amountCharged: 0,
        clientReference: client_reference || null,
        requestBody,
        errorMessage: errorMsg,
      });

      return NextResponse.json(
        {
          status: "error",
          code: "RECORD_NOT_FOUND",
          message: errorMsg,
          environment: "test",
          transaction: {
            amount_charged: 0.0,
            currency: "NGN",
          },
        },
        { status: 422 }
      );
    }
    const billingResult = await executeDeveloperBilling({
      userId: keyPayload.userId,
      environment,
      requiredAmount,
      reference,
      serviceTitle: priceResult.title,
      description: `Test Phone NIN Verification (${slip_type})`,
    });

    if (!billingResult.success) {
      return NextResponse.json(
        {
          status: "error",
          code: billingResult.code || "BILLING_ERROR",
          message: billingResult.message || "Failed to process sandbox billing.",
        },
        { status: 402 }
      );
    }

    const responseData = generateMockNinResponse({
      identifier: cleanPhone,
      searchType: "PHONE",
      slipType: slip_type,
      reference,
      clientReference: client_reference || null,
      amountCharged: requiredAmount,
      balanceAfter: billingResult.balanceAfter,
    });

    recordApiRequestLog({
      userId: keyPayload.userId,
      apiKeyId: keyPayload.id,
      environment,
      method: "POST",
      endpoint,
      statusCode: 200,
      latencyMs: Date.now() - startTime,
      amountCharged: requiredAmount,
      clientReference: client_reference || null,
      requestBody,
      responseBody: { status: "success", reference, amount_charged: requiredAmount },
    });

    return NextResponse.json(responseData, { status: 200 });
  }

  // 8. LIVE Mode: Direct DataVerify Phone Slip Generation
  try {
    const result = await executeNinSlipGeneration(slip_type, cleanPhone, "PHONE");

    if (!result.success || !result.pdfBase64) {
      const rawText = (result.error || result.message || "").toLowerCase();
      const isNotFound =
        result.failureReason === "RECORD_NOT_FOUND" ||
        rawText.includes("not exist") ||
        rawText.includes("no record") ||
        rawText.includes("not found");

      const statusCode = isNotFound ? 422 : 503;
      const errorCode = isNotFound ? "RECORD_NOT_FOUND" : "SERVICE_UNAVAILABLE";
      const cleanMessage = isNotFound
        ? "No identity record was found matching the provided phone number."
        : (result.cleanMessage || "Identity verification service is temporarily unavailable. Please try again shortly.");

      recordApiRequestLog({
        userId: keyPayload.userId,
        apiKeyId: keyPayload.id,
        environment,
        method: "POST",
        endpoint,
        statusCode,
        latencyMs: Date.now() - startTime,
        amountCharged: 0,
        clientReference: client_reference || null,
        requestBody,
        errorMessage: result.rawError || result.error || cleanMessage,
      });

      return NextResponse.json(
        {
          status: "error",
          code: errorCode,
          message: cleanMessage,
          environment: "live",
          transaction: {
            amount_charged: 0.0,
            currency: "NGN",
          },
        },
        { status: statusCode }
      );
    }

    // 9. Atomic Wallet Deduction upon successful verification
    const billingResult = await executeDeveloperBilling({
      userId: keyPayload.userId,
      walletId: keyPayload.user.walletId,
      environment,
      requiredAmount,
      reference,
      serviceTitle: priceResult.title,
      description: `Live Phone NIN Verification (${slip_type}) for ${cleanPhone.slice(0, 4)}*****${cleanPhone.slice(-3)}`,
    });

    if (!billingResult.success) {
      return NextResponse.json(
        {
          status: "error",
          code: billingResult.code || "INSUFFICIENT_BALANCE",
          message: billingResult.message || "Wallet debit failed.",
        },
        { status: 402 }
      );
    }

    // 10. Normalize into clean, straightforward lowercase contract
    const normalizedResponse = normalizeNinSlipResponse({
      rawResult: result,
      slipType: slip_type,
      reference,
      clientReference: client_reference || null,
      amountCharged: requiredAmount,
      environment,
      balanceAfter: billingResult.balanceAfter,
    });

    recordApiRequestLog({
      userId: keyPayload.userId,
      apiKeyId: keyPayload.id,
      environment,
      method: "POST",
      endpoint,
      statusCode: 200,
      latencyMs: Date.now() - startTime,
      amountCharged: requiredAmount,
      clientReference: client_reference || null,
      requestBody,
      responseBody: { status: "success", reference, amount_charged: requiredAmount },
    });

    return NextResponse.json(normalizedResponse, { status: 200 });
  } catch (err: any) {
    console.error("❌ [API /api/v1/nin/by-phone] Internal Error:", err);
    recordApiRequestLog({
      userId: keyPayload.userId,
      apiKeyId: keyPayload.id,
      environment,
      method: "POST",
      endpoint,
      statusCode: 500,
      latencyMs: Date.now() - startTime,
      amountCharged: 0,
      clientReference: client_reference || null,
      requestBody,
      errorMessage: err.message || "Internal server error",
    });

    return NextResponse.json(
      {
        status: "error",
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while generating the verification slip. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, X-Requested-With",
      "Access-Control-Max-Age": "86400",
    },
  });
}
