import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await prisma.user.findFirst({ where: { email: session.user.email, role: "ADMIN" } });
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { actionType, withdrawalId, rewardAmount, spendThreshold, minWithdrawal } = body;

    if (actionType === "UPDATE_SETTINGS") {
      await prisma.$transaction([
        prisma.globalSetting.upsert({
          where: { key: 'REFERRAL_REWARD_AMOUNT' },
          update: { value: String(rewardAmount) },
          create: { key: 'REFERRAL_REWARD_AMOUNT', value: String(rewardAmount), description: 'Amount paid per successful referral' }
        }),
        prisma.globalSetting.upsert({
          where: { key: 'REFERRAL_SPEND_THRESHOLD' },
          update: { value: String(spendThreshold) },
          create: { key: 'REFERRAL_SPEND_THRESHOLD', value: String(spendThreshold), description: 'Amount referred user must spend' }
        }),
        prisma.globalSetting.upsert({
          where: { key: 'REFERRAL_MIN_WITHDRAWAL' },
          update: { value: String(minWithdrawal) },
          create: { key: 'REFERRAL_MIN_WITHDRAWAL', value: String(minWithdrawal), description: 'Minimum withdrawal limit' }
        })
      ]);
      return NextResponse.json({ success: true, message: "Settings updated successfully." });
    }

    if (actionType === "APPROVE_PAYOUT") {
      await prisma.referralWithdrawal.update({ where: { id: withdrawalId }, data: { status: "PAID" } });
      return NextResponse.json({ success: true, message: "Payout marked as Paid." });
    }

    if (actionType === "REJECT_PAYOUT") {
      const withdrawal = await prisma.referralWithdrawal.findUnique({ where: { id: withdrawalId } });
      if (!withdrawal || withdrawal.status !== "PENDING") return NextResponse.json({ error: "Invalid withdrawal." }, { status: 400 });

      await prisma.$transaction(async (tx) => {
        await tx.referralWithdrawal.update({ where: { id: withdrawalId }, data: { status: "REJECTED" } });
        await tx.user.update({ where: { id: withdrawal.userId }, data: { referralBalance: { increment: withdrawal.amount } } });
      });

      return NextResponse.json({ success: true, message: "Payout rejected and funds returned to user." });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
