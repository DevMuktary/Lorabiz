import { PrismaClient, Prisma, UserRewardType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface WheelSlice {
  id: string;
  label: string;
  shortLabel: string;
  type: "WALLET_CASH" | "AIRTIME" | "NIN_SLIP" | "NIN_VALIDATION" | "NIN_PERSONALIZATION" | "CAC_VOUCHER" | "SCUML_VOUCHER";
  value: number;
  weight: number; // Server-side drop rate weight (0 = locked/teaser)
  color: string;
  textColor: string;
  isTeaser?: boolean;
}

export const DEFAULT_WHEEL_SLICES: WheelSlice[] = [
  {
    id: "slice-1",
    label: "₦200 Instant Airtime",
    shortLabel: "₦200 Airtime",
    type: "AIRTIME",
    value: 200,
    weight: 30, // 30% drop rate
    color: "#059669", // Emerald
    textColor: "#FFFFFF",
  },
  {
    id: "slice-2",
    label: "Free Premium NIN Slip",
    shortLabel: "Free NIN Slip",
    type: "NIN_SLIP",
    value: 1000,
    weight: 30, // 30% drop rate
    color: "#2563EB", // Blue
    textColor: "#FFFFFF",
  },
  {
    id: "slice-3",
    label: "₦5,000 Grand Wallet Credit",
    shortLabel: "₦5,000 Jackpot",
    type: "WALLET_CASH",
    value: 5000,
    weight: 0, // Teaser / 0% drop rate
    color: "#D97706", // Amber
    textColor: "#FFFFFF",
    isTeaser: true,
  },
  {
    id: "slice-4",
    label: "₦500 Wallet Bonus",
    shortLabel: "₦500 Bonus",
    type: "WALLET_CASH",
    value: 500,
    weight: 20, // 20% drop rate
    color: "#7C3AED", // Violet
    textColor: "#FFFFFF",
  },
  {
    id: "slice-5",
    label: "Free Business Name CAC",
    shortLabel: "Free CAC Reg",
    type: "CAC_VOUCHER",
    value: 29000,
    weight: 0, // Teaser / 0% drop rate
    color: "#DB2777", // Pink
    textColor: "#FFFFFF",
    isTeaser: true,
  },
  {
    id: "slice-6",
    label: "₦1,000 CAC / SCUML Voucher",
    shortLabel: "₦1,000 Voucher",
    type: "CAC_VOUCHER",
    value: 1000,
    weight: 10, // 10% drop rate
    color: "#0891B2", // Cyan
    textColor: "#FFFFFF",
  },
  {
    id: "slice-7",
    label: "Free NIN Validation Pass",
    shortLabel: "Free Validation",
    type: "NIN_VALIDATION",
    value: 2000,
    weight: 5, // 5% drop rate
    color: "#0D9488", // Teal
    textColor: "#FFFFFF",
  },
  {
    id: "slice-8",
    label: "Free NIN Personalization Pass",
    shortLabel: "Free Personalize",
    type: "NIN_PERSONALIZATION",
    value: 1500,
    weight: 5, // 5% drop rate
    color: "#4F46E5", // Indigo
    textColor: "#FFFFFF",
  },
];

/**
 * Evaluates whether a wallet deposit qualifies for a Lucky Spin Token
 * and atomically creates the SpinToken record.
 */
export async function grantSpinTokenIfEligible(
  db: Prisma.TransactionClient | PrismaClient,
  userId: string,
  depositAmount: number,
  sourceTxRef: string
) {
  try {
    // 1. Check if campaign is active
    const campaignSetting = await db.globalSetting.findUnique({
      where: { key: "SPIN_CAMPAIGN_ACTIVE" },
    });
    if (campaignSetting && campaignSetting.value === "false") {
      return null;
    }

    // 2. Check threshold
    const thresholdSetting = await db.globalSetting.findUnique({
      where: { key: "SPIN_MIN_DEPOSIT" },
    });
    const minDeposit = thresholdSetting ? Number(thresholdSetting.value) : 20000.0;

    if (depositAmount < minDeposit) {
      return null;
    }

    // 3. Prevent duplicate token generation for the exact same deposit reference
    const existing = await db.spinToken.findFirst({
      where: { sourceTxRef },
    });
    if (existing) {
      return existing;
    }

    // 4. Calculate token count (1 token per minDeposit milestone, minimum 1)
    const tokenCount = Math.max(1, Math.floor(depositAmount / minDeposit));

    const createdTokens = [];
    for (let i = 0; i < tokenCount; i++) {
      const refSuffix = tokenCount > 1 ? `${sourceTxRef}_${i + 1}` : sourceTxRef;
      const token = await db.spinToken.create({
        data: {
          userId,
          sourceTxRef: refSuffix,
          depositAmount: depositAmount,
          status: "AVAILABLE",
        },
      });
      createdTokens.push(token);
    }

    return createdTokens;
  } catch (error) {
    console.error("❌ Error granting Spin Token:", error);
    return null;
  }
}

/**
 * Server-side spin wheel execution with strict atomic state guard
 * against race conditions and concurrent multi-device double clicks.
 */
export async function spinWheelServerSide(userId: string) {
  return await prisma.$transaction(
    async (tx) => {
      // 1. Find the earliest available spin token for this user
      const availableToken = await tx.spinToken.findFirst({
        where: {
          userId,
          status: "AVAILABLE",
        },
        orderBy: { createdAt: "asc" },
      });

      if (!availableToken) {
        throw new Error("NO_SPIN_TOKEN_AVAILABLE");
      }

      // 2. ATOMIC STATE TRANSITION: Guard against concurrent multi-device taps
      // If two requests hit simultaneously, only one can update status from AVAILABLE -> USED
      const updateResult = await tx.spinToken.updateMany({
        where: {
          id: availableToken.id,
          status: "AVAILABLE",
        },
        data: {
          status: "USED",
          spunAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new Error("RACE_CONDITION_DETECTED");
      }

      // 3. Get Wheel Slices Configuration
      const slicesSetting = await tx.globalSetting.findUnique({
        where: { key: "SPIN_SLICES_CONFIG" },
      });

      let activeSlices: WheelSlice[] = DEFAULT_WHEEL_SLICES;
      if (slicesSetting && slicesSetting.value) {
        try {
          activeSlices = JSON.parse(slicesSetting.value);
        } catch {
          activeSlices = DEFAULT_WHEEL_SLICES;
        }
      }

      // 4. Weighted random selection (Filtering out slices with 0 weight)
      const eligibleSlices = activeSlices.filter((s) => s.weight > 0);
      const totalWeight = eligibleSlices.reduce((acc, s) => acc + s.weight, 0);

      let randomWeight = Math.random() * totalWeight;
      let selectedSlice: WheelSlice = eligibleSlices[0] || DEFAULT_WHEEL_SLICES[0];

      for (const slice of eligibleSlices) {
        if (randomWeight < slice.weight) {
          selectedSlice = slice;
          break;
        }
        randomWeight -= slice.weight;
      }

      // Find original index in the full activeSlices array so frontend wheel spins to the exact slice
      const winningSliceIndex = activeSlices.findIndex((s) => s.id === selectedSlice.id);

      // 5. AUTOMATED PRIZE FULFILLMENT
      let prizeDetails: Record<string, any> = {
        sliceId: selectedSlice.id,
        label: selectedSlice.label,
        type: selectedSlice.type,
        value: selectedSlice.value,
      };

      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user) throw new Error("USER_NOT_FOUND");

      if (selectedSlice.type === "AIRTIME") {
        await tx.userRewardCredit.create({
          data: {
            userId,
            rewardType: "AIRTIME",
            title: "₦200 Free Airtime Discount",
            description: "₦200 off your next airtime recharge on any network (MTN, Airtel, Glo, 9mobile).",
            value: selectedSlice.value,
            status: "ACTIVE",
            sourceSpinId: availableToken.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
      } else if (selectedSlice.type === "WALLET_CASH") {
        if (user.wallet && selectedSlice.value > 0) {
          const balanceBefore = Number(user.wallet.balance);
          const balanceAfter = balanceBefore + selectedSlice.value;

          await tx.wallet.update({
            where: { id: user.wallet.id },
            data: { balance: { increment: selectedSlice.value } },
          });

          await tx.transaction.create({
            data: {
              walletId: user.wallet.id,
              amount: selectedSlice.value,
              balanceBefore,
              balanceAfter,
              type: "CREDIT",
              status: "SUCCESS",
              reference: `REW_SPIN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
              serviceCategory: "REWARD",
              description: `🎁 Lorabiz Lucky Spin Reward - ${selectedSlice.label}`,
            },
          });

          // Also record in UserRewardCredit so it shows in "My Won Rewards" history
          await tx.userRewardCredit.create({
            data: {
              userId,
              rewardType: "WALLET_CASH",
              title: selectedSlice.label,
              description: `₦${selectedSlice.value.toLocaleString()} credited directly to your wallet balance.`,
              value: selectedSlice.value,
              status: "REDEEMED",
              redeemedAt: new Date(),
              sourceSpinId: availableToken.id,
            },
          });
        }
      } else if (selectedSlice.type === "NIN_SLIP") {
        await tx.userRewardCredit.create({
          data: {
            userId,
            rewardType: "NIN_SLIP",
            title: "1x Free Premium NIN Slip Pass",
            description: "Valid for 1 instant Premium NIN Slip generation at ₦0 fee.",
            value: selectedSlice.value,
            status: "ACTIVE",
            sourceSpinId: availableToken.id,
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          },
        });
      } else if (selectedSlice.type === "NIN_VALIDATION") {
        await tx.userRewardCredit.create({
          data: {
            userId,
            rewardType: "NIN_VALIDATION",
            title: "1x Free NIN Validation Pass",
            description: "Valid for 1 instant NIN Validation submission at ₦0 fee.",
            value: selectedSlice.value,
            status: "ACTIVE",
            sourceSpinId: availableToken.id,
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          },
        });
      } else if (selectedSlice.type === "NIN_PERSONALIZATION") {
        await tx.userRewardCredit.create({
          data: {
            userId,
            rewardType: "NIN_PERSONALIZATION",
            title: "1x Free NIN Personalization Pass",
            description: "Valid for 1 NIMC Personalization tracking submission at ₦0 fee.",
            value: selectedSlice.value,
            status: "ACTIVE",
            sourceSpinId: availableToken.id,
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          },
        });
      } else if (selectedSlice.type === "CAC_VOUCHER" || selectedSlice.type === "SCUML_VOUCHER") {
        const randomCode = `SPIN-CAC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        prizeDetails.voucherCode = randomCode;

        await tx.userRewardCredit.create({
          data: {
            userId,
            rewardType: selectedSlice.type as UserRewardType,
            title: "₦1,000 Off CAC / SCUML Registration",
            description: `Discount voucher code ${randomCode} for ₦1,000 off at CAC/SCUML checkout.`,
            value: selectedSlice.value,
            voucherCode: randomCode,
            status: "ACTIVE",
            sourceSpinId: availableToken.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
      }

      // 6. Update Spin Token with won prize info
      await tx.spinToken.update({
        where: { id: availableToken.id },
        data: {
          wonPrizeType: selectedSlice.type,
          wonPrizeValue: selectedSlice.value,
          wonPrizeLabel: selectedSlice.label,
          wonPrizeDetails: prizeDetails as any,
        },
      });

      return {
        success: true,
        tokenId: availableToken.id,
        winningSliceIndex: winningSliceIndex >= 0 ? winningSliceIndex : 0,
        prize: {
          id: selectedSlice.id,
          label: selectedSlice.label,
          shortLabel: selectedSlice.shortLabel,
          type: selectedSlice.type,
          value: selectedSlice.value,
          color: selectedSlice.color,
          details: prizeDetails,
        },
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000,
    }
  );
}

/**
 * Atomically consumes a user's free reward pass during service submission
 * to guarantee no double-spend across concurrent browser sessions.
 */
export async function redeemServiceRewardCredit(
  tx: Prisma.TransactionClient,
  userId: string,
  rewardType: UserRewardType,
  serviceRef: string
) {
  const credit = await tx.userRewardCredit.findFirst({
    where: {
      userId,
      rewardType,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "asc" },
  });

  if (!credit) {
    return null;
  }

  const updateResult = await tx.userRewardCredit.updateMany({
    where: {
      id: credit.id,
      status: "ACTIVE",
    },
    data: {
      status: "REDEEMED",
      redeemedAt: new Date(),
      usedForServiceRef: serviceRef,
    },
  });

  if (updateResult.count === 0) {
    return null;
  }

  return credit;
}

/**
 * Gets user's available reward passes count
 */
export async function getUserRewardPassCount(userId: string, rewardType: UserRewardType): Promise<number> {
  return await prisma.userRewardCredit.count({
    where: {
      userId,
      rewardType,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
}
