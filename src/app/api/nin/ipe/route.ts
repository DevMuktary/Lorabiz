import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { submitIpeClearance } from "@/lib/agenthub";
import { submitDataVerifyIpe } from "@/lib/dataverify";
import { logUserActivity } from "@/lib/activity-logger";
import { getEffectiveServicePrice, recordPromoUsageInTx } from "@/lib/discounts";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access. Please log in." },
        { status: 401 }
      );
    }

    const { trackingId, attestationsAccepted } = await req.json();

    if (!trackingId || typeof trackingId !== "string" || trackingId.trim().length < 8) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid NIMC Tracking ID (e.g. 0SQT6M4S4RJISV1)." },
        { status: 400 }
      );
    }

    const sanitizedTrackingId = trackingId.trim().toUpperCase();

    if (!attestationsAccepted) {
      return NextResponse.json(
        { success: false, message: "You must accept the legal statutory declaration to proceed." },
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

    // Check ServicePricing configuration
    const servicePricing = await prisma.servicePricing.findUnique({
      where: { serviceKey: "NIN_IPE_CLEARANCE" },
    });

    if (servicePricing && !servicePricing.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: servicePricing.maintenanceMsg || "IPE Clearance service is currently unavailable for maintenance.",
        },
        { status: 400 }
      );
    }

    const basePrice = servicePricing ? Number(servicePricing.price) : 2500.0;
    const discountInfo = await getEffectiveServicePrice(prisma, "NIN_IPE_CLEARANCE", basePrice, user.id);
    const requiredAmount = discountInfo.finalPrice;
    const currentBalance = Number(user.wallet.balance);

    if (currentBalance < requiredAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `Insufficient wallet balance. This service costs ₦${requiredAmount.toLocaleString()} but your balance is ₦${currentBalance.toLocaleString()}. Please fund your wallet.`,
        },
        { status: 402 }
      );
    }

    // Check if there is already an ongoing request for the same tracking ID by this user
    const existingActiveRequest = await prisma.ninIpeRequest.findFirst({
      where: {
        userId: user.id,
        trackingId: sanitizedTrackingId,
        status: "PROCESSING",
      },
    });

    if (existingActiveRequest) {
      return NextResponse.json(
        {
          success: false,
          message: `You already have an active IPE clearance request in processing for Tracking ID ${sanitizedTrackingId} (Reference: ${existingActiveRequest.reference}).`,
        },
        { status: 409 }
      );
    }

    // Fetch active provider from GlobalSettings
    const providerSetting = await prisma.globalSetting.findUnique({
      where: { key: "NIN_IPE_PROVIDER" },
    });
    const activeProvider = (providerSetting?.value || "DATAVERIFY").toUpperCase(); // "DATAVERIFY" | "AGENTHUB" | "MANUAL"

    // Generate unique reference
    const reference = `IPE_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    let externalReqId: string | null = null;
    let apiMessage = "Request submitted successfully. Processing in progress.";
    let rawApiResponse: unknown = null;

    if (activeProvider === "DATAVERIFY") {
      const dvRes = await submitDataVerifyIpe(sanitizedTrackingId);
      if (!dvRes.success || !dvRes.data?.status) {
        return NextResponse.json(
          {
            success: false,
            message:
              dvRes.error ||
              "Unable to submit IPE request to identity gateway (DataVerify). Please verify your Tracking ID and try again.",
          },
          { status: 422 }
        );
      }
      externalReqId = dvRes.data.transaction_id || null;
      apiMessage = dvRes.data.message || apiMessage;
      rawApiResponse = dvRes.data;
    } else if (activeProvider === "AGENTHUB") {
      const agentHubResponse = await submitIpeClearance(sanitizedTrackingId, reference);
      if (!agentHubResponse.success || !agentHubResponse.data?.status) {
        return NextResponse.json(
          {
            success: false,
            message:
              agentHubResponse.error ||
              "Unable to submit IPE request to identity gateway (AgentHub). Please verify your Tracking ID and try again.",
          },
          { status: 422 }
        );
      }
      externalReqId = agentHubResponse.data.requestId || null;
      apiMessage = agentHubResponse.data?.message || apiMessage;
      rawApiResponse = agentHubResponse.data;
    } else {
      // Manual Operator queue
      apiMessage = "Request queued for manual operator verification and clearance.";
    }

    // Execute atomic transaction for wallet debit, ledger record, and IPE request creation
    const createdIpe = await prisma.$transaction(async (tx) => {
      const currentWallet = await tx.wallet.findUnique({ where: { id: user.wallet!.id } });
      if (!currentWallet || Number(currentWallet.balance) < requiredAmount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const balanceBefore = Number(currentWallet.balance);
      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: { decrement: requiredAmount } },
      });
      const balanceAfter = Number(updatedWallet.balance);

      // 2. Ledger Transaction Record
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
          description: `NIMC IPE Clearance Service - Tracking ID: ${sanitizedTrackingId}`,
        },
      });

      // 3. Create IPE Request (starts in PROCESSING state)
      const ipeRecord = await tx.ninIpeRequest.create({
        data: {
          userId: user.id,
          trackingId: sanitizedTrackingId,
          reference: reference,
          provider: activeProvider === "AGENTHUB" ? "AGENTHUB" : activeProvider === "MANUAL" ? "MANUAL" : "DATAVERIFY",
          externalReqId: externalReqId,
          status: "PROCESSING",
          amountCharged: requiredAmount,
          apiMessage: apiMessage,
          apiResponse: rawApiResponse as any,
        },
      });

      // 4. Referral commission
      const activeReferral = await tx.referral.findUnique({
        where: { referredUserId: user.id },
      });

      if (activeReferral) {
        const isReferralActiveSetting = await tx.globalSetting.findUnique({
          where: { key: "REFERRAL_ACTIVE" },
        });
        const isReferralActive = !isReferralActiveSetting || isReferralActiveSetting.value === "true";
        const isNotExpired = !activeReferral.expiresAt || new Date() < activeReferral.expiresAt;

        if (isReferralActive && isNotExpired) {
          const rewardSetting = await tx.globalSetting.findUnique({
            where: { key: "REF_REWARD_NIN" },
          });
          const commissionAmount = rewardSetting ? Number(rewardSetting.value) : 10.0;

          if (commissionAmount > 0) {
            await tx.referralCommission.create({
              data: {
                referralId: activeReferral.id,
                serviceType: "NIN",
                serviceId: ipeRecord.id,
                amount: commissionAmount,
              },
            });

            await tx.user.update({
              where: { id: activeReferral.referrerId },
              data: { referralBalance: { increment: commissionAmount } },
            });
          }
        }
      }

      // 5. Record promo usage if discount was applied
      if (discountInfo.hasDiscount && discountInfo.promoId) {
        await recordPromoUsageInTx(tx, discountInfo.promoId, user.id, discountInfo.savedAmount, "NIN_IPE_CLEARANCE");
      }

      return ipeRecord;
    });

    // Log Activity
    await logUserActivity({
      userId: user.id,
      action: "NIN_IPE_CLEARANCE_SUBMITTED",
      category: "SERVICES",
      description: `Submitted NIMC IPE clearance for Tracking ID: ${sanitizedTrackingId}`,
      status: "SUCCESS",
      referenceId: reference,
      req,
      metadata: {
        trackingId: sanitizedTrackingId,
        reference,
        provider: activeProvider,
        amountCharged: requiredAmount,
        requestId: externalReqId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "IPE Clearance request submitted successfully. Processing has started.",
      reference: createdIpe.reference,
      requestId: externalReqId,
      status: "PROCESSING",
    });
  } catch (error: any) {
    console.error("❌ NIN IPE Submission Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An unexpected error occurred during submission." },
      { status: 500 }
    );
  }
}
