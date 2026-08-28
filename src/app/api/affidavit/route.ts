import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateNumericId } from "@/utils/generateId";
import { getEffectiveServicePrice } from "@/lib/discounts";
import { getReferrerRewardAmount } from "@/lib/loyalty";
import { logUserActivity } from "@/lib/activity-logger";
import { sendCourtAffidavitSubmittedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  CAC_CORPORATE: "CAC Corporate Affidavit",
  CHANGE_OF_NAME: "Change / Correction of Name",
  AGE_DECLARATION: "Declaration of Age",
  LOSS_OF_ITEM: "Loss of Document / SIM Card",
  PROOF_OF_OWNERSHIP: "Proof of Ownership",
  GENERAL_PURPOSE: "General Purpose Sworn Affidavit",
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const requests = await prisma.courtAffidavitRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error: any) {
    console.error("Court Affidavit Fetch Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch affidavit requests." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized access. Please log in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const body = await req.json();
    const {
      category,
      subCategory,
      deponentFullName,
      passportUrl,
      gender,
      dob,
      religion,
      nationality = "Nigerian",
      residentialAddress,
      occupation,
      signatureUrl,
      details,
    } = body;

    // Validation
    if (!category || !deponentFullName || !gender || !dob || !religion || !residentialAddress || !details) {
      return NextResponse.json({
        success: false,
        message: "Please fill all required deponent information and affidavit details."
      }, { status: 400 });
    }

    if (!signatureUrl) {
      return NextResponse.json({
        success: false,
        message: "Deponent signature is required. Please sign on the canvas or upload a signature image."
      }, { status: 400 });
    }

    // Auto-calculate Age
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) {
      return NextResponse.json({ success: false, message: "Invalid Date of Birth." }, { status: 400 });
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    const isAdult = age >= 18;

    // Price and Service Availability Verification from ServicePricing
    const categoryLabel = CATEGORY_LABELS[category] || "Court Affidavit";
    const isAttested = details?.sealTier === "HIGH_COURT_ATTESTED" || subCategory === "HIGH_COURT_ATTESTED";
    const tierServiceKey = isAttested ? "AFFIDAVIT_FEDERAL" : "AFFIDAVIT_STATE";
    const matterServiceKey = `AFFIDAVIT_${category}`;

    if (isAttested && (!passportUrl || !passportUrl.trim())) {
      return NextResponse.json({
        success: false,
        message: "Deponent passport photograph is 100% compulsory for Federal High Court Attestation."
      }, { status: 400 });
    }

    // 1. Check Stamping Format Service Availability
    const tierPricing = await prisma.servicePricing.findUnique({
      where: { serviceKey: tierServiceKey }
    });
    if (tierPricing && !tierPricing.isActive) {
      return NextResponse.json({
        success: false,
        message: tierPricing.maintenanceMsg || `${isAttested ? "Federal High Court" : "State Judiciary"} affidavit service is currently offline for maintenance.`
      }, { status: 400 });
    }

    // 2. Check Specific Matter Service Availability (e.g. Change of Name, Age Declaration, CAC)
    const matterPricing = await prisma.servicePricing.findUnique({
      where: { serviceKey: matterServiceKey }
    });
    if (matterPricing && !matterPricing.isActive) {
      return NextResponse.json({
        success: false,
        message: matterPricing.maintenanceMsg || `Affidavit for ${categoryLabel} is currently offline for maintenance.`
      }, { status: 400 });
    }

    // Determine Base Price strictly from ServicePricing (or global setting fallback if seeded)
    let basePrice = tierPricing ? Number(tierPricing.price) : (isAttested ? 4000 : 2500);

    const discountInfo = await getEffectiveServicePrice(
      prisma,
      tierServiceKey,
      basePrice,
      user.id
    );

    const finalPrice = discountInfo.finalPrice;

    // Check Wallet Balance
    const currentBalance = Number(user.wallet?.balance || 0);
    if (currentBalance < finalPrice) {
      return NextResponse.json({
        success: false,
        message: `Insufficient wallet balance. Required: ₦${finalPrice.toLocaleString()}, Current Balance: ₦${currentBalance.toLocaleString()}. Please fund your wallet.`,
        requiredAmount: finalPrice,
        currentBalance,
      }, { status: 402 });
    }

    const trackingId = `AFF-${generateNumericId(6)}`;
    const reference = `TX_AFF_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Execute atomic wallet debit and creation
    const createdAffidavit = await prisma.$transaction(async (tx) => {
      // 1. Debit wallet
      const balanceBefore = Number(user.wallet!.balance);
      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: { decrement: finalPrice } }
      });
      const balanceAfter = Number(updatedWallet.balance);

      // 2. Create Ledger Transaction
      await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: finalPrice,
          balanceBefore,
          balanceAfter,
          type: "DEBIT",
          status: "SUCCESS",
          reference,
          serviceCategory: "SERVICES",
          description: `Sworn Court Affidavit (${categoryLabel}) - ${trackingId}`,
        }
      });

      // 3. Create Court Affidavit Request
      const record = await tx.courtAffidavitRequest.create({
        data: {
          trackingId,
          userId: user.id,
          category,
          subCategory: subCategory || null,
          status: "PENDING",
          deponentFullName: deponentFullName.trim(),
          passportUrl: passportUrl || null,
          gender,
          dob,
          age,
          isAdult,
          religion,
          nationality: nationality || "Nigerian",
          residentialAddress: residentialAddress.trim(),
          occupation: occupation ? occupation.trim() : null,
          signatureUrl,
          details: details as any,
          amountCharged: finalPrice,
          transactionRef: reference,
        }
      });

      // 4. Referral Ledger Payout
      const activeReferral = await tx.referral.findUnique({
        where: { referredUserId: user.id }
      });

      if (activeReferral) {
        const isReferralActiveSetting = await tx.globalSetting.findUnique({
          where: { key: "REFERRAL_ACTIVE" }
        });
        const isReferralActive = !isReferralActiveSetting || isReferralActiveSetting.value === "true";
        const isNotExpired = !activeReferral.expiresAt || new Date() < activeReferral.expiresAt;

        if (isReferralActive && isNotExpired) {
          const rewardSetting = await tx.globalSetting.findUnique({
            where: { key: "REF_REWARD_AFFIDAVIT" }
          });
          const baseReward = rewardSetting ? Number(rewardSetting.value) : 300.00;
          const commissionAmount = await getReferrerRewardAmount(tx, activeReferral.referrerId, baseReward);

          if (commissionAmount > 0) {
            await tx.referralCommission.create({
              data: {
                referralId: activeReferral.id,
                serviceType: "COURT_AFFIDAVIT",
                serviceId: record.id,
                amount: commissionAmount,
              }
            });

            await tx.user.update({
              where: { id: activeReferral.referrerId },
              data: { referralBalance: { increment: commissionAmount } }
            });
          }
        }
      }

      return record;
    });

    // Log user activity
    await logUserActivity({
      userId: user.id,
      action: "COURT_AFFIDAVIT_SUBMITTED",
      category: "SERVICES",
      description: `Submitted ${categoryLabel} for ${deponentFullName} (Ref: ${trackingId})`,
      status: "PENDING",
      referenceId: trackingId,
      req,
      metadata: {
        trackingId,
        category,
        subCategory,
        deponentFullName,
        amountCharged: finalPrice,
        isAdult,
      }
    });

    // Send confirmation email
    try {
      await sendCourtAffidavitSubmittedEmail({
        to: user.email,
        firstName: user.firstName,
        trackingId,
        categoryLabel,
        deponentName: deponentFullName,
        turnaroundTime: "2 – 5 Hours",
      });
    } catch (emailErr) {
      console.warn("Could not dispatch affidavit submission email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Court Affidavit application submitted successfully. Processing has started.",
      trackingId,
      affidavit: createdAffidavit,
    });

  } catch (error: any) {
    console.error("❌ Court Affidavit Submission Error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "An unexpected error occurred during affidavit submission."
    }, { status: 500 });
  }
}
