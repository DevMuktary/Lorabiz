import { prisma } from "@/lib/prisma";
import { generateSlipApiSlip, NormalizedSlipResult } from "@/lib/slipapi";

export interface ProviderHealthState {
  dataVerifyFailures: number;
  lastFailureTime: number | null;
  isDataVerifyDegraded: boolean;
}

// In-memory circuit breaker (10 minute auto-recovery)
const healthState: ProviderHealthState = {
  dataVerifyFailures: 0,
  lastFailureTime: null,
  isDataVerifyDegraded: false,
};

const CIRCUIT_BREAKER_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Checks if DataVerify should be probed or restored after cooldown
 */
function checkAndRefreshProviderHealth(): boolean {
  if (healthState.isDataVerifyDegraded && healthState.lastFailureTime) {
    const elapsed = Date.now() - healthState.lastFailureTime;
    if (elapsed > CIRCUIT_BREAKER_WINDOW_MS) {
      console.log("🔄 [NIN Provider Router] 10-minute cooldown elapsed. Restoring DataVerify to primary probe.");
      healthState.isDataVerifyDegraded = false;
      healthState.dataVerifyFailures = 0;
      healthState.lastFailureTime = null;
    }
  }
  return !healthState.isDataVerifyDegraded;
}

function recordDataVerifyFailure(isInfrastructureError: boolean) {
  if (isInfrastructureError) {
    healthState.dataVerifyFailures += 1;
    healthState.lastFailureTime = Date.now();
    if (healthState.dataVerifyFailures >= 2) {
      console.warn("⚠️ [NIN Provider Router] Multiple infrastructure failures on DataVerify. Tripping circuit breaker to SlipAPI.");
      healthState.isDataVerifyDegraded = true;
    }
  }
}

