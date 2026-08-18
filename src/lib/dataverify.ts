/**
 * DataVerify API Integration Client for NIN Personalization, IPE Clearance & NIN Slips
 * 
 * Base endpoint: https://dataverify.com.ng/api/developers/
 * Authentication: DATAVERIFY_API_KEY from environment variables
 */

export interface DataVerifyPersonalizationUserData {
  nin?: string;
  firstname?: string;
  surname?: string;
  middlename?: string;
  birthdate?: string;
  gender?: string;
  telephoneno?: string;
  residence_state?: string;
  photo?: string;
  [key: string]: unknown;
}

export interface DataVerifyPersonalizationSubmitResponse {
  status: boolean;
  accepted?: boolean;
  category?: string;
  transaction_id?: string;
  price?: number;
  balance_before?: number;
  balance_after?: number;
  request_status?: string; // "pending" | "processing"
  error?: string;
  error_code?: string;
  message?: string;
}

export interface DataVerifyPersonalizationStatusResponse {
  status: boolean;
  request_status: string; // "pending" | "processing" | "completed" | "failed"
  category?: string;
  transaction_id?: string;
  tracking_id?: string;
  nin?: string;
  pdf_base64?: string;
  user_data?: DataVerifyPersonalizationUserData;
  error_detail?: string;
  refunded?: boolean;
  message?: string;
  error?: string;
}

export interface ParsedPersonalizationResult {
  normalizedStatus: "PROCESSING" | "COMPLETED" | "FAILED";
  resolvedNin?: string;
  fullName?: string;
  dob?: string;
  gender?: string;
  phone?: string;
  residenceState?: string;
  photoUrl?: string;
  pdfBase64?: string;
  userData?: DataVerifyPersonalizationUserData;
  errorDetail?: string;
  message?: string;
}

export interface DataVerifyIpeSubmitResponse {
  status: boolean;
  message?: string;
  trackingID?: string;
  transaction_id?: string;
  price?: number;
  balance_before?: number;
  balance_after?: number;
  request_status?: string;
  error?: string;
}

export interface DataVerifyIpeStatusResponse {
  status: boolean;
  request_status?: string; // "completed" | "pending" | "failed" | "inprogress"
  trackingID?: string;
  newNIN?: string;
  newTrackingID?: string;
  date?: string;
  error_detail?: string;
  message?: string;
  error?: string;
}

export interface ParsedDataVerifyIpeResult {
  normalizedStatus: "PROCESSING" | "COMPLETED" | "FAILED";
  resolvedNin?: string;
  newTrackingId?: string;
  completedDate?: string;
  errorDetail?: string;
  message?: string;
}

function getDataVerifyConfig() {
  const apiKey = process.env.DATAVERIFY_API_KEY?.trim() || "";
  const baseUrl = "https://dataverify.com.ng/api/developers";

  if (!apiKey) {
    console.warn("[DataVerify] DATAVERIFY_API_KEY environment variable is not configured.");
  }

  return { apiKey, baseUrl };
}

// ============================================================================
// NIN PERSONALIZATION
// ============================================================================

/**
 * Submit Tracking ID for NIN Personalization to DataVerify
 */
