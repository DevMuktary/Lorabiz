import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

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
    const scumlRegistrations = await prisma.scumlRegistration.findMany({
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

    const pipeline = scumlRegistrations.map(reg => ({
      id: reg.id,
      userId: reg.userId,
      type: reg.type,
      companyName: reg.companyName,
      status: reg.status,
      transactionRef: reg.transactionRef,
      amountPaid: reg.amountPaid,
      certificateUrl: reg.certificateUrl,
      statusReportUrl: reg.statusReportUrl,
      memorandumUrl: reg.memorandumUrl,
      constitutionUrl: reg.constitutionUrl,
      finalCertificateUrl: reg.finalCertificateUrl,
      failureReason: reg.failureReason,
      createdAt: reg.createdAt.toISOString(),
      updatedAt: reg.updatedAt.toISOString(),
      clientName: `${reg.user?.firstName || ''} ${reg.user?.lastName || ''}`.trim() || 'Unknown Client',
      clientEmail: reg.user?.email || 'N/A'
    }));

    return NextResponse.json({ success: true, pipeline });
  } catch (error) {
    console.error("Fetch SCUML Pipeline Error:", error);
    return NextResponse.json({ error: "Failed to fetch pipeline." }, { status: 500 });
  }
}
