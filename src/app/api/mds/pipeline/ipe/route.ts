import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const ipeRequests = await prisma.ninIpeRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            wallet: {
              select: {
                id: true,
                balance: true,
              },
            },
          },
        },
      },
    });

    const pipeline = ipeRequests.map((req) => ({
      id: req.id,
      trackingId: req.trackingId,
      reference: req.reference,
      amountCharged: Number(req.amountCharged),
      status: req.status,
      resolvedNin: req.resolvedNin,
      fullName: req.fullName,
      dob: req.dob,
      gender: req.gender,
      photoUrl: req.photoUrl,
      failureReason: req.failureReason,
      apiMessage: req.apiMessage,
      apiResponse: req.apiResponse,
      createdAt: req.createdAt,
      completedAt: req.completedAt,
      clientName: `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim() || "Unknown Client",
      clientEmail: req.user?.email || "",
      clientPhone: req.user?.phone || "",
      walletBalance: Number(req.user?.wallet?.balance || 0),
    }));

    return NextResponse.json({
      success: true,
      pipeline,
      metrics: {
        total: pipeline.length,
        processing: pipeline.filter((p) => p.status === "PROCESSING").length,
        completed: pipeline.filter((p) => p.status === "COMPLETED").length,
        failed: pipeline.filter((p) => p.status === "FAILED").length,
      },
    });
  } catch (error: any) {
    console.error("MDS IPE Pipeline API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch IPE pipeline" },
      { status: 500 }
    );
  }
}
