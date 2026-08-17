// src/app/api/mds/pipeline/nin-validation/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const validationRequests = await prisma.ninValidationRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    const pipeline = validationRequests.map((req) => ({
      id: req.id,
      userId: req.userId,
      category: req.category,
      nin: req.nin,
      status: req.status,
      amountCharged: Number(req.amountCharged),
      transactionRef: req.transactionRef,
      failureReason: req.failureReason,
      adminNotes: req.adminNotes,
      completedAt: req.completedAt ? req.completedAt.toISOString() : null,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
      clientName: `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim() || "Unknown Client",
      clientEmail: req.user?.email || "N/A",
      clientPhone: req.user?.phone || "N/A",
    }));

    return NextResponse.json({ success: true, pipeline });
  } catch (error) {
    console.error("Fetch NIN Validation Pipeline Error:", error);
    return NextResponse.json({ error: "Failed to fetch validation pipeline." }, { status: 500 });
  }
}
