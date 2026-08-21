import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth"; 

export async function POST(req: Request) {
  try {
    // 1. Authenticate the User Securely
    const session = await getServerSession();
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

    if (!network || !phone || !amount || Number(amount) < 50) {
      return NextResponse.json({ success: false, message: "Invalid parameters. Minimum airtime amount is ₦50." }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\s+/g, "").replace(/^\+234/, "0");
    if (cleanPhone.length !== 11) {
      return NextResponse.json({ success: false, message: "Phone number must be exactly 11 digits." }, { status: 400 });
    }

    // 4. Verify Wallet Balance
    if (Number(user.wallet.balance) < Number(amount)) {
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

    // 6. Generate Clean Generic Idempotency Reference (No branding prefix)
    const reference = `ref_${Date.now()}_${Math.floor(100000 + Math.random() * 900000)}`;

    // 7. Securely Call CheapDataSales API
    const externalRes = await fetch("https://cheapdatasales.com/autobiz_vending_index.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CHEAPDATASALES_API_KEY || ""}`
      },
      body: JSON.stringify({
        amount: Number(amount),
        product_code: productCode,
        phone_number: cleanPhone,
        action: "vend",
        user_reference: reference
      })
    });

    const externalData = await externalRes.json();

    // 8. Handle Success Strictly
    if (externalData.status === true || externalData.status === "success") {
      const amountCharged = Number(amount);
      const oldBalance = Number(user.wallet.balance);
      const newBalance = oldBalance - amountCharged;

      // Atomic Prisma Transaction
      await prisma.$transaction([
        prisma.wallet.update({
          where: { id: user.wallet.id },
          data: { balance: newBalance }
        }),
        prisma.transaction.create({
          data: {
            walletId: user.wallet.id,
            amount: amountCharged,
            balanceBefore: oldBalance,
            balanceAfter: newBalance,
            type: "DEBIT",
            status: "SUCCESS",
            reference: reference,
            description: `Airtime Recharge - ${cleanPhone} (${network.toUpperCase()})`,
            serviceCategory: "UTILITIES"
          }
        })
      ]);

      return NextResponse.json({
        success: true,
        message: "Airtime vending successful.",
        reference: reference,
        amount: amountCharged,
        phone: cleanPhone,
        network: network.toUpperCase(),
        newBalance: newBalance,
        data: externalData.data || {}
      });
    } else {
      const serverMessage = externalData.server_message || externalData.message || "Provider failed to process recharge. Your wallet was not debited.";
      return NextResponse.json({
        success: false,
        message: serverMessage
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Airtime Vending Error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "An unexpected error occurred. Please try again."
    }, { status: 500 });
  }
}
