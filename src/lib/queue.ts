import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

// We initialize the Queue without payload inspection so BullMQ v5 doesn't 
// mistake the customer 'name' field in NotificationEvent for a Job Definition name.
export const notificationQueue = new Queue("notifications", {
  // Cast to any to resolve duplicate ioredis type definitions between root and bullmq
  connection: redis as any,
});
