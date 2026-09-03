import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { logUserActivity } from "@/lib/activity-logger";

export async function POST(req: Request) {
  try {
    // 1. Authenticate the User Securely
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized. Please log in." }, { status: 401 });
    }

    // 2. Fetch User and Wallet from Database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, message: "Wallet not found. Please contact support." }, { status: 400 });
    }

    // 3. Parse and Validate Payload
    const { network, phone, amount, useRewardCredit } = await req.json();
    const numAmount = Number(amount);

    if (!network || !phone || !numAmount || numAmount < 50) {
      return NextResponse.json({ success: false, message: "Invalid parameters. Minimum airtime amount is ₦50." }, { status: 400 });
    }

    if (numAmount > 10000) {
      return NextResponse.json({ success: false, message: "Maximum airtime amount per transaction is ₦10,000." }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\s+/g, "").replace(/^\+234/, "0");
    if (cleanPhone.length !== 11 || !/^\d{11}$/.test(cleanPhone)) {
      return NextResponse.json({ success: false, message: "Phone number must be exactly 11 digits." }, { status: 400 });
    }

    // 4. Check for and apply user's active Airtime Reward Discount
    let discountAmount = 0;
    let appliedCreditId: string | null = null;

    if (useRewardCredit) {
      const rewardCredit = await prisma.userRewardCredit.findFirst({
        where: {
          userId: user.id,
          rewardType: "AIRTIME",
          status: "ACTIVE",
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        orderBy: { createdAt: "asc" }
      });

      if (rewardCredit) {
        discountAmount = Math.min(numAmount, Number(rewardCredit.value));
        appliedCreditId = rewardCredit.id;
      }
    }

    const payableAmount = Math.max(0, numAmount - discountAmount);

    // 5. Verify Wallet Balance for the payable amount
    if (Number(user.wallet.balance) < payableAmount) {
      return NextResponse.json({ 
        success: false, 
        message: `Insufficient wallet balance. You need ₦${payableAmount.toLocaleString()} to complete this purchase.` 
      }, { status: 400 });
    }

    // 6. Map Network to CheapDataSales Product Codes
    const productCodes: Record<string, string> = {
      "MTN": "mtn_custom",
      "GLO": "glo_custom",
      "AIRTEL": "airtel_custom",
      "9MOBILE": "9mobile_custom",
      "ETISALAT": "9mobile_custom"
    };

    const productCode = productCodes[network.toUpperCase()];
    if (!productCode) {
      return NextResponse.json({ success: false, message: "Invalid network provider." }, { status: 400 });
    }

    // 7. Generate Clean Generic Idempotency Reference
    const reference = `ref_${Date.now()}_${Math.floor(100000 + Math.random() * 900000)}`;

    // 8. Atomic Wallet Debit (Guards against double-spend)
    const debitResult = await prisma.$transaction(async (tx) => {
      const currentWallet = await tx.wallet.findUnique({ where: { id: user.wallet!.id } });
      if (!currentWallet || Number(currentWallet.balance) < payableAmount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const balanceBefore = Number(currentWallet.balance);
      let balanceAfter = balanceBefore;

      if (payableAmount > 0) {
        const updatedWallet = await tx.wallet.update({
          where: { id: user.wallet!.id },
          data: { balance: { decrement: payableAmount } }
        });
        balanceAfter = Number(updatedWallet.balance);
      }

      // Mark the Airtime reward credit as REDEEMED if applied
      if (appliedCreditId) {
        await tx.userRewardCredit.update({
          where: { id: appliedCreditId },
          data: {
            status: "REDEEMED",
            redeemedAt: new Date(),
            usedForServiceRef: reference
          }
        });
      }

      const txRecord = await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: payableAmount,
          balanceBefore,
          balanceAfter,
          type: "DEBIT",
          status: "SUCCESS",
          reference,
          description: discountAmount > 0 
            ? `Airtime Recharge - ${cleanPhone} (${network.toUpperCase()}) [₦${discountAmount} Reward Applied]`
            : `Airtime Recharge - ${cleanPhone} (${network.toUpperCase()})`,
          serviceCategory: "AIRTIME"
        }
      });

      return { balanceAfter, txRecord };
    });

    // 9. Call Telecom Upstream Provider API with the FULL requested amount
    const apiKey = process.env.CHEAPDATA_API_KEY || process.env.CHEAPDATASALES_API_KEY || "";
    if (!apiKey) {
      console.error("CRITICAL: CHEAPDATA_API_KEY / CHEAPDATASALES_API_KEY is missing in environment.");
    }

    const payload = {
      amount: numAmount,
      product_code: productCode,
      phone_number: cleanPhone,
      action: "vend",
      user_reference: reference,
      bypass_network: "yes",
    };

    try {
      const externalRes = await fetch("https://cheapdatasales.com/autobiz_vending_index.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const rawText = await externalRes.text();
      let externalData: any = {};
      try {
        externalData = JSON.parse(rawText);
      } catch (e) {
        console.error("Provider returned non-JSON payload:", rawText);
        externalData = { status: "failed", message: rawText };
      }

      const isSuccess = 
        externalData.status === "success" || 
        externalData.status === 1 || 
        externalData.status === "1" || 
        externalData.success === true ||
        externalData.status_code === 200 ||
        externalData.code === 200;

      if (isSuccess) {
        logUserActivity({
          userId: user.id,
          action: "AIRTIME_VENDED",
          category: "SERVICES",
          description: `Purchased ₦${numAmount.toLocaleString()} ${network.toUpperCase()} airtime for ${cleanPhone}${discountAmount > 0 ? ` (₦${discountAmount} discount applied)` : ""}`,
          status: "SUCCESS",
          referenceId: reference,
          metadata: {
            amount: numAmount,
            paid: payableAmount,
            discount: discountAmount,
            phone: cleanPhone,
            network: network.toUpperCase(),
          },
        });

        return NextResponse.json({
          success: true,
          message: externalData.server_message || "Airtime Sent Successfully",
          reference,
          amount: numAmount,
          paid: payableAmount,
          discount: discountAmount,
          phone: cleanPhone,
          network: network.toUpperCase(),
          newBalance: debitResult.balanceAfter,
          data: {
            network: network.toUpperCase(),
            amount: numAmount,
            phone: cleanPhone,
            provider_ref: externalData.data?.recharge_id,
            balance_after: externalData.data?.after_balance,
          }
        });
      } else {
        // Upstream failed -> Refund payableAmount to wallet and restore reward voucher
        if (payableAmount > 0) {
          await prisma.wallet.update({
            where: { id: user.wallet!.id },
            data: { balance: { increment: payableAmount } }
          }).catch(() => {});
        }

        await prisma.transaction.update({
          where: { id: debitResult.txRecord.id },
          data: {
            status: "FAILED",
            description: `Airtime Recharge Failed (Refunded) - ${cleanPhone} (${network.toUpperCase()})`
          }
        }).catch(() => {});

        if (appliedCreditId) {
          await prisma.userRewardCredit.update({
            where: { id: appliedCreditId },
            data: {
              status: "ACTIVE",
              redeemedAt: null,
              usedForServiceRef: null
            }
          }).catch(() => {});
        }

        const rawMsg = externalData.server_message || externalData.data?.true_response || externalData.message || externalData.error || externalData.msg;
        const serverMessage = rawMsg 
          ? `Provider error: ${rawMsg}. Your wallet has been refunded.`
          : "Provider failed to process airtime recharge. Your wallet has been refunded.";

        return NextResponse.json({
          success: false,
          message: serverMessage,
          refunded: true,
          newBalance: Number(user.wallet.balance)
        }, { status: 400 });
      }
    } catch (providerErr) {
      console.error("Provider Network Failure, reversing debit:", providerErr);

      if (payableAmount > 0) {
        await prisma.wallet.update({
          where: { id: user.wallet!.id },
          data: { balance: { increment: payableAmount } }
        }).catch(() => {});
      }

      await prisma.transaction.update({
        where: { id: debitResult.txRecord.id },
        data: {
          status: "FAILED",
          description: `Airtime Recharge Timed Out (Refunded) - ${cleanPhone} (${network.toUpperCase()})`
        }
      }).catch(() => {});

      if (appliedCreditId) {
        await prisma.userRewardCredit.update({
          where: { id: appliedCreditId },
          data: {
            status: "ACTIVE",
            redeemedAt: null,
            usedForServiceRef: null
          }
        }).catch(() => {});
      }

      return NextResponse.json({
        success: false,
        message: "Network issue contacting telecommunication carrier. Your wallet has been refunded.",
        refunded: true,
        newBalance: Number(user.wallet.balance)
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Airtime Purchase Exception:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to process airtime recharge" 
    }, { status: 500 });
  }
}
