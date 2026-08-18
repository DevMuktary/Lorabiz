/**
 * SlipAPI Integration Client for NIN Verification Slips
 * 
 * Supports:
 * - Standard Slip (NIN): https://slipapi.com/developers/nin_slips/nin_standard.php
 * - Premium Slip (NIN): https://slipapi.com/developers/nin_slips/nin_premium.php
 * - Phone Search Slips (Regular / Standard / Premium): https://slipapi.com/developers/nin_slips/nin_premium_phone.php or nin_by_phone.php
 * 
 * Authentication: SLIPAPI_API_KEY from environment variables
 */

export interface SlipApiUserData {
  nin?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  gender?: string;
  date_of_birth?: string;
  phone_number?: string;
  address?: string;
  [key: string]: unknown;
}

export interface SlipApiResponse {
  status?: string | boolean;
  response_code?: string;
  message?: string;
  error?: string;
  user_data?: SlipApiUserData;
  pdf_base64?: string;
}

export interface NormalizedSlipResult {
  success: boolean;
  pdfBase64?: string;
  userData?: SlipApiUserData;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  gender?: string;
  dob?: string;
  phone?: string;
  address?: string;
  nin?: string;
  message?: string;
  error?: string;
  provider: "SLIPAPI" | "DATAVERIFY";
}

function getSlipApiConfig() {
  const apiKey = process.env.SLIPAPI_API_KEY?.trim() || "";
  const baseUrl = "https://slipapi.com/developers/nin_slips";
  return { apiKey, baseUrl };
}

/**
 * Generate NIN Slip via SlipAPI
 * 
 * @param slipType "nin_standard" | "nin_premium" | "nin_regular"
 * @param identifier 11-digit NIN or Phone number
 * @param searchType "NIN" | "PHONE"
 */
export async function generateSlipApiSlip(
  slipType: string,
  identifier: string,
  searchType: "NIN" | "PHONE" = "NIN"
): Promise<NormalizedSlipResult> {
  try {
    const { apiKey, baseUrl } = getSlipApiConfig();

    if (!apiKey) {
      return {
        success: false,
        error: "Identity verification gateway is temporarily offline for maintenance.",
        provider: "SLIPAPI",
      };
    }

    // Determine target endpoint
    let endpointUrl = "";
    if (searchType === "PHONE") {
      if (slipType === "nin_premium") {
        endpointUrl = `${baseUrl}/nin_premium_phone.php`;
      } else if (slipType === "nin_standard") {
        endpointUrl = `${baseUrl}/nin_standard_phone.php`;
      } else {
        endpointUrl = `${baseUrl}/nin_regular_phone.php`;
      }
    } else {
      // By NIN
      if (slipType === "nin_premium") {
        endpointUrl = `${baseUrl}/nin_premium.php`;
      } else if (slipType === "nin_standard") {
        endpointUrl = `${baseUrl}/nin_standard.php`;
      } else {
        return {
          success: false,
          error: "This slip format is temporarily undergoing system maintenance. Please select Standard or Premium Slip.",
          provider: "SLIPAPI",
        };
      }
    }

    const payload: Record<string, string> = {
      api_key: apiKey,
      nin: identifier.trim(),
    };

    if (searchType === "PHONE") {
      payload.phone = identifier.trim();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let response: Response;
    try {
      response = await fetch(endpointUrl, {
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
        error: isTimeout ? "Verification request timed out. Please try again shortly." : "Network connection to verification gateway failed. Please try again.",
        provider: "SLIPAPI",
      };
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status >= 500) {
      return {
        success: false,
        error: "Verification service is temporarily experiencing high traffic. Please try again shortly.",
        provider: "SLIPAPI",
      };
    }

    const data: SlipApiResponse = await response.json().catch(() => ({
      status: "error",
      error: "Unable to process verification slip response.",
    }));

    const isSuccess =
      response.ok &&
      (data.status === "success" || data.status === true || data.response_code === "00") &&
      Boolean(data.pdf_base64);

    if (!isSuccess) {
      let rawMsg = data.error || data.message || "Could not generate verification slip with the provided details.";
      const lower = rawMsg.toLowerCase();
      if (lower.includes("slipapi") || lower.includes("dataverify") || lower.includes("http") || lower.includes("server error")) {
        rawMsg = "Verification gateway is temporarily busy. Please check your details or try again shortly.";
      }
      return {
        success: false,
        error: rawMsg,
        message: rawMsg,
        provider: "SLIPAPI",
      };
    }

    const u = data.user_data || {};
    const firstName = (u.first_name as string) || "";
    const middleName = (u.middle_name as string) || "";
    const lastName = (u.last_name as string) || "";
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

    return {
      success: true,
      pdfBase64: data.pdf_base64,
      userData: u,
      fullName: fullName || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      middleName: middleName || undefined,
      gender: u.gender as string | undefined,
      dob: (u.date_of_birth as string) || (u.dob as string) || undefined,
      phone: (u.phone_number as string) || (searchType === "PHONE" ? identifier : undefined),
      address: u.address as string | undefined,
      nin: (u.nin as string) || (searchType === "NIN" ? identifier : undefined),
      message: data.message || "Slip generated successfully.",
      provider: "SLIPAPI",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected error during slip processing";
    console.error("❌ [Slip Gateway Error]:", errorMsg);
    return {
      success: false,
      error: "An unexpected error occurred while processing your verification slip. Please try again.",
      provider: "SLIPAPI",
    };
  }
}
