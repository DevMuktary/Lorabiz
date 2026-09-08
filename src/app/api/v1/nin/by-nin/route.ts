import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/developer/api-auth";
import { getStrictApiPrice, executeDeveloperBilling } from "@/lib/developer/api-pricing";
import { recordApiRequestLog } from "@/lib/developer/logger";
import { executeNinSlipGeneration } from "@/lib/nin-slips-provider";
import {
  VALID_NIN_SLIP_TYPES,
  API_PRICING_KEYS_NIN,
  SANDBOX_NOT_FOUND_NINS,
  normalizeNinSlipResponse,
  generateMockNinResponse,
} from "@/lib/developer/nin-normalizer";
import { ApiKeyType } from "@prisma/client";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const endpoint = "/api/v1/nin/by-nin";

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

  const { nin, slip_type, client_reference, include_slip } = requestBody || {};

  // 2. Validate NIN format (Must be exactly 11 digits)
  if (!nin || !/^\d{11}$/.test(String(nin).trim())) {
    const errorMsg = "Please provide a valid 11-digit National Identification Number (NIN).";
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

  // 3. Validate Slip Type (Must be one of the 5 supported NIN slip types)
  if (!slip_type || !VALID_NIN_SLIP_TYPES.includes(slip_type)) {
    const errorMsg = `Invalid slip_type provided. Supported types for NIN search are: ${VALID_NIN_SLIP_TYPES.join(", ")}.`;
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

  // 4. Strict Database-Driven Pricing (Zero Fallback Constants)
  const serviceKey = API_PRICING_KEYS_NIN[slip_type];
  const priceResult = await getStrictApiPrice(serviceKey);

  if (!priceResult.configured) {
    const errorMsg = priceResult.error || "Service pricing is not configured for this slip format.";
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

  // 5. Pre-execution Balance Verification (Charged ₦0.00 if insufficient)
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

  const cleanNin = String(nin).trim();
  const reference = `NIN_${slip_type.toUpperCase()}_${Date.now()}`;

  // 6. TEST Mode: High-fidelity simulation (No real DataVerify credits burned)
  if (environment === ApiKeyType.TEST) {
    // 6a. Explicit Sandbox Test Case: Record Not Found (422) simulation
    if (SANDBOX_NOT_FOUND_NINS.includes(cleanNin)) {
      const errorMsg = "No identity record was found matching the provided National Identification Number (NIN).";
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
      description: `Test NIN Verification (${slip_type})`,
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
      identifier: cleanNin,
      searchType: "NIN",
      slipType: slip_type,
      reference,
      clientReference: client_reference || null,
      amountCharged: requiredAmount,
      balanceAfter: billingResult.balanceAfter,
      includeSlip: include_slip !== false,
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

  // 7. LIVE Mode: Direct DataVerify Slip Generation
  try {
    const result = await executeNinSlipGeneration(slip_type, cleanNin, "NIN");

    if (!result.success || !result.pdfBase64) {
      const rawError = result.error || result.message || "Could not resolve identity with the provided NIN.";
      const isNotFound =
        rawError.toLowerCase().includes("not found") ||
        rawError.toLowerCase().includes("no record") ||
        rawError.toLowerCase().includes("does not exist") ||
        rawError.toLowerCase().includes("invalid nin");

      const statusCode = isNotFound ? 422 : 503;
      const errorCode = isNotFound ? "RECORD_NOT_FOUND" : "PROVIDER_ERROR";

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
        errorMessage: rawError,
      });

      return NextResponse.json(
        {
          status: "error",
          code: errorCode,
          message: rawError,
          environment: "live",
          transaction: {
            amount_charged: 0.0,
            currency: "NGN",
          },
        },
        { status: statusCode }
      );
    }

    // 8. Atomic Wallet Deduction upon successful verification
    const billingResult = await executeDeveloperBilling({
      userId: keyPayload.userId,
      walletId: keyPayload.user.walletId,
      environment,
      requiredAmount,
      reference,
      serviceTitle: priceResult.title,
      description: `Live NIN Verification (${slip_type}) for ${cleanNin.slice(0, 3)}*****${cleanNin.slice(-3)}`,
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

    // 9. Normalize into clean, straightforward lowercase contract
    const normalizedResponse = normalizeNinSlipResponse({
      rawResult: result,
      slipType: slip_type,
      reference,
      clientReference: client_reference || null,
      amountCharged: requiredAmount,
      environment,
      balanceAfter: billingResult.balanceAfter,
      includeSlip: include_slip !== false,
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
    console.error("❌ [API /api/v1/nin/by-nin] Internal Error:", err);
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
