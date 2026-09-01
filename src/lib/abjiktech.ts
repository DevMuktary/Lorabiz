// src/lib/abjiktech.ts

/**
 * Abjiktech NIN Validation Integration Service
 * 
 * Documentation Endpoints:
 * - Submit Request: POST https://abjiktech.com.ng/api/verification/validation.php
 * - Check Status:   POST https://abjiktech.com.ng/api/verification/validation_status.php
 *   (Fallback:     POST https://abjiktech.com.ng/api/verification/get_status.php)
 */

export interface AbjiktechValidationSubmitData {
  transaction_id?: string;
  ticket_id?: string;
  nin?: string;
  error_type?: string;
  error_type_label?: string;
  status?: string;
  amount_charged?: string;
  balance_before?: string;
  balance_after?: string;
  note?: string;
  message?: string;
  [key: string]: any;
}

export interface AbjiktechValidationSubmitResponse {
  success?: boolean | string | number;
  status?: string | boolean | number;
  message?: string;
  msg?: string;
  data?: AbjiktechValidationSubmitData;
  [key: string]: any;
}

export interface AbjiktechValidationStatusData {
  ticket_id?: string;
  transaction_id?: string;
  nin?: string;
  error_type?: string;
  status?: string; // "pending" | "success" | "failed" | "completed" | "processing" | "invalid nin"
  submitted_at?: string;
  completed_at?: string;
  message?: string;
  [key: string]: any;
}

export interface AbjiktechValidationStatusResponse {
  success?: boolean | string | number;
  status?: string | boolean | number;
  message?: string;
  msg?: string;
  data?: AbjiktechValidationStatusData;
  [key: string]: any;
}

export type NormalizedValidationStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface ParsedAbjiktechValidationResult {
  normalizedStatus: NormalizedValidationStatus;
  rawStatus: string;
  ticketId?: string;
  transactionId?: string;
  nin?: string;
  errorType?: string;
  message?: string;
}

/**
 * Maps Lorabiz NinValidationCategory enum to Abjiktech error_type
 */
export function mapCategoryToAbjiktechErrorType(category: string): string {
  switch (category) {
    case "NO_RECORD_FOUND":
      return "no_record";
    case "VNIN_VALIDATION":
      return "simbank_validation";
    case "UPDATE_RECORD_MOD":
      return "modification";
    case "PHOTO_ERROR":
      return "photo_error";
    default:
      return category.toLowerCase();
  }
}

/**
 * Normalizes Abjiktech raw status string into standard status
 */
export function normalizeAbjiktechStatus(rawStatus?: string | null): NormalizedValidationStatus {
  if (!rawStatus) return "PROCESSING";
  const s = rawStatus.toLowerCase().trim();

  if (s === "success" || s === "completed" || s === "approved" || s === "successful" || s === "done") {
    return "COMPLETED";
  }

  if (
    s === "failed" ||
    s === "rejected" ||
    s === "invalid" ||
    s === "invalid nin" ||
    s === "cancelled" ||
    s === "suspended" ||
    s === "not_found"
  ) {
    return "FAILED";
  }

  if (s === "pending" || s === "processing" || s === "in_progress" || s === "queued" || s === "submitted") {
    return "PROCESSING";
  }

  return "PROCESSING";
}

/**
 * Reads configured Abjiktech API Credentials
 */
function getAbjiktechConfig() {
  const apiKey =
    process.env.ABJIKTECH_API_KEY ||
    process.env.ABJIK_API_KEY ||
    process.env.ABJIKTECH_KEY ||
    "";

  const baseUrl =
    process.env.ABJIKTECH_BASE_URL ||
    "https://abjiktech.com.ng/api/verification";

  return { apiKey: apiKey.trim(), baseUrl: baseUrl.replace(/\/+$/, "") };
}

/**
 * Determines if an API response indicates success
 */
function isSuccessResponse(json: any, httpStatus: number): boolean {
  if (json.success === true || json.success === "true" || json.success === 1 || json.success === "1") {
    return true;
  }
  if (
    json.status === "success" ||
    json.status === "pending" ||
    json.status === "completed" ||
    json.status === true ||
    json.status === "true" ||
    json.status === 200 ||
    json.status === "200"
  ) {
    return true;
  }
  const msg = (json.message || json.msg || json.note || "").toLowerCase();
  if (
    msg.includes("submitted successfully") ||
    msg.includes("request submitted") ||
    msg.includes("pending processing") ||
    msg.includes("success")
  ) {
    return true;
  }
  if (httpStatus === 200 && (json.data || json.ticket_id || json.transaction_id)) {
    return true;
  }
  return false;
}

/**
 * Submits NIN Validation Request to Abjiktech API
 */
