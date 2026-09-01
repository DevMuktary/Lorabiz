import { PrismaClient } from "@prisma/client";
import { getUserLoyaltyProfile, getTierDiscountForCategory } from "@/lib/loyalty";

export interface ActiveDiscountInfo {
  hasDiscount: boolean;
  promoId?: string;
  promoCode?: string;
  discountPct?: number;
  originalPrice: number;
  finalPrice: number;
  savedAmount: number;
  badge?: string;
  tierName?: string;
  tierBadge?: string;
  isLoyaltyTierDiscount?: boolean;
}

/**
 * Calculates the effective price for a service evaluating both:
 * 1. Automatic continuous Loyalty Tier Discounts (Tier 1/2/3/4)
 * 2. Active Promo Codes
 * Always applies the most favorable discount rate for the user while strictly excluding AIRTIME from loyalty discounts.
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

  let bestDiscount: ActiveDiscountInfo = {
    hasDiscount: false,
    originalPrice: numericBasePrice,
    finalPrice: numericBasePrice,
    savedAmount: 0,
  };

  try {
    // 1. Evaluate User Loyalty Tier Discount (if user is authenticated)
    if (userId) {
      const loyaltyProfile = await getUserLoyaltyProfile(prismaClient, userId);
      const tierDiscountPct = getTierDiscountForCategory(loyaltyProfile.currentTier, serviceKey);

      if (tierDiscountPct > 0) {
        const savedAmount = Math.round((numericBasePrice * tierDiscountPct) / 100);
        const finalPrice = Math.max(0, numericBasePrice - savedAmount);

        bestDiscount = {
          hasDiscount: true,
          discountPct: tierDiscountPct,
          originalPrice: numericBasePrice,
          finalPrice: finalPrice,
          savedAmount: savedAmount,
          badge: `${loyaltyProfile.currentTier.name} ${tierDiscountPct}% OFF`,
          tierName: loyaltyProfile.currentTier.fullName,
          tierBadge: loyaltyProfile.currentTier.badge,
          isLoyaltyTierDiscount: true,
        };
      }
    }

    // 2. Evaluate Active Promo Codes (check if a promo provides a higher discount)
    const now = new Date();
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
      const isEligible = promo.restrictedServices.some((s: string) => {
        const norm = s.toUpperCase();
        if (norm === "ALL") return true;
        if (norm === normalizedKey) return true;
        
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
        if (norm === "NIN_PERSONALIZATION" || norm === "PERSONALIZATION") {
          return normalizedKey === "NIN_PERSONALIZATION";
        }
        if (norm === "AFFIDAVIT" || norm === "AFFIDAVITS" || norm === "COURT_AFFIDAVIT") {
          return normalizedKey.startsWith("AFFIDAVIT") || normalizedKey.startsWith("PRICE_COURT_AFFIDAVIT");
        }
        if (norm === "TAX_ID" || norm === "TAXID" || norm === "TIN") {
          return normalizedKey.startsWith("TAX_ID");
        }
        if (norm === "BVN_RETRIEVAL") {
          return normalizedKey === "BVN_RETRIEVAL";
        }
        if (norm === "CAC") {
          return ["BUSINESS_NAME", "LLC", "NGO"].includes(normalizedKey);
        }
        return false;
      });

      if (!isEligible) continue;

      if (promo.usageLimit !== null && promo.timesUsed >= promo.usageLimit) {
        continue;
      }

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

      let promoDiscountAmount = 0;
      if (promo.discountPct && promo.discountPct > 0) {
        promoDiscountAmount = Math.round((numericBasePrice * promo.discountPct) / 100);
      } else if (promo.fixedAmount && Number(promo.fixedAmount) > 0) {
        promoDiscountAmount = Math.round(Number(promo.fixedAmount));
      }

      promoDiscountAmount = Math.min(promoDiscountAmount, numericBasePrice);
      const promoFinalPrice = Math.max(0, numericBasePrice - promoDiscountAmount);

      // If promo discount is greater than current tier discount, upgrade to promo
      if (promoDiscountAmount > bestDiscount.savedAmount) {
        bestDiscount = {
          hasDiscount: true,
          promoId: promo.id,
          promoCode: promo.code,
          discountPct: promo.discountPct || undefined,
          originalPrice: numericBasePrice,
          finalPrice: promoFinalPrice,
          savedAmount: promoDiscountAmount,
          badge: promo.discountPct ? `${promo.discountPct}% OFF` : `₦${promoDiscountAmount.toLocaleString()} OFF`,
          isLoyaltyTierDiscount: false,
        };
      }
    }
  } catch (error) {
    console.error(`[Discounts Engine] Error evaluating discounts for ${serviceKey}:`, error);
  }

  return bestDiscount;
}

/**
 * Helper to atomically record promo usage and increment timesUsed in transaction
 */
export async function recordPromoUsageInTx(
  tx: any,
  promoId: string | undefined,
  userId: string,
  discountAmount?: number,
  serviceKey?: string
) {
  if (!promoId || !userId) return;

  try {
    await tx.promoUsage.create({
      data: {
        promoId,
        userId,
        discountAmount: discountAmount || 0,
        serviceKey: serviceKey || "DIRECT_SERVICE",
      },
    });

    await tx.promoCode.update({
      where: { id: promoId },
      data: { timesUsed: { increment: 1 } },
    });
  } catch (err) {
    console.error(`[Promo Usage Recording Error] Failed to log usage for promo ${promoId}:`, err);
  }
}
