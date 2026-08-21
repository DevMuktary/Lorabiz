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
  photo?: string;
  signature?: string;
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
        endpointUrl = `${baseUrl}/nin_by_phone.php`;
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

    const rawText = await response.text();
    let data: any;

    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("❌ [SlipAPI] Non-JSON response received:", rawText.slice(0, 400));
      return {
        success: false,
        error: "Verification gateway returned an invalid response. Please try again.",
        provider: "SLIPAPI",
      };
    }

    // 📡 SANITIZED DEBUG LOG FOR RAILWAY CONSOLE
    const debugKeys = Object.keys(data).filter((k) => k !== "pdf_base64");
    console.log(`📡 [SlipAPI Response: ${endpointUrl}] [HTTP ${response.status}]`, {
      status: data.status,
      response_code: data.response_code,
      message: data.message || data.error,
      has_pdf_base64: Boolean(data.pdf_base64),
      pdf_base64_length: typeof data.pdf_base64 === "string" ? data.pdf_base64.length : 0,
      root_keys_received: debugKeys,
      user_data: data.user_data || data.data || data.details || (Array.isArray(data.response) ? data.response[0] : data.response) || null,
      raw_sample: Object.fromEntries(
        debugKeys.map((k) => [k, typeof data[k] === "object" ? data[k] : String(data[k]).slice(0, 100)])
      ),
    });

    const isSuccess =
      response.ok &&
      (data.status === "success" || data.status === true || data.response_code === "00") &&
      Boolean(data.pdf_base64 || (Array.isArray(data.response) && data.response[0]));

    if (!isSuccess) {
      let rawMsg = data.error || data.message || data.detail || "Could not generate verification slip with the provided details.";
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

    const respItem = Array.isArray(data.response) ? data.response[0] : data.response;
    const u = (data.user_data || data.data || data.details || respItem || data.demographics || data.result || data) as Record<string, any>;

    const firstName = (u.first_name || u.firstname || u.firstName || u.given_name || data.first_name || data.firstname || "") as string;
    const middleName = (u.middle_name || u.middlename || u.middleName || data.middle_name || data.middlename || "") as string;
    const lastName = (u.last_name || u.surname || u.lastname || u.lastName || u.family_name || data.last_name || data.surname || "") as string;

    const rawFullName = (u.fullname || u.fullName || u.name || u.applicant_name || data.fullname || data.fullName || data.name || "") as string;
    const constructedFullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
    const fullName = constructedFullName || rawFullName || undefined;

    const gender = (u.gender || u.sex || data.gender || data.sex || undefined) as string | undefined;
    const dob = (u.date_of_birth || u.dob || u.birthdate || u.birth_date || data.date_of_birth || data.dob || data.birthdate || undefined) as string | undefined;
    const phone = (u.phone_number || u.phone || u.telephoneno || u.mobile || data.phone_number || data.phone || data.telephoneno || (searchType === "PHONE" ? identifier : undefined)) as string | undefined;
    const rawAddress = (u.address || u.residence_address || u.residential_address || u.residence_AdressLine1 || data.address || data.residence_address || undefined) as string | undefined;
    const address = rawAddress?.trim() ? rawAddress.trim() : undefined;
    const nin = (u.nin || u.vnin || data.nin || (searchType === "NIN" ? identifier : undefined)) as string | undefined;
    const photo = (u.photo || data.photo || undefined) as string | undefined;
    const signature = (u.signature || data.signature || undefined) as string | undefined;

    console.log(`✅ [SlipAPI Extracted Demographics]`, {
      fullName,
      firstName,
      lastName,
      gender,
      dob,
      phone,
      hasPhoto: Boolean(photo),
      hasAddress: Boolean(address),
    });

    return {
      success: true,
      pdfBase64: data.pdf_base64 || (u.pdf_base64 as string) || undefined,
      userData: u,
      fullName: fullName || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      middleName: middleName || undefined,
      gender,
      dob,
      phone,
      address,
      nin,
      photo,
      signature,
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
