import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface WebhookDispatchPayload {
  event: "nin_validation.submitted" | "nin_validation.completed" | "nin_validation.failed";
  timestamp: string;
  data: {
    tracking_id: string;
    client_reference?: string | null;
    nin: string;
    validation_type: string;
    request_status: "submitted" | "processing" | "validated" | "failed";
    message: string;
    completed_at?: string | null;
    error_detail?: string | null;
    refunded?: boolean;
    amount_charged?: number;
    currency?: string;
  };
}

/**
 * Dispatches an HMAC-SHA256 signed webhook notification to a developer if they have an active WebhookConfig.
 * Executes asynchronously with a timeout; does not block the caller.
 */
export async function dispatchDeveloperWebhook(
  userId: string,
  event: "nin_validation.submitted" | "nin_validation.completed" | "nin_validation.failed",
  data: WebhookDispatchPayload["data"]
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { webhookConfig: true },
    });

    if (!user?.webhookConfig || !user.webhookConfig.isActive || !user.webhookConfig.url) {
      return;
    }

    const { url, secretKey } = user.webhookConfig;
    const payload: WebhookDispatchPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const payloadString = JSON.stringify(payload);
    const signature = crypto.createHmac("sha256", secretKey).update(payloadString).digest("hex");

    // Fire and forget with timeout
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Lorabiz-Webhook-Bot/1.0",
        "X-Lorabiz-Signature": `sha256=${signature}`,
        "X-Lorabiz-Event": event,
      },
      body: payloadString,
      signal: AbortSignal.timeout(10000),
    }).catch((err) => {
      console.warn(`⚠️ [Developer Webhook] Failed to deliver ${event} to ${url}:`, err.message);
    });
  } catch (err) {
    console.error("❌ [Developer Webhook Dispatcher Error]:", err);
  }
}
