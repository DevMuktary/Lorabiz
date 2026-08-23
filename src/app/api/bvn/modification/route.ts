import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendBvnModificationSubmittedEmail } from "@/lib/email";
import { getEffectiveServicePrice, recordPromoUsageInTx } from "@/lib/discounts";

export const dynamic = "force-dynamic";

export const ENROLLING_BANKS = [
  { id: "AGENCY_BVN", name: "Agency BVN", description: "POS Agent & Field Enrollment", isAvailable: true },
  { id: "ENTERPRISE", name: "Enterprise Bank", description: "Enterprise Commercial Banking", isAvailable: true },
  { id: "AGRICULTURAL_BANK", name: "Agricultural Bank", description: "Bank of Agriculture / Agribank", isAvailable: true },
  { id: "NIBSS_IMPORT", name: "NIBSS IMPORT", description: "Direct NIBSS Database Migration", isAvailable: true },
  { id: "HERITAGE_BANK", name: "HERITAGE BANK", description: "Heritage Commercial Banking", isAvailable: true },
  { id: "MICROFINANCE_BANK", name: "MICROFINANCE BANK", description: "Microfinance Banking Institutions", isAvailable: true },
];

export const MODIFICATION_OPTIONS: Record<string, { label: string; priceKey: string; defaultPrice: number; hasName: boolean; hasDob: boolean; hasPhone: boolean }> = {
  CHANGE_OF_NAME: {
    label: "Change of Name Only",
    priceKey: "BVN_MOD_NAME",
    defaultPrice: 3000,
    hasName: true,
    hasDob: false,
    hasPhone: false,
  },
  CHANGE_OF_DOB: {
    label: "Change of Date of Birth (DOB) Only",
    priceKey: "BVN_MOD_DOB",
    defaultPrice: 15000,
    hasName: false,
    hasDob: true,
    hasPhone: false,
  },
  CHANGE_OF_PHONE: {
    label: "Change of Phone Number Only",
    priceKey: "BVN_MOD_PHONE",
    defaultPrice: 2500,
    hasName: false,
    hasDob: false,
    hasPhone: true,
  },
  CHANGE_OF_NAME_PHONE: {
    label: "Change of Name & Phone Number",
    priceKey: "BVN_MOD_NAME_PHONE",
    defaultPrice: 5000,
    hasName: true,
    hasDob: false,
    hasPhone: true,
  },
  CHANGE_OF_DOB_PHONE: {
    label: "Change of Date of Birth & Phone Number",
    priceKey: "BVN_MOD_DOB_PHONE",
    defaultPrice: 17000,
    hasName: false,
    hasDob: true,
    hasPhone: true,
  },
  CHANGE_OF_NAME_DOB: {
    label: "Change of Name & Date of Birth (DOB)",
    priceKey: "BVN_MOD_NAME_DOB",
    defaultPrice: 17500,
    hasName: true,
    hasDob: true,
    hasPhone: false,
  },
  CHANGE_OF_ALL: {
    label: "Change of Name, Date of Birth & Phone Number (All 3)",
    priceKey: "BVN_MOD_ALL",
    defaultPrice: 19500,
    hasName: true,
    hasDob: true,
    hasPhone: true,
  },
};

