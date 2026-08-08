import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// =========================================================================
// GET: Fetch Referral Dashboard Stats, Ledger & Rates
// =========================================================================
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        withdrawals: true,
      }
    });

    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    // 1. Fetch all their referrals and related ledger commissions
    const referrals = await prisma.referral.findMany({
      where: { referrerId: user.id },
      include: { commissions: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch the actual user details of the people they referred
    const referredUserIds = referrals.map(r => r.referredUserId);
    const referredUsers = await prisma.user.findMany({
      where: { id: { in: referredUserIds } },
      select: { id: true, firstName: true, lastName: true, email: true, createdAt: true }
    });

    // 3. Build the "My Referees" List
    const refereesList = referrals.map(ref => {
      const rUser = referredUsers.find(u => u.id === ref.referredUserId);
      const totalEarnedFromThisUser = ref.commissions.reduce((sum, c) => sum + Number(c.amount), 0);
      return {
        id: ref.id,
        name: rUser ? `${rUser.firstName} ${rUser.lastName}` : "Unknown User",
        email: rUser?.email || "Hidden",
        joinedAt: rUser?.createdAt,
        totalEarned: totalEarnedFromThisUser
      };
    });

    // 4. Build the Flattened "Earnings Ledger"
    const earningsHistory = referrals.flatMap(ref =>
      ref.commissions.map(c => {
         const rUser = referredUsers.find(u => u.id === ref.referredUserId);
         return {
            id: c.id,
            serviceType: c.serviceType,
            amount: Number(c.amount),
            date: c.createdAt,
            refereeName: rUser ? `${rUser.firstName} ${rUser.lastName}` : "Unknown"
         }
      })
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 5. Fetch dynamic admin pricing for the Transparency Table
    const settings = await prisma.globalSetting.findMany({
      where: {
        key: { in: ['REF_REWARD_CAC_BIZ', 'REF_REWARD_CAC_LLC', 'REF_REWARD_SCUML', 'REF_REWARD_TAX_ID', 'REF_REWARD_NIN', 'REFERRAL_MIN_WITHDRAWAL'] }
      }
    });
    
    const getSetting = (key: string, fallback: number) => {
      const found = settings.find(s => s.key === key);
      return found ? Number(found.value) : fallback;
    };

    const totalWithdrawn = user.withdrawals
      .filter(w => w.status === "PAID")
      .reduce((sum, w) => sum + Number(w.amount), 0);

    return NextResponse.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralBalance: Number(user.referralBalance),
        totalSignups: referrals.length,
        totalEarnedAllTime: earningsHistory.reduce((sum, e) => sum + e.amount, 0),
        totalWithdrawn,
        refereesList,
        earningsHistory,
        rewardRates: {
          cacBiz: getSetting('REF_REWARD_CAC_BIZ', 1000),
          cacLlc: getSetting('REF_REWARD_CAC_LLC', 1500),
          scuml: getSetting('REF_REWARD_SCUML', 500),
          taxId: getSetting('REF_REWARD_TAX_ID', 200),
          nin: getSetting('REF_REWARD_NIN', 10),
        },
        minWithdrawal: getSetting('REFERRAL_MIN_WITHDRAWAL', 2000),
        bankDetails: user.payoutAccountNo ? {
          bankName: user.payoutBankName,
          accountNo: user.payoutAccountNo,
          accountName: user.payoutAccountName
        } : null
      }
    });
  } catch (error) {
    console.error("Referral Stats Fetch Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

// =========================================================================
// POST: Enroll in Program & Validate Bank Details via Paystack
// =========================================================================
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bankCode, bankName, accountNumber, acceptTerms } = body;

    if (!acceptTerms) {
      return NextResponse.json({ success: false, message: "You must accept the Referral Terms and Conditions." }, { status: 400 });
    }

    if (!bankCode || !bankName || !accountNumber || accountNumber.length !== 10) {
      return NextResponse.json({ success: false, message: "Invalid bank details provided." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });

    // 1. Paystack Account Resolution
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error("❌ Paystack Secret Key missing.");
      return NextResponse.json({ success: false, message: "Payment gateway error." }, { status: 500 });
    }

    const paystackRes = await fetch(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
      headers: { Authorization: `Bearer ${secretKey}` }
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      return NextResponse.json({ 
        success: false, 
        message: paystackData.message || "Could not verify this account number with the selected bank." 
      }, { status: 400 });
    }

    // 2. Strict Name Matching Validation
    const resolvedName = paystackData.data.account_name.toLowerCase();
    const userFirstName = (user.firstName || "").toLowerCase().trim();
    const userLastName = (user.lastName || "").toLowerCase().trim();

    if (!resolvedName.includes(userFirstName) || !resolvedName.includes(userLastName)) {
      return NextResponse.json({ 
        success: false, 
        message: `Verification Failed: The bank account name (${paystackData.data.account_name}) must match your registered LoraBiz name (${user.firstName?.trim()} ${user.lastName?.trim()}).` 
      }, { status: 400 });
    }

    // 3. Generate Code (Only if they don't already have one)
    let newReferralCode = user.referralCode;
    if (!newReferralCode) {
      const cleanFirstName = userFirstName.replace(/[^a-z0-9]/g, '');
      newReferralCode = `lora-${cleanFirstName}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // 4. Update User Profile
    await prisma.user.update({
      where: { id: user.id },
      data: {
        referralCode: newReferralCode,
        payoutBankCode: bankCode,
        payoutBankName: bankName,
        payoutAccountNo: accountNumber,
        payoutAccountName: paystackData.data.account_name
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Bank details verified and referral account activated!",
      referralCode: newReferralCode,
      accountName: paystackData.data.account_name
    });

  } catch (error) {
    console.error("Bank Verification Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error during verification." }, { status: 500 });
  }
}
