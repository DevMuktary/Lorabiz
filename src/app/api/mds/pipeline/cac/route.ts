import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Fetch Business Names & LLCs in parallel (EXCLUDING UNSUBMITTED DRAFTS)
    const [bizNames, llcs] = await Promise.all([
      prisma.businessRegistration.findMany({
        where: { status: { not: "UNSUBMITTED" } },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          assignedStaff: { select: { firstName: true, lastName: true } }
        }
      }),
      prisma.llcRegistration.findMany({
        where: { status: { not: "UNSUBMITTED" } },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          assignedStaff: { select: { firstName: true, lastName: true } }
        }
      })
    ]);

    // 2. Normalize Business Names into standard "Tickets"
    const formattedBizNames = bizNames.map(biz => ({
      id: biz.id,
      trackingId: biz.trackingId || "PENDING-ID",
      type: "BUSINESS_NAME", // Used for strict internal logic
      displayType: "Business Name",
      proposedName: biz.proposedName,
      status: biz.status,
      createdAt: biz.createdAt,
      updatedAt: biz.updatedAt,
      clientName: `${biz.user.firstName} ${biz.user.lastName}`,
      clientEmail: biz.user.email,
      assignedStaff: biz.assignedStaff ? `${biz.assignedStaff.firstName} ${biz.assignedStaff.lastName.charAt(0)}.` : null
    }));

    // 3. Normalize LLCs into standard "Tickets"
    const formattedLlcs = llcs.map(llc => ({
      id: llc.id,
      trackingId: llc.trackingId || "PENDING-ID",
      type: "LLC", // Used for strict internal logic
      displayType: "LLC Formation",
      proposedName: llc.proposedName,
      status: llc.status,
      createdAt: llc.createdAt,
      updatedAt: llc.updatedAt,
      clientName: `${llc.user.firstName} ${llc.user.lastName}`,
      clientEmail: llc.user.email,
      assignedStaff: llc.assignedStaff ? `${llc.assignedStaff.firstName} ${llc.assignedStaff.lastName.charAt(0)}.` : null
    }));

    // 4. Combine and sort by newest first
    const unifiedPipeline = [...formattedBizNames, ...formattedLlcs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ pipeline: unifiedPipeline });

  } catch (error) {
    console.error("CAC Pipeline API Error:", error);
    return NextResponse.json({ error: "Failed to fetch CAC pipeline" }, { status: 500 });
  }
}
