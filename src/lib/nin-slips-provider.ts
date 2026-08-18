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
        error: "DataVerify API key is not configured on server.",
        provider: "DATAVERIFY",
        isInfraError: true,
      };
    }

    let endpointFile = "";
    if (searchType === "PHONE") {
      endpointFile = `${slipType}_phone.php`;
    } else {
      if (slipType === "nin_basic") {
        endpointUrlDataVerify("nin_basic_slip.php");
      }
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
        error: isTimeout ? "DataVerify provider request timed out." : "DataVerify network connection failed.",
        provider: "DATAVERIFY",
        isInfraError: true,
      };
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status >= 500) {
      return {
        success: false,
        error: `DataVerify provider returned server error (HTTP ${response.status}).`,
        provider: "DATAVERIFY",
        isInfraError: true,
      };
    }

    const data = await response.json().catch(() => null);

    if (!data) {
      return {
        success: false,
        error: "Invalid JSON response from DataVerify.",
        provider: "DATAVERIFY",
        isInfraError: true,
      };
    }

    const isSuccess = (data.status === "success" || data.response_code === "00") && Boolean(data.pdf_base64);

    if (!isSuccess) {
      const errMsg = data.message || data.error || "DataVerify could not generate slip.";
      // Detect if this is an insufficient balance or provider service outage vs invalid NIN user error
      const lower = errMsg.toLowerCase();
      const isInfra =
        lower.includes("insufficient balance") ||
        lower.includes("wallet low") ||
        lower.includes("service down") ||
        lower.includes("maintenance") ||
        lower.includes("internal error");

      return {
        success: false,
        error: errMsg,
        message: errMsg,
        provider: "DATAVERIFY",
        isInfraError: isInfra,
      };
    }

    recordDataVerifySuccess();

    const u = data.user_data || {};
    const firstName = (u.first_name as string) || (u.firstname as string) || "";
    const middleName = (u.middle_name as string) || (u.middlename as string) || "";
    const lastName = (u.last_name as string) || (u.surname as string) || "";
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

    return {
      success: true,
      pdfBase64: data.pdf_base64,
      userData: u,
      fullName: fullName || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      middleName: middleName || undefined,
      gender: (u.gender as string) || undefined,
      dob: (u.date_of_birth as string) || (u.birthdate as string) || undefined,
      phone: (u.phone_number as string) || (u.telephoneno as string) || (searchType === "PHONE" ? identifier : undefined),
      address: (u.address as string) || (u.residence_address as string) || undefined,
      nin: (u.nin as string) || (searchType === "NIN" ? identifier : undefined),
      message: data.message || "Slip generated successfully.",
      provider: "DATAVERIFY",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected error during DataVerify slip execution";
    return {
      success: false,
      error: errorMsg,
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
        error: `The selected slip type (${slipType}) is not supported by SlipAPI. Please select Standard or Premium Slip.`,
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
        console.warn(`⚠️ [NIN Provider Router] DataVerify failed with infra error (${primaryResult.error}). Failing over to SlipAPI for ${slipType}...`);
        const fallbackResult = await generateSlipApiSlip(slipType, identifier, searchType);
        if (fallbackResult.success) {
          return fallbackResult;
        }
      }
    }

    // Return primary error if fallback not possible or also failed
    return primaryResult;
  } else {
    // DataVerify is currently in degraded state
    if (isSlipApiSupported) {
      console.log(`ℹ️ [NIN Provider Router] DataVerify in degraded state. Routing directly to SlipAPI for ${slipType}...`);
      const slipApiResult = await generateSlipApiSlip(slipType, identifier, searchType);
      if (slipApiResult.success) {
        return slipApiResult;
      }
      // If SlipAPI fails too, probe DataVerify as a last ditch
      console.log("ℹ️ [NIN Provider Router] SlipAPI also failed, attempting DataVerify probe...");
      return await generateDataVerifySlip(slipType, identifier, searchType);
    } else {
      // Slip not supported by SlipAPI (e.g. basic or vnin)
      return {
        success: false,
        error: `DataVerify is temporarily unavailable and this slip type is not supported by our backup provider. Please select Standard or Premium Slip.`,
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
