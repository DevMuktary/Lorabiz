import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // 1. Authentication Guard
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized access. Please log in." }, { status: 401 });
    }

    const { nin, slipType, attestationsAccepted } = await req.json();

    // 2. Input & Legal Attestation Validation
    if (!nin || !/^\d{11}$/.test(nin)) {
      return NextResponse.json({ success: false, message: "Please provide a valid 11-digit NIN." }, { status: 400 });
    }

    const validTypes = ["nin_premium", "nin_standard", "nin_regular"];
    if (!slipType || !validTypes.includes(slipType)) {
      return NextResponse.json({ success: false, message: "Invalid slip type selected." }, { status: 400 });
    }

    if (!attestationsAccepted) {
      return NextResponse.json({ success: false, message: "You must accept the legal statutory disclaimers to proceed." }, { status: 400 });
    }

    // 3. Retrieve User & Check Wallet Balance
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, message: "User wallet not found." }, { status: 404 });
    }

    // Lookup dynamic pricing for selected slip variant
    const pricing = await prisma.ninSlipPricing.findUnique({
      where: { slipType }
    });

    if (!pricing || !pricing.isActive) {
      return NextResponse.json({ success: false, message: "Selected slip service is currently unavailable." }, { status: 400 });
    }

    const currentBalance = Number(user.wallet.balance);
    const requiredAmount = Number(pricing.price);

    if (currentBalance < requiredAmount) {
      return NextResponse.json({ 
        success: false, 
        message: `Insufficient wallet balance. You need ₦${requiredAmount.toLocaleString()} but your balance is ₦${currentBalance.toLocaleString()}. Please fund your wallet.` 
      }, { status: 402 }); // 402 Payment Required
    }

    // 4. Verify API Key Configuration
    const apiKey = process.env.DATAVERIFY_API_KEY;
    if (!apiKey) {
      console.error("❌ DataVerify API Key missing from environment variables.");
      return NextResponse.json({ success: false, message: "Server configuration error. Please contact technical support." }, { status: 500 });
    }

    // 5. Connect to Third-Party Provider (DataVerify)
    const url = `https://dataverify.com.ng/developers/nin_slips/${slipType}.php`;

    const apiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        nin: nin,
      }),
    });

    const data = await apiResponse.json();

    // If external lookup fails, abort immediately without charging the user
    if (!apiResponse.ok || data.status !== "success" || !data.pdf_base64) {
      return NextResponse.json({ 
        success: false, 
        message: data.message || "Could not retrieve slip. Please verify the NIN and try again." 
      }, { status: 422 });
    }

    // 6. Atomic Transaction: Debit Wallet + Create Ledger Record + Log NIN Request
    const maskedNin = `${nin.slice(0, 3)}*****${nin.slice(-3)}`;
    const reference = `NIN_${slipType.toUpperCase()}_${Date.now()}`;
    const newBalance = currentBalance - requiredAmount;

    await prisma.$transaction(async (tx) => {
      // Deduct wallet balance
      await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: newBalance }
      });

      // Record wallet transaction history
      await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: requiredAmount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          type: "DEBIT",
          status: "SUCCESS",
          reference: reference,
          description: `NIMC Slip Printing (${pricing.displayName}) - ${maskedNin}`
        }
      });

      // Log verification audit trail
      await tx.ninRequestLog.create({
        data: {
          userId: user.id,
          ninMasked: maskedNin,
          slipType: slipType,
          amountCharged: requiredAmount,
          status: "SUCCESS",
          reference: reference
        }
      });
    });

    // 7. Return PDF document payload to client
    return NextResponse.json({
      success: true,
      pdfBase64: data.pdf_base64
    });

  } catch (error: any) {
    console.error("❌ NIN Slip API Error:", error);
    return NextResponse.json({ success: false, message: "An unexpected server error occurred." }, { status: 500 });
  }
}