export async function submitAbjiktechNinValidation(
  nin: string,
  errorType: string
): Promise<{
  success: boolean;
  data?: AbjiktechValidationSubmitData;
  rawResponse?: any;
  message: string;
}> {
  try {
    const { apiKey, baseUrl } = getAbjiktechConfig();

    if (!apiKey) {
      return {
        success: false,
        message: "ABJIKTECH_API_KEY is not configured on the server environment.",
      };
    }

    const sanitizedNin = nin.replace(/\D/g, "");
    if (sanitizedNin.length !== 11) {
      return {
        success: false,
        message: "Invalid NIN format. Must be exactly 11 digits.",
      };
    }

    const resolvedErrorType = mapCategoryToAbjiktechErrorType(errorType);
    const endpoint = `${baseUrl}/validation.php`;

    const payload = {
      api_key: apiKey,
      nin: sanitizedNin,
      error_type: resolvedErrorType,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr.name === "AbortError";
      return {
        success: false,
        message: isTimeout
          ? "Abjiktech gateway request timed out. Please retry in a few moments."
          : "Network connection to Abjiktech gateway failed.",
      };
    } finally {
      clearTimeout(timeoutId);
    }

    const rawText = await response.text();
    let json: any;
    try {
      json = JSON.parse(rawText);
    } catch {
      console.error("[Abjiktech Submit] Non-JSON response:", rawText.slice(0, 400));
      return {
        success: false,
        message: `Invalid response format received from Abjiktech gateway (HTTP ${response.status}).`,
        rawResponse: rawText,
      };
    }

    console.log("[Abjiktech Submit Response]", {
      httpStatus: response.status,
      parsed: json,
    });

    const isSuccess = isSuccessResponse(json, response.status);

    // Extract data object (handles nested data or flat root)
    const dataObj: any = json.data || json.result || json.response || json || {};

    const ticketId =
      dataObj.ticket_id ||
      dataObj.ticketId ||
      dataObj.ticket ||
      json.ticket_id ||
      json.ticketId ||
      json.ticket ||
      null;

    const transactionId =
      dataObj.transaction_id ||
      dataObj.transactionId ||
      dataObj.tx_id ||
      dataObj.txId ||
      dataObj.reference ||
      json.transaction_id ||
      json.transactionId ||
      null;

    const message =
      json.message ||
      json.msg ||
      dataObj.message ||
      dataObj.note ||
      (isSuccess ? "NIN validation request submitted successfully." : "Submission failed on Abjiktech.");

    const normalizedData: AbjiktechValidationSubmitData = {
      ticket_id: ticketId || `TKT_${Date.now()}`,
      transaction_id: transactionId || `nin_val_${Date.now()}`,
      nin: dataObj.nin || json.nin || sanitizedNin,
      error_type: dataObj.error_type || resolvedErrorType,
      error_type_label: dataObj.error_type_label || resolvedErrorType,
      status: dataObj.status || json.status || "pending",
      amount_charged: dataObj.amount_charged,
      balance_before: dataObj.balance_before,
      balance_after: dataObj.balance_after,
      note: dataObj.note || message,
      message,
    };

    if (!isSuccess && !ticketId && !transactionId) {
      return {
        success: false,
        message,
        rawResponse: json,
      };
    }

    return {
      success: true,
      data: normalizedData,
      message,
      rawResponse: json,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unexpected error submitting to Abjiktech";
    console.error("[Abjiktech Submit Error]:", msg);
    return {
      success: false,
      message: msg,
    };
  }
}

/**
 * Check Status of NIN Validation on Abjiktech
 */
export async function checkAbjiktechNinValidationStatus(identifier: {
  ticketId?: string;
  transactionId?: string;
}): Promise<{
  success: boolean;
  result?: ParsedAbjiktechValidationResult;
  rawResponse?: any;
  message: string;
}> {
  try {
    const { apiKey, baseUrl } = getAbjiktechConfig();

    if (!apiKey) {
      return {
        success: false,
        message: "Abjiktech API key is not configured on the server.",
      };
    }

    if (!identifier.ticketId && !identifier.transactionId) {
      return {
        success: false,
        message: "Either ticket_id or transaction_id must be provided to check status.",
      };
    }

    const payload: Record<string, string> = {
      api_key: apiKey,
    };

    if (identifier.ticketId) payload.ticket_id = identifier.ticketId.trim();
    if (identifier.transactionId) payload.transaction_id = identifier.transactionId.trim();

    // Primary endpoint: validation_status.php; Fallback: get_status.php
    const endpoints = [
      `${baseUrl}/validation_status.php`,
      `${baseUrl}/get_status.php`,
    ];

    let json: any = null;
    let lastError = "";

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.status === 404) {
          continue; // Try next endpoint
        }

        const rawText = await response.text();
        try {
          json = JSON.parse(rawText);
          break; // successfully parsed JSON
        } catch {
          lastError = `Invalid non-JSON response from ${endpoint}`;
          continue;
        }
      } catch (endpointErr: any) {
        lastError = endpointErr?.message || "Endpoint error";
      }
    }

    if (!json) {
      return {
        success: false,
        message: lastError || "Failed to reach Abjiktech status endpoint.",
      };
    }

    const isSuccess = isSuccessResponse(json, 200);
    const dataObj: any = json.data || json.result || json.response || json || {};

    const rawStatus = (dataObj.status || json.status || "pending").toString();
    const normalizedStatus = normalizeAbjiktechStatus(rawStatus);

    const ticketId = dataObj.ticket_id || json.ticket_id || identifier.ticketId;
    const transactionId = dataObj.transaction_id || json.transaction_id || identifier.transactionId;
    const message = dataObj.message || json.message || json.msg || "Status retrieved successfully.";

    return {
      success: isSuccess,
      result: {
        normalizedStatus,
        rawStatus,
        ticketId,
        transactionId,
        nin: dataObj.nin || json.nin,
        errorType: dataObj.error_type || json.error_type,
        message,
      },
      rawResponse: json,
      message,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unexpected error during Abjiktech status check";
    console.error("[Abjiktech Status Check Error]:", msg);
    return {
      success: false,
      message: msg,
    };
  }
}
