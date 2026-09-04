// src/app/api/cac/annual-returns/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateNumericId } from "@/utils/generateId";
import { logUserActivity } from "@/lib/activity-logger";
import { sendAnnualReturnsSubmittedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const [history, pricingItems] = await Promise.all([
      prisma.cacAnnualReturnRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.servicePricing.findMany({
        where: {
          serviceKey: {
            in: ["CAC_ANNUAL_RETURNS_BN", "CAC_ANNUAL_RETURNS_LLC"],
          },
        },
      }),
    ]);

    const pricingMap = {
      BUSINESS_NAME: 12000,
      LLC: 18000,
    };

    pricingItems.forEach((p) => {
      if (p.serviceKey === "CAC_ANNUAL_RETURNS_BN") {
        pricingMap.BUSINESS_NAME = Number(p.price);
      } else if (p.serviceKey === "CAC_ANNUAL_RETURNS_LLC") {
        pricingMap.LLC = Number(p.price);
      }
    });

    return NextResponse.json({
      success: true,
      history,
      pricing: pricingMap,
    });
  } catch (error: any) {
    console.error("Fetch CAC Annual Returns Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch annual returns history." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const {
      companyType,
      companyName,
      registrationNumber,
      filingYears,
      documentType,
      documentUrl,
      designeeFullName,
      designeeRole,
      designeeSignatureUrl,
    } = body;

    // Validation
    if (!companyType || !["BUSINESS_NAME", "LLC"].includes(companyType)) {
      return NextResponse.json({ success: false, error: "Invalid company structure selected." }, { status: 400 });
    }
    if (!companyName?.trim()) {
      return NextResponse.json({ success: false, error: "Company name is required." }, { status: 400 });
    }
    if (!registrationNumber?.trim()) {
      return NextResponse.json({ success: false, error: "Registration number (RC/BN) is required." }, { status: 400 });
    }
    if (!documentUrl?.trim()) {
      return NextResponse.json({ success: false, error: "Supporting CAC verification document is required." }, { status: 400 });
    }
    if (!designeeFullName?.trim()) {
      return NextResponse.json({ success: false, error: "Authorizing officer full name is required." }, { status: 400 });
    }
    if (!designeeRole?.trim()) {
      return NextResponse.json({ success: false, error: "Authorizing officer designation is required." }, { status: 400 });
    }
    if (!designeeSignatureUrl?.trim()) {
      return NextResponse.json({ success: false, error: "Authorizing officer signature is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, error: "User wallet account not found." }, { status: 404 });
    }

    // Authoritative Price Determination
    const targetServiceKey = companyType === "LLC" ? "CAC_ANNUAL_RETURNS_LLC" : "CAC_ANNUAL_RETURNS_BN";
    const servicePricing = await prisma.servicePricing.findUnique({
      where: { serviceKey: targetServiceKey },
    });

    if (servicePricing && !servicePricing.isActive) {
      return NextResponse.json(
        { success: false, error: servicePricing.maintenanceMsg || "Annual Returns filing is temporarily unavailable for maintenance." },
        { status: 400 }
      );
    }

    const defaultPrice = companyType === "LLC" ? 18000 : 12000;
    const requiredAmount = servicePricing ? Number(servicePricing.price) : defaultPrice;

    const userBalance = Number(user.wallet.balance);
    if (userBalance < requiredAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient wallet balance. This filing costs ₦${requiredAmount.toLocaleString()}, but your balance is ₦${userBalance.toLocaleString()}. Please fund your wallet to proceed.`,
        },
        { status: 400 }
      );
    }

    const trackingId = `AR-${generateNumericId(6)}`;
    const transactionRef = `AR-TX-${generateNumericId(8)}`;

    const newRequest = await prisma.$transaction(async (tx) => {
      // 1. Debit wallet
      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: { decrement: requiredAmount } },
      });

      const updatedBalance = Number(updatedWallet.balance);
      const balanceBefore = updatedBalance + requiredAmount;

      // 2. Ledger Transaction
      await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: requiredAmount,
          balanceBefore,
          balanceAfter: updatedBalance,
          type: "DEBIT",
          status: "SUCCESS",
          reference: transactionRef,
          serviceCategory: "CAC",
          description: `CAC Annual Returns Filing [${companyType === "LLC" ? "LLC" : "BN"}] - ${companyName.trim()} (${registrationNumber.trim()})`,
        },
      });

      // 3. Create Annual Return Request
      const created = await tx.cacAnnualReturnRequest.create({
        data: {
          trackingId,
          userId: user.id,
          companyType,
          companyName: companyName.trim(),
          registrationNumber: registrationNumber.trim().toUpperCase(),
          filingYears: filingYears?.trim() || new Date().getFullYear().toString(),
          documentType: documentType || "CERTIFICATE",
          documentUrl: documentUrl.trim(),
          designeeFullName: designeeFullName.trim(),
          designeeRole: designeeRole.trim(),
          designeeSignatureUrl: designeeSignatureUrl.trim(),
          status: "PENDING",
          amountPaid: requiredAmount,
          transactionRef,
        },
      });

      // 4. In-App Notification
      await tx.inAppNotification.create({
        data: {
          userId: user.id,
          title: "Annual Returns Submitted 📄",
          message: `Filing received for ${companyName.trim()} (${trackingId}). Our compliance team is processing your CAC submission.`,
          type: "info",
          link: `/dashboard/cac/post-incorporation/annual-returns`,
        },
      });

      return created;
    });

    // 5. Activity Logger
    await logUserActivity({
      userId: user.id,
      action: "CAC_ANNUAL_RETURNS_SUBMITTED",
      category: "CAC",
      description: `Submitted CAC Annual Returns for ${companyName.trim()} (Tracking: ${trackingId})`,
      status: "SUCCESS",
      referenceId: trackingId,
      metadata: {
        trackingId,
        companyName: companyName.trim(),
        registrationNumber: registrationNumber.trim(),
        companyType,
        amount: requiredAmount,
        transactionRef,
      },
      req,
    });

    // 6. Send Submission Receipt Email (non-blocking)
    sendAnnualReturnsSubmittedEmail({
      to: user.email,
      firstName: user.firstName || "Valued Client",
      companyName: companyName.trim(),
      trackingId,
      registrationNumber: registrationNumber.trim().toUpperCase(),
      filingYears: filingYears?.trim() || new Date().getFullYear().toString(),
      amountPaid: requiredAmount,
    }).catch((emailErr) => {
      console.error("Failed to send Annual Returns submission email:", emailErr);
    });

    return NextResponse.json({
      success: true,
      message: "Annual Returns application submitted successfully!",
      data: newRequest,
    });
  } catch (error: any) {
    console.error("CAC Annual Returns Submission Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process Annual Returns application." },
      { status: 500 }
    );
  }
}
