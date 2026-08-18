import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized access. Please log in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const searchTypeFilter = searchParams.get("searchType"); // "NIN" | "PHONE" | null

    // Calculate timestamp for 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const whereClause: any = {
      userId: user.id,
      status: "SUCCESS",
      createdAt: {
        gte: twentyFourHoursAgo
      }
    };

    if (searchTypeFilter === "PHONE") {
      whereClause.searchType = "PHONE";
    } else if (searchTypeFilter === "NIN") {
      whereClause.OR = [
        { searchType: "NIN" },
        { searchType: null }
      ];
    }

    // Fetch logs within the last 24 hours
    const logs = await prisma.ninRequestLog.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc"
      }
    });

    const slipTypeLabelMap: Record<string, string> = {
      "nin_basic": "Basic NIN Slip",
      "nin_vnin": "VNIN Verification Slip",
      "nin_regular": "Regular Official Slip",
      "nin_standard": "Standard Biometric Slip",
      "nin_premium": "Premium Card Slip"
    };

    // Format for the frontend UI
    const formattedHistory = logs.map((log) => ({
      id: log.id,
      ninMasked: log.ninMasked,
      rawSlipType: log.slipType,
      slipType: slipTypeLabelMap[log.slipType] || log.slipType,
      searchType: log.searchType || "NIN",
      amountCharged: Number(log.amountCharged),
      reference: log.reference,
      fullName: log.fullName || undefined,
      firstName: log.firstName || undefined,
      lastName: log.lastName || undefined,
      middleName: log.middleName || undefined,
      gender: log.gender || undefined,
      dob: log.dob || undefined,
      phone: log.phone || undefined,
      address: log.address || undefined,
      userData: log.userData || undefined,
      providerUsed: log.providerUsed || undefined,
      createdAt: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAtFull: log.createdAt,
      pdfUrl: log.pdfUrl || undefined
    }));

    return NextResponse.json({
      success: true,
      history: formattedHistory
    });

  } catch (error) {
    console.error("❌ Fetch NIN History Error:", error);
    return NextResponse.json({ success: false, message: "Failed to retrieve history" }, { status: 500 });
  }
}