export async function submitDataVerifyPersonalization(
  trackingId: string
): Promise<{ success: boolean; data?: DataVerifyPersonalizationSubmitResponse; error?: string }> {
  try {
    const { apiKey, baseUrl } = getDataVerifyConfig();

    if (!apiKey) {
      return { success: false, error: "DataVerify API key is not configured on the server." };
    }

    const endpoint = `${baseUrl}/personalization.php`;
    const payload = {
      api_key: apiKey,
      tracking_id: trackingId.trim(),
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: DataVerifyPersonalizationSubmitResponse = await response.json().catch(() => ({
      status: false,
      error: `Invalid response from DataVerify (HTTP ${response.status})`,
    }));

    if (!response.ok || data.status === false || data.accepted === false) {
      return {
        success: false,
        error: data.error || data.message || `Personalization submission failed with HTTP ${response.status}`,
        data,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error during personalization submission";
    console.error("[DataVerify Personalization Submit Error]:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Check Status of NIN Personalization on DataVerify
 */
export async function checkDataVerifyPersonalizationStatus(
  transactionId?: string,
  trackingId?: string
): Promise<{ success: boolean; data?: DataVerifyPersonalizationStatusResponse; error?: string }> {
  try {
    const { apiKey, baseUrl } = getDataVerifyConfig();

    if (!apiKey) {
      return { success: false, error: "DataVerify API key is not configured on the server." };
    }

    const endpoint = `${baseUrl}/personalization_status.php`;
    const payload: Record<string, unknown> = {
      api_key: apiKey,
      include_slip: true,
    };

    if (transactionId) payload.transaction_id = transactionId.trim();
    if (trackingId) payload.tracking_id = trackingId.trim();

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: DataVerifyPersonalizationStatusResponse = await response.json().catch(() => ({
      status: false,
      request_status: "failed",
      error: `Invalid JSON response from DataVerify (HTTP ${response.status})`,
    }));

    return {
      success: true,
      data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error during personalization status check";
    console.error("[DataVerify Personalization Status Check Error]:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Parse and normalize DataVerify Personalization response
 */
export function parseDataVerifyPersonalizationResult(
  response: DataVerifyPersonalizationStatusResponse
): ParsedPersonalizationResult {
  const rawStatus = (response.request_status || (response.status ? "pending" : "failed")).toLowerCase();

  let normalizedStatus: "PROCESSING" | "COMPLETED" | "FAILED" = "PROCESSING";

  if (rawStatus === "completed" || rawStatus === "success" || rawStatus === "successful") {
    normalizedStatus = "COMPLETED";
  } else if (
    rawStatus === "failed" ||
    rawStatus === "rejected" ||
    rawStatus === "error" ||
    response.status === false
  ) {
    normalizedStatus = "FAILED";
  } else {
    normalizedStatus = "PROCESSING";
  }

  let resolvedNin: string | undefined = response.nin;
  let fullName: string | undefined;
  let dob: string | undefined;
  let gender: string | undefined;
  let phone: string | undefined;
  let residenceState: string | undefined;
  let photoUrl: string | undefined;

  if (response.user_data) {
    const ud = response.user_data;
    if (!resolvedNin && ud.nin) resolvedNin = ud.nin;
    const names = [ud.firstname, ud.middlename, ud.surname].filter(Boolean).join(" ").trim();
    if (names) fullName = names;
    if (ud.birthdate) dob = ud.birthdate;
    if (ud.gender) gender = ud.gender;
    if (ud.telephoneno) phone = ud.telephoneno;
    if (ud.residence_state) residenceState = ud.residence_state;
    if (ud.photo) photoUrl = ud.photo;
  }

  return {
    normalizedStatus,
    resolvedNin,
    fullName,
    dob,
    gender,
    phone,
    residenceState,
    photoUrl,
    pdfBase64: response.pdf_base64,
    userData: response.user_data,
    errorDetail: response.error_detail || response.message || response.error,
    message: response.message,
  };
}

// ============================================================================
// NIMC IPE CLEARANCE (DataVerify Gateway)
// ============================================================================

/**
 * Submit IPE Clearance to DataVerify
 */
export async function submitDataVerifyIpe(
  trackingId: string
): Promise<{ success: boolean; data?: DataVerifyIpeSubmitResponse; error?: string }> {
  try {
    const { apiKey, baseUrl } = getDataVerifyConfig();

    if (!apiKey) {
      return { success: false, error: "DataVerify API key is not configured on the server." };
    }

    const endpoint = `${baseUrl}/ipe.php`;
    const payload = {
      api_key: apiKey,
      trackingID: trackingId.trim(),
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: DataVerifyIpeSubmitResponse = await response.json().catch(() => ({
      status: false,
      error: `Invalid response from DataVerify IPE endpoint (HTTP ${response.status})`,
    }));

    if (!response.ok || data.status === false) {
      return {
        success: false,
        error: data.error || data.message || `DataVerify IPE submission failed with HTTP ${response.status}`,
        data,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error during DataVerify IPE submission";
    console.error("[DataVerify IPE Submit Error]:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Check IPE Clearance Status on DataVerify
 */
export async function checkDataVerifyIpeStatus(
  trackingId: string
): Promise<{ success: boolean; data?: DataVerifyIpeStatusResponse; error?: string }> {
  try {
    const { apiKey, baseUrl } = getDataVerifyConfig();

    if (!apiKey) {
      return { success: false, error: "DataVerify API key is not configured on the server." };
    }

    const endpoint = `${baseUrl}/ipe_status.php`;
    const payload = {
      api_key: apiKey,
      trackingID: trackingId.trim(),
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: DataVerifyIpeStatusResponse = await response.json().catch(() => ({
      status: false,
      request_status: "failed",
      error: `Invalid response from DataVerify IPE status (HTTP ${response.status})`,
    }));

    return {
      success: true,
      data,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error during DataVerify IPE status check";
    console.error("[DataVerify IPE Status Check Error]:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Parse and normalize DataVerify IPE Status response
 */
export function parseDataVerifyIpeResult(
  response: DataVerifyIpeStatusResponse
): ParsedDataVerifyIpeResult {
  const rawStatus = (response.request_status || (response.status ? "pending" : "failed")).toLowerCase();

  let normalizedStatus: "PROCESSING" | "COMPLETED" | "FAILED" = "PROCESSING";

  if (rawStatus === "completed" || rawStatus === "success" || rawStatus === "successful") {
    normalizedStatus = "COMPLETED";
  } else if (
    rawStatus === "failed" ||
    rawStatus === "rejected" ||
    rawStatus === "error" ||
    rawStatus === "blocked" ||
    rawStatus === "incompleted" ||
    rawStatus === "insufficient_fingerprint" ||
    rawStatus === "abis" ||
    response.status === false
  ) {
    normalizedStatus = "FAILED";
  } else {
    normalizedStatus = "PROCESSING";
  }

  return {
    normalizedStatus,
    resolvedNin: response.newNIN,
    newTrackingId: response.newTrackingID,
    completedDate: response.date,
    errorDetail: response.error_detail || response.message || response.error,
    message: response.message,
  };
}
