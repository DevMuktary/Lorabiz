import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { transactionId, refundAmount, reason } = body;

    if (!transactionId || !refundAmount || !reason) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // 1. Fetch the original transaction to validate
    const originalTx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true }
    });

    if (!originalTx) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    if (originalTx.type !== "DEBIT" || originalTx.status !== "SUCCESS") {
      return NextResponse.json({ error: "Only successful payments (debits) can be refunded." }, { status: 400 });
    }

    if (Number(refundAmount) > Number(originalTx.amount) || Number(refundAmount) <= 0) {
      return NextResponse.json({ error: "Invalid refund amount." }, { status: 400 });
    }

    const walletId = originalTx.walletId;
    const balanceBefore = originalTx.wallet.balance;
    const balanceAfter = Number(balanceBefore) + Number(refundAmount);
    
    // Secure reference generation
    const refundRef = `REF-${Math.floor(Math.random() * 1000000000)}`;

    // 2. Execute Database Transaction (All or Nothing)
    await prisma.$transaction(async (tx) => {
      // A. Update Wallet
      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: balanceAfter }
      });

      // B. Create Refund Transaction Record
      await tx.transaction.create({
        data: {
          walletId: walletId,
          amount: refundAmount,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          type: "REFUND",
          status: "SUCCESS",
          reference: refundRef,
          // Explicitly tying the reason to the original transaction
          description: `Refund for [${originalTx.reference}] - Reason: ${reason}` 
        }
      });

      // C. Log the MDS Action
      await tx.staffActionLog.create({
        data: {
          userId: "SYSTEM_MDS", // Ideally, pull the actual MDS ID from NextAuth session
          action: "ISSUED_REFUND",
          targetId: refundRef,
          details: `Issued ₦${refundAmount} refund for original TX ${originalTx.reference}. Reason: ${reason}`
        }
      });
    });

    return NextResponse.json({ success: true, message: "Refund processed successfully." });

  } catch (error) {
    console.error("Refund Error:", error);
    return NextResponse.json({ error: "Internal server error during refund." }, { status: 500 });
  }
}
