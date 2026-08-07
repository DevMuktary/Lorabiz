// src/app/api/mds/referrals/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await prisma.user.findFirst({ where: { email: session.user.email, role: "ADMIN" } });
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 1. Fetch Pending Withdrawals
    const pendingWithdrawals = await prisma.referralWithdrawal.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch Top Referrers
    const topReferrers = await prisma.user.findMany({
      where: { referralsGiven: { some: {} } },
      select: {
        id: true, firstName: true, lastName: true, email: true, referralCode: true, referralBalance: true,
        _count: { select: { referralsGiven: true } },
        referralsGiven: { select: { status: true } }
      },
      orderBy: { referralBalance: 'desc' },
      take: 50
    });

    const formattedReferrers = topReferrers.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      code: user.referralCode,
      balance: Number(user.referralBalance),
      totalReferred: user._count.referralsGiven,
      earnedCount: user.referralsGiven.filter(r => r.status === "EARNED").length
    }));

    // 3. Fetch Enrolled Users (Everyone with a referral code)
    const enrolledUsers = await prisma.user.findMany({
      where: { referralCode: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        referralCode: true,
        createdAt: true,
        referralBalance: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // 4. Fetch Settings
    const rewardSetting = await prisma.globalSetting.findUnique({ where: { key: 'REFERRAL_REWARD_AMOUNT' } });
    const thresholdSetting = await prisma.globalSetting.findUnique({ where: { key: 'REFERRAL_SPEND_THRESHOLD' } });

    // 5. Fetch Quick Stats
    const totalPaidData = await prisma.referralWithdrawal.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true }
    });
    
    const totalPendingData = await prisma.referralWithdrawal.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true }
    });

    return NextResponse.json({
      success: true,
      pendingWithdrawals,
      topReferrers: formattedReferrers,
      enrolledUsers,
      settings: {
        rewardAmount: rewardSetting ? Number(rewardSetting.value) : 1000,
        spendThreshold: thresholdSetting ? Number(thresholdSetting.value) : 5000
      },
      stats: {
        totalPaid: Number(totalPaidData._sum.amount || 0),
        totalPending: Number(totalPendingData._sum.amount || 0)
      }
    });

  } catch (error) {
    console.error("Admin Referral Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
