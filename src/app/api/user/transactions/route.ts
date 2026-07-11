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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        wallet: {
          include: {
            transactions: {
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
