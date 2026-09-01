/**
 * Abjiktech API Integration Client for NIN Validation
 * 
 * Base endpoint: https://abjiktech.com.ng/api/verification/
 * Authentication: ABJIKTECH_API_KEY from environment variables
 */

export type AbjiktechErrorType =
  | "no_record"
  | "simbank_validation"
  | "modification"
  | "photo_error";

export interface AbjiktechValidationSubmitData {
  transaction_id: string;
  ticket_id: string;
  nin: string;
  error_type: AbjiktechErrorType | string;
  error_type_label?: string;
  status: string; // "pending" | "processing" | etc.
  amount_charged?: string;
  balance_before?: string;
  balance_after?: string;
  note?: string;
}

export interface AbjiktechValidationSubmitResponse {
  success: boolean;
  message: string;
  data?: AbjiktechValidationSubmitData;
  allowed_types?: Record<string, string>;
}

export interface AbjiktechValidationStatusData {
  ticket_id: string;
  transaction_id?: string;
  nin?: string;
  error_type?: string;
  status: string; // "pending" | "processing" | "inprogress" | "success" | "failed" | "suspended" | "invalid nin"
  submitted_at?: string;
  message?: string;
}

export interface AbjiktechValidationStatusResponse {
  success: boolean;
  message?: string;
  data?: AbjiktechValidationStatusData;
}

export interface ParsedAbjiktechValidationResult {
  normalizedStatus: "PROCESSING" | "COMPLETED" | "FAILED";
  rawStatus: string;
  ticketId?: string;
  transactionId?: string;
  nin?: string;
  errorType?: string;
  message?: string;
}

function getAbjiktechConfig() {
  const apiKey = (process.env.ABJIKTECH_API_KEY || process.env.ABJIK_API_KEY)?.trim() || "";
  const baseUrl = "https://abjiktech.com.ng/api/verification";

  if (!apiKey) {
    console.warn("[Abjiktech] ABJIKTECH_API_KEY environment variable is not configured.");
  }

  return { apiKey, baseUrl };
}

/**
 * Maps internal category enum strings to Abjiktech error_type strings
 */
export function mapCategoryToAbjiktechErrorType(category: string): AbjiktechErrorType {
  const normalized = (category || "").toUpperCase();

  switch (normalized) {
    case "NO_RECORD_FOUND":
    case "NO_RECORD":
      return "no_record";
    case "VNIN_VALIDATION":
    case "SIMBANK_VALIDATION":
    case "SIM_BANK_VALIDATION":
      return "simbank_validation";
    case "UPDATE_RECORD_MOD":
    case "MODIFICATION":
    case "MOD_VALIDATION":
      return "modification";
    case "PHOTO_ERROR":
    case "PHOTOGRAPHIC_ERROR":
      return "photo_error";
    default:
      return "no_record";
  }
}

/**
 * Normalizes Abjiktech status string to internal NinValidationStatus enum
 */
export function normalizeAbjiktechStatus(rawStatus?: string): "PROCESSING" | "COMPLETED" | "FAILED" {
  const status = (rawStatus || "").toLowerCase().trim();

  if (status === "success" || status === "completed" || status === "successful") {
    return "COMPLETED";
  }

  if (
    status === "failed" ||
    status === "suspended" ||
    status === "invalid nin" ||
    status === "rejected" ||
    status === "error" ||
    status === "not_found"
  ) {
    return "FAILED";
  }

  // "pending", "processing", "inprogress", or anything unknown remains in processing
  return "PROCESSING";
}

/**
 * Submit NIN Validation Request to Abjiktech
 */
export async function submitAbjiktechNinValidation(
  nin: string,
  errorType: AbjiktechErrorType | string
): Promise<{ success: boolean; data?: AbjiktechValidationSubmitData; message: string; rawResponse?: unknown }> {
  try {
    const { apiKey, baseUrl } = getAbjiktechConfig();

    if (!apiKey) {
      return {
        success: false,
        message: "Abjiktech API key is not configured on the server (ABJIKTECH_API_KEY).",
      };
    }

    const sanitizedNin = nin.replace(/\D/g, "").slice(0, 11);
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
    let json: AbjiktechValidationSubmitResponse;
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
      success: json.success,
      message: json.message,
      ticketId: json.data?.ticket_id,
      transactionId: json.data?.transaction_id,
    });

    if (!json.success || !json.data) {
      return {
        success: false,
        message: json.message || "Failed to submit validation request to Abjiktech.",
        rawResponse: json,
      };
    }

    return {
      success: true,
      data: json.data,
      message: json.message || "NIN validation request submitted successfully.",
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
  rawResponse?: AbjiktechValidationStatusResponse;
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

    const endpoint = `${baseUrl}/validation_status.php`;
    const payload: Record<string, string> = {
      api_key: apiKey,
    };

    if (identifier.ticketId) payload.ticket_id = identifier.ticketId.trim();
    if (identifier.transactionId) payload.transaction_id = identifier.transactionId.trim();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

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
          ? "Status check timed out from Abjiktech."
          : "Network connection to Abjiktech status endpoint failed.",
      };
    } finally {
      clearTimeout(timeoutId);
    }

    const rawText = await response.text();
    let json: AbjiktechValidationStatusResponse;
    try {
      json = JSON.parse(rawText);
    } catch {
      console.error("[Abjiktech Status Check] Non-JSON response:", rawText.slice(0, 400));
      return {
        success: false,
        message: `Invalid response from Abjiktech status endpoint (HTTP ${response.status}).`,
      };
    }

    if (!json.success || !json.data) {
      return {
        success: false,
        message: json.message || "No status data returned for this identifier.",
        rawResponse: json,
      };
    }

    const rawStatus = (json.data.status || "pending").toLowerCase();
    const normalizedStatus = normalizeAbjiktechStatus(rawStatus);

    return {
      success: true,
      result: {
        normalizedStatus,
        rawStatus: json.data.status,
        ticketId: json.data.ticket_id,
        transactionId: json.data.transaction_id,
        nin: json.data.nin,
        errorType: json.data.error_type,
        message: json.data.message || json.message,
      },
      rawResponse: json,
      message: json.data.message || json.message || "Status retrieved successfully.",
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
