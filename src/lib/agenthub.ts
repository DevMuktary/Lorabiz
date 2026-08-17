/**
 * AgentHub API Integration Client for NIMC IPE Clearance & Identity Verification
 * 
 * Secure wrapper around AgentHub API endpoints.
 * Environment variables AGENTHUB_BASE_URL and AGENTHUB_API_KEY are strictly loaded at runtime.
 */

interface AgentHubSubmitIpeResponse {
  status: boolean;
  message?: string;
  requestId?: string;
  reference?: string;
  error?: string;
}

export interface AgentHubStatusData {
  reply?: string;
  status?: string;
  nin?: string;
  firstname?: string;
  middlename?: string;
  surname?: string;
  fullName?: string;
  birthdate?: string;
  dob?: string;
  gender?: string;
  photo?: string;
  image?: string;
  [key: string]: unknown;
}

export interface AgentHubIpeStatusResponse {
  status: boolean;
  current_status?: string; // "PROCESSING" | "COMPLETED" | "FAILED" | "PENDING"
  message?: string;
  data?: AgentHubStatusData;
  last_updated?: string;
  error?: string;
}

export interface ParsedIpeResult {
  normalizedStatus: "PROCESSING" | "COMPLETED" | "FAILED";
  resolvedNin?: string;
  fullName?: string;
  dob?: string;
  gender?: string;
  photoUrl?: string;
  rawReply?: string;
  message?: string;
}

function getAgentHubConfig() {
  const baseUrl = process.env.AGENTHUB_BASE_URL?.trim() || "https://api.agenthub.ng";
  const apiKey = process.env.AGENTHUB_API_KEY?.trim();

  if (!apiKey) {
    console.warn("[AgentHub] AGENTHUB_API_KEY environment variable is not configured.");
  }

  // Remove trailing slashes
  const sanitizedBaseUrl = baseUrl.replace(/\/+$/, "");

  return {
    baseUrl: sanitizedBaseUrl,
    apiKey: apiKey || "",
  };
}

/**
 * Submit an IPE Clearance request to AgentHub
 */
export async function submitIpeClearance(
  trackingId: string,
  reference: string
): Promise<{ success: boolean; data?: AgentHubSubmitIpeResponse; error?: string }> {
  try {
    const { baseUrl, apiKey } = getAgentHubConfig();

    if (!apiKey) {
      return {
        success: false,
        error: "AgentHub API configuration missing on server.",
      };
    }

    const endpoint = `${baseUrl}/v1/identity/ipe-clearance`;
    const payload = {
      trackingId: trackingId.trim(),
      reference: reference.trim(),
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data: AgentHubSubmitIpeResponse = await response.json();

    if (!response.ok || data.status === false) {
      return {
        success: false,
        error: data.message || data.error || `AgentHub request failed with HTTP ${response.status}`,
        data,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    console.error("[AgentHub Submit Error]:", message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Check IPE Clearance Status on AgentHub by reference
 */
export async function checkIpeClearanceStatus(
  reference: string
): Promise<{ success: boolean; data?: AgentHubIpeStatusResponse; error?: string }> {
  try {
    const { baseUrl, apiKey } = getAgentHubConfig();

    if (!apiKey) {
      return {
        success: false,
        error: "AgentHub API configuration missing on server.",
      };
    }

    const endpoint = `${baseUrl}/v1/identity/ipe-clearance/status?reference=${encodeURIComponent(reference.trim())}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data: AgentHubIpeStatusResponse = await response.json();

    if (!response.ok && !data) {
      return {
        success: false,
        error: `Failed to check status (HTTP ${response.status})`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    console.error("[AgentHub Status Check Error]:", message);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Helper to parse and normalize AgentHub IPE status and extracted payload attributes
 */
export function parseIpeStatusResponse(response: AgentHubIpeStatusResponse): ParsedIpeResult {
  const rawStatus = (response.current_status || (response.data?.status as string) || "").toUpperCase();
  
  let normalizedStatus: "PROCESSING" | "COMPLETED" | "FAILED" = "PROCESSING";

  if (rawStatus === "COMPLETED" || rawStatus === "SUCCESSFUL" || rawStatus === "SUCCESS") {
    normalizedStatus = "COMPLETED";
  } else if (rawStatus === "FAILED" || rawStatus === "REJECTED" || rawStatus === "ERROR") {
    normalizedStatus = "FAILED";
  } else {
    normalizedStatus = "PROCESSING";
  }

  let resolvedNin: string | undefined;
  let fullName: string | undefined;
  let dob: string | undefined;
  let gender: string | undefined;
  let photoUrl: string | undefined;
  const rawReply = response.data?.reply;

  // 1. Extract NIN from explicit field or reply string (e.g., "TRACKING_ID=75572848754" or "75572848754")
  if (response.data?.nin && /^\d{11}$/.test(response.data.nin.trim())) {
    resolvedNin = response.data.nin.trim();
  } else if (rawReply) {
    const match = rawReply.match(/=(\d{11})/);
    if (match && match[1]) {
      resolvedNin = match[1];
    } else {
      const parts = rawReply.split("=");
      const lastPart = parts[parts.length - 1]?.trim();
      if (lastPart && /^\d{11}$/.test(lastPart)) {
        resolvedNin = lastPart;
      }
    }
  }

  // 2. Extract demographics if available in broader response
  if (response.data) {
    const { firstname, middlename, surname, fullName: rawFullName, birthdate, dob: rawDob, gender: rawGender, photo, image } = response.data;
    
    if (rawFullName) {
      fullName = rawFullName;
    } else if (firstname || surname) {
      fullName = [firstname, middlename, surname].filter(Boolean).join(" ").trim();
    }

    dob = birthdate || rawDob;
    gender = rawGender;
    photoUrl = photo || image;
  }

  return {
    normalizedStatus,
    resolvedNin,
    fullName,
    dob,
    gender,
    photoUrl,
    rawReply,
    message: response.message,
  };
}
