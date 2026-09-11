import { prisma } from "@/lib/prisma";
import { ApiKeyType } from "@prisma/client";

export interface LogApiRequestParams {
  userId: string;
  apiKeyId?: string;
  environment: ApiKeyType;
  method: string;
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  amountCharged?: number;
  ipAddress?: string;
  clientReference?: string | null;
  requestHeaders?: Record<string, unknown>;
  requestBody?: unknown;
  responseBody?: unknown;
  errorMessage?: string;
}

/**
 * Asynchronously logs an API request to the database without delaying the HTTP response.
 */
export function recordApiRequestLog(params: LogApiRequestParams): void {
  // Execute in background
  (async () => {
    try {
      // Filter out sensitive auth headers
      const sanitizedHeaders = params.requestHeaders ? { ...params.requestHeaders } : {};
      if (sanitizedHeaders["authorization"]) {
        sanitizedHeaders["authorization"] = "Bearer lora_••••••••";
      }

      await prisma.apiRequestLog.create({
        data: {
          userId: params.userId,
          apiKeyId: params.apiKeyId || null,
          environment: params.environment,
          method: params.method.toUpperCase(),
          endpoint: params.endpoint,
          statusCode: params.statusCode,
          latencyMs: Math.max(1, Math.round(params.latencyMs)),
          amountCharged: params.amountCharged || 0,
          ipAddress: params.ipAddress || null,
          clientReference: params.clientReference || null,
          requestHeaders: sanitizedHeaders as any,
          requestBody: params.requestBody ? (params.requestBody as any) : undefined,
          responseBody: params.responseBody ? (params.responseBody as any) : undefined,
          errorMessage: params.errorMessage || null,
        },
      });
    } catch (err) {
      console.error("❌ [API Logger] Failed to record API request log:", err);
    }
  })();
}
