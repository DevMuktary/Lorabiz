import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const taxRequests = await prisma.taxIdRequest.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    const pipeline = taxRequests.map(reg => ({
      id: reg.id,
      userId: reg.userId,
      type: reg.type,
      status: reg.status,
      nin: reg.nin,
      firstName: reg.firstName,
      lastName: reg.lastName,
      dob: reg.dob,
      cacNumber: reg.cacNumber,
      corporateCategory: reg.corporateCategory,
      taxIdNumber: reg.taxIdNumber,
      failureReason: reg.failureReason,
      amountPaid: reg.amountPaid,
      transactionRef: reg.transactionRef,
      createdAt: reg.createdAt.toISOString(),
      updatedAt: reg.updatedAt.toISOString(),
      clientName: `${reg.user?.firstName || ''} ${reg.user?.lastName || ''}`.trim() || 'Unknown Client',
      clientEmail: reg.user?.email || 'N/A'
    }));

    return NextResponse.json({ success: true, pipeline });
  } catch (error) {
    console.error("Fetch Tax ID Pipeline Error:", error);
    return NextResponse.json({ error: "Failed to fetch pipeline." }, { status: 500 });
  }
}
