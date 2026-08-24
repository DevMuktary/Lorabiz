import { PrismaClient } from "@prisma/client";

export type LoyaltyTierLevel = "TIER_1" | "TIER_2" | "TIER_3" | "TIER_4";

export interface TierConfig {
  level: LoyaltyTierLevel;
  tierNumber: number;
  name: string;
  fullName: string;
  badge: string;
  minSpend: number;
  maxSpend: number | null;
  discountPct: number;
  referralMultiplier: number;
  minWithdrawal: number;
  priorityQueue: "STANDARD" | "FAST" | "VIP";
  colorHex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  description: string;
}

export const LOYALTY_TIERS: Record<LoyaltyTierLevel, TierConfig> = {
  TIER_1: {
    level: "TIER_1",
    tierNumber: 1,
    name: "Bronze",
    fullName: "Tier 1 (Bronze Starter)",
    badge: "🥉 Tier 1 · Bronze",
    minSpend: 0,
    maxSpend: 24999,
    discountPct: 0,
    referralMultiplier: 1.0,
    minWithdrawal: 2000,
    priorityQueue: "STANDARD",
    colorHex: "#cd7f32",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/20",
    textClass: "text-amber-600 dark:text-amber-400",
    description: "Standard retail pricing for new and personal accounts.",
  },
  TIER_2: {
    level: "TIER_2",
    tierNumber: 2,
    name: "Silver",
    fullName: "Tier 2 (Silver Agent)",
    badge: "🥈 Tier 2 · Silver",
    minSpend: 25000,
    maxSpend: 99999,
    discountPct: 2,
    referralMultiplier: 1.1,
    minWithdrawal: 1500,
    priorityQueue: "STANDARD",
    colorHex: "#94a3b8",
    bgClass: "bg-slate-400/10",
    borderClass: "border-slate-400/30",
    textClass: "text-slate-300 dark:text-slate-200",
    description: "2% continuous discount on all services & ₦1,500 min withdrawal.",
  },
  TIER_3: {
    level: "TIER_3",
    tierNumber: 3,
    name: "Gold",
    fullName: "Tier 3 (Gold Pro)",
    badge: "🥇 Tier 3 · Gold Pro",
    minSpend: 100000,
    maxSpend: 499999,
    discountPct: 4,
    referralMultiplier: 1.2,
    minWithdrawal: 1000,
    priorityQueue: "FAST",
    colorHex: "#eab308",
    bgClass: "bg-yellow-500/10",
    borderClass: "border-yellow-500/30",
    textClass: "text-yellow-500 dark:text-yellow-400",
    description: "4% continuous discount, fast-track processing queue & ₦1,000 min withdrawal.",
  },
  TIER_4: {
    level: "TIER_4",
    tierNumber: 4,
    name: "Platinum",
    fullName: "Tier 4 (Platinum VIP)",
    badge: "💎 Tier 4 · Platinum VIP",
    minSpend: 500000,
    maxSpend: null,
    discountPct: 6,
    referralMultiplier: 1.25,
    minWithdrawal: 500,
    priorityQueue: "VIP",
    colorHex: "#38bdf8",
    bgClass: "bg-sky-500/10",
    borderClass: "border-sky-500/30",
    textClass: "text-sky-400 dark:text-sky-300",
    description: "6% maximum continuous discount, VIP priority queue & ₦500 min withdrawal.",
  },
};

/**
 * Calculates a user's legitimate all-time spend strictly from confirmed service debit transactions.
 * Anti-exploit: Excludes wallet funding, wallet transfers, withdrawals, and refunds.
 */
export async function getUserAllTimeSpend(
  prismaClient: PrismaClient | any,
  userId: string
): Promise<number> {
  if (!userId) return 0;

  try {
    const aggregate = await prismaClient.transaction.aggregate({
      where: {
        wallet: { userId },
        type: "DEBIT",
        status: "SUCCESS",
        NOT: {
          serviceCategory: {
            in: ["REFUND", "TRANSFER", "WITHDRAWAL", "FUNDING"],
          },
        },
      },
      _sum: {
        amount: true,
      },
    });

    return Number(aggregate._sum.amount || 0);
  } catch (error) {
    console.error("Error calculating user all-time spend:", error);
    return 0;
  }
}

export interface UserLoyaltyProfile {
  allTimeSpend: number;
  currentTier: TierConfig;
  nextTier: TierConfig | null;
  progressPct: number;
  remainingSpendToNextTier: number;
  discountPct: number;
  referralMultiplier: number;
  minWithdrawal: number;
}

/**
 * Retrieves the complete loyalty profile, active tier, and next milestone for a user.
 */
export async function getUserLoyaltyProfile(
  prismaClient: PrismaClient | any,
  userId: string
): Promise<UserLoyaltyProfile> {
  const spend = await getUserAllTimeSpend(prismaClient, userId);

  let currentTier: TierConfig = LOYALTY_TIERS.TIER_1;
  let nextTier: TierConfig | null = LOYALTY_TIERS.TIER_2;

  if (spend >= LOYALTY_TIERS.TIER_4.minSpend) {
    currentTier = LOYALTY_TIERS.TIER_4;
    nextTier = null;
  } else if (spend >= LOYALTY_TIERS.TIER_3.minSpend) {
    currentTier = LOYALTY_TIERS.TIER_3;
    nextTier = LOYALTY_TIERS.TIER_4;
  } else if (spend >= LOYALTY_TIERS.TIER_2.minSpend) {
    currentTier = LOYALTY_TIERS.TIER_2;
    nextTier = LOYALTY_TIERS.TIER_3;
  } else {
    currentTier = LOYALTY_TIERS.TIER_1;
    nextTier = LOYALTY_TIERS.TIER_2;
  }

  let progressPct = 100;
  let remainingSpendToNextTier = 0;

  if (nextTier) {
    const tierRange = nextTier.minSpend - currentTier.minSpend;
    const spendInCurrentTier = spend - currentTier.minSpend;
    progressPct = Math.min(100, Math.max(0, Math.round((spendInCurrentTier / tierRange) * 100)));
    remainingSpendToNextTier = Math.max(0, nextTier.minSpend - spend);
  }

  return {
    allTimeSpend: spend,
    currentTier,
    nextTier,
    progressPct,
    remainingSpendToNextTier,
    discountPct: currentTier.discountPct,
    referralMultiplier: currentTier.referralMultiplier,
    minWithdrawal: currentTier.minWithdrawal,
  };
}

/**
 * Returns tier discount percentage for a service category.
 * Anti-exploit: Strictly returns 0% for AIRTIME purchases.
 */
export function getTierDiscountForCategory(
  tier: TierConfig,
  serviceKeyOrCategory?: string
): number {
  if (!serviceKeyOrCategory) return tier.discountPct;

  const upper = serviceKeyOrCategory.toUpperCase();
  if (upper === "AIRTIME" || upper.startsWith("AIRTIME_") || upper.includes("VTU_AIRTIME")) {
    return 0; // Airtime excluded from loyalty discounts
  }

  return tier.discountPct;
}
