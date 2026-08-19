import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Admin pipeline is PERMANENT (no 24h retention filter)
    const bvnLogs = await prisma.bvnRequestLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } }
      }
    });

    const slipTypeLabelMap: Record<string, string> = {
      "bvn_standard": "Standard BVN Slip",
      "bvn_premium": "Premium BVN Card Slip",
    };

    const formattedLogs = bvnLogs.map((log) => ({
      id: log.id,
      reference: log.reference,
      bvnMasked: log.bvnMasked,
      slipType: log.slipType,
      slipTypeLabel: slipTypeLabelMap[log.slipType] || log.slipType,
      amountCharged: Number(log.amountCharged),
      status: log.status,
      createdAt: log.createdAt,
      clientName: `${log.user.firstName} ${log.user.lastName}`,
      clientEmail: log.user.email,
      clientPhone: log.user.phone,
      pdfUrl: log.pdfUrl || undefined,
      fullName: log.fullName || undefined,
      firstName: log.firstName || undefined,
      lastName: log.lastName || undefined,
      middleName: log.middleName || undefined,
      gender: log.gender || undefined,
      dob: log.dob || undefined,
      phone: log.phone || undefined,
      address: log.address || undefined,
      userData: log.userData || undefined,
      providerUsed: log.providerUsed || "DATAVERIFY",
    }));

    return NextResponse.json({ pipeline: formattedLogs });
  } catch (error) {
    console.error("❌ BVN Admin Pipeline API Error:", error);
    return NextResponse.json({ error: "Failed to fetch BVN pipeline" }, { status: 500 });
  }
}
