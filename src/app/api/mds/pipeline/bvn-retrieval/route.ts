import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const requests = await prisma.bvnRetrievalRequest.findMany({
      orderBy: { updatedAt: "desc" },
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

    const pipeline = requests.map((item) => ({
      id: item.id,
      trackingId: item.trackingId,
      userId: item.userId,
      fullName: item.fullName,
      phone: item.phone,
      status: item.status,
      retrievedBvn: item.retrievedBvn,
      slipUrl: item.slipUrl,
      failureReason: item.failureReason,
      adminNotes: item.adminNotes,
      amountPaid: item.amountPaid,
      refundAmount: item.refundAmount,
      isRefunded: item.isRefunded,
      transactionRef: item.transactionRef,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      completedAt: item.completedAt ? item.completedAt.toISOString() : null,
      clientName: `${item.user?.firstName || ""} ${item.user?.lastName || ""}`.trim() || "Unknown Client",
      clientEmail: item.user?.email || "N/A",
      clientPhone: item.user?.phone || "N/A",
    }));

    return NextResponse.json({ success: true, pipeline });
  } catch (error) {
    console.error("Fetch BVN Retrieval Pipeline Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch BVN Retrieval pipeline." }, { status: 500 });
  }
}
