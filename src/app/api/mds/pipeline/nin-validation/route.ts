import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: { email: session.user.email, role: { in: ["ADMIN", "STAFF"] } }
    });
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin or Staff access required." }, { status: 403 });
    }
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
