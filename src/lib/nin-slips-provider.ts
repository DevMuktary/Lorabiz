import { prisma } from "@/lib/prisma";
import { generateSlipApiSlip, NormalizedSlipResult, SlipFailureReason } from "@/lib/slipapi";

export interface ProviderHealthState {
  dataVerifyFailures: number;
  lastFailureTime: number | null;
  isDataVerifyDegraded: boolean;
}

// In-memory circuit breakers (Decoupled: NIN failures do not affect Phone and vice versa)
const ninHealthState: ProviderHealthState = {
  dataVerifyFailures: 0,
  lastFailureTime: null,
  isDataVerifyDegraded: false,
};

const phoneHealthState: ProviderHealthState = {
  dataVerifyFailures: 0,
  lastFailureTime: null,
  isDataVerifyDegraded: false,
};

const CIRCUIT_BREAKER_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Checks if DataVerify should be probed or restored after cooldown for a specific search type
 */
function checkAndRefreshProviderHealth(searchType: "NIN" | "PHONE" = "NIN"): boolean {
  const state = searchType === "PHONE" ? phoneHealthState : ninHealthState;
  if (state.isDataVerifyDegraded && state.lastFailureTime) {
    const elapsed = Date.now() - state.lastFailureTime;
    if (elapsed > CIRCUIT_BREAKER_WINDOW_MS) {
      console.log(`🔄 [NIN Provider Router (${searchType})] 10-minute cooldown elapsed. Restoring DataVerify.`);
      state.isDataVerifyDegraded = false;
      state.dataVerifyFailures = 0;
      state.lastFailureTime = null;
    }
  }
  return !state.isDataVerifyDegraded;
}

function recordDataVerifyFailure(searchType: "NIN" | "PHONE", isInfrastructureError: boolean) {
  if (isInfrastructureError) {
    const state = searchType === "PHONE" ? phoneHealthState : ninHealthState;
    state.dataVerifyFailures += 1;
    state.lastFailureTime = Date.now();
    if (state.dataVerifyFailures >= 2) {
      console.warn(`⚠️ [NIN Provider Router (${searchType})] Multiple infrastructure failures on DataVerify. Tripping circuit breaker to SlipAPI.`);
      state.isDataVerifyDegraded = true;
    }
  }
}

function recordDataVerifySuccess(searchType: "NIN" | "PHONE" = "NIN") {
  const state = searchType === "PHONE" ? phoneHealthState : ninHealthState;
  state.dataVerifyFailures = 0;
  state.isDataVerifyDegraded = false;
  state.lastFailureTime = null;
}

/**
 * Executes NIN Slip generation directly via DataVerify
 */
