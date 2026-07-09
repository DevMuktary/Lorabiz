import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id, type, proposedName, altName1, altName2 } = await req.json();

    // 1. Fetch Pricing & Wallet
    const pricing = await prisma.servicePricing.findUnique({ where: { serviceKey: "NAME_SUBSTITUTION" } });
    const fee = pricing?.price ? Number(pricing.price) : 5000;

    const wallet = await prisma.wallet.findUnique({ where: { userId: (session.user as any).id } });
    if (!wallet || Number(wallet.balance) < fee) {
      return NextResponse.json({ message: "Insufficient wallet balance." }, { status: 400 });
    }

    // 2. Perform Transaction & Update Names
    await prisma.$transaction(async (tx) => {
      // Deduct Fee
      const newBalance = Number(wallet.balance) - fee;
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance }
      });

      // Record Transaction
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          amount: fee,
          balanceBefore: wallet.balance,
          balanceAfter: newBalance,
          type: "DEBIT",
          status: "SUCCESS",
          reference: `NSUB-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          description: `Name Substitution Fee for tracking ID ${id}`
        }
      });

      // Update the Specific Registration Table
      if (type === "BUSINESS_NAME") {
        await tx.businessRegistration.update({
          where: { id },
          data: { proposedName, altName1, altName2 }
        });
      } else {
        await tx.llcRegistration.update({
          where: { id },
          data: { proposedName, altName1, altName2 }
        });
      }
    });

    return NextResponse.json({ message: "Names updated successfully" }, { status: 200 });

  } catch (error) {
    console.error("Name Substitution Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
