import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [bizNames, llcs, staffList] = await Promise.all([
      prisma.businessRegistration.findMany({
        where: { status: { not: "UNSUBMITTED" } },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignedStaff: { select: { firstName: true, lastName: true } },
          proprietors: true 
        }
      }),
      prisma.llcRegistration.findMany({
        where: { status: { not: "UNSUBMITTED" } },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignedStaff: { select: { firstName: true, lastName: true } },
          officers: true 
        }
      }),
      // Fetch available staff for assignment
      prisma.user.findMany({
        where: { role: "STAFF" },
        select: { id: true, firstName: true, lastName: true }
      })
    ]);

    const formattedBizNames = bizNames.map(biz => ({
      ...biz,
      type: "BUSINESS_NAME",
      displayType: "Business Name",
      clientName: `${biz.user.firstName} ${biz.user.lastName}`,
      clientEmail: biz.user.email,
      assignedStaff: biz.assignedStaff ? `${biz.assignedStaff.firstName} ${biz.assignedStaff.lastName.charAt(0)}.` : null,
      people: biz.proprietors 
    }));

    const formattedLlcs = llcs.map(llc => ({
      ...llc,
      type: "LLC",
      displayType: "LLC Formation",
      clientName: `${llc.user.firstName} ${llc.user.lastName}`,
      clientEmail: llc.user.email,
      assignedStaff: llc.assignedStaff ? `${llc.assignedStaff.firstName} ${llc.assignedStaff.lastName.charAt(0)}.` : null,
      people: llc.officers 
    }));

    const unifiedPipeline = [...formattedBizNames, ...formattedLlcs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ pipeline: unifiedPipeline, staff: staffList });
  } catch (error) {
    console.error("CAC Pipeline API Error:", error);
    return NextResponse.json({ error: "Failed to fetch CAC pipeline" }, { status: 500 });
  }
}
