import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const withdrawAmount = Number(body.amount);
    
    // Dynamic minimum limit
    const minWithSetting = await prisma.globalSetting.findUnique({ where: { key: 'REFERRAL_MIN_WITHDRAWAL' } });
    const MIN_WITHDRAWAL = minWithSetting ? Number(minWithSetting.value) : 2000;

    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount < MIN_WITHDRAWAL) {
      return NextResponse.json({ success: false, message: `Minimum withdrawal amount is ₦${MIN_WITHDRAWAL.toLocaleString()}.` }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    if (!user.payoutAccountNo || !user.payoutBankName || !user.payoutAccountName) {
      return NextResponse.json({ success: false, message: "Please set up your payout bank details first." }, { status: 400 });
    }

    if (Number(user.referralBalance) < withdrawAmount) {
      return NextResponse.json({ success: false, message: "Insufficient referral balance." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { referralBalance: { decrement: withdrawAmount } } });
      await tx.referralWithdrawal.create({
        data: {
          userId: user.id, amount: withdrawAmount, status: "PENDING",
          bankName: user.payoutBankName!, accountNo: user.payoutAccountNo!, accountName: user.payoutAccountName!
        }
      });
    });

    return NextResponse.json({ success: true, message: `Withdrawal request for ₦${withdrawAmount.toLocaleString()} submitted.` });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
