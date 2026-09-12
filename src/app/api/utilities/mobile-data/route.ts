import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ensureDataPlansSeeded } from "@/lib/data-plans-seed";
import { logUserActivity } from "@/lib/activity-logger";

// GET: Fetch all active data plans for public user UI
export async function GET(req: Request) {
  try {
    // 1. Auto-seed if database is empty or missing plans
    await ensureDataPlansSeeded(prisma);

    // 2. Fetch all active plans
    const activePlans = await prisma.mobileDataPlan.findMany({
      where: { isActive: true },
      orderBy: [
        { network: "asc" },
        { category: "asc" },
        { price: "asc" },
      ],
    });

    // 3. Group by network
    const grouped: Record<string, typeof activePlans> = {
      MTN: [],
      AIRTEL: [],
      GLO: [],
      "9MOBILE": [],
    };

    for (const plan of activePlans) {
      const net = plan.network.toUpperCase();
      if (grouped[net]) {
        grouped[net].push(plan);
      } else {
        grouped[net] = [plan];
      }
    }

    return NextResponse.json({
      success: true,
      plans: activePlans,
      grouped: grouped,
    });
  } catch (error: any) {
    console.error("Fetch Data Plans Error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to load data plans.",
    }, { status: 500 });
  }
}

// POST: Vend mobile data plan
export async function POST(req: Request) {
  try {
    // 1. Authenticate the User Securely
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized. Please log in." }, { status: 401 });
    }

    // 2. Fetch User and Wallet
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, message: "Wallet not found. Please contact support." }, { status: 400 });
    }

    // 3. Parse and Validate Payload
    const { planId, phone } = await req.json();

    if (!planId || !phone) {
      return NextResponse.json({ success: false, message: "Plan ID and phone number are required." }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\s+/g, "").replace(/^\+234/, "0");
    if (cleanPhone.length !== 11 || !/^\d{11}$/.test(cleanPhone)) {
      return NextResponse.json({ success: false, message: "Phone number must be exactly 11 digits." }, { status: 400 });
    }

    // 4. Fetch the selected plan from Database
    const plan = await prisma.mobileDataPlan.findUnique({
      where: { planId: Number(planId) },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json({ success: false, message: "This data plan is currently unavailable." }, { status: 400 });
    }

    const planPrice = Number(plan.price);

    // 5. Verify Initial Wallet Balance
    if (Number(user.wallet.balance) < planPrice) {
      return NextResponse.json({ 
        success: false, 
        message: "Insufficient wallet balance. Please fund your wallet.",
        shortfall: planPrice - Number(user.wallet.balance),
      }, { status: 400 });
    }

    // 6. Generate Clean Generic Idempotency Reference
    const reference = `ref_${Date.now()}_${Math.floor(100000 + Math.random() * 900000)}`;

    // 7. Atomic Wallet Debit
    const debitResult = await prisma.$transaction(async (tx) => {
      const currentWallet = await tx.wallet.findUnique({ where: { id: user.wallet!.id } });
      if (!currentWallet || Number(currentWallet.balance) < planPrice) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const balanceBefore = Number(currentWallet.balance);
      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: { decrement: planPrice } }
      });
      const balanceAfter = Number(updatedWallet.balance);

      const txRecord = await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: planPrice,
          balanceBefore,
          balanceAfter,
          type: "DEBIT",
          status: "SUCCESS",
          reference,
          description: `Mobile Data - ${plan.name} (${cleanPhone})`,
          serviceCategory: "MOBILE_DATA"
        }
      });

      return { balanceAfter, txRecord };
    });

    // 8. Call Telecom Upstream Provider API (Matches exact CheapData format)
    const apiKey = process.env.CHEAPDATA_API_KEY || process.env.CHEAPDATASALES_API_KEY || "";
    if (!apiKey) {
      console.error("CRITICAL: CHEAPDATA_API_KEY / CHEAPDATASALES_API_KEY is missing in environment.");
    }

    const payload = {
      product_code: plan.productCode,
      phone_number: cleanPhone,
      action: "vend",
      user_reference: reference,
      bypass_network: "yes", // Skipping strict network check for speed & ported numbers
    };

    console.log("[CheapData Data Request Payload]:", JSON.stringify(payload));

    try {
      const externalRes = await fetch("https://cheapdatasales.com/autobiz_vending_index.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "Bearer": apiKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(45000),
      });

      const externalData = await externalRes.json().catch(() => ({}));
      console.log("[CheapData Data Response Data]:", JSON.stringify(externalData));
      
      const statusStr = String(externalData.status ?? "").trim().toLowerCase();
      const textStatusStr = String(externalData.text_status ?? "").trim().toLowerCase();
      const code = externalData.status_code || externalData.code;

      // Check for success (Matches exact working provider logic)
      const isSuccess = 
        externalData.status === true || 
        statusStr === "success" || 
        statusStr === "1" || 
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
        Object.keys(externalData).length === 0;

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
          action: "MOBILE_DATA_VENDED",
          category: "SERVICES",
          description: `Purchased ${plan.name} for ${cleanPhone}`,
          status: "SUCCESS",
          referenceId: reference,
          metadata: {
            amount: planPrice,
            phone: cleanPhone,
            network: plan.network,
            type: plan.name,
          },
        });

        return NextResponse.json({
          success: true,
          message: externalData.server_message || externalData.data?.true_response || "Data Sent Successfully.",
          reference,
          planName: plan.name,
          amount: planPrice,
          phone: cleanPhone,
          network: plan.network,
          validity: plan.validity,
          capacity: plan.capacity,
          newBalance: debitResult.balanceAfter,
          data: {
            product_code: plan.productCode,
            phone: cleanPhone,
            provider_ref: externalData.data?.recharge_id,
            balance_after: externalData.data?.after_balance,
            description: externalData.data?.true_response || externalData.server_message,
          },
        });
      } else if (isPending) {
        // Upstream carrier is processing or order is queued -> DO NOT refund immediately
        await prisma.transaction.update({
          where: { id: debitResult.txRecord.id },
          data: {
            status: "PENDING",
            description: `Mobile Data Processing - ${plan.name} (${cleanPhone})`
          }
        }).catch(() => {});

        logUserActivity({
          userId: user.id,
          action: "MOBILE_DATA_QUEUED",
          category: "SERVICES",
          description: `Mobile data order queued for ${cleanPhone} (${plan.name})`,
          status: "PENDING",
          referenceId: reference,
        });

        return NextResponse.json({
          success: true,
          status: "PENDING",
          message: externalData.server_message || externalData.data?.true_response || "Data order submitted and currently processing with the carrier.",
          reference,
          planName: plan.name,
          amount: planPrice,
          phone: cleanPhone,
          network: plan.network,
          newBalance: debitResult.balanceAfter,
          data: {
            product_code: plan.productCode,
            phone: cleanPhone,
            provider_ref: externalData.data?.recharge_id,
            status: "PENDING",
          },
        });
      } else if (isExplicitFailure) {
        // Upstream explicitly failed -> Refund wallet and mark the original transaction as FAILED
        await prisma.$transaction(async (tx) => {
          await tx.wallet.update({
            where: { id: user.wallet!.id },
            data: { balance: { increment: planPrice } }
          });
          await tx.transaction.update({
            where: { id: debitResult.txRecord.id },
            data: {
              status: "FAILED",
              description: `Mobile Data Failed (Refunded) - ${plan.name} (${cleanPhone})`
            }
          });
        });

        const rawMsg = externalData.server_message || externalData.data?.true_response || externalData.message || externalData.error || externalData.msg;
        const serverMessage = rawMsg 
          ? `Provider error: ${rawMsg}. Your wallet has been refunded.`
          : "Transaction Failed at provider. Your wallet has been refunded.";

        return NextResponse.json({
          success: false,
          message: serverMessage,
          refunded: true,
          newBalance: Number(user.wallet.balance)
        }, { status: 400 });
      } else {
        // Ambiguous upstream response -> Hold funds in PENDING state awaiting reconciliation
        await prisma.transaction.update({
          where: { id: debitResult.txRecord.id },
          data: {
            status: "PENDING",
            description: `Mobile Data In-Review - ${plan.name} (${cleanPhone})`
          }
        }).catch(() => {});

        return NextResponse.json({
          success: false,
          status: "PENDING",
          message: "Data request queued and awaiting carrier confirmation. Funds have been held pending final settlement.",
          reference,
          newBalance: debitResult.balanceAfter,
        }, { status: 202 });
      }
    } catch (providerErr) {
      console.error("Provider Network Failure during mobile data vending:", providerErr);

      // SECURITY CRITICAL: Do NOT automatically refund wallet on network timeouts.
      await prisma.transaction.update({
        where: { id: debitResult.txRecord.id },
        data: {
          status: "PENDING",
          description: `Mobile Data Processing (Network Timeout) - ${plan.name} (${cleanPhone})`
        }
      }).catch(() => {});

      return NextResponse.json({
        success: false,
        status: "PENDING",
        pendingVerification: true,
        message: "Carrier network timeout. Your data order has been queued and funds reserved. If delivery fails, your wallet will be refunded following reconciliation.",
        reference,
        newBalance: debitResult.balanceAfter,
      }, { status: 202 });
    }

  } catch (error: any) {
    if (error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ success: false, message: "Insufficient wallet balance. Please fund your wallet." }, { status: 400 });
    }
    console.error("Mobile Data Vending Error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "An unexpected error occurred while processing data vending.",
    }, { status: 500 });
  }
}
