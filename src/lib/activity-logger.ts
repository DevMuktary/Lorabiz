import { prisma } from "@/lib/prisma";

import { notifyAdminTelegram } from "@/lib/telegram";

export type ActivityCategory = "AUTH" | "CAC" | "WALLET" | "SERVICES" | "SECURITY";
export type ActivityStatus = "SUCCESS" | "PENDING" | "FAILED";

export interface LogActivityParams {
  userId: string;
  action: string;
  category: ActivityCategory;
  description: string;
  status?: ActivityStatus;
  referenceId?: string | null;
  metadata?: Record<string, any> | null;
  req?: Request | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const SENSITIVE_KEY_PATTERN = /password|secret|token|otp|cvv|pin|authorization|private|hash|cookie/i;

/**
 * Strips sensitive keys (passwords, auth tokens, OTP codes, card data) from log metadata
 * to prevent accidental sensitive data exposure.
 */
function sanitizeMetadata(metadata?: Record<string, any> | null): Record<string, any> | null {
  if (!metadata || typeof metadata !== "object") return null;

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      continue; // Omit sensitive field
    }

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      clean[key] = sanitizeMetadata(value);
    } else {
      clean[key] = value;
    }
  }

  return clean;
}

/**
 * Records a user activity event safely in the database and sends real-time Telegram alerts.
 * Designed to never throw or interrupt the calling transaction/route.
 */
export async function logUserActivity(params: LogActivityParams): Promise<void> {
  try {
    let clientIp = params.ipAddress || null;
    let clientUa = params.userAgent || null;

    if (params.req) {
      const rawIp =
        params.req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        params.req.headers.get("x-real-ip") ||
        null;
      clientIp = rawIp;
      clientUa = params.req.headers.get("user-agent") || null;
    }

    const cleanMetadata = sanitizeMetadata(params.metadata);

    await prisma.userActivityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        category: params.category,
        description: params.description,
        status: params.status || "SUCCESS",
        referenceId: params.referenceId || null,
        metadata: cleanMetadata ? cleanMetadata : undefined,
        ipAddress: clientIp,
        userAgent: clientUa,
      },
    });

    // Dispatch Real-Time Telegram Admin Alerts for High-Value Events
    dispatchTelegramAlertForActivity(params, cleanMetadata);

  } catch (error) {
    // Non-blocking: log to console but never crash parent operation
    console.error("Failed to write UserActivityLog:", error);
  }
}

/**
 * Asynchronously checks if activity requires a Telegram ping and sends alert
 */
function dispatchTelegramAlertForActivity(
  params: LogActivityParams,
  cleanMetadata: Record<string, any> | null
) {
  // Fire and forget in background
  setImmediate(async () => {
    try {
      // Filter out low-priority background noise (e.g. routine OTP verifications)
      const isHighPriority = 
        params.category === "WALLET" ||
        params.category === "CAC" ||
        params.category === "SERVICES" ||
        params.action.includes("FUNDING") ||
        params.action.includes("SUBMITTED") ||
        params.action.includes("SLIP") ||
        params.action.includes("VERIFY_SUCCESS");

      if (!isHighPriority) return;

      // Look up user name & email
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { firstName: true, lastName: true, email: true, phone: true }
      });

      const userName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer" : "Customer";
      const userEmail = user?.email || undefined;

      let title = params.action.replace(/_/g, " ");
      if (params.action.includes("WALLET_FUNDING")) title = "Wallet Funded Successfully";
      else if (params.action.includes("BVN_RETRIEVAL")) title = "New BVN Retrieval Request";
      else if (params.action.includes("BVN_MODIFICATION")) title = "New BVN Modification Request";
      else if (params.action.includes("TAX_ID")) title = "New Tax ID (TIN) Request";
      else if (params.action.includes("NIN_IPE")) title = "New NIN IPE Clearance Request";
      else if (params.action.includes("NIN_VALIDATION")) title = "New NIN Validation Request";
      else if (params.action.includes("NIN_MODIFICATION")) title = "New NIN Modification Request";
      else if (params.action.includes("SLIP")) title = "New Verification Slip Generated";
      else if (params.action.includes("CAC")) title = "New CAC Application";

      const details: Record<string, string | number | undefined | null> = {
        "Description": params.description,
        "Reference": params.referenceId || undefined,
      };

      if (cleanMetadata) {
        if (cleanMetadata.amount) details["Amount"] = `₦${Number(cleanMetadata.amount).toLocaleString()}`;
        if (cleanMetadata.trackingId) details["Tracking ID"] = cleanMetadata.trackingId;
        if (cleanMetadata.type) details["Type"] = cleanMetadata.type;
        if (cleanMetadata.modificationType) details["Modification"] = cleanMetadata.modificationType;
        if (cleanMetadata.enrollingBank) details["Bank"] = cleanMetadata.enrollingBank;
        if (cleanMetadata.fullName) details["Applicant Name"] = cleanMetadata.fullName;
        if (cleanMetadata.phone) details["Phone"] = cleanMetadata.phone;
        if (cleanMetadata.bvn) details["BVN"] = cleanMetadata.bvn;
        if (cleanMetadata.status) details["Status"] = cleanMetadata.status;
      }

      await notifyAdminTelegram({
        title,
        category: params.category,
        user: {
          name: userName,
          email: userEmail,
        },
        details,
      });
    } catch (e) {
      console.warn("[Telegram Dispatcher] Failed to send activity alert:", e);
    }
  });
}

