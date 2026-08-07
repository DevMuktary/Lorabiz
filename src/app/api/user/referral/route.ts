import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// =========================================================================
// GET: Fetch Referral Dashboard Stats & Details
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
        referralsGiven: true,
        withdrawals: true,
      }
    });

    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    // Calculate Stats
    const totalSignups = user.referralsGiven.length;
    const pendingReferrals = user.referralsGiven.filter(r => r.status === "PENDING").length;
    const earnedReferrals = user.referralsGiven.filter(r => r.status === "EARNED").length;
    const totalWithdrawn = user.withdrawals
      .filter(w => w.status === "PAID")
      .reduce((sum, w) => sum + Number(w.amount), 0);

    // Fetch the Global Settings so users know the current parameters
    const thresholdSetting = await prisma.globalSetting.findUnique({ where: { key: 'REFERRAL_SPEND_THRESHOLD' } });
    const rewardSetting = await prisma.globalSetting.findUnique({ where: { key: 'REFERRAL_REWARD_AMOUNT' } });
    const minWithSetting = await prisma.globalSetting.findUnique({ where: { key: 'REFERRAL_MIN_WITHDRAWAL' } });

    return NextResponse.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralBalance: Number(user.referralBalance),
        totalSignups,
        pendingReferrals,
        earnedReferrals,
        totalWithdrawn,
        spendThreshold: thresholdSetting ? Number(thresholdSetting.value) : 5000,
        rewardAmount: rewardSetting ? Number(rewardSetting.value) : 1000,
        minWithdrawal: minWithSetting ? Number(minWithSetting.value) : 2000,
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

    // 2. Strict Name Matching Validation (With aggressive trimming for safety)
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
