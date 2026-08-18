import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { logUserActivity } from "@/lib/activity-logger";
import { executeNinSlipGeneration } from "@/lib/nin-slips-provider";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized access. Please log in." }, { status: 401 });
    }

    const { identifier, searchType = "NIN", slipType, attestationsAccepted } = await req.json();

    if (!identifier || !/^\d{11}$/.test(identifier.trim())) {
      return NextResponse.json({ 
        success: false, 
        message: `Please provide a valid 11-digit ${searchType === "PHONE" ? "Phone Number" : "NIN"}.` 
      }, { status: 400 });
    }

    // Supported Slip Types
    const validNinSlipTypes = ["nin_basic", "nin_vnin", "nin_regular", "nin_standard", "nin_premium"];
    const validPhoneSlipTypes = ["nin_regular", "nin_standard", "nin_premium"];

    const isPhoneSearch = searchType === "PHONE";
    const allowedSlipTypes = isPhoneSearch ? validPhoneSlipTypes : validNinSlipTypes;

    if (!slipType || !allowedSlipTypes.includes(slipType)) {
      return NextResponse.json({ 
        success: false, 
        message: isPhoneSearch 
          ? "Phone search only supports Regular, Standard, and Premium slips."
          : "Invalid slip type selected." 
      }, { status: 400 });
    }

    if (!attestationsAccepted) {
      return NextResponse.json({ 
        success: false, 
        message: "You must accept the statutory disclaimers to proceed." 
      }, { status: 400 });
    }

    // Check Phone Search Master Toggle if searching by Phone
    if (isPhoneSearch) {
      const phoneSetting = await prisma.globalSetting.findUnique({
        where: { key: "NIN_PHONE_SEARCH_ACTIVE" }
      });
      if (phoneSetting && phoneSetting.value.toLowerCase() === "false") {
        return NextResponse.json({
          success: false,
          message: "NIN Verification by Phone Number is temporarily offline for maintenance. Please use 11-digit NIN verification."
        }, { status: 503 });
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, message: "User wallet not found." }, { status: 404 });
    }

    // Map slipType to ServicePricing serviceKey
    const dbKeyMap: Record<string, string> = {
      "nin_basic": "NIN_BASIC",
      "nin_vnin": "NIN_VNIN",
      "nin_regular": "NIN_REGULAR",
      "nin_standard": "NIN_STANDARD",
      "nin_premium": "NIN_PREMIUM"
    };
    
    const serviceKey = dbKeyMap[slipType];

    const pricing = await prisma.servicePricing.findUnique({
      where: { serviceKey }
    });

    if (!pricing || !pricing.isActive) {
      return NextResponse.json({ 
        success: false, 
        message: pricing?.maintenanceMsg || "Selected slip service is currently unavailable for maintenance." 
      }, { status: 400 });
    }

    const currentBalance = Number(user.wallet.balance);
    const requiredAmount = Number(pricing.price);

    if (currentBalance < requiredAmount) {
      return NextResponse.json({ 
        success: false, 
        message: `Insufficient wallet balance. You need ₦${requiredAmount.toLocaleString()} but your balance is ₦${currentBalance.toLocaleString()}. Please fund your wallet.` 
      }, { status: 402 }); 
    }

    // Execute slip generation via multi-provider failover router
    const result = await executeNinSlipGeneration(slipType, identifier.trim(), isPhoneSearch ? "PHONE" : "NIN");

    if (!result.success || !result.pdfBase64) {
      return NextResponse.json({ 
        success: false, 
        message: result.error || result.message || `Could not generate slip via ${isPhoneSearch ? "Phone Number" : "NIN"}. Please check the number and try again.` 
      }, { status: 422 });
    }

    // Upload PDF to Cloudinary for permanent storage
    const dataUri = `data:application/pdf;base64,${result.pdfBase64}`;
    let securePdfUrl: string | null = null;

    try {
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: "lumebiz_nin_slips",
        resource_type: "auto",
      });
      securePdfUrl = uploadResult.secure_url;
    } catch (cloudErr) {
      console.warn("⚠️ Cloudinary PDF Upload Warning (using base64 fallback):", cloudErr);
    }

    const maskedIdentifier = `${identifier.slice(0, 3)}*****${identifier.slice(-3)}`;
    const referencePrefix = isPhoneSearch ? "TEL" : "NIN";
    const reference = `${referencePrefix}_${slipType.toUpperCase()}_${Date.now()}`;
    const newBalance = currentBalance - requiredAmount;

    // Database transaction: debit wallet, log transaction, save demographic details to NinRequestLog
    const ninLog = await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: newBalance }
      });

      await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: requiredAmount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          type: "DEBIT",
          status: "SUCCESS",
          reference: reference,
          serviceCategory: "IDENTITY",
          description: `NIMC Slip Printing (${pricing.title}) - ${maskedIdentifier}`
        }
      });

      const log = await tx.ninRequestLog.create({
        data: {
          userId: user.id,
          ninMasked: maskedIdentifier,
          slipType: slipType,
          amountCharged: requiredAmount,
          status: "SUCCESS",
          reference: reference,
          pdfUrl: securePdfUrl || dataUri,
          searchType: isPhoneSearch ? "PHONE" : "NIN",
          fullName: result.fullName,
          firstName: result.firstName,
          lastName: result.lastName,
          middleName: result.middleName,
          gender: result.gender,
          dob: result.dob,
          phone: result.phone,
          address: result.address,
          userData: (result.userData as any) || undefined,
          providerUsed: result.provider,
        }
      });

      // REFERRAL LEDGER PAYOUT (INSTANT FOR NIN)
      const activeReferral = await tx.referral.findUnique({
        where: { referredUserId: user.id }
      });

      if (activeReferral) {
        const isReferralActiveSetting = await tx.globalSetting.findUnique({ 
          where: { key: 'REFERRAL_ACTIVE' } 
        });
        const isReferralActive = !isReferralActiveSetting || isReferralActiveSetting.value === 'true';
        const isNotExpired = !activeReferral.expiresAt || new Date() < activeReferral.expiresAt;

        if (isReferralActive && isNotExpired) {
          const existingCommission = await tx.referralCommission.findUnique({
            where: { serviceId: log.id } 
          });

          if (!existingCommission) {
            const rewardSetting = await tx.globalSetting.findUnique({
              where: { key: 'REF_REWARD_NIN' }
            });
            
            const commissionAmount = rewardSetting ? Number(rewardSetting.value) : 10.00;

            if (commissionAmount > 0) {
              await tx.referralCommission.create({
                data: {
                  referralId: activeReferral.id,
                  serviceType: "NIN",
                  serviceId: log.id, 
                  amount: commissionAmount
                }
              });

              await tx.user.update({
                where: { id: activeReferral.referrerId },
                data: { referralBalance: { increment: commissionAmount } }
              });
            }
          }
        }
      }

      return log;
    });

    // Record user activity
    await logUserActivity({
      userId: user.id,
      action: "NIN_SLIP_GENERATED",
      category: "SERVICES",
      description: `Generated ${pricing.title} for ${maskedIdentifier} (${result.fullName || "Verified Citizen"})`,
      status: "SUCCESS",
      referenceId: reference,
      req,
      metadata: {
        slipType,
        searchType: isPhoneSearch ? "PHONE" : "NIN",
        amount: requiredAmount,
        providerUsed: result.provider,
        fullName: result.fullName,
      }
    });

    return NextResponse.json({
      success: true,
      pdfBase64: result.pdfBase64,
      pdfUrl: securePdfUrl || dataUri,
      userData: result.userData,
      fullName: result.fullName,
      firstName: result.firstName,
      lastName: result.lastName,
      middleName: result.middleName,
      gender: result.gender,
      dob: result.dob,
      phone: result.phone,
      address: result.address,
      nin: result.nin,
      reference: reference,
      providerUsed: result.provider,
      message: result.message || "NIN slip generated successfully.",
    });

  } catch (error: any) {
    console.error("❌ NIN Slip API Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "An unexpected server error occurred." 
    }, { status: 500 });
  }
}
