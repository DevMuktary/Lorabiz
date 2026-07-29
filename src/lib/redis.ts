import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn("REDIS_URL is not defined in your environment variables");
}

const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(redisUrl || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
    lazyConnect: true, // <--- CRITICAL FIX: Stops the build crash on Railway
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
