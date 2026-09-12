import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export type DeveloperWebhookEvent =
  | "nin_validation.submitted"
  | "nin_validation.completed"
  | "nin_validation.failed"
  | "nin_ipe.submitted"
  | "nin_ipe.completed"
  | "nin_ipe.failed"
  | "nin_personalization.submitted"
  | "nin_personalization.completed"
  | "nin_personalization.failed";

export interface WebhookDispatchPayload {
  event: DeveloperWebhookEvent;
  environment?: "live" | "test";
  timestamp: string;
  data: {
    reference: string;
    client_reference?: string | null;
    tracking_id?: string;
    new_tracking_id?: string | null;
    nin?: string;
    resolved_nin?: string | null;
    validation_type?: string;
    request_status?: "submitted" | "processing" | "validated" | "completed" | "failed";
    status?: "submitted" | "processing" | "validated" | "completed" | "failed";
    message: string;
    pdf_base64?: string | null;
    data?: Record<string, unknown> | null;
    completed_at?: string | null;
    error_detail?: string | null;
    failure_reason?: string | null;
    refunded?: boolean;
    refund_amount?: number;
    amount_charged?: number;
    currency?: string;
  };
}

/**
 * Computes an HMAC-SHA256 signature for webhook payload delivery.
 * Note for static analysis (CodeQL CWE-916): This creates an RFC 2104 HMAC message
 * authentication code for client systems to verify payload integrity and authenticity.
 * It is NOT a password hash or password storage mechanism.
 */
export function computeWebhookSignature(payloadString: string, secretKey: string): string {
  // lgtm [js/insufficient-password-hash] Webhook HMAC signature, not a password hash
  // codeql [js/insufficient-password-hash] Webhook HMAC signature, not a password hash
  return crypto.createHmac("sha256", secretKey).update(payloadString).digest("hex");
}

/**
 * Dispatches an HMAC-SHA256 signed webhook notification to a developer if they have an active WebhookConfig.
 * Dispatches strictly to the respective LIVE or TEST webhook endpoint with the matching secret key.
 */
export async function dispatchDeveloperWebhook(
  userId: string,
  event: DeveloperWebhookEvent,
  data: WebhookDispatchPayload["data"],
  environment: "LIVE" | "TEST" = "LIVE"
): Promise<void> {
  try {
    const envType: "LIVE" | "TEST" = environment === "TEST" ? "TEST" : "LIVE";
    const config = await prisma.webhookConfig.findUnique({
      where: {
        userId_environment: {
          userId,
          environment: envType,
        },
      },
    });

    if (!config || !config.isActive || !config.url) {
      return;
    }

    const { url, secretKey } = config;
    const payload: WebhookDispatchPayload = {
      event,
      environment: envType.toLowerCase() as "live" | "test",
      timestamp: new Date().toISOString(),
      data,
    };

    const payloadString = JSON.stringify(payload);
    // lgtm [js/insufficient-password-hash] Webhook HMAC signature, not a password hash
    // codeql [js/insufficient-password-hash] Webhook HMAC signature, not a password hash
    const signature = computeWebhookSignature(payloadString, secretKey);

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
