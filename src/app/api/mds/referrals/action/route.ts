// src/app/api/mds/referrals/action/route.ts

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
    const { actionType, withdrawalId, rewardAmount, spendThreshold } = body;

    // A. UPDATE SETTINGS
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
        })
      ]);
      return NextResponse.json({ success: true, message: "Settings updated successfully." });
    }

    // B. APPROVE PAYOUT
    if (actionType === "APPROVE_PAYOUT") {
      await prisma.referralWithdrawal.update({
        where: { id: withdrawalId },
        data: { status: "PAID", processedAt: new Date() }
      });
      return NextResponse.json({ success: true, message: "Payout marked as Paid." });
    }

    // C. REJECT PAYOUT (Refund the user's referral balance)
    if (actionType === "REJECT_PAYOUT") {
      const withdrawal = await prisma.referralWithdrawal.findUnique({ where: { id: withdrawalId } });
      if (!withdrawal || withdrawal.status !== "PENDING") {
        return NextResponse.json({ error: "Invalid or already processed withdrawal." }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        await tx.referralWithdrawal.update({
          where: { id: withdrawalId },
          data: { status: "REJECTED", processedAt: new Date() }
        });

        // Give the money back to their dashboard balance so they can try again
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: { referralBalance: { increment: withdrawal.amount } }
        });
      });

      return NextResponse.json({ success: true, message: "Payout rejected and funds returned to user." });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });

  } catch (error) {
    console.error("Admin Referral Action Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
