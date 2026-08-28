// src/app/api/tax-id/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma"; 
import { generateNumericId } from "@/utils/generateId"; 
import { sendTaxIdSubmittedEmail } from "@/lib/email";
import { logUserActivity } from "@/lib/activity-logger";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized access. Please log in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ success: false, error: "User account not found." }, { status: 404 });
    }

    const history = await prisma.taxIdRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error("Tax ID History Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch Tax ID application history." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized access. Please log in." }, { status: 401 });
    }

    const data = await req.json();
    const { type, individualData, corporateData, price } = data;

    if (!type || (type !== "INDIVIDUAL" && type !== "CORPORATE")) {
      return NextResponse.json({ success: false, error: "Invalid request type specified." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, error: "User account or wallet not found." }, { status: 404 });
    }

    // Check service killswitch & get authoritative price
    const targetServiceKey = type === "CORPORATE" ? "TAX_ID_CORPORATE" : "TAX_ID_INDIVIDUAL";
    const taxIdPricing = await prisma.servicePricing.findUnique({
      where: { serviceKey: targetServiceKey }
    });

    if (taxIdPricing && !taxIdPricing.isActive) {
      return NextResponse.json({ 
        success: false,
        error: taxIdPricing.maintenanceMsg || "Tax ID processing is currently undergoing maintenance." 
      }, { status: 400 });
    }

    const defaultPrice = type === "CORPORATE" ? 1000 : 500;
    const finalPrice = taxIdPricing ? Number(taxIdPricing.price) : (Number(price) || defaultPrice);

    const userBalance = Number(user.wallet.balance);
    if (userBalance < finalPrice) {
      return NextResponse.json({ 
        success: false, 
        error: `Insufficient wallet balance. This service costs ₦${finalPrice.toLocaleString()} but your balance is ₦${userBalance.toLocaleString()}. Please fund your wallet to proceed.` 
      }, { status: 400 });
    }

    // Input validation
    if (type === "INDIVIDUAL") {
      if (!individualData?.nin || !individualData?.firstName || !individualData?.lastName || !individualData?.dob) {
        return NextResponse.json({ 
          success: false, 
          error: "Please fill in all required fields (NIN, First Name, Last Name, Date of Birth)." 
        }, { status: 400 });
      }
    } else {
      if (!corporateData?.cacNumber) {
        return NextResponse.json({ 
          success: false, 
          error: "Please provide a valid CAC Registration Number (RC/BN)." 
        }, { status: 400 });
      }
    }

    const transactionRef = `TIN-${generateNumericId(8)}`;

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: { decrement: finalPrice } }
      });

      const updatedBalance = Number(updatedWallet.balance);
      const balanceBeforeUpdate = updatedBalance + finalPrice;

      await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: finalPrice,
          balanceBefore: balanceBeforeUpdate,
          balanceAfter: updatedBalance,
          type: "DEBIT",
          status: "SUCCESS",
          reference: transactionRef,
          serviceCategory: "TAX_ID",
          description: `Tax ID Generation (${type === "CORPORATE" ? "Corporate" : "Individual"})`
        }
      });

      const taxReq = await tx.taxIdRequest.create({
        data: {
          userId: user.id,
          type,
          nin: individualData?.nin || null,
          firstName: individualData?.firstName || null,
          lastName: individualData?.lastName || null,
          dob: individualData?.dob || null,
          cacNumber: corporateData?.cacNumber || null,
          corporateCategory: corporateData?.category || null,
          amountPaid: finalPrice,
          transactionRef
        }
      });

      return taxReq;
    });

    // Send confirmation email
    try {
      await sendTaxIdSubmittedEmail({
        to: user.email!,
        name: user.firstName || "Customer",
        requestType: type === "INDIVIDUAL" ? "Individual Tax ID" : "Corporate Tax ID",
        transactionRef: transactionRef
      });
    } catch (e) {
      console.error("Failed to send TAX ID confirmation email:", e);
    }

    // Log user activity & dispatch real-time Telegram alert
    await logUserActivity({
      userId: user.id,
      action: "TAX_ID_SUBMITTED",
      category: "SERVICES",
      description: `Submitted Tax ID request (${type === "CORPORATE" ? "Corporate" : "Individual"}) - Ref: ${transactionRef}`,
      status: "SUCCESS",
      referenceId: transactionRef,
      metadata: {
        amount: finalPrice,
        type: type === "CORPORATE" ? "Corporate Tax ID" : "Individual Tax ID",
        nin: individualData?.nin || null,
        cacNumber: corporateData?.cacNumber || null,
        transactionRef,
      },
      req,
    });

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error("Tax ID Submission Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || "An unexpected error occurred while processing your request." 
    }, { status: 500 });
  }
}
