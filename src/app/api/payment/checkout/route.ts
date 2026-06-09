import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { registrationId, paymentMethod } = body; // paymentMethod = "WALLET" or "ONLINE"

    // 1. Fetch User & Wallet securely
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true }
    });
    if (!user || !user.wallet) return NextResponse.json({ message: "User or wallet not found" }, { status: 404 });

    // 2. Fetch the Registration to ensure it belongs to the user and isn't already paid
    const registration = await prisma.businessRegistration.findUnique({ where: { id: registrationId } });
    if (!registration || registration.userId !== user.id) return NextResponse.json({ message: "Invalid application" }, { status: 404 });
    if (registration.status !== "UNSUBMITTED") return NextResponse.json({ message: "Application is already submitted." }, { status: 400 });

    // 3. Fetch Service Price (Assuming "BUSINESS_NAME" is your service key)
    // NOTE: You must ensure a ServicePricing record exists in your DB for this!
    const servicePriceRecord = await prisma.servicePricing.findUnique({ where: { serviceKey: "BUSINESS_NAME" } });
    if (!servicePriceRecord) return NextResponse.json({ message: "Pricing configuration missing" }, { status: 500 });
    
    const amountToPay = Number(servicePriceRecord.price);

    // ==========================================
    // FLOW A: PAY WITH WALLET
    // ==========================================
    if (paymentMethod === "WALLET") {
      const currentBalance = Number(user.wallet.balance);
      
      if (currentBalance < amountToPay) {
        return NextResponse.json({ success: false, message: "Insufficient wallet balance." }, { status: 400 });
      }

      // ATOMIC TRANSACTION: Debit Wallet, Record Transaction, Update Registration
      await prisma.$transaction(async (tx) => {
        const newBalance = currentBalance - amountToPay;

        // Update Wallet
        await tx.wallet.update({
          where: { id: user.wallet!.id },
          data: { balance: newBalance }
        });

        // Record Ledger Debit
        await tx.transaction.create({
          data: {
            walletId: user.wallet!.id,
            amount: amountToPay,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            type: "DEBIT",
            status: "SUCCESS",
            reference: `WLT_${registrationId}_${Date.now()}`,
            description: `Payment for Business Registration (${registration.proposedName})`
          }
        });

        // Update Application Status
        await tx.businessRegistration.update({
          where: { id: registrationId },
          data: { status: "PENDING" } // PENDING means submitted to admin for processing
        });
      });

      return NextResponse.json({ success: true, message: "Payment successful via Wallet." });
    }

    // ==========================================
    // FLOW B: PAY ONLINE (PAYSTACK)
    // ==========================================
    if (paymentMethod === "ONLINE") {
      // We embed the registrationId directly into the reference so we know what they paid for when Paystack verifies it.
      const reference = `ONL_${registrationId}_${Date.now()}`;

      // We don't touch the database yet. We just return the data needed to trigger Paystack on the frontend.
      return NextResponse.json({ 
        success: true, 
        paystackData: {
          email: user.email,
          amount: amountToPay * 100, // Paystack uses Kobo/Cents
          reference: reference,
          publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
        }
      });
    }

    return NextResponse.json({ message: "Invalid payment method" }, { status: 400 });

  } catch (error) {
    console.error("Checkout Initialization Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
