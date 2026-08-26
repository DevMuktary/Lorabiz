import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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

    const requests = await prisma.courtAffidavitRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          }
        }
      }
    });

    const pipeline = requests.map((req) => ({
      id: req.id,
      trackingId: req.trackingId,
      userId: req.userId,
      category: req.category,
      subCategory: req.subCategory,
      status: req.status,
      deponentFullName: req.deponentFullName,
      passportUrl: req.passportUrl,
      gender: req.gender,
      dob: req.dob,
      age: req.age,
      isAdult: req.isAdult,
      religion: req.religion,
      nationality: req.nationality,
      residentialAddress: req.residentialAddress,
      occupation: req.occupation,
      signatureUrl: req.signatureUrl,
      details: req.details,
      amountCharged: req.amountCharged,
      transactionRef: req.transactionRef,
      certificateUrl: req.certificateUrl,
      courtName: req.courtName,
      commissionerName: req.commissionerName,
      queryReason: req.queryReason,
      isRefunded: req.isRefunded,
      refundAmount: req.refundAmount,
      adminNotes: req.adminNotes,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
      completedAt: req.completedAt ? req.completedAt.toISOString() : null,
      clientName: `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim() || "Unknown User",
      clientEmail: req.user?.email || "N/A",
      clientPhone: req.user?.phoneNumber || "N/A",
    }));

    return NextResponse.json({ success: true, pipeline });
  } catch (error: any) {
    console.error("Fetch Court Affidavit Pipeline Error:", error);
    return NextResponse.json({ error: "Failed to fetch affidavit pipeline." }, { status: 500 });
  }
}
