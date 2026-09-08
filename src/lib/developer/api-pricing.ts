import { prisma } from "@/lib/prisma";
import { ApiKeyType } from "@prisma/client";

export interface ApiPriceResult {
  configured: boolean;
  serviceKey: string;
  price: number;
  title: string;
  isActive: boolean;
  error?: string;
}

export interface BillingResult {
  success: boolean;
  code?: string;
  message?: string;
  amountCharged: number;
  balanceBefore: number;
  balanceAfter: number;
  reference: string;
}

/**
 * Strict database-driven API price lookup.
 * ZERO fallback constants: If the service key does not exist or is inactive,
 * fails fast with an explicit error to prevent incorrect or unexpected charges.
 */
export async function getStrictApiPrice(serviceKey: string): Promise<ApiPriceResult> {
  try {
    const record = await prisma.servicePricing.findUnique({
      where: { serviceKey },
    });

    if (!record) {
      return {
        configured: false,
        serviceKey,
        price: 0,
        title: "",
        isActive: false,
        error: `Service pricing key '${serviceKey}' is not configured in the database. Please contact support.`,
      };
    }

    if (!record.isActive) {
      return {
        configured: false,
        serviceKey,
        price: Number(record.price),
        title: record.title,
        isActive: false,
        error: record.maintenanceMsg || `The service '${record.title}' is currently offline for maintenance.`,
      };
    }

    return {
      configured: true,
      serviceKey,
      price: Number(record.price),
      title: record.title,
      isActive: true,
    };
  } catch (err: any) {
    console.error(`❌ [API Pricing] Failed to fetch price for ${serviceKey}:`, err);
    return {
      configured: false,
      serviceKey,
      price: 0,
      title: "",
      isActive: false,
      error: "Unable to verify service pricing. Please try again shortly.",
    };
  }
}

/**
 * Pre-checks whether the developer has sufficient funds before calling upstream providers.
 * Returns true if balance is sufficient, false otherwise.
 */
export function checkBalanceSufficient(
  environment: ApiKeyType,
  currentBalance: number,
  requiredAmount: number
): boolean {
  return currentBalance >= requiredAmount;
}

/**
 * Executes atomic debit on developer account upon successful verification.
 * - Test Mode: Decrements user.sandboxBalance (virtual funds).
 * - Live Mode: Atomically decrements user.wallet.balance and inserts an immutable Transaction ledger record.
 */
export async function executeDeveloperBilling(params: {
  userId: string;
  walletId?: string;
  environment: ApiKeyType;
  requiredAmount: number;
  reference: string;
  serviceTitle: string;
  description: string;
}): Promise<BillingResult> {
  const { userId, walletId, environment, requiredAmount, reference, serviceTitle, description } = params;

  if (environment === ApiKeyType.TEST) {
    // Virtual sandbox deduction
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sandboxBalance: true },
    });

    const currentSandbox = Number(user?.sandboxBalance || 1000000);

    if (currentSandbox < requiredAmount) {
      return {
        success: false,
        code: "INSUFFICIENT_BALANCE",
        message: `Insufficient test sandbox balance. Service costs ₦${requiredAmount.toFixed(2)}, but balance is ₦${currentSandbox.toFixed(2)}. Reset balance in the Developer Console.`,
        amountCharged: 0,
        balanceBefore: currentSandbox,
        balanceAfter: currentSandbox,
        reference,
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { sandboxBalance: { decrement: requiredAmount } },
      select: { sandboxBalance: true },
    });

    return {
      success: true,
      amountCharged: requiredAmount,
      balanceBefore: currentSandbox,
      balanceAfter: Number(updatedUser.sandboxBalance),
      reference,
    };
  }

  // LIVE MODE: Real atomic wallet transaction
  if (!walletId) {
    return {
      success: false,
      code: "WALLET_NOT_FOUND",
      message: "Developer live wallet not found. Please contact support.",
      amountCharged: 0,
      balanceBefore: 0,
      balanceAfter: 0,
      reference,
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const currentWallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      const balanceBefore = Number(currentWallet?.balance || 0);

      if (!currentWallet || balanceBefore < requiredAmount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { decrement: requiredAmount } },
      });

      const balanceAfter = Number(updatedWallet.balance);

      await tx.transaction.create({
        data: {
          walletId,
          amount: requiredAmount,
          balanceBefore,
          balanceAfter,
          type: "DEBIT",
          status: "SUCCESS",
          reference,
          serviceCategory: "API_SERVICE",
          description: `API: ${serviceTitle} - ${description}`,
        },
      });

      return {
        balanceBefore,
        balanceAfter,
      };
    });

    return {
      success: true,
      amountCharged: requiredAmount,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
      reference,
    };
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_BALANCE") {
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      const current = Number(wallet?.balance || 0);
      return {
        success: false,
        code: "INSUFFICIENT_BALANCE",
        message: `Insufficient live wallet balance. Service costs ₦${requiredAmount.toFixed(2)}, but balance is ₦${current.toFixed(2)}. Please fund your wallet.`,
        amountCharged: 0,
        balanceBefore: current,
        balanceAfter: current,
        reference,
      };
    }

    console.error("❌ [Developer Billing Error]:", err);
    throw err;
  }
}