function calculateYearsDifference(currentDobStr: string, newDobStr: string): { diffYears: number; isOverFiveYears: boolean } {
  const current = new Date(currentDobStr);
  const updated = new Date(newDobStr);

  if (isNaN(current.getTime()) || isNaN(updated.getTime())) {
    return { diffYears: 0, isOverFiveYears: false };
  }

  const diffTime = Math.abs(updated.getTime() - current.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  const diffYears = Number((diffDays / 365.2425).toFixed(2));
  
  // 5 calendar years = 1826.25 days
  const isOverFiveYears = diffDays > 1826.25;

  return { diffYears, isOverFiveYears };
}

// GET: Fetch prices, user balance, and modification config
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const [user, pricingRows, dobSetting] = await Promise.all([
      prisma.user.findUnique({
        where: { email: session.user.email },
        include: { wallet: true },
      }),
      prisma.servicePricing.findMany({
        where: {
          serviceKey: {
            in: [
              "BVN_MOD_NAME", 
              "BVN_MOD_PHONE", 
              "BVN_MOD_DOB", 
              "BVN_MOD_NAME_PHONE",
              "BVN_MOD_DOB_PHONE",
              "BVN_MOD_NAME_DOB",
              "BVN_MOD_ALL",
              "BVN_MOD_DOB_SURCHARGE"
            ],
          },
        },
      }),
      prisma.globalSetting.findUnique({
        where: { key: "BVN_MOD_DOB_OVER_5_YEARS_ALLOWED" },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const pricingMap: Record<string, number> = {
      BVN_MOD_NAME: 3000,
      BVN_MOD_PHONE: 2500,
      BVN_MOD_DOB: 15000,
      BVN_MOD_NAME_PHONE: 5000,
      BVN_MOD_DOB_PHONE: 17000,
      BVN_MOD_NAME_DOB: 17500,
      BVN_MOD_ALL: 19500,
      BVN_MOD_DOB_SURCHARGE: 5000,
    };

    for (const p of pricingRows) {
      pricingMap[p.serviceKey] = Number(p.price);
    }

    const effectivePricingMap: Record<string, number> = { ...pricingMap };
    const originalPricingMap: Record<string, number> = { ...pricingMap };
    let hasAnyDiscount = false;
    let globalBadge: string | undefined = undefined;

    for (const key of Object.keys(pricingMap)) {
      const base = pricingMap[key];
      const disc = await getEffectiveServicePrice(prisma, key, base, user.id);
      effectivePricingMap[key] = disc.finalPrice;
      if (disc.hasDiscount) {
        hasAnyDiscount = true;
        if (disc.badge) globalBadge = disc.badge;
      }
    }

    // Default to true if not explicitly set to "false"
    const dobOver5YearsAllowed = dobSetting ? dobSetting.value !== "false" : true;

    return NextResponse.json({
      success: true,
      walletBalance: Number(user.wallet?.balance || 0),
      pricing: effectivePricingMap,
      originalPricing: originalPricingMap,
      hasDiscount: hasAnyDiscount,
      discountBadge: globalBadge,
      dobOver5YearsAllowed,
      enrollingBanks: ENROLLING_BANKS,
      modificationOptions: MODIFICATION_OPTIONS,
    });
  } catch (error: any) {
    console.error("❌ BVN Modification GET Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load BVN modification data." },
      { status: 500 }
    );
  }
}

// POST: Submit a new BVN modification request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const {
      enrollingBank,
      modificationType, // e.g. "CHANGE_OF_NAME", "CHANGE_OF_ALL"
      nin,
      bvn,
      oldFirstName,
      oldLastName,
      oldMiddleName,
      newFirstName,
      newLastName,
      newMiddleName,
      oldDob,
      newDob,
      oldPhone,
      newPhone,
    } = body;

    // 1. Validation of Bank and Modification Type
    const validBank = ENROLLING_BANKS.find(b => b.id === enrollingBank);
    if (!validBank) {
      return NextResponse.json(
        { success: false, message: "Please select a valid enrolling bank from the list." },
        { status: 400 }
      );
    }

    const modConfig = MODIFICATION_OPTIONS[modificationType];
    if (!modConfig) {
      return NextResponse.json(
        { success: false, message: "Please select a valid modification type." },
        { status: 400 }
      );
    }

    // 2. Primary Identifiers Validation
    const cleanNin = (nin || "").trim().replace(/\D/g, "");
    if (!cleanNin || cleanNin.length !== 11) {
      return NextResponse.json(
        { success: false, message: "A valid 11-digit NIN Number is required." },
        { status: 400 }
      );
    }

    const cleanBvn = (bvn || "").trim().replace(/\D/g, "");
    if (!cleanBvn || cleanBvn.length !== 11) {
      return NextResponse.json(
        { success: false, message: "A valid 11-digit BVN Number is required." },
        { status: 400 }
      );
    }

    if (!oldFirstName?.trim() || !oldLastName?.trim()) {
      return NextResponse.json(
        { success: false, message: "Please provide your Old First Name and Surname as registered on your BVN." },
        { status: 400 }
      );
    }

    const currentFullName = [oldFirstName.trim(), oldMiddleName?.trim(), oldLastName.trim()].filter(Boolean).join(" ");

    // 3. Dynamic Field Validations based on selected modification type
    if (modConfig.hasName) {
      if (!newFirstName?.trim() || !newLastName?.trim()) {
        return NextResponse.json(
          { success: false, message: "New First Name and New Surname are required for Name Modification." },
          { status: 400 }
        );
      }
    }

    let surchargeApplied = false;
    let surchargeAmount = 0;
    let yearsDifference: number | null = null;

    if (modConfig.hasDob) {
      if (!oldDob || !newDob) {
        return NextResponse.json(
          { success: false, message: "Both Old Date of Birth and New Date of Birth are required for DOB Modification." },
          { status: 400 }
        );
      }
      const dobCalc = calculateYearsDifference(oldDob, newDob);
      yearsDifference = dobCalc.diffYears;
      surchargeApplied = dobCalc.isOverFiveYears;

      // Check admin policy for DOB difference > 5 years
      if (surchargeApplied) {
        const dobSetting = await prisma.globalSetting.findUnique({
          where: { key: "BVN_MOD_DOB_OVER_5_YEARS_ALLOWED" },
        });
        if (dobSetting && dobSetting.value === "false") {
          return NextResponse.json(
            {
              success: false,
              message: "Date of birth differences greater than 5 years are currently not accepted on the platform.",
            },
            { status: 400 }
          );
        }
      }
    }

    if (modConfig.hasPhone) {
      const cleanNewPhone = (newPhone || "").trim().replace(/\s+/g, "");
      if (!cleanNewPhone || !/^0\d{10}$/.test(cleanNewPhone)) {
        return NextResponse.json(
          { success: false, message: "A valid 11-digit New Phone Number starting with 0 is required." },
          { status: 400 }
        );
      }
    }

    // 4. Fetch Pricing from Database
    const pricingRows = await prisma.servicePricing.findMany({
      where: {
        serviceKey: {
          in: [
            "BVN_MOD_NAME", 
            "BVN_MOD_PHONE", 
            "BVN_MOD_DOB", 
            "BVN_MOD_NAME_PHONE",
            "BVN_MOD_DOB_PHONE",
            "BVN_MOD_NAME_DOB",
            "BVN_MOD_ALL",
            "BVN_MOD_DOB_SURCHARGE"
          ],
        },
      },
    });

    const pricingMap: Record<string, number> = {
      BVN_MOD_NAME: 3000,
      BVN_MOD_PHONE: 2500,
      BVN_MOD_DOB: 15000,
      BVN_MOD_NAME_PHONE: 5000,
      BVN_MOD_DOB_PHONE: 17000,
      BVN_MOD_NAME_DOB: 17500,
      BVN_MOD_ALL: 19500,
      BVN_MOD_DOB_SURCHARGE: 5000,
    };

    for (const p of pricingRows) {
      pricingMap[p.serviceKey] = Number(p.price);
    }

    // 5. Fetch User & Wallet Balance
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, message: "User wallet not found." }, { status: 404 });
    }

    // 6. Calculate Total Dynamic Price
    const nominalBasePrice = pricingMap[modConfig.priceKey] || modConfig.defaultPrice;
    const discountInfo = await getEffectiveServicePrice(prisma, modConfig.priceKey, nominalBasePrice, user.id);
    const basePrice = discountInfo.finalPrice;
    let totalPrice = basePrice;

    if (surchargeApplied) {
      surchargeAmount = pricingMap.BVN_MOD_DOB_SURCHARGE || 5000;
      totalPrice += surchargeAmount;
    }

    const currentBalance = Number(user.wallet.balance);
    if (currentBalance < totalPrice) {
      return NextResponse.json(
        {
          success: false,
          isInsufficientBalance: true,
          message: `Insufficient wallet balance. Total cost is ₦${totalPrice.toLocaleString()}, but your balance is ₦${currentBalance.toLocaleString()}.`,
          requiredAmount: totalPrice,
          currentBalance,
        },
        { status: 400 }
      );
    }

    // Determine Prisma enum type for backward compatibility
    let modTypeEnum: "CHANGE_OF_NAME" | "CHANGE_OF_PHONE" | "CHANGE_OF_DOB" | "COMBINED" = "COMBINED";
    if (modificationType === "CHANGE_OF_NAME") modTypeEnum = "CHANGE_OF_NAME";
    else if (modificationType === "CHANGE_OF_PHONE") modTypeEnum = "CHANGE_OF_PHONE";
    else if (modificationType === "CHANGE_OF_DOB") modTypeEnum = "CHANGE_OF_DOB";

    // Generate unique tracking ID & reference
    const trackingSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const trackingId = `BVN-MOD-${trackingSuffix}`;
    const transactionRef = `TX-BVN-MOD-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;

    // 7. Atomic Transaction: Debit Wallet + Log Transaction + Create Request
    const result = await prisma.$transaction(async (tx) => {
      // Debit wallet
      const updatedWallet = await tx.wallet.update({
        where: { userId: user.id },
        data: {
          balance: {
            decrement: totalPrice,
          },
        },
      });

      // Record transaction
      const transaction = await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: totalPrice,
          balanceBefore: currentBalance,
          balanceAfter: Number(updatedWallet.balance),
          type: "DEBIT",
          status: "SUCCESS",
          reference: transactionRef,
          serviceCategory: "BVN",
          description: `BVN Modification Request (${modConfig.label}) - ${cleanBvn} (${trackingId})`,
        },
      });

      // Create BVN Modification Request
      const modificationRequest = await tx.bvnModificationRequest.create({
        data: {
          trackingId,
          userId: user.id,
          type: modTypeEnum,
          modificationCategory: modificationType,
          status: "PENDING",
          enrollingBank: validBank.name,
          nin: cleanNin,
          bvn: cleanBvn,
          currentFullName,
          oldFirstName: oldFirstName.trim().toUpperCase(),
          oldLastName: oldLastName.trim().toUpperCase(),
          oldMiddleName: oldMiddleName?.trim() ? oldMiddleName.trim().toUpperCase() : null,
          modifyName: modConfig.hasName,
          modifyPhone: modConfig.hasPhone,
          modifyDob: modConfig.hasDob,
          newFirstName: modConfig.hasName ? newFirstName?.trim().toUpperCase() : null,
          newLastName: modConfig.hasName ? newLastName?.trim().toUpperCase() : null,
          newMiddleName: modConfig.hasName && newMiddleName?.trim() ? newMiddleName.trim().toUpperCase() : null,
          currentPhone: modConfig.hasPhone && oldPhone?.trim() ? oldPhone.trim() : null,
          newPhone: modConfig.hasPhone ? newPhone?.trim() : null,
          currentDob: modConfig.hasDob ? oldDob : null,
          newDob: modConfig.hasDob ? newDob : null,
          yearsDifference: yearsDifference,
          surchargeApplied: surchargeApplied,
          surchargeAmount: surchargeAmount,
          documentUrls: [],
          amountPaid: totalPrice,
          transactionRef,
        },
      });

      // Send in-app notification
      await tx.inAppNotification.create({
        data: {
          userId: user.id,
          title: "BVN Modification Submitted",
          message: `Your BVN modification request (${trackingId}) has been received and queued.`,
          type: "INFO",
          link: `/dashboard/bvn/modification/history`,
        },
      });

      // Record promo usage if discount was applied
      if (discountInfo.hasDiscount && discountInfo.promoId) {
        await recordPromoUsageInTx(tx, discountInfo.promoId, user.id, discountInfo.savedAmount, modConfig.priceKey);
      }

      return { updatedWallet, transaction, modificationRequest };
    });

    // Send transactional email in background
    sendBvnModificationSubmittedEmail({
      to: user.email,
      firstName: user.firstName || "Valued Client",
      trackingId,
      modificationType: modConfig.label,
      enrollingBank: validBank.name,
      bvn: cleanBvn,
      amountPaid: totalPrice,
    }).catch(err => console.error("❌ Failed to send BVN modification submitted email:", err));

    return NextResponse.json({
      success: true,
      message: "BVN modification request submitted successfully.",
      trackingId,
      amountPaid: totalPrice,
      surchargeApplied,
      newBalance: Number(result.updatedWallet.balance),
      request: result.modificationRequest,
    });
  } catch (error: any) {
    console.error("❌ BVN Modification POST Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit BVN modification request." },
      { status: 500 }
    );
  }
}
