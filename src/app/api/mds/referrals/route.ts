import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_SETTINGS = {
  REFERRAL_ACTIVE: 'true',
  REFERRAL_DISCOUNT_PCT: '5',
  REFERRAL_MIN_WITHDRAWAL: '2000',
  REF_REWARD_CAC_BIZ: '1000',
  REF_REWARD_CAC_LLC: '1500',
  REF_REWARD_SCUML: '500',
  REF_REWARD_TAX_ID: '200',
  REF_REWARD_NIN: '10',
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await prisma.user.findFirst({ where: { email: session.user.email, role: "ADMIN" } });
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 1. Fetch Pending Withdrawals
    const pendingWithdrawals = await prisma.referralWithdrawal.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch Top Referrers (Updated for Ledger Architecture)
    const topReferrers = await prisma.user.findMany({
      where: { referralsGiven: { some: {} } },
      select: {
        id: true, firstName: true, lastName: true, email: true, referralCode: true, referralBalance: true,
        _count: { select: { referralsGiven: true } },
        referralsGiven: { select: { commissions: true } }
      },
      orderBy: { referralBalance: 'desc' },
      take: 50
    });

    const formattedReferrers = topReferrers.map(user => {
      // Calculate total earned from commissions
      const totalEarned = user.referralsGiven.reduce((acc, ref) => {
        return acc + ref.commissions.reduce((sum, comm) => sum + Number(comm.amount), 0);
      }, 0);

      return {
        id: user.id, 
        name: `${user.firstName} ${user.lastName}`.trim(), 
        email: user.email,
        code: user.referralCode, 
        balance: Number(user.referralBalance),
        totalReferred: user._count.referralsGiven,
        totalEarned: totalEarned // Replaced 'earnedCount' with actual money earned
      };
    });

    // 3. Fetch Enrolled Users
    const enrolledUsers = await prisma.user.findMany({
      where: { referralCode: { not: null } },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, referralCode: true, createdAt: true, referralBalance: true },
      orderBy: { createdAt: 'desc' }
    });

    // 4. Fetch Ledger Global Settings
    const dbSettings = await prisma.globalSetting.findMany({
      where: { key: { in: Object.keys(DEFAULT_SETTINGS) } }
    });

    const settings = { ...DEFAULT_SETTINGS };
    dbSettings.forEach(s => {
      if (s.key in settings) {
        settings[s.key as keyof typeof settings] = s.value;
      }
    });

    // 5. Global Stats
    const totalPaidData = await prisma.referralWithdrawal.aggregate({ where: { status: "PAID" }, _sum: { amount: true } });
    const totalPendingData = await prisma.referralWithdrawal.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } });

    return NextResponse.json({
      success: true, 
      pendingWithdrawals, 
      topReferrers: formattedReferrers, 
      enrolledUsers,
      settings: {
        REFERRAL_ACTIVE: settings.REFERRAL_ACTIVE === 'true',
        REFERRAL_DISCOUNT_PCT: Number(settings.REFERRAL_DISCOUNT_PCT),
        REFERRAL_MIN_WITHDRAWAL: Number(settings.REFERRAL_MIN_WITHDRAWAL),
        REF_REWARD_CAC_BIZ: Number(settings.REF_REWARD_CAC_BIZ),
        REF_REWARD_CAC_LLC: Number(settings.REF_REWARD_CAC_LLC),
        REF_REWARD_SCUML: Number(settings.REF_REWARD_SCUML),
        REF_REWARD_TAX_ID: Number(settings.REF_REWARD_TAX_ID),
        REF_REWARD_NIN: Number(settings.REF_REWARD_NIN),
      },
      stats: {
        totalPaid: Number(totalPaidData._sum.amount || 0), totalPending: Number(totalPendingData._sum.amount || 0)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
