import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface AuthenticatedApiKeyContext {
  apiKeyId: string;
  userId: string;
  keyType: "SANDBOX" | "LIVE";
  isSandbox: boolean;
  name: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export type AuthResult = 
  | { success: true; context: AuthenticatedApiKeyContext }
  | { success: false; response: NextResponse };

/**
 * Authenticates an incoming Developer B2B request using Bearer API Key
 * Header format: Authorization: Bearer lora_live_... or Bearer lora_test_...
 */
export async function authenticateApiKey(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization") || req.headers.get("x-api-key") || "";
  
  let rawKey = "";
  if (authHeader.startsWith("Bearer ")) {
    rawKey = authHeader.substring(7).trim();
  } else if (authHeader.startsWith("lora_")) {
    rawKey = authHeader.trim();
  }

  if (!rawKey) {
    return {
      success: false,
      response: NextResponse.json(
        {
          status: false,
          error: "AUTHENTICATION_REQUIRED",
          message: "Missing or invalid API key. Please provide 'Authorization: Bearer <your_api_key>'.",
          statusCode: 401,
        },
        { status: 401 }
      ),
    };
  }

  // Calculate SHA-256 hash of provided key
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isSuspended: true,
          },
        },
      },
    });

    if (!apiKey) {
      return {
        success: false,
        response: NextResponse.json(
          {
            status: false,
            error: "INVALID_API_KEY",
            message: "The provided API key is invalid or does not exist.",
            statusCode: 401,
          },
          { status: 401 }
        ),
      };
    }

    if (!apiKey.isActive) {
      return {
        success: false,
        response: NextResponse.json(
          {
            status: false,
            error: "API_KEY_REVOKED",
            message: "This API key has been deactivated or revoked.",
            statusCode: 403,
          },
          { status: 403 }
        ),
      };
    }

    if (apiKey.user.isSuspended) {
      return {
        success: false,
        response: NextResponse.json(
          {
            status: false,
            error: "ACCOUNT_SUSPENDED",
            message: "Your developer account is currently suspended. Please contact support.",
            statusCode: 403,
          },
          { status: 403 }
        ),
      };
    }

    // IP Whitelist Check (if configured on key)
    if (apiKey.ipWhitelist && apiKey.ipWhitelist.length > 0) {
      const clientIp = 
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
        req.headers.get("x-real-ip") || 
        "";

      if (clientIp && !apiKey.ipWhitelist.includes(clientIp)) {
        return {
          success: false,
          response: NextResponse.json(
            {
              status: false,
              error: "IP_NOT_WHITELISTED",
              message: `Access denied. Client IP (${clientIp}) is not in the authorized IP whitelist for this API key.`,
              statusCode: 403,
            },
            { status: 403 }
          ),
        };
      }
    }

    // Update lastUsedAt asynchronously (fire-and-forget to minimize latency)
    prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    return {
      success: true,
      context: {
        apiKeyId: apiKey.id,
        userId: apiKey.userId,
        keyType: apiKey.type,
        isSandbox: apiKey.type === "SANDBOX",
        name: apiKey.name,
        user: {
          id: apiKey.user.id,
          email: apiKey.user.email,
          firstName: apiKey.user.firstName,
          lastName: apiKey.user.lastName,
        },
      },
    };
  } catch (error) {
    console.error("[API_AUTH_ERROR]", error);
    return {
      success: false,
      response: NextResponse.json(
        {
          status: false,
          error: "INTERNAL_AUTH_ERROR",
          message: "An internal error occurred while validating authentication credentials.",
          statusCode: 500,
        },
        { status: 500 }
      ),
    };
  }
}
