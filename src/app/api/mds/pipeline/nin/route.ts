import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const ninLogs = await prisma.ninRequestLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    const formattedLogs = ninLogs.map(log => ({
      id: log.id,
      reference: log.reference,
      ninMasked: log.ninMasked,
      slipType: log.slipType,
      amountCharged: Number(log.amountCharged),
      status: log.status,
      createdAt: log.createdAt,
      clientName: `${log.user.firstName} ${log.user.lastName}`,
      clientEmail: log.user.email,
    }));

    return NextResponse.json({ pipeline: formattedLogs });
  } catch (error) {
    console.error("NIN Pipeline API Error:", error);
    return NextResponse.json({ error: "Failed to fetch NIN pipeline" }, { status: 500 });
  }
}
