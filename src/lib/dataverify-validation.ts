// src/lib/dataverify-validation.ts

/**
 * DataVerify NIN Validation Integration Service
 * 
 * Endpoints:
 * - Submit Request: POST https://dataverify.com.ng/api/developers/validation.php
 * - Check Status:   POST https://dataverify.com.ng/api/developers/validation_status.php
 */

export interface DataVerifyValidationSubmitResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  nin?: string;
  validationType?: string;
  price?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  requestStatus?: string;
  rawResponse?: any;
}

export type NormalizedValidationStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface DataVerifyValidationStatusResponse {
  success: boolean;
  message: string;
  normalizedStatus: NormalizedValidationStatus;
  rawStatus: string;
  transactionId?: string;
  nin?: string;
  validationType?: string;
  response?: string;
  errorDetail?: string;
  price?: number;
  date?: string;
  completedAt?: string;
  rawResponse?: any;
}

/**
 * Retrieves the DataVerify API key from the environment
 */
function getDataVerifyApiKey(): string {
  return (
    process.env.DATAVERIFY_API_KEY ||
    process.env.DATAVERIFY_KEY ||
    ""
  ).trim();
}

/**
 * Submits a NIN Validation request to DataVerify.
 * NOTE: DataVerify currently only supports "no_record_found".
 */
export async function submitDataVerifyNinValidation(
  nin: string,
  category: string
): Promise<DataVerifyValidationSubmitResponse> {
  const sanitizedNin = typeof nin === "string" ? nin.trim().replace(/\D/g, "") : "";

  if (sanitizedNin.length !== 11) {
    return {
      success: false,
      message: "NIN must be exactly 11 digits.",
    };
  }

  // DataVerify only supports no_record_found
  if (category !== "NO_RECORD_FOUND") {
    return {
      success: false,
      message: "DataVerify automated validation currently only supports 'No Record Found' requests. Other categories must be processed manually.",
    };
  }

  const apiKey = getDataVerifyApiKey();
  if (!apiKey) {
    console.error("❌ DATAVERIFY_API_KEY is not configured in environment variables.");
    return {
      success: false,
      message: "DATAVERIFY_API_KEY is not configured on the server environment.",
    };
  }

  const endpoint = "https://dataverify.com.ng/api/developers/validation.php";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        nin: sanitizedNin,
        validation_type: "no_record_found",
      }),
      signal: AbortSignal.timeout(25000),
    });

    const rawText = await response.text();
    let data: any = {};

    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("[DataVerify Validation Submit] Non-JSON response:", rawText.slice(0, 300));
      return {
        success: false,
        message: `Invalid response from DataVerify gateway (HTTP ${response.status}).`,
        rawResponse: rawText,
      };
    }

    console.log(`📡 [DataVerify Validation Submit Response] [HTTP ${response.status}]:`, data);

    // Success response:
    // { status: true, message: "...", transaction_id: "...", price: 800, balance_before: 5000, balance_after: 4200, request_status: "pending" }
    if (data.status === true || data.request_status === "pending" || Boolean(data.transaction_id)) {
      return {
        success: true,
        message: data.message || "NIN Validation request submitted successfully to DataVerify.",
        transactionId: data.transaction_id,
        nin: data.nin || sanitizedNin,
        validationType: data.validation_type || "no_record_found",
        price: data.price,
        balanceBefore: data.balance_before,
        balanceAfter: data.balance_after,
        requestStatus: data.request_status || "pending",
        rawResponse: data,
      };
    }

    // Insufficient balance handling
    let errorMsg = data.message || "Failed to submit validation request to DataVerify.";
    if (data.balance !== undefined && data.price !== undefined) {
      errorMsg = `DataVerify API Error: Insufficient provider account balance (₦${data.price} needed, current balance: ₦${data.balance}). Please fund your DataVerify developer account.`;
    }

    return {
      success: false,
      message: errorMsg,
      transactionId: data.transaction_id,
      rawResponse: data,
    };
  } catch (err: any) {
    const isTimeout = err?.name === "TimeoutError" || err?.name === "AbortError";
    console.error("[DataVerify Validation Submit Error]:", err);
    return {
      success: false,
      message: isTimeout
        ? "DataVerify gateway request timed out. Please retry in a few moments."
        : err?.message || "Failed to reach DataVerify validation API.",
    };
  }
}

/**
 * Checks the status of a NIN Validation request on DataVerify.
 */
export async function checkDataVerifyNinValidationStatus(identifier: {
  transactionId?: string;
  nin?: string;
}): Promise<DataVerifyValidationStatusResponse> {
  const apiKey = getDataVerifyApiKey();
  if (!apiKey) {
    return {
      success: false,
      message: "DATAVERIFY_API_KEY is not configured on the server environment.",
      normalizedStatus: "FAILED",
      rawStatus: "CONFIG_ERROR",
    };
  }

  const endpoint = "https://dataverify.com.ng/api/developers/validation_status.php";
  const payload: any = { api_key: apiKey };

  if (identifier.transactionId && identifier.transactionId.trim()) {
    payload.transaction_id = identifier.transactionId.trim();
  } else if (identifier.nin && identifier.nin.trim()) {
    payload.nin = identifier.nin.trim().replace(/\D/g, "");
  } else {
    return {
      success: false,
      message: "Either transactionId or NIN must be provided to check status.",
      normalizedStatus: "FAILED",
      rawStatus: "INVALID_IDENTIFIER",
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });

    const rawText = await response.text();
    let data: any = {};

    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("[DataVerify Validation Status] Non-JSON response:", rawText.slice(0, 300));
      return {
        success: false,
        message: `Invalid response from DataVerify status gateway (HTTP ${response.status}).`,
        normalizedStatus: "PROCESSING",
        rawStatus: "GATEWAY_ERROR",
        rawResponse: rawText,
      };
    }

    console.log(`📡 [DataVerify Validation Status Response] [HTTP ${response.status}]:`, data);

    const reqStatus = (data.request_status || "").toLowerCase().trim();

    let normalized: NormalizedValidationStatus = "PROCESSING";
    if (reqStatus === "validated" || reqStatus === "success" || reqStatus === "completed") {
      normalized = "COMPLETED";
    } else if (reqStatus === "failed" || reqStatus === "rejected") {
      normalized = "FAILED";
    } else if (reqStatus === "pending") {
      normalized = "PENDING";
    } else {
      normalized = "PROCESSING";
    }

    const isSuccess = data.status !== false || normalized === "COMPLETED";

    return {
      success: isSuccess,
      message: data.message || (normalized === "COMPLETED" ? "Validation completed successfully." : "Status retrieved successfully."),
      normalizedStatus: normalized,
      rawStatus: reqStatus || (data.status === true ? "pending" : "unknown"),
      transactionId: data.transaction_id || identifier.transactionId,
      nin: data.nin || identifier.nin,
      validationType: data.validation_type,
      response: data.response,
      errorDetail: data.error_detail,
      price: data.price,
      date: data.date,
      completedAt: data.completed_at,
      rawResponse: data,
    };
  } catch (err: any) {
    const isTimeout = err?.name === "TimeoutError" || err?.name === "AbortError";
    console.error("[DataVerify Validation Status Error]:", err);
    return {
      success: false,
      message: isTimeout
        ? "Connection to DataVerify status endpoint timed out."
        : err?.message || "Failed to reach DataVerify status endpoint.",
      normalizedStatus: "PROCESSING",
      rawStatus: "NETWORK_ERROR",
    };
  }
}
