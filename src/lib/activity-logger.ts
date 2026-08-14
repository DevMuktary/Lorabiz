import { prisma } from "@/lib/prisma";

export type ActivityCategory = "AUTH" | "CAC" | "WALLET" | "SERVICES" | "SECURITY";
export type ActivityStatus = "SUCCESS" | "PENDING" | "FAILED";

export interface LogActivityParams {
  userId: string;
  action: string;
  category: ActivityCategory;
  description: string;
  status?: ActivityStatus;
  referenceId?: string | null;
  metadata?: Record<string, any> | null;
  req?: Request | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const SENSITIVE_KEY_PATTERN = /password|secret|token|otp|cvv|pin|authorization|private|hash|cookie/i;

/**
 * Strips sensitive keys (passwords, auth tokens, OTP codes, card data) from log metadata
 * to prevent accidental sensitive data exposure.
 */
function sanitizeMetadata(metadata?: Record<string, any> | null): Record<string, any> | null {
  if (!metadata || typeof metadata !== "object") return null;

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      continue; // Omit sensitive field
    }

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      clean[key] = sanitizeMetadata(value);
    } else {
      clean[key] = value;
    }
  }

  return clean;
}

/**
 * Records a user activity event safely in the database.
 * Designed to never throw or interrupt the calling transaction/route.
 */
export async function logUserActivity(params: LogActivityParams): Promise<void> {
  try {
    let clientIp = params.ipAddress || null;
    let clientUa = params.userAgent || null;

    if (params.req) {
      const rawIp =
        params.req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        params.req.headers.get("x-real-ip") ||
        null;
      clientIp = rawIp;
      clientUa = params.req.headers.get("user-agent") || null;
    }

    const cleanMetadata = sanitizeMetadata(params.metadata);

    await prisma.userActivityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        category: params.category,
        description: params.description,
        status: params.status || "SUCCESS",
        referenceId: params.referenceId || null,
        metadata: cleanMetadata ? cleanMetadata : undefined,
        ipAddress: clientIp,
        userAgent: clientUa,
      },
    });
  } catch (error) {
    // Non-blocking: log to console but never crash parent operation
    console.error("Failed to write UserActivityLog:", error);
  }
}
