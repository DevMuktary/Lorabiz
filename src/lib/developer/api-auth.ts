import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, VerifiedKeyPayload } from "@/lib/developer/keys";
import { checkRateLimit, RateLimitResult, getRateLimitHeaders } from "@/lib/developer/rate-limiter";

export { getRateLimitHeaders };

export interface ApiAuthResult {
  authenticated: boolean;
  keyPayload?: VerifiedKeyPayload;
  rateLimit?: RateLimitResult;
  errorResponse?: NextResponse;
}

/**
 * Extracts and verifies developer API key using dual-mode authentication:
 * Supports:
 * - Authorization: Bearer <key> (RFC 6750 Standard)
 * - Authorization: <key> (Direct key fallback)
 * - x-api-key: <key> (Custom header)
 * 
 * Verifies key via sub-3ms Redis cache (with PostgreSQL fallback),
 * validates account suspension, developer approval status (for LIVE keys),
 * enforces IP whitelist (if configured), and applies sliding window rate limits.
 */
export async function authenticateApiKey(req: NextRequest): Promise<ApiAuthResult> {
  const authHeader = req.headers.get("authorization")?.trim() || "";
  const xApiKeyHeader = req.headers.get("x-api-key")?.trim() || "";

  let rawKey = "";

  if (authHeader) {
    if (authHeader.toLowerCase().startsWith("bearer ")) {
      rawKey = authHeader.slice(7).trim();
    } else {
      rawKey = authHeader;
    }
  } else if (xApiKeyHeader) {
    rawKey = xApiKeyHeader;
  }

  if (!rawKey || rawKey === "null" || rawKey === "undefined" || rawKey.toLowerCase() === "bearer") {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          status: "error",
          code: "UNAUTHORIZED",
          message: "API key is required. Please provide an active API key via 'Authorization: Bearer <key>' or 'x-api-key: <key>'.",
        },
        { status: 401 }
      ),
    };
  }

  // Fast Redis-cached key verification
  const keyPayload = await verifyApiKey(rawKey);

  if (!keyPayload) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          status: "error",
          code: "UNAUTHORIZED",
          message: "Invalid, revoked, or expired API key. Please check your key in the Developer Console.",
        },
        { status: 401 }
      ),
    };
  }

  // Check account suspension
  if (keyPayload.user.isSuspended) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          status: "error",
          code: "ACCOUNT_SUSPENDED",
          message: "Your developer account has been suspended. Please contact Lorabiz support.",
        },
        { status: 403 }
      ),
    };
  }

  // IP Whitelisting Check (if configured on the key)
  if (keyPayload.ipWhitelist && keyPayload.ipWhitelist.length > 0) {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

    if (!keyPayload.ipWhitelist.includes(clientIp)) {
      return {
        authenticated: false,
        errorResponse: NextResponse.json(
          {
            status: "error",
            code: "IP_FORBIDDEN",
            message: `Client IP address (${clientIp}) is not whitelisted for this API key.`,
          },
          { status: 403 }
        ),
      };
    }
  }

  // Sliding window rate limiting
  const rateLimit = await checkRateLimit(keyPayload.id, keyPayload.type);

  if (!rateLimit.allowed) {
    return {
      authenticated: false,
      rateLimit,
      errorResponse: NextResponse.json(
        {
          status: "error",
          code: "RATE_LIMITED",
          message: `Too many requests. Limit is ${rateLimit.limit} requests per minute in ${keyPayload.type} mode.`,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimit.reset.toString(),
          },
        }
      ),
    };
  }

  return {
    authenticated: true,
    keyPayload,
    rateLimit,
  };
}