async function generateDataVerifySlip(
  slipType: string,
  identifier: string,
  searchType: "NIN" | "PHONE" = "NIN"
): Promise<NormalizedSlipResult & { isInfraError?: boolean }> {
  try {
    const apiKey = process.env.DATAVERIFY_API_KEY?.trim() || "";
    if (!apiKey) {
      const err = "Identity verification gateway is temporarily offline for maintenance.";
      return {
        success: false,
        error: err,
        message: err,
        cleanMessage: err,
        provider: "DATAVERIFY",
        failureReason: "SERVICE_UNAVAILABLE",
        isInfraError: true,
      };
    }

    let endpointFile = "";
    if (searchType === "PHONE") {
      endpointFile = `${slipType}_phone.php`;
    } else {
      if (slipType === "nin_basic") endpointFile = "nin_basic_slip.php";
      else if (slipType === "nin_vnin") endpointFile = "vnin_slip.php";
      else endpointFile = `${slipType}.php`;
    }

    const url = `https://dataverify.com.ng/developers/nin_slips/${endpointFile}`;

    const payload = {
      api_key: apiKey,
      nin: identifier.trim(),
      phone: identifier.trim(),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr.name === "AbortError";
      const err = isTimeout ? "Verification request timed out. Please try again in a few moments." : "Network connection to verification gateway failed. Please try again.";
      return {
        success: false,
        error: err,
        message: err,
        cleanMessage: err,
        rawError: fetchErr?.message,
        provider: "DATAVERIFY",
        failureReason: "SERVICE_UNAVAILABLE",
        isInfraError: true,
      };
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status >= 500) {
      const err = "Verification gateway is temporarily experiencing high traffic. Please try again shortly.";
      return {
        success: false,
        error: err,
        message: err,
        cleanMessage: err,
        rawError: `HTTP_${response.status}`,
        provider: "DATAVERIFY",
        failureReason: "SERVICE_UNAVAILABLE",
        isInfraError: true,
      };
    }

    const rawText = await response.text();
    let data: any;

    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("❌ [DataVerify] Non-JSON response received:", rawText.slice(0, 400));
      const err = "Verification gateway returned an invalid response. Please try again.";
      return {
        success: false,
        error: err,
        message: err,
        cleanMessage: err,
        rawError: rawText.slice(0, 300),
        provider: "DATAVERIFY",
        failureReason: "SERVICE_UNAVAILABLE",
        isInfraError: true,
      };
    }

    // 📡 SANITIZED DEBUG LOG FOR RAILWAY CONSOLE
    const debugKeys = Object.keys(data).filter((k) => k !== "pdf_base64");
    console.log(`📡 [DataVerify Response: ${endpointFile}] [HTTP ${response.status}]`, {
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

    const isSuccess = (data.status === "success" || data.status === true || data.response_code === "00") && Boolean(data.pdf_base64 || (Array.isArray(data.response) && data.response[0]));

    if (!isSuccess) {
      const rawErrMsg = data.message || data.error || data.detail || "Could not generate verification slip with the provided details.";
      const lower = rawErrMsg.toLowerCase();

      // Provider-agnostic missing record detection
      const isNotFound =
        lower.includes("not exist") ||
        lower.includes("not exists") ||
        lower.includes("does not exist") ||
        lower.includes("no record") ||
        lower.includes("not found") ||
        lower.includes("record not found") ||
        lower.includes("unregistered") ||
        lower.includes("not registered") ||
        lower.includes("no match") ||
        lower.includes("invalid nin") ||
        lower.includes("invalid phone") ||
        data.response_code === "01" ||
        data.response_code === "404" ||
        data.response_code === "422";

      const isInfra =
        !isNotFound && (
          lower.includes("insufficient balance") ||
          lower.includes("wallet low") ||
          lower.includes("service down") ||
          lower.includes("maintenance") ||
          lower.includes("internal error") ||
          lower.includes("database") ||
          lower.includes("503") ||
          lower.includes("500") ||
          lower.includes("502") ||
          lower.includes("504") ||
          lower.includes("dataverify") ||
          lower.includes("slipapi") ||
          lower.includes("gateway") ||
          lower.includes("timeout") ||
          lower.includes("timed out")
        );

      let cleanError: string;
      let failureReason: SlipFailureReason;

      if (isNotFound) {
        failureReason = "RECORD_NOT_FOUND";
        cleanError = searchType === "PHONE"
          ? "No identity record was found matching the provided phone number."
          : "No identity record was found matching the provided NIN.";
      } else if (isInfra) {
        failureReason = "SERVICE_UNAVAILABLE";
        cleanError = "Identity verification service is temporarily undergoing scheduled maintenance. Please try again shortly.";
      } else {
        failureReason = "GATEWAY_ERROR";
        cleanError = rawErrMsg;
      }

      return {
        success: false,
        error: cleanError,
        message: cleanError,
        cleanMessage: cleanError,
        rawError: rawErrMsg,
        failureReason,
        provider: "DATAVERIFY",
        isInfraError: isInfra,
      };
    }

    recordDataVerifySuccess();

    // Comprehensive demographic field extractor (supporting user_data, data, details, response[0], or flat root keys)
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

    console.log(`✅ [DataVerify Extracted Demographics]`, {
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
      provider: "DATAVERIFY",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected error during slip execution";
    console.error("❌ [Identity Router Error]:", errorMsg);
    const cleanErr = "An unexpected error occurred while processing your verification slip. Please try again.";
    return {
      success: false,
      error: cleanErr,
      message: cleanErr,
      cleanMessage: cleanErr,
      rawError: errorMsg,
      provider: "DATAVERIFY",
      failureReason: "SERVICE_UNAVAILABLE",
      isInfraError: true,
    };
  }
}

function endpointUrlDataVerify(file: string) {
  return `https://dataverify.com.ng/developers/nin_slips/${file}`;
}

/**
 * Main Router: Dispatches NIN slip generation based on decoupled GlobalSettings and independent failover
 */
export async function executeNinSlipGeneration(
  slipType: string,
  identifier: string,
  searchType: "NIN" | "PHONE" = "NIN"
): Promise<NormalizedSlipResult> {
  const isPhone = searchType === "PHONE";
  const settingKey = isPhone ? "NIN_SLIP_PROVIDER_PHONE" : "NIN_SLIP_PROVIDER_NIN";

  // 1. Fetch Decoupled Provider Setting
  let providerSetting = "AUTO";
  try {
    const setting = await prisma.globalSetting.findUnique({
      where: { key: settingKey },
    });
    if (setting?.value) {
      providerSetting = setting.value.toUpperCase();
    } else if (!isPhone) {
      // Backward compatibility fallback
      const legacy = await prisma.globalSetting.findUnique({
        where: { key: "NIN_SLIP_PROVIDER" },
      });
      if (legacy?.value) providerSetting = legacy.value.toUpperCase();
    }
  } catch (err) {
    console.error(`⚠️ Failed to load ${settingKey} from database, falling back to AUTO:`, err);
  }

  // Check if slip is supported by SlipAPI
  const isSlipApiSupportedForNIN = ["nin_standard", "nin_premium"].includes(slipType);
  const isSlipApiSupportedForPhone = ["nin_regular", "nin_standard", "nin_premium"].includes(slipType);
  const isSlipApiSupported = isPhone ? isSlipApiSupportedForPhone : isSlipApiSupportedForNIN;

  // 2. Forced SLIPAPI routing
  if (providerSetting === "SLIPAPI") {
    if (!isSlipApiSupported) {
      const cleanErr = "This slip format is temporarily undergoing system maintenance. Please select Standard or Premium Slip.";
      return {
        success: false,
        error: cleanErr,
        message: cleanErr,
        cleanMessage: cleanErr,
        provider: "SLIPAPI",
        failureReason: "SERVICE_UNAVAILABLE",
        isInfraError: true,
      };
    }
    return await generateSlipApiSlip(slipType, identifier, searchType);
  }

  // 3. Forced DATAVERIFY routing
  if (providerSetting === "DATAVERIFY") {
    const result = await generateDataVerifySlip(slipType, identifier, searchType);
    return result;
  }

  // 4. AUTO ROUTING (DataVerify Primary with SlipAPI Fallback)
  const isHealthy = checkAndRefreshProviderHealth(searchType);

  if (isHealthy) {
    const primaryResult = await generateDataVerifySlip(slipType, identifier, searchType);

    if (primaryResult.success) {
      recordDataVerifySuccess(searchType);
      return primaryResult;
    }

    // Check if this was an infrastructure/downtime error
    if (primaryResult.isInfraError) {
      recordDataVerifyFailure(searchType, true);

      // Attempt fallback if supported on SlipAPI
      if (isSlipApiSupported) {
        console.warn(`⚠️ [NIN Provider Router (${searchType})] Primary returned infra error (${primaryResult.error}). Failing over to backup SlipAPI for ${slipType}...`);
        const fallbackResult = await generateSlipApiSlip(slipType, identifier, searchType);
        if (fallbackResult.success) {
          return fallbackResult;
        }
        const fallbackMsg = fallbackResult.error || "Identity verification is temporarily unavailable. Please try again shortly.";
        return {
          success: false,
          error: fallbackMsg,
          message: fallbackMsg,
          cleanMessage: fallbackResult.cleanMessage || fallbackMsg,
          rawError: fallbackResult.rawError || primaryResult.rawError,
          failureReason: fallbackResult.failureReason || "SERVICE_UNAVAILABLE",
          provider: "SLIPAPI",
          isInfraError: true,
        };
      } else {
        const maintMsg = "This slip format is temporarily undergoing system maintenance. Please select Standard or Premium Slip, or check back shortly.";
        return {
          success: false,
          error: maintMsg,
          message: maintMsg,
          cleanMessage: maintMsg,
          rawError: primaryResult.rawError,
          failureReason: "SERVICE_UNAVAILABLE",
          provider: "DATAVERIFY",
          isInfraError: true,
        };
      }
    }

    return primaryResult;
  } else {
    // DataVerify is currently in degraded state for this searchType
    if (isSlipApiSupported) {
      console.log(`ℹ️ [NIN Provider Router (${searchType})] Primary in degraded state. Routing directly to backup SlipAPI for ${slipType}...`);
      const slipApiResult = await generateSlipApiSlip(slipType, identifier, searchType);
      if (slipApiResult.success) {
        return slipApiResult;
      }
      // Probe primary as last resort
      const probeResult = await generateDataVerifySlip(slipType, identifier, searchType);
      if (probeResult.success) {
        recordDataVerifySuccess(searchType);
        return probeResult;
      }
      const busyMsg = "Verification service is temporarily experiencing high traffic. Please try again in a few moments.";
      return {
        success: false,
        error: busyMsg,
        message: busyMsg,
        cleanMessage: busyMsg,
        rawError: probeResult.rawError,
        failureReason: "SERVICE_UNAVAILABLE",
        provider: "DATAVERIFY",
        isInfraError: true,
      };
    } else {
      const maintMsg = "This slip format is temporarily undergoing system maintenance. Please select Standard or Premium Slip, or check back shortly.";
      return {
        success: false,
        error: maintMsg,
        message: maintMsg,
        cleanMessage: maintMsg,
        failureReason: "SERVICE_UNAVAILABLE",
        provider: "DATAVERIFY",
        isInfraError: true,
      };
    }
  }
}

/**
 * Returns current provider status and dynamic slip availability for the frontend
 */
export async function getNinSlipProviderStatus(): Promise<{
  activeRoutingNin: string;
  activeRoutingPhone: string;
  phoneSearchActive: boolean;
  isDataVerifyDegradedNin: boolean;
  isDataVerifyDegradedPhone: boolean;
  availableNINSlips: string[];
  availablePhoneSlips: string[];
}> {
  checkAndRefreshProviderHealth("NIN");
  checkAndRefreshProviderHealth("PHONE");

  let activeRoutingNin = "AUTO";
  let activeRoutingPhone = "AUTO";
  let phoneSearchActive = true;

  try {
    const [settingNin, legacySetting, settingPhone, phoneSetting] = await Promise.all([
      prisma.globalSetting.findUnique({ where: { key: "NIN_SLIP_PROVIDER_NIN" } }),
      prisma.globalSetting.findUnique({ where: { key: "NIN_SLIP_PROVIDER" } }),
      prisma.globalSetting.findUnique({ where: { key: "NIN_SLIP_PROVIDER_PHONE" } }),
      prisma.globalSetting.findUnique({ where: { key: "NIN_PHONE_SEARCH_ACTIVE" } }),
    ]);

    if (settingNin?.value) activeRoutingNin = settingNin.value.toUpperCase();
    else if (legacySetting?.value) activeRoutingNin = legacySetting.value.toUpperCase();

    if (settingPhone?.value) activeRoutingPhone = settingPhone.value.toUpperCase();
    if (phoneSetting?.value) phoneSearchActive = phoneSetting.value.toLowerCase() !== "false";
  } catch (err) {
    console.error("⚠️ Failed to load provider status from database:", err);
  }

  const isDegradedNin = activeRoutingNin === "SLIPAPI" || (activeRoutingNin === "AUTO" && ninHealthState.isDataVerifyDegraded);

  const availableNINSlips = isDegradedNin
    ? ["nin_standard", "nin_premium"]
    : ["nin_basic", "nin_vnin", "nin_regular", "nin_standard", "nin_premium"];

  const availablePhoneSlips = ["nin_regular", "nin_standard", "nin_premium"];

  return {
    activeRoutingNin,
    activeRoutingPhone,
    phoneSearchActive,
    isDataVerifyDegradedNin: ninHealthState.isDataVerifyDegraded,
    isDataVerifyDegradedPhone: phoneHealthState.isDataVerifyDegraded,
    availableNINSlips,
    availablePhoneSlips,
  };
}
