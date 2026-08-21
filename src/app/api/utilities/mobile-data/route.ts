import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { ensureDataPlansSeeded } from "@/lib/data-plans-seed";

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
    // 1. Authenticate the User
    const session = await getServerSession();
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
    const { planId, phone, network } = await req.json();

    if (!planId || !phone) {
      return NextResponse.json({ success: false, message: "Plan ID and phone number are required." }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\s+/g, "").replace(/^\+234/, "0");
    if (cleanPhone.length !== 11) {
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

    // 5. Verify Wallet Balance
    if (Number(user.wallet.balance) < planPrice) {
      return NextResponse.json({ 
        success: false, 
        message: "Insufficient wallet balance. Please fund your wallet.",
        shortfall: planPrice - Number(user.wallet.balance),
      }, { status: 400 });
    }

    // 6. Generate Clean Generic Idempotency Reference (No branding prefix)
    const reference = `ref_${Date.now()}_${Math.floor(100000 + Math.random() * 900000)}`;

    // 7. Securely Call CheapDataSales API
    const externalRes = await fetch("https://cheapdatasales.com/autobiz_vending_index.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CHEAPDATASALES_API_KEY || ""}`,
      },
      body: JSON.stringify({
        product_code: plan.productCode,
        phone_number: cleanPhone,
        action: "vend",
        user_reference: reference,
      }),
    });

    const externalData = await externalRes.json();

    // 8. Handle Success Strictly
    if (externalData.status === true || externalData.status === "success") {
      const oldBalance = Number(user.wallet.balance);
      const newBalance = oldBalance - planPrice;

      // Atomic Prisma Transaction
      await prisma.$transaction([
        prisma.wallet.update({
          where: { id: user.wallet.id },
          data: { balance: newBalance },
        }),
        prisma.transaction.create({
          data: {
            walletId: user.wallet.id,
            amount: planPrice,
            balanceBefore: oldBalance,
            balanceAfter: newBalance,
            type: "DEBIT",
            status: "SUCCESS",
            reference: reference,
            description: `Mobile Data - ${plan.name} (${cleanPhone})`,
            serviceCategory: "UTILITIES",
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: "Data subscription successful.",
        reference: reference,
        planName: plan.name,
        amount: planPrice,
        phone: cleanPhone,
        network: plan.network,
        validity: plan.validity,
        capacity: plan.capacity,
        newBalance: newBalance,
        data: externalData.data || {},
      });
    } else {
      const serverMessage = externalData.server_message || externalData.message || "Provider failed to vend data bundle. Your wallet was not debited.";
      return NextResponse.json({
        success: false,
        message: serverMessage,
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Mobile Data Vending Error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "An unexpected error occurred while processing data vending.",
    }, { status: 500 });
  }
}
