import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    
    const userEmail = session.user.email;
    const { id, type, paymentMethod, proposedName, altName1, altName2 } = await req.json();

    const pricing = await prisma.servicePricing.findUnique({ where: { serviceKey: "NAME_SUBSTITUTION" } });
    const fee = pricing?.price ? Number(pricing.price) : 5000;

    // ==========================================
    // FLOW A: PAY WITH WALLET
    // ==========================================
    if (paymentMethod === "WALLET") {
      const wallet = await prisma.wallet.findUnique({ where: { userId: (session.user as any).id } });
      if (!wallet || Number(wallet.balance) < fee) {
        return NextResponse.json({ message: "Insufficient wallet balance." }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        const newBalance = Number(wallet.balance) - fee;
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: newBalance }
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            amount: fee,
            balanceBefore: wallet.balance,
            balanceAfter: newBalance,
            type: "DEBIT",
            status: "SUCCESS",
            reference: `NSUB-WLT-${id}-${Date.now()}`,
            description: `Name Substitution Fee for tracking ID ${id}`
          }
        });

        // Update Names immediately
        if (type === "BUSINESS_NAME") {
          await tx.businessRegistration.update({ where: { id }, data: { proposedName, altName1, altName2 } });
        } else {
          await tx.llcRegistration.update({ where: { id }, data: { proposedName, altName1, altName2 } });
        }
      });

      return NextResponse.json({ success: true, message: "Names updated successfully" }, { status: 200 });
    }

    // ==========================================
    // FLOW B: PAY ONLINE (PAYSTACK)
    // ==========================================
    if (paymentMethod === "ONLINE") {
      if (!userEmail) return NextResponse.json({ message: "User email required for online payment" }, { status: 400 });

      // Clean, short reference
      const reference = `NSUB-ONL-${id}-${Date.now()}`; 

      return NextResponse.json({ 
        success: true, 
        paystackData: {
          email: userEmail,
          amount: fee * 100, // Paystack uses Kobo
          reference: reference,
          // THE FIX: Pass the names safely in the metadata object
          metadata: {
            registrationId: id,
            type,
            proposedName,
            altName1,
            altName2
          },
          publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
        }
      });
    }

    return NextResponse.json({ message: "Invalid payment method" }, { status: 400 });

  } catch (error) {
    console.error("Name Substitution Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
