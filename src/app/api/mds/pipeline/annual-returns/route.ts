// src/app/api/mds/pipeline/annual-returns/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: { email: session.user.email, role: { in: ["ADMIN", "STAFF"] } },
    });
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin or Staff access required." }, { status: 403 });
    }

    const requests = await prisma.cacAnnualReturnRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const pipeline = requests.map((req) => ({
      id: req.id,
      trackingId: req.trackingId,
      userId: req.userId,
      companyType: req.companyType,
      companyName: req.companyName,
      registrationNumber: req.registrationNumber,
      filingYears: req.filingYears,
      documentType: req.documentType,
      documentUrl: req.documentUrl,
      designeeFullName: req.designeeFullName,
      designeeRole: req.designeeRole,
      designeeSignatureUrl: req.designeeSignatureUrl,
      status: req.status,
      queryReason: req.queryReason,
      rejectionReason: req.rejectionReason,
      adminNotes: req.adminNotes,
      acknowledgementLetterUrl: req.acknowledgementLetterUrl,
      approvedAt: req.approvedAt ? req.approvedAt.toISOString() : null,
      amountPaid: Number(req.amountPaid),
      transactionRef: req.transactionRef,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
      clientName: `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim() || "Unknown Client",
      clientEmail: req.user?.email || "N/A",
      clientPhone: req.user?.phone || "N/A",
    }));

    return NextResponse.json({ success: true, pipeline });
  } catch (error: any) {
    console.error("Fetch MDS Annual Returns Pipeline Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch Annual Returns pipeline." },
      { status: 500 }
    );
  }
}
