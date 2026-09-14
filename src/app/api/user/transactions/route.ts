import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/mobile-auth"; 
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // 1. Extract query parameters from the URL
    const { searchParams } = req.nextUrl;
    const typeFilter = searchParams.get("type");
    const statusFilter = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");

    // 2. Build a dynamic Prisma "where" object
    const txWhere: any = {};
    if (typeFilter && typeFilter !== "ALL") txWhere.type = typeFilter;
    if (statusFilter && statusFilter !== "ALL") txWhere.status = statusFilter;

    if (!user.wallet) {
      return NextResponse.json({ 
        success: true, 
        transactions: [] 
      });
    }

    // 3. Fetch the user's wallet transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        walletId: user.wallet.id,
        ...txWhere,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ 
      success: true, 
      transactions 
    });

  } catch (error) {
    console.error("Transactions Fetch Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
