import { Queue } from "bullmq";
import { redis } from "@/lib/redis";
import { NotificationEvent } from "@/services/notifications";

// Initialize the notifications queue using our Redis connection
export const notificationQueue = new Queue<NotificationEvent>("notifications", {
  connection: redis,
});
