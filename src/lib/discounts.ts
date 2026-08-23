import { PrismaClient } from "@prisma/client";

export interface ActiveDiscountInfo {
  hasDiscount: boolean;
  promoId?: string;
  promoCode?: string;
  discountPct?: number;
  originalPrice: number;
  finalPrice: number;
  savedAmount: number;
  badge?: string;
}

/**
 * Calculates the effective price for a direct service after evaluating any active auto-applied promos.
 * Strictly verifies:
 * - Promo is active (isActive: true)
 * - Promo has not expired (expiresAt is null or > now)
 * - Service matches restrictedServices (e.g. "ALL", or matching serviceKey)
 * - Promo has not exceeded global usageLimit
 * - User has not exceeded perUserLimit (if userId is provided)
 */
export async function getEffectiveServicePrice(
  prismaClient: PrismaClient | any,
  serviceKey: string,
  basePrice: number,
  userId?: string
): Promise<ActiveDiscountInfo> {
  const numericBasePrice = Number(basePrice) || 0;
  
  if (numericBasePrice <= 0) {
    return {
      hasDiscount: false,
      originalPrice: 0,
      finalPrice: 0,
      savedAmount: 0,
    };
  }

  try {
    const now = new Date();

    // Query active auto-applied promos
    const activePromos = await prismaClient.promoCode.findMany({
      where: {
        isActive: true,
        isAutoApplied: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    const normalizedKey = serviceKey.toUpperCase();

    for (const promo of activePromos) {
      // Check service eligibility with category aliases support
      const isEligible = promo.restrictedServices.some((s: string) => {
        const norm = s.toUpperCase();
        if (norm === "ALL") return true;
        if (norm === normalizedKey) return true;
        
        // Category alias matching
        if (norm === "BVN_MOD" || norm === "BVN_MODIFICATION") {
          return normalizedKey.startsWith("BVN_MOD_");
        }
        if (norm === "NIN_VALIDATION") {
          return normalizedKey.startsWith("NIN_VALIDATION_");
        }
        if (norm === "NIN_MOD" || norm === "NIN_MODIFICATION") {
          return normalizedKey.startsWith("NIN_MOD_");
        }
        if (norm === "NIN_IPE" || norm === "NIN_IPE_CLEARANCE") {
          return normalizedKey === "NIN_IPE_CLEARANCE";
        }
        if (norm === "BVN_RETRIEVAL") {
          return normalizedKey === "BVN_RETRIEVAL";
        }
        return false;
      });

      if (!isEligible) continue;

      // Check global usage limit
      if (promo.usageLimit !== null && promo.timesUsed >= promo.usageLimit) {
        continue;
      }

      // Check per user usage limit if userId is provided
      if (userId && promo.perUserLimit) {
        const userUsageCount = await prismaClient.promoUsage.count({
          where: {
            promoId: promo.id,
            userId: userId,
          },
        });
        if (userUsageCount >= promo.perUserLimit) {
          continue;
        }
      }

      // Compute discount
      let discountAmount = 0;
      if (promo.discountPct && promo.discountPct > 0) {
        discountAmount = Math.round((numericBasePrice * promo.discountPct) / 100);
      } else if (promo.fixedAmount && Number(promo.fixedAmount) > 0) {
        discountAmount = Math.round(Number(promo.fixedAmount));
      }

      discountAmount = Math.min(discountAmount, numericBasePrice);
      const finalPrice = Math.max(0, numericBasePrice - discountAmount);

      if (discountAmount > 0) {
        return {
          hasDiscount: true,
          promoId: promo.id,
          promoCode: promo.code,
          discountPct: promo.discountPct || undefined,
          originalPrice: numericBasePrice,
          finalPrice: finalPrice,
          savedAmount: discountAmount,
          badge: promo.discountPct ? `${promo.discountPct}% OFF` : `₦${discountAmount.toLocaleString()} OFF`,
        };
      }
    }
  } catch (error) {
    console.error(`[Discounts Engine] Error evaluating discounts for ${serviceKey}:`, error);
  }

  // Default fallback: regular base price
  return {
    hasDiscount: false,
    originalPrice: numericBasePrice,
    finalPrice: numericBasePrice,
    savedAmount: 0,
  };
}

/**
 * Helper to atomically record promo usage and increment timesUsed in transaction
 */
export async function recordPromoUsageInTx(
  tx: any,
  promoId: string | undefined,
  userId: string
) {
  if (!promoId) return;

  try {
    // 1. Increment usage count
    await tx.promoCode.update({
      where: { id: promoId },
      data: { timesUsed: { increment: 1 } },
    });

    // 2. Insert ledger record
    await tx.promoUsage.create({
      data: {
        promoId,
        userId,
      },
    });
  } catch (error) {
    console.error(`[Discounts Engine] Error recording promo usage for promo ${promoId}:`, error);
  }
}
