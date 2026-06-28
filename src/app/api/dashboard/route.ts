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

    // Fetch user and include wallet
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      include: { wallet: true }
    });
    
    if (!user) return NextResponse.json({ message: "No user found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search")?.toLowerCase() || "";
    const status = searchParams.get("status") || "ALL";
    const type = searchParams.get("type") || "ALL";
    const limit = 10;
    const skip = (page - 1) * limit;

    // 1. ATOMIC FETCH: Grab all Business Names, LLCs, and Transactions simultaneously
    const [bizRegs, llcRegs, transactions] = await Promise.all([
      prisma.businessRegistration.findMany({ where: { userId: user.id } }),
      prisma.llcRegistration.findMany({ where: { userId: user.id } }),
      user.wallet ? prisma.transaction.findMany({
        where: { walletId: user.wallet.id, status: "SUCCESS" }
      }) : Promise.resolve([])
    ]);

    // Tag them so the frontend knows exactly which database table they came from
    const normalizedBiz = bizRegs.map(reg => ({ ...reg, _appType: "BUSINESS_NAME" }));
    const normalizedLlc = llcRegs.map(reg => ({ ...reg, _appType: "LLC" }));

    // 2. MERGE: Combine all applications into one unified list
    let allRegs = [...normalizedBiz, ...normalizedLlc];

    // 3. COMPUTE STATS: Calculate metrics BEFORE applying search/pagination filters
    const stats = {
      total: allRegs.length,
      pending: allRegs.filter(r => r.status === "PENDING").length,
      approved: allRegs.filter(r => r.status === "APPROVED").length,
      queried: allRegs.filter(r => r.status === "QUERIED").length,
      unsubmitted: allRegs.filter(r => r.status === "UNSUBMITTED").length,
      postInc: 0 // Placeholder for future post-incorporation tracking
    };

    // 4. APPLY FILTERS
    if (search) {
      allRegs = allRegs.filter(reg => 
        reg.proposedName?.toLowerCase().includes(search)
      );
    }

    if (status !== "ALL") {
      allRegs = allRegs.filter(reg => reg.status === status);
    }

    if (type !== "ALL") {
      if (type === "BUSINESS_NAME") {
        allRegs = allRegs.filter(reg => reg._appType === "BUSINESS_NAME");
      } else if (type === "LTD" || type === "LTD_GTE") {
        allRegs = allRegs.filter(reg => reg._appType === "LLC");
      } else if (type === "TRUSTEE") {
        allRegs = allRegs.filter(reg => reg._appType === "NGO"); // Future-proofing
      }
    }

    // 5. SORT: Order everything by the most recently updated (Newest first)
    allRegs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // 6. PAGINATE: Slice the master array to return only the current page
    const totalRecords = allRegs.length;
    const paginatedRegs = allRegs.slice(skip, skip + limit);

    // 7. ENRICH: Attach secure transaction details from the ledger
    const enrichedRegistrations = paginatedRegs.map((reg) => {
      const relatedTx = transactions.find(tx => 
        tx.reference.includes(reg.id) || 
        tx.description.includes(reg.id) || 
        tx.reference.includes(reg.id.substring(0, 8).toUpperCase())
      );

      return {
        ...reg,
        amountPaid: relatedTx ? Number(relatedTx.amount) : 0,
        transactionRef: relatedTx ? relatedTx.reference : `SRV_${reg.id.substring(0, 8).toUpperCase()}`
      };
    });

    return NextResponse.json({
      walletBalance: user.wallet?.balance ? Number(user.wallet.balance) : 0,
      stats,
      tableData: enrichedRegistrations,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: page
    }, { status: 200 });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
