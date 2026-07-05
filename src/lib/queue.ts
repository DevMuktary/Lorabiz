import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

// Create a queue named 'notifications' using our Redis connection
export const notificationQueue = new Queue("notifications", {
  connection: redis,
});
