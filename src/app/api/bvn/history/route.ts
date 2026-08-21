import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { parseDemographics } from "@/lib/demographics-parser";

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

    // 72 hours retention window for regular users
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

    const logs = await prisma.bvnRequestLog.findMany({
      where: {
        userId: user.id,
        status: "SUCCESS",
        createdAt: {
          gte: seventyTwoHoursAgo
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const slipTypeLabelMap: Record<string, string> = {
      "bvn_standard": "Standard BVN Slip",
      "bvn_premium": "Premium BVN Card Slip",
    };

    const formattedHistory = logs.map((log) => {
      const demo = parseDemographics(log.userData, log.fullName || undefined);

      return {
        id: log.id,
        bvnMasked: log.bvnMasked,
        rawSlipType: log.slipType,
        slipType: slipTypeLabelMap[log.slipType] || log.slipType,
        amountCharged: Number(log.amountCharged),
        reference: log.reference,
        fullName: demo.fullName || log.fullName || undefined,
        firstName: demo.firstName || log.firstName || undefined,
        lastName: demo.lastName || log.lastName || undefined,
        middleName: demo.middleName || log.middleName || undefined,
        gender: demo.gender || log.gender || undefined,
        dob: demo.dob || log.dob || undefined,
        phone: demo.phone || log.phone || undefined,
        address: demo.address || log.address || undefined,
        photo: demo.photo || undefined,
        userData: log.userData || undefined,
        providerUsed: log.providerUsed || undefined,
        createdAt: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAtFull: log.createdAt,
        pdfUrl: log.pdfUrl || undefined
      };
    });

    return NextResponse.json({
      success: true,
      history: formattedHistory
    });

  } catch (error) {
    console.error("❌ Fetch BVN History Error:", error);
    return NextResponse.json({ success: false, message: "Failed to retrieve history" }, { status: 500 });
  }
}

