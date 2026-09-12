import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { logUserActivity } from "@/lib/activity-logger";

// GET: Check Airtime service availability / kill switch status
export async function GET() {
  try {
    const pricing = await prisma.servicePricing.findUnique({
      where: { serviceKey: "UTILITY_AIRTIME" }
    });

    return NextResponse.json({
      success: true,
      isActive: pricing ? pricing.isActive : true,
      maintenanceMsg: pricing?.maintenanceMsg || null,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      isActive: true,
      maintenanceMsg: null,
    });
  }
}

export async function POST(req: Request) {
  try {
    // 0. Check Master Service Kill Switch
    const airtimePricing = await prisma.servicePricing.findUnique({
      where: { serviceKey: "UTILITY_AIRTIME" }
    });

    if (airtimePricing && !airtimePricing.isActive) {
      return NextResponse.json({
        success: false,
        isMaintenance: true,
        message: airtimePricing.maintenanceMsg || "Airtime vending is temporarily disabled for carrier maintenance. Please try again later."
      }, { status: 503 });
    }

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

      if (rewardCredit && numAmount >= Number(rewardCredit.value)) {
        discountAmount = Number(rewardCredit.value);
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
      let isJsonPayload = true;
      try {
        externalData = JSON.parse(rawText);
      } catch (e) {
        isJsonPayload = false;
        console.error("Provider returned non-JSON payload:", rawText);
        externalData = { status: "pending", message: rawText };
      }

      const statusStr = String(externalData.status ?? "").trim().toLowerCase();
      const textStatusStr = String(externalData.text_status ?? "").trim().toLowerCase();
      const code = externalData.status_code || externalData.code;

      const isSuccess = 
        statusStr === "success" || 
        statusStr === "1" || 
        externalData.status === true || 
        externalData.success === true ||
        textStatusStr === "completed" ||
        code === 200;

      const isPending =
        statusStr === "pending" ||
        statusStr === "processing" ||
        statusStr === "queued" ||
        statusStr === "order_received" ||
        textStatusStr === "pending" ||
        textStatusStr === "processing" ||
        !isJsonPayload;

      const isExplicitFailure =
        !isPending &&
        (statusStr === "failed" ||
          statusStr === "fail" ||
          statusStr === "0" ||
          textStatusStr === "failed" ||
          textStatusStr === "cancelled" ||
          textStatusStr === "reversed");

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
          message: externalData.server_message || externalData.data?.true_response || "Airtime Sent Successfully",
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
      } else if (isPending) {
        // Carrier / Provider is actively processing or order is queued.
        // DO NOT refund the wallet immediately to prevent unauthorized double-spending exploit!
        await prisma.transaction.update({
          where: { id: debitResult.txRecord.id },
          data: {
            status: "PENDING",
            description: `Airtime Recharge Processing - ${cleanPhone} (${network.toUpperCase()})`
          }
        }).catch(() => {});

        logUserActivity({
          userId: user.id,
          action: "AIRTIME_VEND_QUEUED",
          category: "SERVICES",
          description: `Airtime recharge queued for ${cleanPhone} (${network.toUpperCase()})`,
          status: "PENDING",
          referenceId: reference,
          metadata: {
            amount: numAmount,
            paid: payableAmount,
            phone: cleanPhone,
            network: network.toUpperCase(),
          },
        });

        return NextResponse.json({
          success: true,
          status: "PENDING",
          message: externalData.server_message || externalData.data?.true_response || "Recharge request has been submitted to the carrier and is currently processing.",
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
            status: "PENDING",
          }
        });
      } else if (isExplicitFailure) {
        // Upstream explicitly rejected transaction -> Safe to refund payableAmount to wallet
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
          : "Provider confirmed airtime recharge could not be fulfilled. Your wallet has been refunded.";

        return NextResponse.json({
          success: false,
          message: serverMessage,
          refunded: true,
          newBalance: Number(user.wallet.balance)
        }, { status: 400 });
      } else {
        // Ambiguous upstream response -> Retain funds in PENDING state awaiting reconciliation
        await prisma.transaction.update({
          where: { id: debitResult.txRecord.id },
          data: {
            status: "PENDING",
            description: `Airtime Recharge In-Review - ${cleanPhone} (${network.toUpperCase()})`
          }
        }).catch(() => {});

        return NextResponse.json({
          success: false,
          status: "PENDING",
          message: "Transaction received and awaiting carrier confirmation. Funds have been held pending final status.",
          reference,
          newBalance: debitResult.balanceAfter
        }, { status: 202 });
      }
    } catch (providerErr) {
      console.error("Provider Network Failure during airtime vending:", providerErr);

      // SECURITY CRITICAL: Do NOT automatically refund wallet on network timeouts.
      // The upstream telco provider may have already processed or enqueued the transaction.
      // Keep transaction as PENDING so funds are safely held until confirmed.
      await prisma.transaction.update({
        where: { id: debitResult.txRecord.id },
        data: {
          status: "PENDING",
          description: `Airtime Recharge Awaiting Confirmation (Network Timeout) - ${cleanPhone} (${network.toUpperCase()})`
        }
      }).catch(() => {});

      logUserActivity({
        userId: user.id,
        action: "AIRTIME_VEND_DELAYED",
        category: "SERVICES",
        description: `Airtime recharge timed out awaiting carrier response for ${cleanPhone} (${network.toUpperCase()})`,
        status: "PENDING",
        referenceId: reference,
      });

      return NextResponse.json({
        success: false,
        status: "PENDING",
        pendingVerification: true,
        message: "Network delay contacting the telecom carrier. Your request is queued and funds have been reserved. If carrier fulfillment fails, your wallet will be refunded following reconciliation.",
        reference,
        newBalance: debitResult.balanceAfter
      }, { status: 202 });
    }

  } catch (error: any) {
    console.error("Airtime Purchase Exception:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to process airtime recharge" 
    }, { status: 500 });
  }
}
