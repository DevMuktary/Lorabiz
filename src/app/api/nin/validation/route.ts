// src/app/api/nin/validation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { logUserActivity } from "@/lib/activity-logger";
import { NinValidationCategory } from "@prisma/client";
import { getEffectiveServicePrice, recordPromoUsageInTx } from "@/lib/discounts";
import { redeemServiceRewardCredit, getUserRewardPassCount } from "@/lib/rewards";

// Category to ServicePricing key mapping
export const CATEGORY_PRICE_KEYS: Record<NinValidationCategory, { key: string; defaultPrice: number; label: string }> = {
  NO_RECORD_FOUND: {
    key: "NIN_VALIDATION_NO_RECORD",
    defaultPrice: 2000.0,
    label: "No Record Found",
  },
  VNIN_VALIDATION: {
    key: "NIN_VALIDATION_VNIN",
    defaultPrice: 2500.0,
    label: "SIM/Bank & VNIN Validation",
  },
  UPDATE_RECORD_MOD: {
    key: "NIN_VALIDATION_MOD",
    defaultPrice: 3000.0,
    label: "Update Record (Mod Validation)",
  },
  PHOTO_ERROR: {
    key: "NIN_VALIDATION_PHOTO_ERROR",
    defaultPrice: 1600.0,
    label: "Photographic Error",
  },
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    // Fetch dynamic pricing for all 3 categories
    const pricingRecords = await prisma.servicePricing.findMany({
      where: {
        serviceKey: {
          in: Object.values(CATEGORY_PRICE_KEYS).map((c) => c.key),
        },
      },
    });

    const categoryPricing: Record<string, { price: number; originalPrice?: number; hasDiscount?: boolean; discountBadge?: string; savedAmount?: number; isActive: boolean; maintenanceMsg?: string | null }> = {};

    for (const [cat, config] of Object.entries(CATEGORY_PRICE_KEYS)) {
      const found = pricingRecords.find((r) => r.serviceKey === config.key);
      const base = found ? Number(found.price) : config.defaultPrice;
      const discountInfo = await getEffectiveServicePrice(prisma, config.key, base, user.id);

      categoryPricing[cat] = {
        price: discountInfo.finalPrice,
        originalPrice: discountInfo.originalPrice,
        hasDiscount: discountInfo.hasDiscount,
        discountBadge: discountInfo.badge,
        savedAmount: discountInfo.savedAmount,
        isActive: found ? found.isActive : true,
        maintenanceMsg: found?.maintenanceMsg || null,
      };
    }

    // Fetch user validation requests and free pass count
    const [history, freePassCount] = await Promise.all([
      prisma.ninValidationRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      getUserRewardPassCount(user.id, "NIN_VALIDATION"),
    ]);

    return NextResponse.json({
      success: true,
      walletBalance: user.wallet ? Number(user.wallet.balance) : 0,
      pricing: categoryPricing,
      history,
      freePassCount,
    });
  } catch (error: any) {
    console.error("❌ NIN Validation Info GET Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load validation details." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { nin, category, attestationsAccepted, useRewardCredit } = body;

    // Validate Category
    if (!category || !(category in CATEGORY_PRICE_KEYS)) {
      return NextResponse.json(
        { success: false, message: "Please select a valid validation category." },
        { status: 400 }
      );
    }

    const validCategory = category as NinValidationCategory;

    // Validate 11-digit NIN
    const sanitizedNin = typeof nin === "string" ? nin.trim().replace(/\D/g, "") : "";
    if (sanitizedNin.length !== 11) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 11-digit National Identification Number (NIN)." },
        { status: 400 }
      );
    }

    if (!attestationsAccepted) {
      return NextResponse.json(
        { success: false, message: "You must accept the terms and guidelines before submitting." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json(
        { success: false, message: "User account or wallet not found." },
        { status: 404 }
      );
    }

    // Check category pricing & kill switch
    const categoryConfig = CATEGORY_PRICE_KEYS[validCategory];
    const servicePricing = await prisma.servicePricing.findUnique({
      where: { serviceKey: categoryConfig.key },
    });

    if (servicePricing && !servicePricing.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: servicePricing.maintenanceMsg || `${categoryConfig.label} is currently unavailable for maintenance.`,
        },
        { status: 400 }
      );
    }

    let isUsingCredit = false;
    if (useRewardCredit) {
      const availablePasses = await getUserRewardPassCount(user.id, "NIN_VALIDATION");
      if (availablePasses > 0) {
        isUsingCredit = true;
      }
    }

    const nominalPrice = servicePricing ? Number(servicePricing.price) : categoryConfig.defaultPrice;
    const discountInfo = await getEffectiveServicePrice(prisma, categoryConfig.key, nominalPrice, user.id);
    const requiredAmount = isUsingCredit ? 0 : discountInfo.finalPrice;
    const currentBalance = Number(user.wallet.balance);

    if (!isUsingCredit && currentBalance < requiredAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient wallet balance. ${categoryConfig.label} requires ₦${requiredAmount.toLocaleString()} but your balance is ₦${currentBalance.toLocaleString()}. Please fund your wallet.`,
        },
        { status: 402 }
      );
    }

    // Check for duplicate pending/processing request with same NIN and Category
    const existingActiveRequest = await prisma.ninValidationRequest.findFirst({
      where: {
        userId: user.id,
        nin: sanitizedNin,
        category: validCategory,
        status: "PROCESSING",
      },
    });

    if (existingActiveRequest) {
      return NextResponse.json(
        {
          success: false,
          message: `You already have an active validation request in progress for this NIN (${existingActiveRequest.transactionRef}). Please wait for it to complete.`,
        },
        { status: 409 }
      );
    }

    // Unique Transaction Reference
    const transactionRef = `VAL_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // Atomic Transaction: Debit Wallet + Log Transaction + Create Validation Request
    const result = await prisma.$transaction(async (tx) => {
      let balanceBefore = Number(user.wallet!.balance);
      let balanceAfter = balanceBefore;

      if (isUsingCredit) {
        const redeemed = await redeemServiceRewardCredit(tx, user.id, "NIN_VALIDATION", transactionRef);
        if (!redeemed) {
          throw new Error("REWARD_PASS_UNAVAILABLE");
        }
      } else {
        const currentWallet = await tx.wallet.findUnique({ where: { id: user.wallet!.id } });
        if (!currentWallet || Number(currentWallet.balance) < requiredAmount) {
          throw new Error("INSUFFICIENT_BALANCE");
        }

        balanceBefore = Number(currentWallet.balance);
        const updatedWallet = await tx.wallet.update({
          where: { id: user.wallet!.id },
          data: { balance: { decrement: requiredAmount } },
        });
        balanceAfter = Number(updatedWallet.balance);
      }

      // 2. Log Debit in Master Ledger
      await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: requiredAmount,
          balanceBefore,
          balanceAfter,
          type: "DEBIT",
          status: "SUCCESS",
          reference: transactionRef,
          serviceCategory: "NIN",
          description: isUsingCredit 
            ? `Payment for NIN Validation [${categoryConfig.label}] - Free Pass Redeemed - NIN: *******${sanitizedNin.slice(-4)}`
            : `Payment for NIN Validation [${categoryConfig.label}] - NIN: *******${sanitizedNin.slice(-4)}`,
        },
      });

      // 3. Create NIN Validation Request Record
      const newRequest = await tx.ninValidationRequest.create({
        data: {
          userId: user.id,
          category: validCategory,
          nin: sanitizedNin,
          provider: "ABJIKTECH",
          status: "PROCESSING",
          amountCharged: requiredAmount,
          transactionRef,
        },
      });

      // 4. Create In-App Notification
      await tx.inAppNotification.create({
        data: {
          userId: user.id,
          title: "NIN Validation Submitted ⏳",
          message: `Your NIN validation request for "${categoryConfig.label}" is being processed. Ref: ${transactionRef}`,
          type: "info",
          link: `/dashboard/nin/validation/history`,
        },
      });

      // 5. Record promo usage if discount was applied
      if (discountInfo.hasDiscount && discountInfo.promoId) {
        await recordPromoUsageInTx(tx, discountInfo.promoId, user.id, discountInfo.savedAmount, categoryConfig.key);
      }

      return newRequest;
    });

    // Log Activity (Asynchronous)
    await logUserActivity({
      userId: user.id,
      action: "NIN_VALIDATION_SUBMITTED",
      category: "SERVICES",
      description: `Submitted NIN Validation for ${categoryConfig.label} (Ref: ${transactionRef})`,
      status: "SUCCESS",
      referenceId: transactionRef,
      metadata: {
        category: validCategory,
        maskedNin: `*******${sanitizedNin.slice(-4)}`,
        amount: requiredAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: "NIN validation request successfully submitted and queued for processing.",
      reference: transactionRef,
      data: result,
    });
  } catch (error: any) {
    console.error("NIN Validation Submission Error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to process NIN validation submission." },
      { status: 500 }
    );
  }
}
