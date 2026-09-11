import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Cleanly maps raw transaction description and category to a developer-friendly Service Name badge.
 */
function resolveServiceName(description: string, serviceCategory?: string | null): string {
  const desc = description.toLowerCase();
  if (desc.includes("personalization")) return "NIN Personalization";
  if (desc.includes("ipe") || desc.includes("in-processing")) return "NIMC IPE Clearance";
  if (desc.includes("validation")) return "NIN Validation";
  if (desc.includes("premium slip")) return "NIN Verification (Premium Slip)";
  if (desc.includes("standard slip")) return "NIN Verification (Standard Slip)";
  if (desc.includes("basic slip")) return "NIN Verification (Basic Slip)";
  if (desc.includes("phone") || desc.includes("by-phone")) return "NIN Verification (by Phone)";
  if (desc.includes("bvn")) return "BVN Verification";
  if (desc.includes("nin")) return "NIN Verification";
  return serviceCategory === "API_SERVICE" ? "API Service" : "API Transaction";
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ success: false, message: "Developer wallet not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const serviceFilter = searchParams.get("service")?.trim().toUpperCase() || "ALL";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    // Build Prisma query condition: strictly for this user's wallet
    const where: Prisma.TransactionWhereInput = {
      walletId: user.wallet.id,
      OR: [
        { serviceCategory: "API_SERVICE" },
        { serviceCategory: "IDENTITY_API" },
        { serviceCategory: "SERVICES" },
        { description: { contains: "API", mode: "insensitive" } },
        { description: { contains: "Personalization", mode: "insensitive" } },
        { description: { contains: "IPE", mode: "insensitive" } },
        { description: { contains: "Validation", mode: "insensitive" } },
        { description: { contains: "Verification", mode: "insensitive" } },
        { description: { contains: "Slip", mode: "insensitive" } },
      ],
    };

    // Text search by reference or description
    if (search) {
      where.AND = [
        {
          OR: [
            { reference: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Total Count & Page Records
    const [totalCount, transactions, aggregateSpent] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          reference: true,
          amount: true,
          balanceBefore: true,
          balanceAfter: true,
          type: true,
          status: true,
          serviceCategory: true,
          description: true,
          createdAt: true,
        },
      }),
      prisma.transaction.aggregate({
        where: {
          walletId: user.wallet.id,
          type: "DEBIT",
          status: "SUCCESS",
          OR: [
            { serviceCategory: "API_SERVICE" },
            { serviceCategory: "IDENTITY_API" },
            { serviceCategory: "SERVICES" },
            { description: { contains: "API", mode: "insensitive" } },
            { description: { contains: "Personalization", mode: "insensitive" } },
            { description: { contains: "IPE", mode: "insensitive" } },
            { description: { contains: "Validation", mode: "insensitive" } },
            { description: { contains: "Verification", mode: "insensitive" } },
            { description: { contains: "Slip", mode: "insensitive" } },
          ],
        },
        _sum: { amount: true },
      }),
    ]);

    // Format transactions with clear Service Name
    const formattedTransactions = transactions.map((tx) => {
      const serviceName = resolveServiceName(tx.description, tx.serviceCategory);
      return {
        id: tx.id,
        reference: tx.reference,
        serviceName,
        description: tx.description,
        type: tx.type, // "DEBIT" or "CREDIT" / "REFUND"
        amount: Number(tx.amount),
        balanceBefore: Number(tx.balanceBefore),
        balanceAfter: Number(tx.balanceAfter),
        status: tx.status,
        createdAt: tx.createdAt.toISOString(),
      };
    });

    // Filter by serviceName if user specified one (e.g. "PERSONALIZATION")
    let finalTransactions = formattedTransactions;
    if (serviceFilter !== "ALL") {
      finalTransactions = formattedTransactions.filter((tx) =>
        tx.serviceName.toUpperCase().includes(serviceFilter)
      );
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const walletBalance = Number(user.wallet.balance);
    const totalDebited = Number(aggregateSpent._sum.amount || 0);

    return NextResponse.json({
      success: true,
      data: {
        transactions: finalTransactions,
        walletBalance,
        totalDebited,
        summary: {
          currentWalletBalance: walletBalance,
          totalDebited,
          totalTransactions: totalCount,
        },
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
      },
    });
  } catch (err) {
    console.error("❌ [Developer Transactions API Error]:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
