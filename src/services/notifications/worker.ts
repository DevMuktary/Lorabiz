import { Worker, Job } from "bullmq";
import { redis } from "@/lib/redis";
import { dispatchNotification, NotificationEvent } from "@/services/notifications";

export const notificationWorker = new Worker<NotificationEvent>(
  "notifications",
  async (job: Job<NotificationEvent>) => {
    console.log(`⏳ Processing notification job [ID: ${job.id} | Type: ${job.data.type}]`);
    
    // Await the asynchronous dispatching of DB notification, email, and WhatsApp
    await dispatchNotification(job.data);
    
    console.log(`✅ Completed notification job [ID: ${job.id}]`);
  },
  {
    connection: redis,
    concurrency: 5, // Process up to 5 notifications concurrently
  }
);

notificationWorker.on("failed", (job, err) => {
  console.error(`❌ Notification job [ID: ${job?.id}] failed after all retry attempts:`, err.message);
});
