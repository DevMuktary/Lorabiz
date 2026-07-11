import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 
import { prisma } from "@/lib/prisma";

// Note: We use NextRequest here to easily read URL query parameters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // 1. Extract query parameters from the URL
    const { searchParams } = req.nextUrl;
    const typeFilter = searchParams.get("type");
    const statusFilter = searchParams.get("status");

    // 2. Build a dynamic Prisma "where" object
    const txWhere: any = {};
    if (typeFilter) txWhere.type = typeFilter;
    if (statusFilter) txWhere.status = statusFilter;

    // 3. Fetch the user's wallet with the dynamically filtered transactions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        wallet: {
          include: {
            transactions: {
              where: txWhere, // This applies our filters right inside the database!
              orderBy: { createdAt: "desc" }
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      transactions: user?.wallet?.transactions || [] 
    });

  } catch (error) {
    console.error("Transactions Fetch Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
