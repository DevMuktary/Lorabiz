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

    if (phone.length !== 11) {
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

    // 6. Generate Unique Idempotency Reference
    const reference = `LUME_AIR_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // 7. Securely Call the External Provider (API Key is hidden on the server)
    const externalRes = await fetch("https://cheapdatasales.com/autobiz_vending_index.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Bearer": process.env.CHEAPDATASALES_API_KEY || "" // Stored securely in .env
      },
      body: JSON.stringify({
        amount: Number(amount),
        product_code: productCode,
        phone_number: phone,
        action: "vend",
        user_reference: reference
      })
    });

    const externalData = await externalRes.json();

    // 8. Handle Success & Update Database
    if (externalData.status === true) {
      const amountCharged = Number(amount);
      const oldBalance = Number(user.wallet.balance);
      const newBalance = oldBalance - amountCharged;

      // Use a Prisma Transaction so Wallet & Transaction Ledger stay perfectly in sync
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
            description: `Airtime Recharge - ${phone} (${network})`
          }
        })
      ]);

      return NextResponse.json({ 
        success: true, 
        message: `Successfully recharged ₦${amount} to ${phone}`, 
        data: externalData.data 
      });
    } else {
      // 9. Handle Provider Error
      return NextResponse.json({ 
        success: false, 
        message: externalData.server_message || "Recharge failed at the network provider." 
      });
    }

  } catch (error) {
    console.error("Airtime Error:", error);
    return NextResponse.json({ success: false, message: "An internal server error occurred." }, { status: 500 });
  }
}
