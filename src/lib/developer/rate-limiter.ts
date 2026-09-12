import { redis } from "@/lib/redis";
import { ApiKeyType } from "@prisma/client";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Seconds until reset
}

/**
 * High-performance sliding window rate limiter using Redis.
 * Falls back gracefully to allowed if Redis is momentarily unreachable.
 */
export async function checkRateLimit(
  apiKeyId: string,
  type: ApiKeyType
): Promise<RateLimitResult> {
  // Test Mode: 60 req/min; Live Mode: 600 req/min
  const limit = type === "LIVE" ? 600 : 60;
  const windowSeconds = 60;
  const currentWindow = Math.floor(Date.now() / 1000 / windowSeconds);
  const redisKey = `ratelimit:${apiKeyId}:${currentWindow}`;

  try {
    const requestsInWindow = await redis.incr(redisKey);
    if (requestsInWindow === 1) {
      await redis.expire(redisKey, windowSeconds + 5);
    }

    const remaining = Math.max(0, limit - requestsInWindow);
    const reset = windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds);

    return {
      allowed: requestsInWindow <= limit,
      limit,
      remaining,
      reset,
    };
  } catch (err) {
    console.warn("⚠️ [Rate Limiter] Redis error, bypassing rate limit check:", err);
    return {
      allowed: true,
      limit,
      remaining: limit,
      reset: 60,
    };
  }
}

/**
 * Standard HTTP Rate Limit headers conforming to IETF draft-ietf-httpapi-ratelimit-headers
 */
export function getRateLimitHeaders(rateLimit?: RateLimitResult): Record<string, string> {
  if (!rateLimit) return {};
  return {
    "X-RateLimit-Limit": rateLimit.limit.toString(),
    "X-RateLimit-Remaining": Math.max(0, rateLimit.remaining).toString(),
    "X-RateLimit-Reset": rateLimit.reset.toString(),
  };
}
