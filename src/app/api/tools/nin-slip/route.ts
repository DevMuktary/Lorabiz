import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized access. Please log in." }, { status: 401 });
    }

    const { identifier, searchType, slipType, attestationsAccepted } = await req.json();

    if (!identifier || !/^\d{11}$/.test(identifier)) {
      return NextResponse.json({ success: false, message: `Please provide a valid 11-digit ${searchType === "PHONE" ? "Phone Number" : "NIN"}.` }, { status: 400 });
    }

    const validTypes = ["nin_premium", "nin_standard", "nin_regular"];
    if (!slipType || !validTypes.includes(slipType)) {
      return NextResponse.json({ success: false, message: "Invalid slip type selected." }, { status: 400 });
    }

    if (!attestationsAccepted) {
      return NextResponse.json({ success: false, message: "You must accept the legal statutory disclaimers to proceed." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, message: "User wallet not found." }, { status: 404 });
    }

    // 🚨 NEW: Map to the Unified ServicePricing Table
    const dbKeyMap: Record<string, string> = {
      "nin_regular": "NIN_REGULAR",
      "nin_standard": "NIN_STANDARD",
      "nin_premium": "NIN_PREMIUM"
    };
    
    const serviceKey = dbKeyMap[slipType];

    const pricing = await prisma.servicePricing.findUnique({
      where: { serviceKey }
    });

    if (!pricing) {
      return NextResponse.json({ success: false, message: "Selected slip service is currently unavailable." }, { status: 400 });
    }

    const currentBalance = Number(user.wallet.balance);
    const requiredAmount = Number(pricing.price);

    if (currentBalance < requiredAmount) {
      return NextResponse.json({ 
        success: false, 
        message: `Insufficient wallet balance. You need ₦${requiredAmount.toLocaleString()} but your balance is ₦${currentBalance.toLocaleString()}. Please fund your wallet.` 
      }, { status: 402 }); 
    }

    const apiKey = process.env.DATAVERIFY_API_KEY;
    if (!apiKey) {
      console.error("❌ DataVerify API Key missing from environment variables.");
      return NextResponse.json({ success: false, message: "Server configuration error. Please contact technical support." }, { status: 500 });
    }

    // Determine endpoint
    const endpointFile = searchType === "PHONE" ? `${slipType}_phone.php` : `${slipType}.php`;
    const url = `https://dataverify.com.ng/developers/nin_slips/${endpointFile}`;

    const requestBody = {
      api_key: apiKey,
      nin: identifier,
      phone: identifier 
    };

    const apiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok || data.status !== "success" || !data.pdf_base64) {
      return NextResponse.json({ 
        success: false, 
        message: data.message || `Could not retrieve slip via ${searchType === "PHONE" ? "Phone Number" : "NIN"}. Please verify and try again.` 
      }, { status: 422 });
    }

    const dataUri = `data:application/pdf;base64,${data.pdf_base64}`;
    let securePdfUrl: string | null = null;

    try {
      const uploadResult = await cloudinary.uploader.upload(dataUri, {
        folder: "lumebiz_nin_slips",
        resource_type: "auto",
      });
      securePdfUrl = uploadResult.secure_url;
    } catch (cloudErr) {
      console.error("❌ Cloudinary PDF Upload Warning:", cloudErr);
    }

    const maskedIdentifier = `${identifier.slice(0, 3)}*****${identifier.slice(-3)}`;
    const referencePrefix = searchType === "PHONE" ? "TEL" : "NIN";
    const reference = `${referencePrefix}_${slipType.toUpperCase()}_${Date.now()}`;
    const newBalance = currentBalance - requiredAmount;

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: newBalance }
      });

      await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: requiredAmount,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          type: "DEBIT",
          status: "SUCCESS",
          reference: reference,
          description: `NIMC Slip Printing (${pricing.title}) - ${maskedIdentifier}`
        }
      });

      await tx.ninRequestLog.create({
        data: {
          userId: user.id,
          ninMasked: maskedIdentifier,
          slipType: slipType,
          amountCharged: requiredAmount,
          status: "SUCCESS",
          reference: reference,
          pdfUrl: securePdfUrl 
        }
      });

      // --- NEW: REFERRAL SPEND TRACKING (NIN SLIP WALLET DEDUCTION) ---
      const updatedSpender = await tx.user.update({
        where: { id: user.id },
        data: { totalSpent: { increment: requiredAmount } }
      });

      const thresholdSetting = await tx.globalSetting.findUnique({ 
        where: { key: 'REFERRAL_SPEND_THRESHOLD' } 
      });
      const thresholdAmount = thresholdSetting ? Number(thresholdSetting.value) : 5000;

      if (Number(updatedSpender.totalSpent) >= thresholdAmount) {
        const pendingReferral = await tx.referral.findUnique({
          where: { referredUserId: user.id }
        });

        if (pendingReferral && pendingReferral.status === "PENDING") {
          await tx.referral.update({
            where: { id: pendingReferral.id },
            data: { status: "EARNED" }
          });

          await tx.user.update({
            where: { id: pendingReferral.referrerId },
            data: { referralBalance: { increment: pendingReferral.rewardAmount } }
          });
        }
      }
      // --------------------------------------------------------
    });

    return NextResponse.json({
      success: true,
      pdfBase64: data.pdf_base64,
      pdfUrl: securePdfUrl
    });

  } catch (error: any) {
    console.error("❌ NIN Slip API Error:", error);
    return NextResponse.json({ success: false, message: "An unexpected server error occurred." }, { status: 500 });
  }
}
