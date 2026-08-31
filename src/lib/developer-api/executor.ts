import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthenticatedApiKeyContext } from "./auth";
import crypto from "crypto";
import { Prisma } from "@prisma/client";

export interface ServiceExecutionParams<T> {
  req: NextRequest;
  auth: AuthenticatedApiKeyContext;
  serviceKey: string;
  defaultPrice: number;
  endpoint: string;
  isRefundableOnFailure?: boolean;
  requestPayload?: any;
  executeSandbox: () => Promise<{ success: boolean; data?: T; error?: string; statusCode?: number }>;
  executeLive: () => Promise<{ success: boolean; data?: T; error?: string; statusCode?: number }>;
}

/**
 * Standard execution wrapper for B2B API requests.
 * Enforces:
 * 1. Idempotency (24h cache).
 * 2. Strict Dual-Wallet isolation (Sandbox Wallet for test keys, Live Wallet for live keys).
 * 3. Dedicated API wholesale pricing (`ApiServicePricing`).
 * 4. Policy-aware Automatic Refunds on failure.
 * 5. Full Telemetry & Request Logging.
 */
export async function executeApiTransaction<T>(
  params: ServiceExecutionParams<T>
): Promise<NextResponse> {
  const startTime = Date.now();
  const { req, auth, serviceKey, defaultPrice, endpoint, requestPayload } = params;

  const idempotencyKey = req.headers.get("idempotency-key")?.trim() || null;
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  // 1. Check Idempotency Cache (if header provided)
  if (idempotencyKey) {
    try {
      const cached = await prisma.apiIdempotencyRecord.findUnique({
        where: {
          userId_idempotencyKey_endpoint: {
            userId: auth.userId,
            idempotencyKey,
            endpoint,
          },
        },
      });

      if (cached && new Date(cached.expiresAt) > new Date()) {
        const responseData = cached.responseBody as any;
        return NextResponse.json(
          {
            ...responseData,
            _idempotency: {
              cached: true,
              key: idempotencyKey,
              originalCreatedAt: cached.createdAt,
            },
          },
          { status: cached.responseStatus }
        );
      }
    } catch (e) {
      console.warn("[IDEMPOTENCY_LOOKUP_ERROR]", e);
    }
  }

  // 2. Fetch Pricing & Policy from ApiServicePricing
  let chargeAmount = defaultPrice;
  let isRefundable = params.isRefundableOnFailure !== false;

  try {
    const pricingRow = await prisma.apiServicePricing.findUnique({
      where: { serviceKey },
    });

    if (pricingRow) {
      if (!pricingRow.isActive) {
        return NextResponse.json(
          {
            status: false,
            error: "SERVICE_MAINTENANCE",
            message: pricingRow.maintenanceMsg || `The service '${serviceKey}' is currently under scheduled maintenance.`,
            statusCode: 503,
          },
          { status: 503 }
        );
      }
      chargeAmount = Number(pricingRow.apiPrice);
      isRefundable = pricingRow.isRefundableOnFailure;
    }
  } catch (e) {
    console.warn("[API_PRICING_LOOKUP_FALLBACK]", e);
  }

  const transactionRef = `LORA_API_${auth.isSandbox ? "TEST" : "LIVE"}_${Date.now()}_${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  // 3. Dual-Wallet Balance Verification & Initial Deduction
  try {
    if (auth.isSandbox) {
      // Sandbox Wallet: Check or initialize with ₦1,000,000 test funds
      let sandboxWallet = await prisma.developerSandboxWallet.findUnique({
        where: { userId: auth.userId },
      });

      if (!sandboxWallet) {
        sandboxWallet = await prisma.developerSandboxWallet.create({
          data: {
            userId: auth.userId,
            balance: new Prisma.Decimal(1000000.0),
          },
        });
      }

      if (Number(sandboxWallet.balance) < chargeAmount) {
        return NextResponse.json(
          {
            status: false,
            error: "INSUFFICIENT_SANDBOX_FUNDS",
            message: `Insufficient sandbox balance (₦${Number(sandboxWallet.balance).toLocaleString()}). Please reset your sandbox balance from the Developer Portal.`,
            statusCode: 402,
          },
          { status: 402 }
        );
      }

      // Deduct from Sandbox Wallet
      await prisma.developerSandboxWallet.update({
        where: { id: sandboxWallet.id },
        data: {
          balance: { decrement: new Prisma.Decimal(chargeAmount) },
        },
      });
    } else {
      // Live Wallet: Check real wallet
      const liveWallet = await prisma.wallet.findUnique({
        where: { userId: auth.userId },
      });

      if (!liveWallet || Number(liveWallet.balance) < chargeAmount) {
        return NextResponse.json(
          {
            status: false,
            error: "INSUFFICIENT_FUNDS",
            message: `Insufficient wallet balance. Required: ₦${chargeAmount.toLocaleString()}. Please top up your live wallet.`,
            statusCode: 402,
          },
          { status: 402 }
        );
      }

      // Atomic Debit on Live Wallet
      await prisma.$transaction([
        prisma.wallet.update({
          where: { id: liveWallet.id },
          data: { balance: { decrement: new Prisma.Decimal(chargeAmount) } },
        }),
        prisma.transaction.create({
          data: {
            walletId: liveWallet.id,
            amount: new Prisma.Decimal(chargeAmount),
            balanceBefore: liveWallet.balance,
            balanceAfter: new Prisma.Decimal(Number(liveWallet.balance) - chargeAmount),
            type: "DEBIT",
            status: "SUCCESS",
            reference: transactionRef,
            serviceCategory: "API_SERVICE",
            description: `B2B API: ${serviceKey} (${endpoint})`,
          },
        }),
      ]);
    }
  } catch (error) {
    console.error("[API_WALLET_DEBIT_ERROR]", error);
    return NextResponse.json(
      {
        status: false,
        error: "WALLET_TRANSACTION_FAILED",
        message: "Failed to process wallet billing for this request.",
        statusCode: 500,
      },
      { status: 500 }
    );
  }

  // 4. Execute Service (Sandbox vs Live)
  let executionResult: { success: boolean; data?: T; error?: string; statusCode?: number };

  try {
    if (auth.isSandbox) {
      executionResult = await params.executeSandbox();
    } else {
      executionResult = await params.executeLive();
    }
  } catch (err: any) {
    executionResult = {
      success: false,
      error: err?.message || "An unexpected error occurred during service execution.",
      statusCode: 500,
    };
  }

  const latencyMs = Date.now() - startTime;
  let isRefunded = false;

  // 5. Automatic Refund on Failure (If Policy Allows)
  if (!executionResult.success && chargeAmount > 0) {
    if (isRefundable) {
      try {
        if (auth.isSandbox) {
          await prisma.developerSandboxWallet.update({
            where: { userId: auth.userId },
            data: { balance: { increment: new Prisma.Decimal(chargeAmount) } },
          });
        } else {
          const liveWallet = await prisma.wallet.findUnique({
            where: { userId: auth.userId },
          });
          if (liveWallet) {
            const refundRef = `REFUND_${transactionRef}`;
            await prisma.$transaction([
              prisma.wallet.update({
                where: { id: liveWallet.id },
                data: { balance: { increment: new Prisma.Decimal(chargeAmount) } },
              }),
              prisma.transaction.create({
                data: {
                  walletId: liveWallet.id,
                  amount: new Prisma.Decimal(chargeAmount),
                  balanceBefore: liveWallet.balance,
                  balanceAfter: new Prisma.Decimal(Number(liveWallet.balance) + chargeAmount),
                  type: "REFUND",
                  status: "SUCCESS",
                  reference: refundRef,
                  serviceCategory: "API_SERVICE",
                  description: `Automatic Refund: B2B API ${serviceKey} failed`,
                },
              }),
            ]);
          }
        }
        isRefunded = true;
      } catch (refundError) {
        console.error("[AUTO_REFUND_FAILED]", refundError);
      }
    }
  }

  // 6. Build Final Response Payload
  const httpStatus = executionResult.statusCode || (executionResult.success ? 200 : 400);

  const responseBody = executionResult.success
    ? {
        status: true,
        message: "Request completed successfully.",
        data: executionResult.data,
        reference: transactionRef,
        environment: auth.keyType,
        chargedAmount: chargeAmount,
        currency: "NGN",
      }
    : {
        status: false,
        error: executionResult.error || "SERVICE_EXECUTION_FAILED",
        message: executionResult.error || "The service execution failed.",
        reference: transactionRef,
        environment: auth.keyType,
        chargedAmount: isRefunded ? 0 : chargeAmount,
        refunded: isRefunded,
        statusCode: httpStatus,
      };

  // 7. Audit Logging (Asynchronous & Resilient)
  prisma.apiRequestLog
    .create({
      data: {
        userId: auth.userId,
        apiKeyId: auth.apiKeyId,
        endpoint,
        method: req.method,
        statusCode: httpStatus,
        latencyMs,
        environment: auth.keyType,
        ipAddress: clientIp,
        idempotencyKey,
        amountCharged: new Prisma.Decimal(isRefunded ? 0 : chargeAmount),
        isRefunded,
        refundAmount: isRefunded ? new Prisma.Decimal(chargeAmount) : null,
        reference: transactionRef,
        requestBody: requestPayload ? requestPayload : undefined,
        responseBody: responseBody,
        errorMessage: executionResult.success ? null : executionResult.error,
      },
    })
    .catch((logErr) => console.error("[API_AUDIT_LOG_ERROR]", logErr));

  // 8. Cache in Idempotency Store (if requested)
  if (idempotencyKey && httpStatus < 500) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    prisma.apiIdempotencyRecord
      .upsert({
        where: {
          userId_idempotencyKey_endpoint: {
            userId: auth.userId,
            idempotencyKey,
            endpoint,
          },
        },
        create: {
          userId: auth.userId,
          idempotencyKey,
          endpoint,
          responseStatus: httpStatus,
          responseBody: responseBody,
          expiresAt,
        },
        update: {
          responseStatus: httpStatus,
          responseBody: responseBody,
          expiresAt,
        },
      })
      .catch(() => {});
  }

  return NextResponse.json(responseBody, { status: httpStatus });
}
