import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { notificationQueue } from "@/lib/queue";
import { sendScumlSubmittedEmail } from "@/lib/email";

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
    let promoServiceKey = ""; 

    let regName = "Registration";
    let displayId = registrationId || "";
    let scumlDraftType = "Registration";

    // =========================================================================
    // 2. IDENTIFY SERVICE & EXCLUSIVELY CALCULATE PRICE ON THE SERVER
    // =========================================================================
    
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
      promoServiceKey = "WALLET_FUNDING";

    } else if (service === "llc") {
      promoServiceKey = "LLC"; 
      
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
      
      regName = registration.proposedName || "LLC Application";
      displayId = registration.trackingId || registrationId;

    } else if (service === "scuml") {
      promoServiceKey = "SCUML"; 
      
      if (!registrationId) {
        return NextResponse.json({ success: false, message: "Registration ID is required." }, { status: 400 });
      }

      const draftStr = await redis.get(registrationId);
      if (!draftStr) {
        return NextResponse.json({ success: false, message: "Application expired or not found. Please resubmit." }, { status: 404 });
      }

      const draft = JSON.parse(draftStr);
      if (draft.userId !== user.id) {
        return NextResponse.json({ success: false, message: "Unauthorized access to this application." }, { status: 403 });
      }

      const servicePriceRecord = await prisma.servicePricing.findUnique({ where: { serviceKey: "SCUML" } });
      baseAmountToPay = servicePriceRecord ? Number(servicePriceRecord.price) : 45000; 
      
      description = `Payment for SCUML Registration (${draft.companyName})`;
      reference = `ONL_SCUML_${registrationId}_${Date.now()}`;
      
      callbackPath = `/dashboard/scuml?verifying=true&draftId=${registrationId}`;
      
      regName = draft.companyName || "SCUML Application";
      scumlDraftType = draft.type || "Registration";
      displayId = registrationId;

    } else {
      promoServiceKey = "BUSINESS_NAME"; 
      
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
      
      regName = registration.proposedName || "Business Name Application";
      displayId = registration.trackingId || registrationId;
    }

    if (baseAmountToPay <= 0) {
      return NextResponse.json({ success: false, message: "Invalid payment amount calculated." }, { status: 400 });
    }

    // =========================================================================
    // 3. PROMO CODE VALIDATION
    // =========================================================================
    let amountToPay = baseAmountToPay;
    let appliedPromoId: string | null = null;

    if (promoCode && service !== "wallet_funding") {
      const normalizedCode = promoCode.toUpperCase().trim();
      const promo = await prisma.promoCode.findUnique({ where: { code: normalizedCode } });

      if (promo) {
        const isAllowedService = promo.restrictedServices.includes("ALL") || promo.restrictedServices.includes(promoServiceKey);
        const userUsagesCount = await prisma.promoUsage.count({ where: { promoId: promo.id, userId: user.id } });
        
        const hasNotExceededUserLimit = promo.perUserLimit === null || userUsagesCount < promo.perUserLimit;

        if (
          promo.isActive &&
          (!promo.expiresAt || new Date(promo.expiresAt) >= new Date()) &&
          (promo.usageLimit === null || promo.timesUsed < promo.usageLimit) &&
          isAllowedService &&
          hasNotExceededUserLimit
        ) {
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
  
        const txReference = `WLT_${registrationId || "SRV"}_${Date.now()}`;
  
        await prisma.$transaction(async (tx) => {
          const updatedWallet = await tx.wallet.update({
            where: { id: user.wallet!.id },
            data: { balance: { decrement: amountToPay } }
          });
          
          const newBalance = Number(updatedWallet.balance);
          const balanceBeforeUpdate = newBalance + amountToPay;
  
          await tx.transaction.create({
            data: {
              walletId: user.wallet!.id,
              amount: amountToPay,
              balanceBefore: balanceBeforeUpdate,
              balanceAfter: newBalance,
              type: "DEBIT",
              status: "SUCCESS",
              reference: txReference,
              description: description,
              serviceCategory: promoServiceKey || "OTHER" 
            }
          });
  
          if (appliedPromoId) {
            await tx.promoCode.update({
              where: { id: appliedPromoId },
              data: { timesUsed: { increment: 1 } }
            });
            await tx.promoUsage.create({
              data: { promoId: appliedPromoId, userId: user.id }
            });
          }
  
          if (promoServiceKey === "LLC" && registrationId) {
            await tx.llcRegistration.update({ where: { id: registrationId }, data: { status: "PENDING" } });
          } else if (promoServiceKey === "SCUML" && registrationId) {
            const draftStr = await redis.get(registrationId);
            if (draftStr) {
              const draft = JSON.parse(draftStr);
              await tx.scumlRegistration.create({
                data: {
                  id: registrationId, 
                  userId: draft.userId,
                  type: draft.type,
                  companyName: draft.companyName,
                  certificateUrl: draft.documents.certificateUrl,
                  statusReportUrl: draft.documents.statusReportUrl,
                  memorandumUrl: draft.documents.memorandumUrl || null,
                  constitutionUrl: draft.documents.constitutionUrl || null,
                  status: "PENDING", 
                  amountPaid: amountToPay,
                  transactionRef: txReference
                }
              });
              await redis.del(registrationId);
            }
          } else if (promoServiceKey === "BUSINESS_NAME" && registrationId) {
            await tx.businessRegistration.update({ where: { id: registrationId }, data: { status: "PENDING" } });
          }
        });
  
        try {
          if (promoServiceKey === "SCUML") {
            await sendScumlSubmittedEmail({
              to: user.email!,
              name: user.firstName || "Customer",
              companyName: regName, 
              regType: scumlDraftType,
              transactionRef: txReference
            });
          } else if (promoServiceKey === "BUSINESS_NAME" || promoServiceKey === "LLC") {
            const userPhone = user.phone || "";
            const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Valued Customer";
  
            await notificationQueue.add("send-application-notification", {
              userId: user.id, 
              type: "APPLICATION_SUBMITTED", 
              phone: userPhone, 
              email: user.email!,
              name: userName, 
              businessName: regName, 
              regId: displayId,
            }, {
              attempts: 3, 
              backoff: { type: "exponential", delay: 5000 }, 
              removeOnComplete: true,
            });
          }
        } catch (emailError) {
          console.error("Failed to send notification for Wallet Payment:", emailError);
        }
  
        return NextResponse.json({ success: true, message: "Payment successful via Wallet." });
    }

    // =========================================================================
    // FLOW B: PAY ONLINE VIA KORAPAY
    // =========================================================================
    if (paymentMethod === "ONLINE") {
      const secretKey = process.env.KORAPAY_SECRET_KEY;
      const appUrl = process.env.NEXTAUTH_URL || "https://lorabiz.com";

      if (!secretKey) {
        console.error("❌ KoraPay Secret Key missing from server environment.");
        return NextResponse.json({ success: false, message: "Payment gateway configuration error." }, { status: 500 });
      }

      // Flattened metadata strictly complying with Kora's 20-char max key rule.
      const safeMetadata: Record<string, string> = {
        "expected": String(Math.round(amountToPay)),
        "category": String(promoServiceKey || "OTHER").substring(0, 50)
      };
      
      if (appliedPromoId) {
        safeMetadata["promo-id"] = String(appliedPromoId);
      }
      if (registrationId) {
        safeMetadata["reg-id"] = String(registrationId);
      }

      const koraPayload = {
        amount: Math.round(amountToPay),
        currency: "NGN",
        reference: reference, 
        redirect_url: `${appUrl}${callbackPath}`,
        customer: {
          email: user.email,
          name: (user.firstName ? `${user.firstName} ${user.lastName || ''}` : "Customer").trim().substring(0, 50)
        },
        metadata: safeMetadata
      };

      const koraResponse = await fetch("https://api.korapay.com/merchant/api/v1/charges/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(koraPayload),
      });

      const koraData = await koraResponse.json();

      if (!koraResponse.ok || !koraData.status || !koraData.data?.checkout_url) {
        console.error("❌ KoraPay Initialization Failed:", koraData);
        return NextResponse.json({ 
          success: false, 
          message: koraData.message || "Failed to initialize secure checkout with bank." 
        }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        authorizationUrl: koraData.data.checkout_url,
        reference: reference
      });
    }

    return NextResponse.json({ success: false, message: "Invalid payment method selected." }, { status: 400 });

  } catch (error: any) {
    console.error("❌ Checkout API Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error during checkout." }, { status: 500 });
  }
}
