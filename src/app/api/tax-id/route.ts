// src/app/api/tax-id/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma"; 
import { generateNumericId } from "@/utils/generateId"; 
import { sendTaxIdSubmittedEmail } from "@/lib/email";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const history = await prisma.taxIdRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error("Tax ID History Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const { type, individualData, corporateData, price } = data;

    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      include: { wallet: true }
    });

    if (!user || !user.wallet) return NextResponse.json({ error: "User or wallet not found" }, { status: 404 });

    // Check service killswitch
    const targetServiceKey = type === "CORPORATE" ? "TAX_ID_CORPORATE" : "TAX_ID_INDIVIDUAL";
    const taxIdPricing = await prisma.servicePricing.findUnique({
      where: { serviceKey: targetServiceKey }
    });
    if (taxIdPricing && !taxIdPricing.isActive) {
      return NextResponse.json({ 
        error: taxIdPricing.maintenanceMsg || "Tax ID processing is currently undergoing maintenance." 
      }, { status: 400 });
    }

    if (Number(user.wallet.balance) < price) return NextResponse.json({ error: "Insufficient wallet balance." }, { status: 400 });

    const transactionRef = `TIN-${generateNumericId(8)}`;

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: { decrement: price } }
      });

      await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: price,
          balanceBefore: user.wallet!.balance,
          balanceAfter: updatedWallet.balance,
          type: "DEBIT",
          status: "SUCCESS",
          reference: transactionRef,
          description: `Tax ID Generation (${type})`
        }
      });

      const taxReq = await tx.taxIdRequest.create({
        data: {
          userId: user.id,
          type,
          nin: individualData?.nin,
          firstName: individualData?.firstName,
          lastName: individualData?.lastName,
          dob: individualData?.dob,
          cacNumber: corporateData?.cacNumber,
          corporateCategory: corporateData?.category,
          amountPaid: price,
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

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error("Tax ID Submission Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
