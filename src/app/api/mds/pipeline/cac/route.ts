import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [bizNames, llcs] = await Promise.all([
      prisma.businessRegistration.findMany({
        where: { status: { not: "UNSUBMITTED" } },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          assignedStaff: { select: { firstName: true, lastName: true } },
          proprietors: true // FETCH ALL PROPRIETOR DATA
        }
      }),
      prisma.llcRegistration.findMany({
        where: { status: { not: "UNSUBMITTED" } },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          assignedStaff: { select: { firstName: true, lastName: true } },
          officers: true // FETCH ALL OFFICER DATA
        }
      })
    ]);

    const formattedBizNames = bizNames.map(biz => ({
      id: biz.id,
      trackingId: biz.trackingId || "PENDING-ID",
      type: "BUSINESS_NAME",
      displayType: "Business Name",
      proposedName: biz.proposedName,
      altName1: biz.altName1,
      altName2: biz.altName2,
      natureOfBusiness: biz.specificNature,
      address: biz.companyAddress,
      status: biz.status,
      createdAt: biz.createdAt,
      updatedAt: biz.updatedAt,
      clientName: `${biz.user.firstName} ${biz.user.lastName}`,
      clientEmail: biz.user.email,
      assignedStaff: biz.assignedStaff ? `${biz.assignedStaff.firstName} ${biz.assignedStaff.lastName.charAt(0)}.` : null,
      people: biz.proprietors // Pass the people data to the UI
    }));

    const formattedLlcs = llcs.map(llc => ({
      id: llc.id,
      trackingId: llc.trackingId || "PENDING-ID",
      type: "LLC",
      displayType: "LLC Formation",
      proposedName: llc.proposedName,
      altName1: llc.altName1,
      altName2: llc.altName2,
      natureOfBusiness: llc.principalActivity,
      address: "See registered address object", // Simplified for UI
      status: llc.status,
      createdAt: llc.createdAt,
      updatedAt: llc.updatedAt,
      clientName: `${llc.user.firstName} ${llc.user.lastName}`,
      clientEmail: llc.user.email,
      assignedStaff: llc.assignedStaff ? `${llc.assignedStaff.firstName} ${llc.assignedStaff.lastName.charAt(0)}.` : null,
      people: llc.officers // Pass the people data to the UI
    }));

    const unifiedPipeline = [...formattedBizNames, ...formattedLlcs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ pipeline: unifiedPipeline });
  } catch (error) {
    console.error("CAC Pipeline API Error:", error);
    return NextResponse.json({ error: "Failed to fetch CAC pipeline" }, { status: 500 });
  }
}
