import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { reference } = body;

    if (!reference || !reference.startsWith("ONL_")) {
      return NextResponse.json({ message: "Invalid transaction reference" }, { status: 400 });
    }

    // Extract the registration ID from our custom reference format: ONL_{registrationId}_{timestamp}
    const registrationId = reference.split("_")[1];

    // 1. Verify Payment Server-to-Server with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, // Must be in .env
      },
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== "success") {
      return NextResponse.json({ success: false, message: "Payment verification failed with Paystack." }, { status: 400 });
    }

    const amountPaid = Number(paystackData.data.amount) / 100; // Convert Kobo back to Naira

    // Store the email safely outside the callback so TypeScript remembers it is a string
    const userEmail = session.user.email as string;

    // 2. ATOMIC TRANSACTION TO PREVENT RACE CONDITIONS
    await prisma.$transaction(async (tx) => {
      // Find the user and wallet using the strictly typed email
      const user = await tx.user.findUnique({ 
        where: { email: userEmail }, 
        include: { wallet: true } 
      });
      if (!user || !user.wallet) throw new Error("User or wallet missing");

      // IDEMPOTENCY CHECK: Ensure we haven't already processed this exact reference!
      const existingTx = await tx.transaction.findUnique({ where: { reference } });
      if (existingTx && existingTx.status === "SUCCESS") {
        return; // Break out safely. It was already handled by another rapid request.
      }

      const registration = await tx.businessRegistration.findUnique({ where: { id: registrationId } });
      if (!registration || registration.status !== "UNSUBMITTED") {
        throw new Error("Application already submitted or invalid");
      }

      // STEP A: FUND THE WALLET (The virtual deposit from Paystack)
      let currentBalance = Number(user.wallet.balance);
      let newBalanceAfterFunding = currentBalance + amountPaid;

      await tx.transaction.create({
        data: {
          walletId: user.wallet.id,
          amount: amountPaid,
          balanceBefore: currentBalance,
          balanceAfter: newBalanceAfterFunding,
          type: "CREDIT",
          status: "SUCCESS",
          reference: reference, // Save the paystack reference here to lock it
          description: "Paystack Online Funding"
        }
      });

      // STEP B: EXACT SIMULTANEOUS DEBIT (Pay for the service)
      let newBalanceAfterPayment = newBalanceAfterFunding - amountPaid;

      await tx.transaction.create({
        data: {
          walletId: user.wallet.id,
          amount: amountPaid,
          balanceBefore: newBalanceAfterFunding,
          balanceAfter: newBalanceAfterPayment,
          type: "DEBIT",
          status: "SUCCESS",
          reference: `SRV_PAY_${registrationId}_${Date.now()}`,
          description: `Payment for Business Registration (${registration.proposedName})`
        }
      });

      // STEP C: UPDATE WALLET BALANCE
      await tx.wallet.update({
        where: { id: user.wallet.id },
        data: { balance: newBalanceAfterPayment } // Mathematically, this equals the original currentBalance
      });

      // STEP D: UPDATE REGISTRATION STATUS
      await tx.businessRegistration.update({
        where: { id: registrationId },
        data: { status: "PENDING" } // Application officially submitted!
      });
    });

    // TODO: Trigger Email/SMS notification here since payment is fully secured.

    return NextResponse.json({ success: true, message: "Payment verified and application submitted!" });

  } catch (error: any) {
    console.error("Payment Verification Error:", error.message);
    return NextResponse.json({ message: error.message || "Failed to process payment." }, { status: 500 });
  }
}
