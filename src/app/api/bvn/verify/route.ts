import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { logUserActivity } from "@/lib/activity-logger";
import { executeBvnSlipGeneration } from "@/lib/bvn-slips-provider";
import { getReferrerRewardAmount } from "@/lib/loyalty";

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

    const { bvn, slipType = "bvn_standard", attestationsAccepted } = await req.json();

    if (!bvn || !/^\d{11}$/.test(bvn.trim())) {
      return NextResponse.json({ 
        success: false, 
        message: "Please provide a valid 11-digit Bank Verification Number (BVN)." 
      }, { status: 400 });
    }

    // Supported Slip Types
    const validSlipTypes = ["bvn_standard", "bvn_premium"];
    if (!validSlipTypes.includes(slipType)) {
      return NextResponse.json({ 
        success: false, 
        message: "Invalid BVN slip type selected. Please choose Standard or Premium slip." 
      }, { status: 400 });
    }

    if (!attestationsAccepted) {
      return NextResponse.json({ 
        success: false, 
        message: "You must accept the statutory authorization and consent disclaimers to proceed." 
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, message: "User wallet not found." }, { status: 404 });
    }

    // Map slipType to ServicePricing serviceKey
    const serviceKey = slipType === "bvn_premium" ? "BVN_PREMIUM" : "BVN_STANDARD";
    const defaultPrice = slipType === "bvn_premium" ? 1000.0 : 700.0;
    const defaultTitle = slipType === "bvn_premium" ? "BVN Premium Card Slip" : "BVN Standard Slip";

    const pricing = await prisma.servicePricing.findUnique({
      where: { serviceKey }
    });

    if (pricing && !pricing.isActive) {
      return NextResponse.json({ 
        success: false, 
        message: pricing.maintenanceMsg || "This BVN slip format is currently unavailable for maintenance." 
      }, { status: 400 });
    }

    const requiredAmount = pricing ? Number(pricing.price) : defaultPrice;
    const slipTitle = pricing?.title || defaultTitle;
    const currentBalance = Number(user.wallet.balance);

    if (currentBalance < requiredAmount) {
      return NextResponse.json({ 
        success: false, 
        message: `Insufficient wallet balance. You need ₦${requiredAmount.toLocaleString()} but your balance is ₦${currentBalance.toLocaleString()}. Please fund your wallet.`,
        shortfall: Math.max(0, requiredAmount - currentBalance),
        walletBalance: currentBalance,
        requiredAmount,
      }, { status: 402 }); 
    }

    // Execute slip generation via DataVerify provider
    const result = await executeBvnSlipGeneration(slipType as "bvn_standard" | "bvn_premium", bvn.trim());

    if (!result.success || !result.pdfBase64) {
      return NextResponse.json({ 
        success: false, 
        message: result.error || result.message || "Could not generate BVN verification slip. Please check the BVN and try again." 
      }, { status: 422 });
    }

    // Upload PDF to Cloudinary for permanent storage
    const dataUri = `data:application/pdf;base64,${result.pdfBase64}`;
    let securePdfUrl: string | null = null;

    try {
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: "lorabiz_bvn_slips",
        resource_type: "auto",
      });
      securePdfUrl = uploadResult.secure_url;
    } catch (cloudErr) {
      console.warn("⚠️ Cloudinary BVN PDF Upload Warning (using base64 fallback):", cloudErr);
    }

    const cleanBvn = bvn.trim();
    const maskedBvn = `${cleanBvn.slice(0, 3)}*****${cleanBvn.slice(-3)}`;
    const reference = `BVN_${slipType === "bvn_premium" ? "PREM" : "STD"}_${Date.now()}`;

    // Database transaction: debit wallet atomically, log transaction, save demographic details to BvnRequestLog
    const bvnLog = await prisma.$transaction(async (tx) => {
      const currentWallet = await tx.wallet.findUnique({ where: { id: user.wallet!.id } });
      if (!currentWallet || Number(currentWallet.balance) < requiredAmount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const balanceBefore = Number(currentWallet.balance);
      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: { decrement: requiredAmount } }
      });
      const balanceAfter = Number(updatedWallet.balance);

      await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: requiredAmount,
          balanceBefore,
          balanceAfter,
          type: "DEBIT",
          status: "SUCCESS",
          reference: reference,
          serviceCategory: "IDENTITY",
          description: `BVN Verification Slip (${slipTitle}) - ${maskedBvn}`
        }
      });

      const log = await tx.bvnRequestLog.create({
        data: {
          userId: user.id,
          bvnMasked: maskedBvn,
          slipType: slipType,
          amountCharged: requiredAmount,
          status: "SUCCESS",
          reference: reference,
          pdfUrl: securePdfUrl || dataUri,
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

      // REFERRAL LEDGER PAYOUT (INSTANT FOR BVN)
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
              where: { key: 'REF_REWARD_BVN' }
            });
            
            const baseAmount = rewardSetting ? Number(rewardSetting.value) : 15.00;
            const commissionAmount = await getReferrerRewardAmount(tx, activeReferral.referrerId, baseAmount);

            if (commissionAmount > 0) {
              await tx.referralCommission.create({
                data: {
                  referralId: activeReferral.id,
                  serviceType: "BVN",
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
      action: "BVN_SLIP_GENERATED",
      category: "SERVICES",
      description: `Generated ${slipTitle} for ${maskedBvn} (${result.fullName || "Verified Citizen"})`,
      status: "SUCCESS",
      referenceId: reference,
      req,
      metadata: {
        slipType,
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
      bvn: result.bvn || cleanBvn,
      photo: result.photo,
      signature: result.signature,
      reference: reference,
      providerUsed: result.provider,
      message: result.message || "BVN verification slip generated successfully.",
    });

  } catch (error: any) {
    console.error("❌ BVN Slip API Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "An unexpected server error occurred." 
    }, { status: 500 });
  }
}
