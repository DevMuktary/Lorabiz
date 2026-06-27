import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { registrationId, paymentMethod, service } = body; 

    // 1. Fetch User & Wallet
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true }
    });
    if (!user || !user.wallet) return NextResponse.json({ message: "User or wallet not found" }, { status: 404 });

    let amountToPay = 0;
    let description = "";

    // 2. Identify Service & Calculate Price
    if (service === "llc") {
      const registration = await prisma.llcRegistration.findUnique({ where: { id: registrationId } });
      if (!registration || registration.userId !== user.id) return NextResponse.json({ message: "Invalid LLC application." }, { status: 404 });
      if (registration.status !== "UNSUBMITTED") return NextResponse.json({ message: "Application is already submitted." }, { status: 400 });

      const prices = await prisma.servicePricing.findMany();
      const pricingMap = prices.reduce((acc: any, item) => { acc[item.serviceKey] = Number(item.price); return acc; }, {});

      const baseLLCFee = pricingMap.LLC || 35000;
      const extraMillionFee = pricingMap.LLC_EXTRA_MILLION || 15000;
      const totalShares = Number(registration.totalShareCapital) || 1000000;
      
      const extraSharesFee = Math.max(0, Math.ceil((totalShares - 1000000) / 1000000)) * extraMillionFee;
      amountToPay = baseLLCFee + extraSharesFee;
      description = `Payment for LLC Registration (${registration.proposedName || 'Draft'})`;

    } else {
      // Default to Business Name Registration
      const registration = await prisma.businessRegistration.findUnique({ where: { id: registrationId } });
      if (!registration || registration.userId !== user.id) return NextResponse.json({ message: "Invalid Business Name application." }, { status: 404 });
      if (registration.status !== "UNSUBMITTED") return NextResponse.json({ message: "Application is already submitted." }, { status: 400 });

      const servicePriceRecord = await prisma.servicePricing.findUnique({ where: { serviceKey: "BUSINESS_NAME" } });
      if (!servicePriceRecord) return NextResponse.json({ message: "Pricing configuration missing" }, { status: 500 });
      
      amountToPay = Number(servicePriceRecord.price);
      description = `Payment for Business Registration (${registration.proposedName})`;
    }

    if (amountToPay <= 0) return NextResponse.json({ message: "Invalid payment amount calculated." }, { status: 400 });

    // ==========================================
    // FLOW A: PAY WITH WALLET
    // ==========================================
    if (paymentMethod === "WALLET") {
      const currentBalance = Number(user.wallet.balance);
      
      if (currentBalance < amountToPay) {
        return NextResponse.json({ success: false, message: "Insufficient wallet balance." }, { status: 400 });
      }

      await prisma.$transaction(async (tx: any) => {
        const newBalance = currentBalance - amountToPay;

        await tx.wallet.update({
          where: { id: user.wallet!.id },
          data: { balance: newBalance }
        });

        await tx.transaction.create({
          data: {
            walletId: user.wallet!.id,
            amount: amountToPay,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            type: "DEBIT",
            status: "SUCCESS",
            reference: `WLT_${registrationId}_${Date.now()}`,
            description: description
          }
        });

        if (service === "llc") {
          await tx.llcRegistration.update({ where: { id: registrationId }, data: { status: "PENDING" } });
        } else {
          await tx.businessRegistration.update({ where: { id: registrationId }, data: { status: "PENDING" } });
        }
      });

      return NextResponse.json({ success: true, message: "Payment successful via Wallet." });
    }

    // ==========================================
    // FLOW B: PAY ONLINE (PAYSTACK)
    // ==========================================
    if (paymentMethod === "ONLINE") {
      // Keep reference format identical so your Webhook doesn't break
      const reference = `ONL_${registrationId}_${Date.now()}`;

      return NextResponse.json({ 
        success: true, 
        paystackData: {
          email: user.email,
          amount: amountToPay * 100, // Paystack uses Kobo
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
