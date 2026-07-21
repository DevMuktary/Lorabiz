import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Calculate timestamp for 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Fetch logs within the last 24 hours that were successful and have a PDF URL
    const logs = await prisma.ninRequestLog.findMany({
      where: {
        userId: user.id,
        status: "SUCCESS",
        createdAt: {
          gte: twentyFourHoursAgo
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Format for the frontend UI
    const formattedHistory = logs.map((log) => ({
      id: log.id,
      ninMasked: log.ninMasked,
      slipType: log.slipType === "nin_premium" ? "Premium Card Slip" : log.slipType === "nin_standard" ? "Standard Biometric Slip" : "Regular Slip",
      createdAt: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
