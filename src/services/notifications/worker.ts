import { Worker, Job } from "bullmq";
import { redis } from "@/lib/redis";
import { dispatchNotification, NotificationEvent } from "@/services/notifications";
import { scanAndEnqueueAbandonedCac } from "@/services/automations/abandoned-cac-scanner";

export const notificationWorker = new Worker<any>(
  "notifications",
  async (job: Job<any>) => {
    console.log(`⏳ Processing notification job [ID: ${job.id} | Name: ${job.name} | Type: ${job.data?.type}]`);
    
    if (job.name === "scan-abandoned-cac" || job.data?.type === "SCAN_ABANDONED_CAC") {
      await scanAndEnqueueAbandonedCac();
      return;
    }

    // Await the asynchronous dispatching of DB notification, email, and WhatsApp
    await dispatchNotification(job.data);
    
    console.log(`✅ Completed notification job [ID: ${job.id}]`);
  },
  {
    // Cast to any to resolve duplicate ioredis type definitions between root and bullmq
    connection: redis as any,
    concurrency: 5, // Process up to 5 notifications concurrently
  }
);

notificationWorker.on("failed", (job, err) => {
  console.error(`❌ Notification job [ID: ${job?.id}] failed after all retry attempts:`, err?.message || err);
});

