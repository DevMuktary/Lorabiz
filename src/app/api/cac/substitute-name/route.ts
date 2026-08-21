import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    
    const userEmail = session.user.email;
    const { id, type, paymentMethod, proposedName, altName1, altName2, callbackUrl } = await req.json();

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
        const currentWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
        if (!currentWallet || Number(currentWallet.balance) < fee) {
          throw new Error("INSUFFICIENT_BALANCE");
        }

        const balanceBefore = Number(currentWallet.balance);
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: fee } }
        });
        const balanceAfter = Number(updatedWallet.balance);

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            amount: fee,
            balanceBefore,
            balanceAfter,
            type: "DEBIT",
            status: "SUCCESS",
            reference: `NSUB-WLT-${id}-${Date.now()}`,
            description: `Name Substitution Fee for tracking ID ${id}`,
            serviceCategory: "NAME_SUBSTITUTION"
          }
        });

        // Update Names immediately in the Database
        if (type === "BUSINESS_NAME") {
          await tx.businessRegistration.update({ where: { id }, data: { proposedName, altName1, altName2 } });
        } else {
          await tx.llcRegistration.update({ where: { id }, data: { proposedName, altName1, altName2 } });
        }
      });

      return NextResponse.json({ success: true, message: "Names updated successfully" }, { status: 200 });
    }

    // ==========================================
    // FLOW B: PAY ONLINE (KORAPAY)
    // ==========================================
    if (paymentMethod === "ONLINE") {
      if (!userEmail) return NextResponse.json({ message: "User email required for online payment" }, { status: 400 });

      const secretKey = process.env.KORAPAY_SECRET_KEY;
      const appUrl = process.env.NEXTAUTH_URL || "https://lorabiz.com";

      const reference = `NSUB_${id}_${Date.now()}`; 
      
      // CRITICAL FIX: Append ?verifying=true so the modal automatically opens when the user returns!
      let callbackPath = callbackUrl 
        ? `${callbackUrl}?verifying=true` 
        : `/dashboard/cac/${type === "LLC" ? "llc" : "businesses"}/${id}/queries?verifying=true`;

      const koraResponse = await fetch("https://api.korapay.com/merchant/api/v1/charges/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(fee),
          currency: "NGN",
          reference: reference,
          redirect_url: `${appUrl}${callbackPath}`,
          customer: {
            email: userEmail,
            name: session.user.name?.substring(0, 50) || "Customer"
          },
          metadata: {
            "reg-id": id.substring(0, 20),
            "type": type.substring(0, 20),
            "name-1": proposedName?.substring(0, 50) || "none",
            "name-2": altName1?.substring(0, 50) || "none",
            "name-3": altName2?.substring(0, 50) || "none"
          }
        }),
      });

      const koraData = await koraResponse.json();

      if (!koraResponse.ok || !koraData.status || !koraData.data?.checkout_url) {
        return NextResponse.json({ success: false, message: koraData.message || "Failed to initialize payment." }, { status: 400 });
      }

      return NextResponse.json({ success: true, authorizationUrl: koraData.data.checkout_url });
    }

    return NextResponse.json({ message: "Invalid payment method" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
