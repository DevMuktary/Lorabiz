import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId, actionType, reason, amount } = body;
    // actionType: "SUSPEND", "UNSUSPEND", "CREDIT_WALLET", "DEBIT_WALLET"

    if (!clientId || !actionType) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const mdsAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!mdsAdmin) return NextResponse.json({ error: "No Admin account found." }, { status: 500 });

    await prisma.$transaction(async (tx) => {
      // 1. Account Suspension Logic
      if (actionType === "SUSPEND" || actionType === "UNSUSPEND") {
        const isSuspended = actionType === "SUSPEND";
        await tx.user.update({
          where: { id: clientId },
          data: { isSuspended } // Your new Prisma field!
        });

        await tx.staffActionLog.create({
          data: {
            userId: mdsAdmin.id,
            action: `ADMIN_${actionType}_USER`,
            targetId: clientId,
            details: `MD ${actionType} user account. Reason: ${reason || 'N/A'}`
          }
        });
      }

      // 2. Manual Wallet Adjustment Logic
      if (actionType === "CREDIT_WALLET" || actionType === "DEBIT_WALLET") {
        if (!amount || Number(amount) <= 0 || !reason) {
          throw new Error("Valid amount and reason are required for wallet adjustments.");
        }

        const wallet = await tx.wallet.findUnique({ where: { userId: clientId } });
        if (!wallet) throw new Error("User does not have an active wallet.");

        const numAmount = Number(amount);
        const balanceBefore = Number(wallet.balance);
        const balanceAfter = actionType === "CREDIT_WALLET" ? balanceBefore + numAmount : balanceBefore - numAmount;

        if (balanceAfter < 0) throw new Error("Debit amount exceeds current wallet balance.");

        const ref = `ADJ-${Math.floor(Math.random() * 1000000000)}`;

        await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter } });
        
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            amount: numAmount,
            balanceBefore,
            balanceAfter,
            type: actionType === "CREDIT_WALLET" ? "ADJUSTMENT" : "DEBIT", // ADJUSTMENT is usually credit bypass
            status: "SUCCESS",
            reference: ref,
            description: `Manual MD Adjustment: ${reason}`
          }
        });

        await tx.staffActionLog.create({
          data: {
            userId: mdsAdmin.id,
            action: `ADMIN_WALLET_ADJUSTMENT`,
            targetId: wallet.id,
            details: `MD performed ${actionType} of ₦${numAmount}. Reason: ${reason}`
          }
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Client Action Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
  }
}
