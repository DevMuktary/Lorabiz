import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined in your environment variables");
}

// Singleton pattern to prevent multiple connections in Next.js development mode
const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required if you plan to use BullMQ later
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
