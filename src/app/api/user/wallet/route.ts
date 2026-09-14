import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (!user.wallet) {
      const newWallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0.00,
        },
      });
      user.wallet = newWallet;
    }

    // Safely convert the Prisma Decimal to a standard Javascript Number
    const currentBalance = user?.wallet?.balance ? Number(user.wallet.balance) : 0;

    // Return both top-level and nested balance for 100% frontend compatibility
    return NextResponse.json({ 
      success: true, 
      balance: currentBalance,
      wallet: {
        id: user.wallet.id,
        balance: currentBalance 
      }
    });

  } catch (error) {
    console.error("Wallet Fetch Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
