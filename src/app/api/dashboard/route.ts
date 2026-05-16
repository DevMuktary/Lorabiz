import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

// If you moved your auth options to a separate file, import it here. 
// Otherwise, NextAuth can sometimes grab the session natively if configured globally.

export async function GET(req: Request) {
  try {
    // 1. Authenticate the User
    // const session = await getServerSession();
    // if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    
    // FOR NOW: We will use a dummy user ID for testing until your NextAuth session is fully wired.
    // Replace this with: const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const user = await prisma.user.findFirst(); 
    if (!user) return NextResponse.json({ message: "No user found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL";
    const type = searchParams.get("type") || "ALL";
    const limit = 10;
    const skip = (page - 1) * limit;

    // 2. Build the dynamic database query
    let whereClause: any = { userId: user.id };
    
    if (search) {
      whereClause.proposedName = { contains: search, mode: "insensitive" };
    }
    if (status !== "ALL") {
      whereClause.status = status;
    }
    if (type !== "ALL") {
      // Assuming Post-Inc services have a specific keyword in their businessType
      if (type === "POST_INC") {
        whereClause.businessType = { in: ["Annual Returns", "Change of Name", "CTC"] };
      } else {
        whereClause.businessType = type;
      }
    }

    // 3. Fetch Data & Calculate Stats (Atomic Promise.all for speed)
    const [
      registrations, 
      totalRecords,
      totalCount,
      pendingCount,
      approvedCount,
      queriedCount,
      unsubmittedCount,
      postIncCount
    ] = await Promise.all([
      prisma.businessRegistration.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.businessRegistration.count({ where: whereClause }), // For pagination
      prisma.businessRegistration.count({ where: { userId: user.id } }), // Total
      prisma.businessRegistration.count({ where: { userId: user.id, status: "PENDING" } }),
      prisma.businessRegistration.count({ where: { userId: user.id, status: "APPROVED" } }),
      prisma.businessRegistration.count({ where: { userId: user.id, status: "QUERIED" } }),
      prisma.businessRegistration.count({ where: { userId: user.id, status: "UNSUBMITTED" } }),
      prisma.businessRegistration.count({ 
        where: { userId: user.id, businessType: { in: ["Annual Returns", "Change of Name", "CTC"] } } 
      }),
    ]);

    // 4. Return the calculated dashboard state
    return NextResponse.json({
      walletBalance: 45000, // Hardcoded for now until we build the Wallet table
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
