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
  REF_REWARD_NIN: '50',
  REF_REWARD_NIN_VAL: '250',
  REF_REWARD_NIN_MOD: '250',
  REF_REWARD_NIN_PERSONALIZATION: '250',
  REF_REWARD_NIN_IPE: '250',
  REF_REWARD_BVN_SLIP: '50',
  REF_REWARD_BVN_RETRIEVAL: '250',
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

    // 2. Fetch ALL Enrolled Partners (Users who have generated a referral code / bank setup)
    const enrolledPartnersRaw = await prisma.user.findMany({
      where: { referralCode: { not: null } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        referralCode: true,
        referralBalance: true,
        payoutBankName: true,
        payoutAccountNo: true,
        payoutAccountName: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { referralsGiven: true } },
        referralsGiven: { select: { commissions: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const enrolledUsers = enrolledPartnersRaw.map(user => {
      const totalEarned = user.referralsGiven.reduce((acc, ref) => {
        return acc + ref.commissions.reduce((sum, comm) => sum + Number(comm.amount), 0);
      }, 0);

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
        code: user.referralCode,
        referralBalance: Number(user.referralBalance),
        balance: Number(user.referralBalance),
        totalReferred: user._count.referralsGiven,
        totalEarned,
        bankDetails: user.payoutAccountNo ? {
          bankName: user.payoutBankName,
          accountNo: user.payoutAccountNo,
          accountName: user.payoutAccountName
        } : null,
        createdAt: user.createdAt,
        joinedAt: user.updatedAt || user.createdAt
      };
    });

    // 3. Top Referrers sorted by referrals given then total earned
    const topReferrers = [...enrolledUsers].sort((a, b) => {
      if (b.totalReferred !== a.totalReferred) {
        return b.totalReferred - a.totalReferred;
      }
      return b.totalEarned - a.totalEarned;
    });

    // 4. Fetch Referral Connections / Pairs (Who referred whom)
    const referralPairsRaw = await prisma.referral.findMany({
      include: {
        referrer: { select: { id: true, firstName: true, lastName: true, email: true, referralCode: true } },
        commissions: { select: { amount: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const refereeUserIds = referralPairsRaw.map(r => r.referredUserId);
    const refereeUsers = await prisma.user.findMany({
      where: { id: { in: refereeUserIds } },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true }
    });

    const referralPairs = referralPairsRaw.map(r => {
      const refUser = refereeUsers.find(u => u.id === r.referredUserId);
      const commissionsEarned = r.commissions.reduce((sum, c) => sum + Number(c.amount), 0);
      return {
        id: r.id,
        referrerName: r.referrer ? `${r.referrer.firstName} ${r.referrer.lastName}`.trim() : "Unknown",
        referrerEmail: r.referrer?.email || "Unknown",
        referrerCode: r.referrer?.referralCode || "N/A",
        refereeName: refUser ? `${refUser.firstName} ${refUser.lastName}`.trim() : "Unknown User",
        refereeEmail: refUser?.email || "Unknown",
        refereePhone: refUser?.phone || "N/A",
        commissionsEarned,
        joinedAt: r.createdAt
      };
    });

    // 5. Fetch Global Settings
    const dbSettings = await prisma.globalSetting.findMany({
      where: { key: { in: Object.keys(DEFAULT_SETTINGS) } }
    });

    const settings = { ...DEFAULT_SETTINGS };
    dbSettings.forEach(s => {
      if (s.key in settings) {
        settings[s.key as keyof typeof settings] = s.value;
      }
    });

    // 6. Global Stats Aggregation
    const totalPaidData = await prisma.referralWithdrawal.aggregate({ where: { status: "PAID" }, _sum: { amount: true } });
    const totalPendingData = await prisma.referralWithdrawal.aggregate({ where: { status: "PENDING" }, _sum: { amount: true } });

    return NextResponse.json({
      success: true, 
      pendingWithdrawals, 
      topReferrers, 
      enrolledUsers,
      referralPairs,
      settings: {
        REFERRAL_ACTIVE: settings.REFERRAL_ACTIVE === 'true',
        REFERRAL_DISCOUNT_PCT: Number(settings.REFERRAL_DISCOUNT_PCT),
        REFERRAL_MIN_WITHDRAWAL: Number(settings.REFERRAL_MIN_WITHDRAWAL),
        REF_REWARD_CAC_BIZ: Number(settings.REF_REWARD_CAC_BIZ),
        REF_REWARD_CAC_LLC: Number(settings.REF_REWARD_CAC_LLC),
        REF_REWARD_SCUML: Number(settings.REF_REWARD_SCUML),
        REF_REWARD_TAX_ID: Number(settings.REF_REWARD_TAX_ID),
        REF_REWARD_NIN: Number(settings.REF_REWARD_NIN),
        REF_REWARD_NIN_VAL: Number(settings.REF_REWARD_NIN_VAL),
        REF_REWARD_NIN_MOD: Number(settings.REF_REWARD_NIN_MOD),
        REF_REWARD_NIN_PERSONALIZATION: Number(settings.REF_REWARD_NIN_PERSONALIZATION),
        REF_REWARD_NIN_IPE: Number(settings.REF_REWARD_NIN_IPE),
        REF_REWARD_BVN_SLIP: Number(settings.REF_REWARD_BVN_SLIP),
        REF_REWARD_BVN_RETRIEVAL: Number(settings.REF_REWARD_BVN_RETRIEVAL),
      },
      stats: {
        totalEnrolled: enrolledUsers.length,
        totalInvited: referralPairs.length,
        totalPaid: Number(totalPaidData._sum.amount || 0), 
        totalPending: Number(totalPendingData._sum.amount || 0)
      }
    });
  } catch (error) {
    console.error("Fetch MDS Referrals Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
