import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Fetch Staff Directory
    const staff = await prisma.user.findMany({
      where: { role: "STAFF" },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isSuspended: true,
        createdAt: true,
        _count: {
          select: { staffActionLogs: true } // Get total actions performed by this staff
        }
      }
    });

    // 2. Fetch Global Audit Logs (Recent 100)
    const logs = await prisma.staffActionLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        user: { select: { firstName: true, lastName: true, role: true } }
      }
    });

    return NextResponse.json({ staff, logs });
  } catch (error) {
    console.error("Staff API Error:", error);
    return NextResponse.json({ error: "Failed to fetch staff data" }, { status: 500 });
  }
}
