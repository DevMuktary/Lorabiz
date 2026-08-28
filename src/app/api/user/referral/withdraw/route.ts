import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getUserLoyaltyProfile } from "@/lib/loyalty";
import { logUserActivity } from "@/lib/activity-logger";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    const body = await req.json();
    const withdrawAmount = Number(body.amount);

    // Compute dynamic minimum limit from User's Loyalty Tier
    const loyaltyProfile = await getUserLoyaltyProfile(prisma, user.id);
    const minWithSetting = await prisma.globalSetting.findUnique({ where: { key: 'REFERRAL_MIN_WITHDRAWAL' } });
    const globalDefault = minWithSetting ? Number(minWithSetting.value) : 2000;
    
    // Tier unlocks progressively lower minimums (Bronze: ₦2,000, Silver: ₦1,500, Gold: ₦1,000, Platinum: ₦500)
    const effectiveMinWithdrawal = Math.min(globalDefault, loyaltyProfile.minWithdrawal);

    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount < effectiveMinWithdrawal) {
      return NextResponse.json({ 
        success: false, 
        message: `Minimum withdrawal amount for your ${loyaltyProfile.currentTier.fullName} is ₦${effectiveMinWithdrawal.toLocaleString()}.` 
      }, { status: 400 });
    }

    if (!user.payoutAccountNo || !user.payoutBankName || !user.payoutAccountName) {
      return NextResponse.json({ success: false, message: "Please set up your payout bank details first." }, { status: 400 });
    }

    if (Number(user.referralBalance) < withdrawAmount) {
      return NextResponse.json({ success: false, message: "Insufficient referral balance." }, { status: 400 });
    }

    const withdrawalRecord = await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { referralBalance: { decrement: withdrawAmount } } });
      const record = await tx.referralWithdrawal.create({
        data: {
          userId: user.id, 
          amount: withdrawAmount, 
          status: "PENDING",
          bankName: user.payoutBankName!, 
          accountNo: user.payoutAccountNo!, 
          accountName: user.payoutAccountName!
        }
      });
      return record;
    });

    // Log activity & dispatch Telegram alert
    await logUserActivity({
      userId: user.id,
      action: "REFERRAL_WITHDRAWAL_REQUESTED",
      category: "WALLET",
      description: `Requested referral payout of ₦${withdrawAmount.toLocaleString()} to ${user.payoutBankName} (${user.payoutAccountNo}) [${loyaltyProfile.currentTier.fullName}]`,
      status: "PENDING",
      referenceId: withdrawalRecord.id,
      metadata: {
        amount: withdrawAmount,
        bankName: user.payoutBankName,
        accountNo: user.payoutAccountNo,
        tier: loyaltyProfile.currentTier.fullName,
      },
      req,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Withdrawal request for ₦${withdrawAmount.toLocaleString()} submitted successfully.` 
    });
  } catch (error) {
    console.error("Referral withdrawal error:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
