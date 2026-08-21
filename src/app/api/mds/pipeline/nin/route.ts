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
    const ninLogs = await prisma.ninRequestLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    const formattedLogs = ninLogs.map(log => ({
      id: log.id,
      reference: log.reference,
      ninMasked: log.ninMasked,
      slipType: log.slipType,
      amountCharged: Number(log.amountCharged),
      status: log.status,
      createdAt: log.createdAt,
      clientName: `${log.user.firstName} ${log.user.lastName}`,
      clientEmail: log.user.email,
      pdfUrl: log.pdfUrl || undefined,
      searchType: log.searchType || "NIN",
      fullName: log.fullName || undefined,
      firstName: log.firstName || undefined,
      lastName: log.lastName || undefined,
      middleName: log.middleName || undefined,
      gender: log.gender || undefined,
      dob: log.dob || undefined,
      phone: log.phone || undefined,
      address: log.address || undefined,
      userData: log.userData || undefined,
      providerUsed: log.providerUsed || "DATAVERIFY",
    }));

    return NextResponse.json({ pipeline: formattedLogs });
  } catch (error) {
    console.error("NIN Pipeline API Error:", error);
    return NextResponse.json({ error: "Failed to fetch NIN pipeline" }, { status: 500 });
  }
}
