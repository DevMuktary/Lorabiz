// src/lib/abjiktech.ts
// COMPATIBILITY BRIDGE: All NIN validation requests are now permanently routed to DataVerify.

import {
  submitDataVerifyNinValidation,
  checkDataVerifyNinValidationStatus,
  NormalizedValidationStatus,
} from "./dataverify-validation";

export type { NormalizedValidationStatus };

export interface AbjiktechValidationSubmitData {
  transaction_id?: string;
  ticket_id?: string;
  nin?: string;
  error_type?: string;
  status?: string;
  amount_charged?: string;
  balance_before?: string;
  balance_after?: string;
  note?: string;
  message?: string;
  [key: string]: any;
}

export interface AbjiktechValidationSubmitResponse {
  success: boolean;
  message: string;
  data?: AbjiktechValidationSubmitData;
  rawResponse?: any;
}

export interface ParsedAbjiktechValidationResult {
  normalizedStatus: NormalizedValidationStatus;
  rawStatus: string;
  ticketId?: string;
  transactionId?: string;
  nin?: string;
  errorType?: string;
  message?: string;
}

export interface AbjiktechValidationStatusResponse {
  success: boolean;
  message: string;
  result?: ParsedAbjiktechValidationResult;
  rawResponse?: any;
}

export function mapCategoryToAbjiktechErrorType(category: string): string {
  return "no_record_found";
}

export function normalizeAbjiktechStatus(rawStatus?: string | null): NormalizedValidationStatus {
  if (!rawStatus) return "PROCESSING";
  const s = rawStatus.toLowerCase().trim();
  if (s === "validated" || s === "success" || s === "completed") return "COMPLETED";
  if (s === "failed" || s === "rejected") return "FAILED";
  if (s === "pending") return "PENDING";
  return "PROCESSING";
}

/**
 * Compatibility wrapper routing to DataVerify
 */
export async function submitAbjiktechNinValidation(
  nin: string,
  errorType: string
): Promise<AbjiktechValidationSubmitResponse> {
  const res = await submitDataVerifyNinValidation(nin, errorType);
  return {
    success: res.success,
    message: res.message,
    data: {
      transaction_id: res.transactionId,
      ticket_id: res.transactionId,
      nin: res.nin,
      status: res.requestStatus,
      amount_charged: res.price ? res.price.toString() : undefined,
    },
    rawResponse: res.rawResponse,
  };
}

/**
 * Compatibility wrapper routing to DataVerify
 */
export async function checkAbjiktechNinValidationStatus(identifier: {
  ticketId?: string;
  transactionId?: string;
  nin?: string;
}): Promise<AbjiktechValidationStatusResponse> {
  const res = await checkDataVerifyNinValidationStatus({
    transactionId: identifier.transactionId || identifier.ticketId,
    nin: identifier.nin,
  });

  return {
    success: res.success,
    message: res.message,
    result: {
      normalizedStatus: res.normalizedStatus,
      rawStatus: res.rawStatus,
      transactionId: res.transactionId,
      ticketId: res.transactionId,
      nin: res.nin,
      message: res.errorDetail || res.response || res.message,
    },
    rawResponse: res.rawResponse,
  };
}
