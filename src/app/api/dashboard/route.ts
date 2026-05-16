import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(req: Request) {
  try {
    // FOR NOW: We will use a dummy user ID for testing until your NextAuth session is fully wired.
    // Replace this with: const session = await getServerSession(); const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const user = await prisma.user.findFirst(); 
    if (!user) return NextResponse.json({ message: "No user found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL";
    const type = searchParams.get("type") || "ALL";
    const limit = 10;
    const skip = (page - 1) * limit;

    let whereClause: any = { userId: user.id };
    
    if (search) {
      whereClause.proposedName = { contains: search, mode: "insensitive" };
    }
    if (status !== "ALL") {
      whereClause.status = status;
    }
    if (type !== "ALL") {
      if (type === "POST_INC") {
        whereClause.businessType = { in: ["Annual Returns", "Change of Name", "CTC"] };
      } else {
        whereClause.businessType = type;
      }
    }

    // Atomic Promise.all for absolute maximum speed. Now querying the Wallet too.
    const [
      registrations, 
      totalRecords,
      totalCount,
      pendingCount,
      approvedCount,
      queriedCount,
      unsubmittedCount,
      postIncCount,
      wallet // <-- FETCHING THE REAL WALLET
    ] = await Promise.all([
      prisma.businessRegistration.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.businessRegistration.count({ where: whereClause }), 
      prisma.businessRegistration.count({ where: { userId: user.id } }), 
      prisma.businessRegistration.count({ where: { userId: user.id, status: "PENDING" } }),
      prisma.businessRegistration.count({ where: { userId: user.id, status: "APPROVED" } }),
      prisma.businessRegistration.count({ where: { userId: user.id, status: "QUERIED" } }),
      prisma.businessRegistration.count({ where: { userId: user.id, status: "UNSUBMITTED" } }),
      prisma.businessRegistration.count({ 
        where: { userId: user.id, businessType: { in: ["Annual Returns", "Change of Name", "CTC"] } } 
      }),
      prisma.wallet.findUnique({ where: { userId: user.id } }) // <-- REAL DB CALL
    ]);

    return NextResponse.json({
      walletBalance: wallet?.balance || 0, // <-- REAL DATA INJECTED HERE
      stats: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        queried: queriedCount,
        unsubmitted: unsubmittedCount,
        postInc: postIncCount
      },
      tableData: registrations,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: page
    }, { status: 200 });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
