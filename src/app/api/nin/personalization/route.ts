import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { submitDataVerifyPersonalization } from "@/lib/dataverify";
import { logUserActivity } from "@/lib/activity-logger";

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

    // Check ServicePricing configuration for NIN_PERSONALIZATION
    const servicePricing = await prisma.servicePricing.findUnique({
      where: { serviceKey: "NIN_PERSONALIZATION" },
    });

    if (servicePricing && !servicePricing.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: servicePricing.maintenanceMsg || "NIN Personalization service is currently unavailable for maintenance.",
        },
        { status: 400 }
      );
    }

    const requiredAmount = servicePricing ? Number(servicePricing.price) : 1500.0;
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

    // Check if there is already an ongoing processing request for the same tracking ID by this user
    const existingActiveRequest = await prisma.ninPersonalizationRequest.findFirst({
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
          message: `You already have an active personalization request in processing for Tracking ID ${sanitizedTrackingId} (Reference: ${existingActiveRequest.reference}).`,
        },
        { status: 409 }
      );
    }

    // Fetch active provider from GlobalSettings
    const providerSetting = await prisma.globalSetting.findUnique({
      where: { key: "NIN_PERSONALIZATION_PROVIDER" },
    });
    const activeProvider = (providerSetting?.value || "DATAVERIFY").toUpperCase(); // "DATAVERIFY" | "MANUAL"

    // Generate unique reference
    const reference = `PZN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    let externalTxId: string | null = null;
    let apiMessage = "Personalization request accepted. Processing in progress.";
    let rawApiResponse: unknown = null;

    if (activeProvider === "DATAVERIFY") {
      const dataVerifyRes = await submitDataVerifyPersonalization(sanitizedTrackingId);

      if (!dataVerifyRes.success || !dataVerifyRes.data?.status) {
        return NextResponse.json(
          {
            success: false,
            message:
              dataVerifyRes.error ||
              "Unable to submit personalization request to identity gateway. Please verify your Tracking ID and try again.",
          },
          { status: 422 }
        );
      }

      externalTxId = dataVerifyRes.data.transaction_id || null;
      apiMessage = dataVerifyRes.data.message || apiMessage;
      rawApiResponse = dataVerifyRes.data;
    } else {
      // Manual Operator routing
      apiMessage = "Request queued for manual verification and personalization processing.";
    }

    // Execute atomic transaction for wallet debit, ledger record, and Personalization request creation
    const createdPersonalization = await prisma.$transaction(async (tx) => {
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
          description: `NIMC NIN Personalization Service - Tracking ID: ${sanitizedTrackingId}`,
        },
      });

      // 3. Create Personalization Request
      const record = await tx.ninPersonalizationRequest.create({
        data: {
          userId: user.id,
          trackingId: sanitizedTrackingId,
          reference: reference,
          provider: activeProvider === "MANUAL" ? "MANUAL" : "DATAVERIFY",
          externalTxId: externalTxId,
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
                serviceId: record.id,
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

      return record;
    });

    // Log Activity
    await logUserActivity({
      userId: user.id,
      action: "NIN_PERSONALIZATION_SUBMITTED",
      category: "SERVICES",
      description: `Submitted NIN Personalization for Tracking ID: ${sanitizedTrackingId}`,
      status: "SUCCESS",
      referenceId: reference,
      req,
      metadata: {
        trackingId: sanitizedTrackingId,
        reference,
        provider: activeProvider,
        amountCharged: requiredAmount,
        transactionId: externalTxId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "NIN Personalization request submitted successfully. Processing has started.",
      reference: createdPersonalization.reference,
      transactionId: externalTxId,
      status: "PROCESSING",
    });
  } catch (error: any) {
    console.error("❌ NIN Personalization Submission Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An unexpected error occurred during personalization submission." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        wallet: true,
        ninPersonalizationRequests: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    const pricing = await prisma.servicePricing.findUnique({
      where: { serviceKey: "NIN_PERSONALIZATION" },
    });

    return NextResponse.json({
      success: true,
      price: pricing ? Number(pricing.price) : 1500,
      isActive: pricing ? pricing.isActive : true,
      maintenanceMsg: pricing?.maintenanceMsg || null,
      walletBalance: user.wallet ? Number(user.wallet.balance) : 0,
      recentRequests: user.ninPersonalizationRequests,
    });
  } catch (error: any) {
    console.error("❌ NIN Personalization Info GET Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Error fetching service details." },
      { status: 500 }
    );
  }
}
