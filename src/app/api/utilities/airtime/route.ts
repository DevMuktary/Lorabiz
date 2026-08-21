import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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
    const { network, phone, amount } = await req.json();
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

    // 4. Verify Initial Wallet Balance
    if (Number(user.wallet.balance) < numAmount) {
      return NextResponse.json({ success: false, message: "Insufficient wallet balance. Please fund your wallet." }, { status: 400 });
    }

    // 5. Map Network to CheapDataSales Product Codes
    const productCodes: Record<string, string> = {
      "MTN": "mtn_custom",
      "GLO": "glo_custom",
      "AIRTEL": "airtel_custom",
      "9MOBILE": "9mobile_custom"
    };

    const productCode = productCodes[network.toUpperCase()];
    if (!productCode) {
      return NextResponse.json({ success: false, message: "Invalid network provider." }, { status: 400 });
    }

    // 6. Generate Clean Generic Idempotency Reference
    const reference = `ref_${Date.now()}_${Math.floor(100000 + Math.random() * 900000)}`;

    // 7. Atomic Wallet Debit (Guards against double-spend)
    const debitResult = await prisma.$transaction(async (tx) => {
      const currentWallet = await tx.wallet.findUnique({ where: { id: user.wallet!.id } });
      if (!currentWallet || Number(currentWallet.balance) < numAmount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const balanceBefore = Number(currentWallet.balance);
      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: { decrement: numAmount } }
      });
      const balanceAfter = Number(updatedWallet.balance);

      const txRecord = await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: numAmount,
          balanceBefore,
          balanceAfter,
          type: "DEBIT",
          status: "SUCCESS",
          reference,
          description: `Airtime Recharge - ${cleanPhone} (${network.toUpperCase()})`,
          serviceCategory: "AIRTIME"
        }
      });

      return { balanceAfter, txRecord };
    });

    // 8. Call Telecom Upstream Provider API
    try {
      const externalRes = await fetch("https://cheapdatasales.com/autobiz_vending_index.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.CHEAPDATASALES_API_KEY || ""}`
        },
        body: JSON.stringify({
          amount: numAmount,
          product_code: productCode,
          phone_number: cleanPhone,
          action: "vend",
          user_reference: reference
        })
      });

      const externalData = await externalRes.json().catch(() => ({}));
      const isSuccess = 
        externalData.status === true || 
        externalData.status === "success" || 
        externalData.status === 1 || 
        externalData.status === "1" || 
        externalData.success === true ||
        externalData.status_code === 200 ||
        externalData.code === 200;

      if (isSuccess) {
        return NextResponse.json({
          success: true,
          message: "Airtime vending successful.",
          reference,
          amount: numAmount,
          phone: cleanPhone,
          network: network.toUpperCase(),
          newBalance: debitResult.balanceAfter,
          data: externalData.data || {}
        });
      } else {
        // Upstream failed -> Reverse debit immediately
        await prisma.$transaction(async (tx) => {
          const w = await tx.wallet.update({
            where: { id: user.wallet!.id },
            data: { balance: { increment: numAmount } }
          });
          await tx.transaction.create({
            data: {
              walletId: user.wallet!.id,
              amount: numAmount,
              balanceBefore: Number(w.balance) - numAmount,
              balanceAfter: Number(w.balance),
              type: "REFUND",
              status: "SUCCESS",
              reference: `REF_${reference}`,
              description: `Airtime Recharge Reversal - ${cleanPhone} (${network.toUpperCase()})`,
              serviceCategory: "AIRTIME"
            }
          });
        });

        const rawMsg = externalData.server_message || externalData.message || externalData.error || externalData.msg;
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
      // Reverse debit on network blip to protect user funds
      await prisma.$transaction(async (tx) => {
        const w = await tx.wallet.update({
          where: { id: user.wallet!.id },
          data: { balance: { increment: numAmount } }
        });
        await tx.transaction.create({
          data: {
            walletId: user.wallet!.id,
            amount: numAmount,
            balanceBefore: Number(w.balance) - numAmount,
            balanceAfter: Number(w.balance),
            type: "REFUND",
            status: "SUCCESS",
            reference: `REF_${reference}`,
            description: `Airtime Recharge Reversal (Network timeout) - ${cleanPhone}`,
            serviceCategory: "AIRTIME"
          }
        });
      });

      return NextResponse.json({
        success: false,
        message: "Provider network timeout. Your wallet has been refunded. Please try again.",
        refunded: true,
        newBalance: Number(user.wallet.balance)
      }, { status: 502 });
    }

  } catch (error: any) {
    if (error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ success: false, message: "Insufficient wallet balance. Please fund your wallet." }, { status: 400 });
    }
    console.error("Airtime Vending Error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "An unexpected error occurred. Please try again."
    }, { status: 500 });
  }
}
