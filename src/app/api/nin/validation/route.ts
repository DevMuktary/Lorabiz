// src/app/api/nin/validation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { logUserActivity } from "@/lib/activity-logger";
import { NinValidationCategory } from "@prisma/client";
import { getEffectiveServicePrice, recordPromoUsageInTx } from "@/lib/discounts";

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
    label: "VNIN Validation",
  },
  UPDATE_RECORD_MOD: {
    key: "NIN_VALIDATION_MOD",
    defaultPrice: 3000.0,
    label: "Update Record (Mod Validation)",
  },
};

export async function GET() {
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

    // Fetch user validation requests
    const history = await prisma.ninValidationRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      walletBalance: user.wallet ? Number(user.wallet.balance) : 0,
      pricing: categoryPricing,
      history,
    });
  } catch (error) {
    console.error("NIN Validation GET API Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch validation data." }, { status: 500 });
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
    const { category, nin, attestationsAccepted } = body;

    // Validate Category
    if (!category || !(category in CATEGORY_PRICE_KEYS)) {
      return NextResponse.json(
        { success: false, message: "Please select a valid validation category." },
        { status: 400 }
      );
    }

    const validCategory = category as NinValidationCategory;

    // Validate 11-digit NIN
    const sanitizedNin = typeof nin === "string" ? nin.trim() : "";
    if (!sanitizedNin || !/^\d{11}$/.test(sanitizedNin)) {
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

    const nominalPrice = servicePricing ? Number(servicePricing.price) : categoryConfig.defaultPrice;
    const discountInfo = await getEffectiveServicePrice(prisma, categoryConfig.key, nominalPrice, user.id);
    const requiredAmount = discountInfo.finalPrice;
    const currentBalance = Number(user.wallet.balance);

    if (currentBalance < requiredAmount) {
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
          message: `You already have an active validation request in processing for this NIN under "${categoryConfig.label}" (Ref: ${existingActiveRequest.transactionRef}).`,
        },
        { status: 409 }
      );
    }

    // Unique Transaction Reference
    const transactionRef = `NINVAL_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Atomic Transaction: Debit Wallet + Log Transaction + Create Validation Request
    const result = await prisma.$transaction(async (tx) => {
      const balanceBefore = Number(user.wallet!.balance);
      const balanceAfter = balanceBefore - requiredAmount;

      // 1. Debit Wallet
      await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: { decrement: requiredAmount } },
      });

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
          description: `Payment for NIN Validation [${categoryConfig.label}] - NIN: *******${sanitizedNin.slice(-4)}`,
        },
      });

      // 3. Create NIN Validation Request Record
      const newRequest = await tx.ninValidationRequest.create({
        data: {
          userId: user.id,
          category: validCategory,
          nin: sanitizedNin,
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
        await recordPromoUsageInTx(tx, discountInfo.promoId, user.id);
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
