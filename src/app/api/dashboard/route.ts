import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch user and include wallet to save an extra database query later
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      include: { wallet: true }
    });
    
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

    // Atomic Promise.all for absolute maximum speed. 
    // We now also fetch ALL successful transactions for this user's wallet.
    const [
      registrations, 
      totalRecords,
      totalCount,
      pendingCount,
      approvedCount,
      queriedCount,
      unsubmittedCount,
      postIncCount,
      transactions
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
      // Fetch the transaction ledger
      user.wallet ? prisma.transaction.findMany({
        where: { walletId: user.wallet.id, status: "SUCCESS" }
      }) : Promise.resolve([])
    ]);

    // SMART MAPPING: Link the real transaction amount to the registration
    const enrichedRegistrations = registrations.map((reg) => {
      // Find the transaction that belongs to this registration
      const relatedTx = transactions.find(tx => 
        tx.reference.includes(reg.id) || 
        tx.description.includes(reg.id) || 
        tx.reference.includes(reg.id.substring(0, 8).toUpperCase())
      );

      return {
        ...reg,
        // Inject the real ledger data
        amountPaid: relatedTx ? Number(relatedTx.amount) : 0,
        transactionRef: relatedTx ? relatedTx.reference : `SRV_${reg.id.substring(0, 8).toUpperCase()}`
      };
    });

    return NextResponse.json({
      walletBalance: user.wallet?.balance ? Number(user.wallet.balance) : 0,
      stats: {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        queried: queriedCount,
        unsubmitted: unsubmittedCount,
        postInc: postIncCount
      },
      tableData: enrichedRegistrations, // Sending the enriched data
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: page
    }, { status: 200 });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
