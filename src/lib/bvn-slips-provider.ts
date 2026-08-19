/**
 * BVN Slips Provider Integration
 * Direct integration with DataVerify BVN Slip generation endpoints
 * - Standard: https://dataverify.com.ng/developers/bvn_slip/bvn_standard.php
 * - Premium: https://dataverify.com.ng/developers/bvn_slip/bvn_premium.php
 */

export interface BvnUserData {
  bvn?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  gender?: string;
  date_of_birth?: string;
  dob?: string;
  phone_number?: string;
  phone?: string;
  address?: string;
  [key: string]: unknown;
}

export interface BvnSlipResult {
  success: boolean;
  pdfBase64?: string;
  pdfUrl?: string;
  userData?: BvnUserData;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  gender?: string;
  dob?: string;
  phone?: string;
  address?: string;
  bvn?: string;
  message?: string;
  error?: string;
  provider: "DATAVERIFY";
  isInfraError?: boolean;
}

export async function executeBvnSlipGeneration(
  slipType: "bvn_standard" | "bvn_premium",
  bvn: string
): Promise<BvnSlipResult> {
  const cleanBvn = bvn.trim();

  const apiKey = process.env.DATAVERIFY_API_KEY?.trim() || "";
  if (!apiKey) {
    return {
      success: false,
      error: "BVN verification gateway is temporarily offline for maintenance. Please try again later.",
      provider: "DATAVERIFY",
      isInfraError: true,
    };
  }

  const endpointFile = slipType === "bvn_standard" ? "bvn_standard.php" : "bvn_premium.php";
  const url = `https://dataverify.com.ng/developers/bvn_slip/${endpointFile}`;

  const payload = {
    api_key: apiKey,
    bvn: cleanBvn,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await response.text();
    let data: any;

    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("❌ DataVerify Non-JSON response:", rawText.slice(0, 300));
      return {
        success: false,
        error: "Upstream identity gateway returned an invalid response. Please try again in a few moments.",
        provider: "DATAVERIFY",
        isInfraError: true,
      };
    }

    const debugKeys = Object.keys(data).filter((k) => !["pdf_base64", "pdf_data", "pdf", "slip"].includes(k));
    console.log(`📡 [DataVerify BVN Response: ${url}] [HTTP ${response.status}]`, {
      status: data.status,
      response_code: data.response_code,
      message: data.message || data.error,
      has_pdf: Boolean(data.pdf_base64 || data.pdf_data || data.pdf || data.slip),
      root_keys_received: debugKeys,
      user_data: data.user_data || data.data || data.details || null,
      raw_sample: Object.fromEntries(
        debugKeys.map((k) => [k, typeof data[k] === "object" ? data[k] : String(data[k]).slice(0, 100)])
      ),
    });

    const isSuccess =
      data.status === "success" ||
      data.status === true ||
      data.response_code === "00" ||
      data.code === 200 ||
      data.code === "00" ||
      (data.status_code === 200 && !!(data.pdf_base64 || data.pdf_data || data.pdf || data.slip));

    if (isSuccess) {
      const pdfBase64 = data.pdf_base64 || data.pdf_data || data.pdf || data.slip || data.data?.pdf_base64 || data.data?.pdf;
      const userData: any = data.user_data || data.data || data.details || data.demographics || data.result || data || {};

      const firstName = (userData.first_name || userData.firstname || userData.firstName || data.first_name || data.firstname || "") as string;
      const middleName = (userData.middle_name || userData.middlename || userData.middleName || data.middle_name || data.middlename || "") as string;
      const lastName = (userData.last_name || userData.surname || userData.lastname || userData.lastName || data.last_name || data.surname || "") as string;

      const rawFullName = (userData.fullname || userData.fullName || userData.name || data.fullname || data.fullName || data.name || "") as string;
      const constructedFullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
      const fullName = constructedFullName || rawFullName || undefined;

      const gender = (userData.gender || userData.sex || data.gender || data.sex || undefined) as string | undefined;
      const dob = (userData.date_of_birth || userData.dob || userData.birthdate || data.date_of_birth || data.dob || undefined) as string | undefined;
      const phone = (userData.phone_number || userData.phone || userData.telephoneno || userData.mobile || data.phone_number || data.phone || undefined) as string | undefined;
      const address = (userData.address || userData.residence_address || data.address || undefined) as string | undefined;
      const bvn = (userData.bvn || data.bvn || cleanBvn) as string;

      console.log(`✅ [DataVerify BVN Extracted Demographics]`, {
        fullName,
        firstName,
        lastName,
        gender,
        dob,
        phone,
        hasAddress: Boolean(address),
      });

      return {
        success: true,
        pdfBase64: pdfBase64 ? pdfBase64.replace(/^data:application\/pdf;base64,/, "") : undefined,
        pdfUrl: data.pdf_url || data.url || undefined,
        userData,
        fullName,
        firstName,
        lastName,
        middleName,
        gender,
        dob,
        phone,
        address,
        bvn,
        message: data.message || "BVN slip generated successfully.",
        provider: "DATAVERIFY",
      };
    }

    // Provider returned error
    const failureMsg =
      data.message ||
      data.detail ||
      data.error ||
      data.description ||
      "Could not generate BVN slip. Please verify the 11-digit BVN and try again.";

    return {
      success: false,
      error: failureMsg,
      provider: "DATAVERIFY",
      isInfraError: false,
    };
  } catch (fetchErr: any) {
    clearTimeout(timeoutId);
    const isTimeout = fetchErr.name === "AbortError";
    console.error(`❌ DataVerify BVN Error (${isTimeout ? "TIMEOUT" : "NETWORK"}):`, fetchErr);

    return {
      success: false,
      error: isTimeout
        ? "Identity gateway timed out while communicating with NIBSS. Please try again."
        : "Network connection error communicating with identity provider.",
      provider: "DATAVERIFY",
      isInfraError: true,
    };
  }
}
