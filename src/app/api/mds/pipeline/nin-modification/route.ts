import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "SUPERADMIN")) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const [requests, consents]: [any[], any[]] = await Promise.all([
      prisma.ninModificationRequest.findMany({
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
                select: { balance: true },
              },
            },
          },
        },
      }),
      prisma.ninModificationConsent.findMany({
        orderBy: { agreedAt: "desc" },
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
      }),
    ]);

    const pipeline = requests.map((req) => ({
      id: req.id,
      trackingId: req.trackingId,
      userId: req.userId,
      type: req.type,
      status: req.status,
      nin: req.nin,
      currentPhone: req.currentPhone,
      newFirstName: req.newFirstName,
      newLastName: req.newLastName,
      newMiddleName: req.newMiddleName,
      currentFullName: req.currentFullName,
      newPhoneNumber: req.newPhoneNumber,
      newAddress: req.newAddress,
      newState: req.newState,
      newLga: req.newLga,
      adminNotes: req.adminNotes,
      rejectionReason: req.rejectionReason,
      slipUrl: req.slipUrl,
      amountPaid: Number(req.amountPaid),
      refundAmount: req.refundAmount ? Number(req.refundAmount) : null,
      isRefunded: req.isRefunded,
      transactionRef: req.transactionRef,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
      clientName: `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim() || "Unknown Client",
      clientEmail: req.user?.email || "N/A",
      clientPhone: req.user?.phone || req.currentPhone || "N/A",
      clientBalance: req.user?.wallet ? Number(req.user.wallet.balance) : 0,
    }));

    const signedConsents = consents.map((c) => ({
      id: c.id,
      userId: c.userId,
      fullName: c.fullName,
      signature: c.signature,
      ipAddress: c.ipAddress,
      userAgent: c.userAgent,
      agreedAt: c.agreedAt.toISOString(),
      clientName: `${c.user?.firstName || ""} ${c.user?.lastName || ""}`.trim() || "Unknown",
      clientEmail: c.user?.email || "N/A",
      clientPhone: c.user?.phone || "N/A",
    }));

    return NextResponse.json({
      success: true,
      pipeline,
      consents: signedConsents,
    });
  } catch (error) {
    console.error("Fetch NIN Modification Pipeline Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch pipeline data." }, { status: 500 });
  }
}
