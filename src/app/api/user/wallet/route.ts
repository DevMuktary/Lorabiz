import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Fetch user and include their connected wallet
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true }
    });

    // Safely convert the Prisma Decimal to a standard Javascript Number
    const currentBalance = user?.wallet?.balance ? Number(user.wallet.balance) : 0;

    // Return both top-level and nested balance for 100% frontend compatibility
    return NextResponse.json({ 
      success: true, 
      balance: currentBalance,
      wallet: {
        balance: currentBalance 
      }
    });

  } catch (error) {
    console.error("Wallet Fetch Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
