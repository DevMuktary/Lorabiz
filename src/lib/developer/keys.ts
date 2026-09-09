import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { ApiKeyType, ApiKeyStatus } from "@prisma/client";

export interface GeneratedKeyData {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
  type: ApiKeyType;
}

export interface VerifiedKeyPayload {
  id: string;
  userId: string;
  name: string;
  type: ApiKeyType;
  status: ApiKeyStatus;
  ipWhitelist: string[];
  user: {
    id: string;
    email: string;
    isSuspended: boolean;
    sandboxBalance: number;
    walletId?: string;
    walletBalance: number;
  };
}

/**
 * Computes SHA-256 hash of an API key
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey.trim()).digest("hex");
}

/**
 * Generates a cryptographically secure API key
 */
export function generateApiKey(type: ApiKeyType, name: string): GeneratedKeyData {
  const prefix = type === "LIVE" ? "lora_live_" : "lora_test_";
  const randomEntropy = crypto.randomBytes(24).toString("hex"); // 48 chars
  const rawKey = `${prefix}${randomEntropy}`;
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = `${prefix}${randomEntropy.slice(0, 6)}••••••••${randomEntropy.slice(-4)}`;

  return {
    rawKey,
    keyPrefix,
    keyHash,
    type,
  };
}

/**
 * Generates a webhook HMAC signing secret
 */
export function generateWebhookSecret(environment: "LIVE" | "TEST" = "LIVE"): string {
  const envPrefix = environment === "LIVE" ? "whsec_live_" : "whsec_test_";
  return `${envPrefix}${crypto.randomBytes(24).toString("hex")}`;
}

/**
 * Fast Redis-cached verification of an incoming API key.
 * Checks format, validates against Redis in < 3ms, falls back to PostgreSQL.
 */
export async function verifyApiKey(rawKey: string): Promise<VerifiedKeyPayload | null> {
  try {
    if (!rawKey || typeof rawKey !== "string") return null;
    const cleanKey = rawKey.trim();

    if (!cleanKey.startsWith("lora_live_") && !cleanKey.startsWith("lora_test_")) {
      return null;
    }

    const keyHash = hashApiKey(cleanKey);
    const cacheKey = `apikey:${keyHash}`;

    // 1. Try Redis cache first (sub-3ms lookup)
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed: VerifiedKeyPayload = JSON.parse(cached);
        if (parsed.user.isSuspended || parsed.status !== "ACTIVE") {
          return null;
        }
        return parsed;
      }
    } catch (redisErr) {
      // If Redis connection blips, continue to database fallback
      console.warn("⚠️ [Auth Key] Redis cache lookup failed, falling back to DB:", redisErr);
    }

    // 2. Database lookup
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash, status: "ACTIVE" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isSuspended: true,
            sandboxBalance: true,
            wallet: {
              select: {
                id: true,
                balance: true,
              },
            },
          },
        },
      },
    });

    if (!apiKey || apiKey.status !== "ACTIVE" || apiKey.user.isSuspended) {
      return null;
    }

    const verifiedPayload: VerifiedKeyPayload = {
      id: apiKey.id,
      userId: apiKey.userId,
      name: apiKey.name,
      type: apiKey.type,
      status: apiKey.status,
      ipWhitelist: apiKey.ipWhitelist || [],
      user: {
        id: apiKey.user.id,
        email: apiKey.user.email,
        isSuspended: apiKey.user.isSuspended,
        sandboxBalance: Number(apiKey.user.sandboxBalance || 1000000),
        walletId: apiKey.user.wallet?.id,
        walletBalance: Number(apiKey.user.wallet?.balance || 0),
      },
    };

    // 3. Cache in Redis for 5 minutes (300 seconds)
    try {
      await redis.set(cacheKey, JSON.stringify(verifiedPayload), "EX", 300);
    } catch (cacheErr) {
      console.warn("⚠️ [Auth Key] Failed to save key in Redis cache:", cacheErr);
    }

    // 4. Update lastUsedAt asynchronously without awaiting
    prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    return verifiedPayload;
  } catch (err) {
    console.error("❌ [Auth Key] Unexpected key verification error:", err);
    return null;
  }
}

/**
 * Invalidates key cache in Redis upon key revocation
 */
export async function invalidateKeyCache(keyHash: string): Promise<void> {
  try {
    await redis.del(`apikey:${keyHash}`);
  } catch (err) {
    console.warn("⚠️ [Auth Key] Failed to invalidate key cache:", err);
  }
}
