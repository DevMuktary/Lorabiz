import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { reference } = body;

    // =====================================================================
    // SSRF FIX: STRICT INPUT VALIDATION & SANITIZATION
    // =====================================================================
    if (!reference || typeof reference !== "string" || !/^[a-zA-Z0-9_-]+$/.test(reference)) {
      return NextResponse.json({ message: "Invalid transaction reference format" }, { status: 400 });
    }

    if (!reference.startsWith("ONL_")) {
      return NextResponse.json({ message: "Invalid transaction type for this endpoint" }, { status: 400 });
    }

    // Safely encode the reference before injecting it into the URL
    const safeReference = encodeURIComponent(reference);
    const registrationId = reference.split("_")[1];

    // 1. Verify Payment Server-to-Server with Korapay
    const koraRes = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${safeReference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.KORAPAY_SECRET_KEY}`, 
        "Content-Type": "application/json"
      },
    });

    const koraData = await koraRes.json();

    if (!koraData.status || (koraData.data.status !== "success" && koraData.data.status !== "successful")) {
      return NextResponse.json({ success: false, message: "Payment verification failed with Korapay." }, { status: 400 });
    }

    // Korapay returns amount in exact Naira
    const amountPaid = Number(koraData.data.amount); 
    const userEmail = session.user.email as string;

    // 2. ATOMIC TRANSACTION TO PREVENT RACE CONDITIONS
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.findUnique({ 
        where: { email: userEmail }, 
        include: { wallet: true } 
      });
      if (!user || !user.wallet) throw new Error("User or wallet missing");

      // IDEMPOTENCY CHECK
      const existingTx = await tx.transaction.findUnique({ where: { reference } });
      if (existingTx && existingTx.status === "SUCCESS") {
        return; 
      }

      const registration = await tx.businessRegistration.findUnique({ where: { id: registrationId } });
      if (!registration || registration.status !== "UNSUBMITTED") {
        throw new Error("Application already submitted or invalid");
      }

      // STEP A: ATOMICALLY FUND THE WALLET
      const fundedWallet = await tx.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: { increment: amountPaid } }
      });
      const balanceAfterCredit = Number(fundedWallet.balance);
      const balanceBeforeCredit = balanceAfterCredit - amountPaid;

      await tx.transaction.create({
        data: {
          walletId: user.wallet.id,
          amount: amountPaid,
          balanceBefore: balanceBeforeCredit,
          balanceAfter: balanceAfterCredit,
          type: "CREDIT",
          status: "SUCCESS",
          reference: reference, 
          description: "Korapay Online Funding",
          serviceCategory: "WALLET_FUNDING"
        }
      });

      // STEP B: EXACT SIMULTANEOUS ATOMIC DEBIT 
      const debitedWallet = await tx.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: { decrement: amountPaid } }
      });
      const balanceAfterDebit = Number(debitedWallet.balance);

      await tx.transaction.create({
        data: {
          walletId: user.wallet.id,
          amount: amountPaid,
          balanceBefore: balanceAfterCredit,
          balanceAfter: balanceAfterDebit,
          type: "DEBIT",
          status: "SUCCESS",
          reference: `SRV_PAY_${registrationId}_${Date.now()}`,
          description: `Payment for Business Registration (${registration.proposedName})`,
          serviceCategory: "BUSINESS_NAME"
        }
      });

      // STEP C: UPDATE REGISTRATION STATUS
      await tx.businessRegistration.update({
        where: { id: registrationId },
        data: { status: "PENDING" } 
      });
    });

    return NextResponse.json({ success: true, message: "Payment verified and application submitted!" });

  } catch (error: any) {
    console.error("Payment Verification Error:", error.message);
    return NextResponse.json({ message: error.message || "Failed to process payment." }, { status: 500 });
  }
}
