import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session?.user?.email || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const personalizationRequests = await prisma.ninPersonalizationRequest.findMany({
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

    const pipeline = personalizationRequests.map((req) => ({
      id: req.id,
      trackingId: req.trackingId,
      reference: req.reference,
      provider: req.provider,
      externalTxId: req.externalTxId,
      amountCharged: Number(req.amountCharged),
      status: req.status,
      resolvedNin: req.resolvedNin,
      fullName: req.fullName,
      dob: req.dob,
      gender: req.gender,
      phone: req.phone,
      residenceState: req.residenceState,
      photoUrl: req.photoUrl,
      pdfUrl: req.pdfUrl,
      userData: req.userData,
      failureReason: req.failureReason,
      adminNotes: req.adminNotes,
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
    console.error("MDS Personalization Pipeline API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch personalization pipeline" },
      { status: 500 }
    );
  }
}
