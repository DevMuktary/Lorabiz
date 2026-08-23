import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { logUserActivity } from "@/lib/activity-logger";
import { sendNinModificationSubmittedEmail } from "@/lib/email";
import { NinModificationType } from "@prisma/client";
import { getEffectiveServicePrice, recordPromoUsageInTx } from "@/lib/discounts";

export const MODIFICATION_PRICE_KEYS: Record<NinModificationType, { key: string; defaultPrice: number; label: string }> = {
  CHANGE_OF_NAME: {
    key: "NIN_MOD_NAME",
    defaultPrice: 2500.0,
    label: "Change of Name",
  },
  CHANGE_OF_PHONE: {
    key: "NIN_MOD_PHONE",
    defaultPrice: 2000.0,
    label: "Change of Phone Number",
  },
  CHANGE_OF_ADDRESS: {
    key: "NIN_MOD_ADDRESS",
    defaultPrice: 2000.0,
    label: "Change of Address",
  },
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized access." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true, ninModificationConsent: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const pricingRecords = await prisma.servicePricing.findMany({
      where: {
        serviceKey: {
          in: Object.values(MODIFICATION_PRICE_KEYS).map((c) => c.key),
        },
      },
    });

    const pricing: Record<string, { price: number; originalPrice?: number; hasDiscount?: boolean; discountBadge?: string; savedAmount?: number; isActive: boolean; maintenanceMsg?: string | null; label: string }> = {};

    for (const [type, config] of Object.entries(MODIFICATION_PRICE_KEYS)) {
      const found = pricingRecords.find((r) => r.serviceKey === config.key);
      const base = found ? Number(found.price) : config.defaultPrice;
      const discountInfo = await getEffectiveServicePrice(prisma, config.key, base, user.id);

      pricing[type] = {
        price: discountInfo.finalPrice,
        originalPrice: discountInfo.originalPrice,
        hasDiscount: discountInfo.hasDiscount,
        discountBadge: discountInfo.badge,
        savedAmount: discountInfo.savedAmount,
        isActive: found ? found.isActive : true,
        maintenanceMsg: found?.maintenanceMsg || null,
        label: config.label,
      };
    }

    return NextResponse.json({
      success: true,
      walletBalance: user.wallet ? Number(user.wallet.balance) : 0,
      hasConsented: !!user.ninModificationConsent,
      userFullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      pricing,
    });
  } catch (error) {
    console.error("Error fetching NIN Modification initial data:", error);
    return NextResponse.json({ success: false, message: "Failed to load service configuration." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized. Please log in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true, ninModificationConsent: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    // 1. Mandatory Legal Terms Verification Check
    if (!user.ninModificationConsent) {
      return NextResponse.json({
        success: false,
        requiresConsent: true,
        message: "You must review and agree to the LoraBiz Terms of Agreement before submitting a modification request.",
      }, { status: 403 });
    }

    const body = await req.json();
    const {
      type,
      nin,
      currentPhone,
      newFirstName,
      newLastName,
      newMiddleName,
      currentFullName,
      newPhoneNumber,
      newAddress,
      newState,
      newLga,
    } = body;

    // Validate type
    if (!type || !Object.values(NinModificationType).includes(type as NinModificationType)) {
      return NextResponse.json({ success: false, message: "Invalid modification type." }, { status: 400 });
    }

    // Validate 11-digit NIN
    const cleanNin = String(nin || "").replace(/\D/g, "");
    if (cleanNin.length !== 11) {
      return NextResponse.json({ success: false, message: "A valid 11-digit NIN is required." }, { status: 400 });
    }

    // Type-specific field validations
    if (type === "CHANGE_OF_NAME") {
      if (!currentPhone || currentPhone.replace(/\D/g, "").length < 10) {
        return NextResponse.json({ success: false, message: "A valid current phone number is required." }, { status: 400 });
      }
      if (!newFirstName || !newFirstName.trim()) {
        return NextResponse.json({ success: false, message: "New First Name is required." }, { status: 400 });
      }
      if (!newLastName || !newLastName.trim()) {
        return NextResponse.json({ success: false, message: "New Surname (Last Name) is required." }, { status: 400 });
      }
    } else if (type === "CHANGE_OF_PHONE") {
      if (!currentFullName || !currentFullName.trim()) {
        return NextResponse.json({ success: false, message: "Full Name on the NIN is required." }, { status: 400 });
      }
      const cleanNewPhone = String(newPhoneNumber || "").replace(/\D/g, "");
      if (cleanNewPhone.length < 10) {
        return NextResponse.json({ success: false, message: "A valid new 11-digit phone number is required." }, { status: 400 });
      }
    } else if (type === "CHANGE_OF_ADDRESS") {
      if (!currentFullName || !currentFullName.trim()) {
        return NextResponse.json({ success: false, message: "Current Full Name on NIN is required." }, { status: 400 });
      }
      if (!currentPhone || currentPhone.replace(/\D/g, "").length < 10) {
        return NextResponse.json({ success: false, message: "A valid current phone number is required." }, { status: 400 });
      }
      if (!newAddress || !newAddress.trim()) {
        return NextResponse.json({ success: false, message: "New street address is required." }, { status: 400 });
      }
      if (!newState || !newState.trim()) {
        return NextResponse.json({ success: false, message: "State is required." }, { status: 400 });
      }
    }

    // Fetch dynamic pricing
    const priceConfig = MODIFICATION_PRICE_KEYS[type as NinModificationType];
    const pricingRow = await prisma.servicePricing.findUnique({
      where: { serviceKey: priceConfig.key },
    });

    if (pricingRow && !pricingRow.isActive) {
      return NextResponse.json({
        success: false,
        message: pricingRow.maintenanceMsg || "This modification service is temporarily under maintenance. Please check back shortly.",
      }, { status: 503 });
    }

    const nominalPrice = pricingRow ? Number(pricingRow.price) : priceConfig.defaultPrice;
    const discountInfo = await getEffectiveServicePrice(prisma, priceConfig.key, nominalPrice, user.id);
    const amountToCharge = discountInfo.finalPrice;
    const currentBalance = user.wallet ? Number(user.wallet.balance) : 0;

    if (currentBalance < amountToCharge) {
      const shortfall = amountToCharge - currentBalance;
      return NextResponse.json({
        success: false,
        insufficientFunds: true,
        message: `Insufficient wallet balance. You need ₦${amountToCharge.toLocaleString()} to submit this modification. Shortfall: ₦${shortfall.toLocaleString()}. Please fund your wallet.`,
        requiredAmount: amountToCharge,
        currentBalance,
        shortfall,
      }, { status: 400 });
    }

    // Generate unique tracking ID & transaction reference
    const random6 = Math.floor(100000 + Math.random() * 900000);
    const trackingId = `MOD-${random6}`;
    const transactionRef = `TX_NIN_MOD_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Execute atomic wallet deduction and request creation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Debit wallet
      const updatedWallet = await tx.wallet.update({
        where: { userId: user.id },
        data: {
          balance: { decrement: amountToCharge },
        },
      });

      // 2. Create ledger transaction
      const transaction = await tx.transaction.create({
        data: {
          walletId: updatedWallet.id,
          reference: transactionRef,
          amount: amountToCharge,
          type: "DEBIT",
          status: "SUCCESS",
          serviceCategory: "SERVICES",
          description: `NIN Modification (${priceConfig.label}) - Tracking ID: ${trackingId}`,
          balanceBefore: currentBalance,
          balanceAfter: Number(updatedWallet.balance),
        },
      });

      // 3. Create NIN Modification Request
      const modRequest = await tx.ninModificationRequest.create({
        data: {
          trackingId,
          userId: user.id,
          type: type as NinModificationType,
          status: "PENDING",
          nin: cleanNin,
          currentPhone: currentPhone ? String(currentPhone).trim() : null,
          newFirstName: newFirstName ? String(newFirstName).trim() : null,
          newLastName: newLastName ? String(newLastName).trim() : null,
          newMiddleName: newMiddleName ? String(newMiddleName).trim() : null,
          currentFullName: currentFullName ? String(currentFullName).trim() : null,
          newPhoneNumber: newPhoneNumber ? String(newPhoneNumber).trim() : null,
          newAddress: newAddress ? String(newAddress).trim() : null,
          newState: newState ? String(newState).trim() : null,
          newLga: newLga ? String(newLga).trim() : null,
          amountPaid: amountToCharge,
          transactionRef,
        },
      });

      // 4. In-App Notification
      await tx.inAppNotification.create({
        data: {
          userId: user.id,
          title: "NIN Modification Submitted",
          message: `Your request for NIN ${priceConfig.label} (${trackingId}) has been received and is pending review.`,
          type: "info",
          link: "/dashboard/nin/modification",
        },
      });

      // 5. Record promo usage if discount was applied
      if (discountInfo.hasDiscount && discountInfo.promoId) {
        await recordPromoUsageInTx(tx, discountInfo.promoId, user.id, discountInfo.savedAmount, priceConfig.key);
      }

      return { modRequest, updatedWallet, transaction };
    });

    // Extract client IP and user agent for audit logging
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "Unknown IP";
    const userAgent = req.headers.get("user-agent") || "Unknown Browser";

    await logUserActivity({
      userId: user.id,
      action: "NIN_MODIFICATION_SUBMITTED",
      category: "SERVICES",
      description: `Submitted NIN ${priceConfig.label} request (${trackingId}) for NIN ${cleanNin.slice(0, 3)}****${cleanNin.slice(-4)}.`,
      referenceId: trackingId,
      status: "SUCCESS",
      ipAddress,
      userAgent,
    });

    // Send confirmation email asynchronously
    const userFullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Customer";
    sendNinModificationSubmittedEmail({
      to: user.email,
      name: userFullName,
      trackingId,
      type,
      amount: amountToCharge,
    }).catch((err) => console.error("Failed to send NIN modification submitted email:", err));

    return NextResponse.json({
      success: true,
      message: "NIN Modification request successfully submitted!",
      trackingId,
      type,
      amountPaid: amountToCharge,
      newWalletBalance: Number(result.updatedWallet.balance),
    });
  } catch (error) {
    console.error("Error submitting NIN Modification request:", error);
    return NextResponse.json({ success: false, message: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}
