import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

// We initialize the Queue without payload inspection so BullMQ v5 doesn't 
// mistake the customer 'name' field in NotificationEvent for a Job Definition name.
export const notificationQueue = new Queue("notifications", {
  // Cast to any to resolve duplicate ioredis type definitions between root and bullmq
  connection: redis as any,
});

// Dedicated queue for bulk email campaigns to isolate from high-priority transactional OTPs
export const campaignQueue = new Queue("email-campaigns", {
  connection: redis as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

