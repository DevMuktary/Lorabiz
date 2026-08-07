// src/app/api/user/referral/withdraw/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount } = body;

    const withdrawAmount = Number(amount);
    
    // Configurable minimum limit
    const MIN_WITHDRAWAL = 2000;

    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount < MIN_WITHDRAWAL) {
      return NextResponse.json({ 
        success: false, 
        message: `Minimum withdrawal amount is ₦${MIN_WITHDRAWAL.toLocaleString()}.` 
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    if (!user.payoutAccountNo || !user.payoutBankName || !user.payoutAccountName) {
      return NextResponse.json({ 
        success: false, 
        message: "You must set up and verify your payout bank details before withdrawing." 
      }, { status: 400 });
    }

    const currentBalance = Number(user.referralBalance);

    if (currentBalance < withdrawAmount) {
      return NextResponse.json({ 
        success: false, 
        message: "Insufficient referral balance." 
      }, { status: 400 });
    }

    // Process Withdrawal safely using a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Deduct balance immediately
      await tx.user.update({
        where: { id: user.id },
        data: { referralBalance: { decrement: withdrawAmount } }
      });

      // 2. Create the pending cashout request for Admin review
      await tx.referralWithdrawal.create({
        data: {
          userId: user.id,
          amount: withdrawAmount,
          status: "PENDING",
          bankName: user.payoutBankName!,
          accountNo: user.payoutAccountNo!,
          accountName: user.payoutAccountName!
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: `Withdrawal request for ₦${withdrawAmount.toLocaleString()} has been submitted for admin review.` 
    });

  } catch (error) {
    console.error("Referral Withdrawal Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