function recordDataVerifySuccess() {
  healthState.dataVerifyFailures = 0;
  healthState.isDataVerifyDegraded = false;
  healthState.lastFailureTime = null;
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
      return {
        success: false,
        error: "Identity verification gateway is temporarily offline for maintenance.",
        provider: "DATAVERIFY",
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
      return {
        success: false,
        error: isTimeout ? "Verification request timed out. Please try again in a few moments." : "Network connection to verification gateway failed. Please try again.",
        provider: "DATAVERIFY",
        isInfraError: true,
      };
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status >= 500) {
      return {
        success: false,
        error: "Verification gateway is temporarily experiencing high traffic. Please try again shortly.",
        provider: "DATAVERIFY",
        isInfraError: true,
      };
    }

    const rawText = await response.text();
    let data: any;

    try {
      data = JSON.parse(rawText);
    } catch {
      console.error("❌ [DataVerify] Non-JSON response received:", rawText.slice(0, 400));
      return {
        success: false,
        error: "Verification gateway returned an invalid response. Please try again.",
        provider: "DATAVERIFY",
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
      user_data: data.user_data || data.data || data.details || null,
      raw_sample: Object.fromEntries(
        debugKeys.map((k) => [k, typeof data[k] === "object" ? data[k] : String(data[k]).slice(0, 100)])
      ),
    });

    const isSuccess = (data.status === "success" || data.status === true || data.response_code === "00") && Boolean(data.pdf_base64);

    if (!isSuccess) {
      const rawErrMsg = data.message || data.error || data.detail || "Could not generate verification slip with the provided details.";
      const lower = rawErrMsg.toLowerCase();
      const isInfra =
        lower.includes("insufficient balance") ||
        lower.includes("wallet low") ||
        lower.includes("service down") ||
        lower.includes("maintenance") ||
        lower.includes("internal error") ||
        lower.includes("database") ||
        lower.includes("503") ||
        lower.includes("500") ||
        lower.includes("dataverify") ||
        lower.includes("slipapi");

      let cleanError = rawErrMsg;
      if (isInfra) {
        cleanError = "Verification service is temporarily undergoing scheduled maintenance. Please try again shortly.";
      }

      return {
        success: false,
        error: cleanError,
        message: cleanError,
        provider: "DATAVERIFY",
        isInfraError: isInfra,
      };
    }

    recordDataVerifySuccess();

    // Comprehensive demographic field extractor (supporting user_data, data, details, or flat root keys)
    const u = (data.user_data || data.data || data.details || data.demographics || data.result || data) as Record<string, any>;

    const firstName = (u.first_name || u.firstname || u.firstName || u.given_name || data.first_name || data.firstname || "") as string;
    const middleName = (u.middle_name || u.middlename || u.middleName || data.middle_name || data.middlename || "") as string;
    const lastName = (u.last_name || u.surname || u.lastname || u.lastName || u.family_name || data.last_name || data.surname || "") as string;

    const rawFullName = (u.fullname || u.fullName || u.name || u.applicant_name || data.fullname || data.fullName || data.name || "") as string;
    const constructedFullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
    const fullName = constructedFullName || rawFullName || undefined;

    const gender = (u.gender || u.sex || data.gender || data.sex || undefined) as string | undefined;
    const dob = (u.date_of_birth || u.dob || u.birthdate || u.birth_date || data.date_of_birth || data.dob || data.birthdate || undefined) as string | undefined;
    const phone = (u.phone_number || u.phone || u.telephoneno || u.mobile || data.phone_number || data.phone || data.telephoneno || (searchType === "PHONE" ? identifier : undefined)) as string | undefined;
    const address = (u.address || u.residence_address || u.residential_address || data.address || data.residence_address || undefined) as string | undefined;
    const nin = (u.nin || u.vnin || data.nin || (searchType === "NIN" ? identifier : undefined)) as string | undefined;

    console.log(`✅ [DataVerify Extracted Demographics]`, {
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
      pdfBase64: data.pdf_base64,
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
      message: data.message || "Slip generated successfully.",
      provider: "DATAVERIFY",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected error during slip execution";
    console.error("❌ [Identity Router Error]:", errorMsg);
    return {
      success: false,
      error: "An unexpected error occurred while processing your verification slip. Please try again.",
      provider: "DATAVERIFY",
      isInfraError: true,
    };
  }
}

function endpointUrlDataVerify(file: string) {
  return `https://dataverify.com.ng/developers/nin_slips/${file}`;
}

/**
 * Main Router: Dispatches NIN slip generation based on GlobalSettings and automatic failover
 */
export async function executeNinSlipGeneration(
  slipType: string,
  identifier: string,
  searchType: "NIN" | "PHONE" = "NIN"
): Promise<NormalizedSlipResult> {
  // 1. Fetch Global Provider Setting
  let providerSetting = "AUTO";
  try {
    const setting = await prisma.globalSetting.findUnique({
      where: { key: "NIN_SLIP_PROVIDER" },
    });
    if (setting?.value) {
      providerSetting = setting.value.toUpperCase();
    }
  } catch (err) {
    console.error("⚠️ Failed to load NIN_SLIP_PROVIDER setting from database, falling back to AUTO:", err);
  }

  // Check if slip is supported by SlipAPI
  const isSlipApiSupportedForNIN = ["nin_standard", "nin_premium"].includes(slipType);
  const isSlipApiSupportedForPhone = ["nin_regular", "nin_standard", "nin_premium"].includes(slipType);
  const isSlipApiSupported = searchType === "PHONE" ? isSlipApiSupportedForPhone : isSlipApiSupportedForNIN;

  // 2. Forced SLIPAPI routing
  if (providerSetting === "SLIPAPI") {
    if (!isSlipApiSupported) {
      return {
        success: false,
        error: "This slip format is temporarily undergoing system maintenance. Please select Standard or Premium Slip.",
        provider: "SLIPAPI",
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
  const isDataVerifyHealthy = checkAndRefreshProviderHealth();

  if (isDataVerifyHealthy) {
    const primaryResult = await generateDataVerifySlip(slipType, identifier, searchType);

    if (primaryResult.success) {
      return primaryResult;
    }

    // Check if this was an infrastructure/downtime error
    if (primaryResult.isInfraError) {
      recordDataVerifyFailure(true);

      // Attempt fallback if supported on SlipAPI
      if (isSlipApiSupported) {
        console.warn(`⚠️ [NIN Provider Router] Primary provider returned infra error (${primaryResult.error}). Failing over to backup provider for ${slipType}...`);
        const fallbackResult = await generateSlipApiSlip(slipType, identifier, searchType);
        if (fallbackResult.success) {
          return fallbackResult;
        }
        // If fallback also failed, return clean sanitized message
        return {
          success: false,
          error: fallbackResult.error || "Identity verification is temporarily unavailable. Please try again shortly.",
          provider: "SLIPAPI",
        };
      } else {
        // Slip not supported on fallback
        return {
          success: false,
          error: "This slip format is temporarily undergoing system maintenance. Please select Standard or Premium Slip, or check back shortly.",
          provider: "DATAVERIFY",
        };
      }
    }

    // Return primary error if not an infrastructure issue (e.g. invalid NIN or not found)
    return primaryResult;
  } else {
    // DataVerify is currently in degraded state
    if (isSlipApiSupported) {
      console.log(`ℹ️ [NIN Provider Router] Primary provider in degraded state. Routing directly to backup provider for ${slipType}...`);
      const slipApiResult = await generateSlipApiSlip(slipType, identifier, searchType);
      if (slipApiResult.success) {
        return slipApiResult;
      }
      // Probe primary as last resort
      const probeResult = await generateDataVerifySlip(slipType, identifier, searchType);
      if (probeResult.success) {
        return probeResult;
      }
      return {
        success: false,
        error: "Verification service is temporarily experiencing high traffic. Please try again in a few moments.",
        provider: "DATAVERIFY",
      };
    } else {
      // Slip not supported by SlipAPI (e.g. basic or vnin)
      return {
        success: false,
        error: "This slip format is temporarily undergoing system maintenance. Please select Standard or Premium Slip, or check back shortly.",
        provider: "DATAVERIFY",
      };
    }
  }
}

/**
 * Returns current provider status and dynamic slip availability for the frontend
 */
export async function getNinSlipProviderStatus(): Promise<{
  activeRouting: string;
  phoneSearchActive: boolean;
  isDataVerifyDegraded: boolean;
  availableNINSlips: string[];
  availablePhoneSlips: string[];
}> {
  checkAndRefreshProviderHealth();

  let activeRouting = "AUTO";
  let phoneSearchActive = true;

  try {
    const [providerSetting, phoneSetting] = await Promise.all([
      prisma.globalSetting.findUnique({ where: { key: "NIN_SLIP_PROVIDER" } }),
      prisma.globalSetting.findUnique({ where: { key: "NIN_PHONE_SEARCH_ACTIVE" } }),
    ]);

    if (providerSetting?.value) activeRouting = providerSetting.value.toUpperCase();
    if (phoneSetting?.value) phoneSearchActive = phoneSetting.value.toLowerCase() !== "false";
  } catch (err) {
    console.error("⚠️ Failed to load provider status from database:", err);
  }

  const isDegraded = activeRouting === "SLIPAPI" || (activeRouting === "AUTO" && healthState.isDataVerifyDegraded);

  // If degraded or forced to SlipAPI:
  // NIN supports standard, premium
  // Phone supports regular, standard, premium
  const availableNINSlips = isDegraded
    ? ["nin_standard", "nin_premium"]
    : ["nin_basic", "nin_vnin", "nin_regular", "nin_standard", "nin_premium"];

  const availablePhoneSlips = ["nin_regular", "nin_standard", "nin_premium"];

  return {
    activeRouting,
    phoneSearchActive,
    isDataVerifyDegraded: healthState.isDataVerifyDegraded,
    availableNINSlips,
    availablePhoneSlips,
  };
}
