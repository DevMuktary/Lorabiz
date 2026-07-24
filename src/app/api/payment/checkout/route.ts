import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized access." }, { status: 401 });
    }

    const body = await req.json();
    const { registrationId, paymentMethod, service, amount, promoCode } = body; 

    // 1. Fetch User & Wallet from Database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, message: "User account or wallet not found." }, { status: 404 });
    }

    let baseAmountToPay = 0;
    let description = "";
    let reference = "";
    let callbackPath = "/dashboard";

    // =========================================================================
    // 2. IDENTIFY SERVICE & EXCLUSIVELY CALCULATE PRICE ON THE SERVER
    // =========================================================================
    
    // CASE A: DIRECT WALLET FUNDING
    if (service === "wallet_funding") {
      if (!amount || isNaN(Number(amount)) || Number(amount) < 100) {
        return NextResponse.json({ success: false, message: "Minimum wallet funding amount is ₦100." }, { status: 400 });
      }
      if (paymentMethod === "WALLET") {
        return NextResponse.json({ success: false, message: "Cannot fund wallet using wallet balance." }, { status: 400 });
      }

      baseAmountToPay = Math.round(Number(amount));
      description = "Wallet Funding via Online Gateway";
      reference = `FW_${Date.now()}_${Math.floor(100000 + Math.random() * 900000)}`;
      callbackPath = "/dashboard?funded=true";

    // CASE B: LLC (LIMITED LIABILITY COMPANY) REGISTRATION
    } else if (service === "llc") {
      if (!registrationId) {
        return NextResponse.json({ success: false, message: "Registration ID is required." }, { status: 400 });
      }

      const registration = await prisma.llcRegistration.findUnique({ where: { id: registrationId } });
      if (!registration || registration.userId !== user.id) {
        return NextResponse.json({ success: false, message: "Invalid LLC application." }, { status: 404 });
      }
      if (registration.status !== "UNSUBMITTED") {
        return NextResponse.json({ success: false, message: "This application has already been submitted or paid for." }, { status: 400 });
      }

      const prices = await prisma.servicePricing.findMany();
      const pricingMap = prices.reduce((acc: Record<string, number>, item) => { 
        acc[item.serviceKey] = Number(item.price); 
        return acc; 
      }, {});

      const baseLLCFee = pricingMap["LLC"] || 35000;
      const extraMillionFee = pricingMap["LLC_EXTRA_MILLION"] || 15000;
      const totalShares = Number(registration.totalShareCapital) || 1000000;
      
      const extraSharesFee = Math.max(0, Math.ceil((totalShares - 1000000) / 1000000)) * extraMillionFee;
      baseAmountToPay = baseLLCFee + extraSharesFee;
      description = `Payment for LLC Registration (${registration.proposedName || "Draft"})`;
      reference = `ONL_${registrationId}_${Date.now()}`;
      
      callbackPath = `/dashboard/cac/register/llc/details/${registrationId}?verifying=true`;

    // CASE C: BUSINESS NAME REGISTRATION (DEFAULT SERVICE)
    } else {
      if (!registrationId) {
        return NextResponse.json({ success: false, message: "Registration ID is required." }, { status: 400 });
      }

      const registration = await prisma.businessRegistration.findUnique({ where: { id: registrationId } });
      if (!registration || registration.userId !== user.id) {
        return NextResponse.json({ success: false, message: "Invalid Business Name application." }, { status: 404 });
      }
      if (registration.status !== "UNSUBMITTED") {
        return NextResponse.json({ success: false, message: "This application has already been submitted or paid for." }, { status: 400 });
      }

      const servicePriceRecord = await prisma.servicePricing.findUnique({ where: { serviceKey: "BUSINESS_NAME" } });
      if (!servicePriceRecord) {
        return NextResponse.json({ success: false, message: "Pricing configuration missing from system." }, { status: 500 });
      }
      
      baseAmountToPay = Number(servicePriceRecord.price);
      description = `Payment for Business Registration (${registration.proposedName})`;
      reference = `ONL_${registrationId}_${Date.now()}`;
      
      callbackPath = `/dashboard/cac/register/business-name/details/${registrationId}?verifying=true`;
    }

    if (baseAmountToPay <= 0) {
      return NextResponse.json({ success: false, message: "Invalid payment amount calculated." }, { status: 400 });
    }

    // =========================================================================
    // 3. PROMO CODE VALIDATION & DISCOUNT CALCULATION
    // =========================================================================
    let amountToPay = baseAmountToPay;
    let appliedPromoId: string | null = null;

    if (promoCode && service !== "wallet_funding") {
      const normalizedCode = promoCode.toUpperCase().trim();
      const promo = await prisma.promoCode.findUnique({ where: { code: normalizedCode } });

      if (promo) {
        const isAllowedService = promo.restrictedServices.includes("ALL") || promo.restrictedServices.includes(service.toUpperCase());
        const userUsagesCount = await prisma.promoUsage.count({ where: { promoId: promo.id, userId: user.id } });

        if (
          promo.isActive &&
          (!promo.expiresAt || new Date(promo.expiresAt) >= new Date()) &&
          (promo.usageLimit === null || promo.timesUsed < promo.usageLimit) &&
          isAllowedService &&
          userUsagesCount < promo.perUserLimit
        ) {
          // Calculate discount
          let discountAmount = 0;
          if (promo.fixedAmount) discountAmount = Number(promo.fixedAmount);
          else if (promo.discountPct) discountAmount = (baseAmountToPay * Number(promo.discountPct)) / 100;
          
          if (discountAmount > baseAmountToPay) discountAmount = baseAmountToPay;
          
          amountToPay = Math.round(baseAmountToPay - discountAmount);
          appliedPromoId = promo.id;
          description += ` (Promo Applied: ${promo.code})`;
        } else {
          return NextResponse.json({ success: false, message: "Invalid, expired, or fully exhausted promo code." }, { status: 400 });
        }
      } else {
        return NextResponse.json({ success: false, message: "Invalid promo code." }, { status: 400 });
      }
    }

    // =========================================================================
    // FLOW A: PAY WITH INTERNAL WALLET BALANCE
    // =========================================================================
    if (paymentMethod === "WALLET") {
      const currentBalance = Number(user.wallet.balance);
      
      if (currentBalance < amountToPay) {
        return NextResponse.json({ 
          success: false, 
          message: `Insufficient wallet balance. You need ₦${amountToPay.toLocaleString()} but have ₦${currentBalance.toLocaleString()}. Please fund your wallet.` 
        }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        const newBalance = currentBalance - amountToPay;

        await tx.wallet.update({
          where: { id: user.wallet!.id },
          data: { balance: newBalance }
        });

        await tx.transaction.create({
          data: {
            walletId: user.wallet!.id,
            amount: amountToPay,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            type: "DEBIT",
            status: "SUCCESS",
            reference: `WLT_${registrationId || "SRV"}_${Date.now()}`,
            description: description
          }
        });

        // BURN PROMO CODE IF APPLIED
        if (appliedPromoId) {
          await tx.promoCode.update({
            where: { id: appliedPromoId },
            data: { timesUsed: { increment: 1 } }
          });
          await tx.promoUsage.create({
            data: { promoId: appliedPromoId, userId: user.id }
          });
        }

        if (service === "llc" && registrationId) {
          await tx.llcRegistration.update({ where: { id: registrationId }, data: { status: "PENDING" } });
        } else if (registrationId) {
          await tx.businessRegistration.update({ where: { id: registrationId }, data: { status: "PENDING" } });
        }
      });

      return NextResponse.json({ success: true, message: "Payment successful via Wallet." });
    }

    // =========================================================================
    // FLOW B: PAY ONLINE VIA PAYSTACK (SERVER-TO-SERVER INITIALIZATION)
    // =========================================================================
    if (paymentMethod === "ONLINE") {
      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      const appUrl = process.env.NEXTAUTH_URL || "https://lorabiz.com";

      if (!secretKey) {
        console.error("❌ Paystack Secret Key missing from server environment.");
        return NextResponse.json({ success: false, message: "Payment gateway configuration error." }, { status: 500 });
      }

      const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: Math.round(amountToPay * 100), 
          reference: reference,
          callback_url: `${appUrl}${callbackPath}`,
          metadata: {
            userId: user.id,
            service: service || "business",
            registrationId: registrationId || null,
            expectedAmount: amountToPay, 
            description: description,
            appliedPromoId: appliedPromoId // Passed securely to Webhook!
          }
        }),
      });

      const paystackData = await paystackResponse.json();

      if (!paystackResponse.ok || !paystackData.status || !paystackData.data?.authorization_url) {
        console.error("❌ Paystack Initialization Failed:", paystackData);
        return NextResponse.json({ 
          success: false, 
          message: paystackData.message || "Failed to initialize secure checkout with bank." 
        }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        authorizationUrl: paystackData.data.authorization_url,
        reference: reference
      });
    }

    return NextResponse.json({ success: false, message: "Invalid payment method selected." }, { status: 400 });

  } catch (error: any) {
    console.error("❌ Checkout API Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error during checkout." }, { status: 500 });
  }
}
