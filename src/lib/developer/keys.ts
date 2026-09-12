import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { ApiKeyType, ApiKeyStatus } from "@prisma/client";

export interface GeneratedKeyData {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
  encryptedKey: string | null;
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
 * Derives a 32-byte AES-256 key from server environment secrets
 */
function getEncryptionKey(): Buffer {
  const secret =
    process.env.DEVELOPER_API_ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    "lorabiz-developer-api-salt-key-2026-vault-secure";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts an API key using AES-256-GCM.
 * Format: ivHex:authTagHex:encryptedHex
 */
export function encryptApiKey(rawKey: string): string {
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  let encrypted = cipher.update(rawKey.trim(), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted API key.
 * Returns null if tampering or corrupted format.
 */
export function decryptApiKey(encryptedData: string | null | undefined): string | null {
  if (!encryptedData || typeof encryptedData !== "string") return null;
  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("❌ [API Key Decryption] Failed to decrypt key:", err);
    return null;
  }
}

/**
 * Returns a server-side pepper for deterministic API key hashing.
 */
function getApiKeyHashPepper(): string {
  return (
    process.env.API_KEY_HASH_PEPPER ||
    process.env.ENCRYPTION_SECRET ||
    process.env.JWT_SECRET ||
    "development-api-key-pepper"
  );
}

/**
 * Computes a deterministic PBKDF2 hash of an API key.
 * Using a computationally expensive KDF mitigates brute-force attacks if hashes leak,
 * satisfying CodeQL CWE-916 (insufficient computational effort).
 */
export function hashApiKey(rawKey: string): string {
  const normalizedKey = rawKey.trim();
  const pepper = getApiKeyHashPepper();
  const iterations = 310000;
  const keylen = 32;
  return crypto.pbkdf2Sync(normalizedKey, pepper, iterations, keylen, "sha256").toString("hex");
}

/**
 * Generates a cryptographically secure API key.
 * For TEST keys, stores encryptedKey for persistent retrieval.
 * For LIVE keys, leaves encryptedKey null (zero-trust storage).
 */
export function generateApiKey(type: ApiKeyType, name: string): GeneratedKeyData {
  const prefix = type === "LIVE" ? "lora_live_" : "lora_test_";
  const randomEntropy = crypto.randomBytes(24).toString("hex"); // 48 chars
  const rawKey = `${prefix}${randomEntropy}`;
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = `${prefix}${randomEntropy.slice(0, 6)}••••••••${randomEntropy.slice(-4)}`;
  const encryptedKey = type === "TEST" ? encryptApiKey(rawKey) : null;

  return {
    rawKey,
    keyPrefix,
    keyHash,
    encryptedKey,
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
