import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized access." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        wallet: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const requests = await prisma.ninModificationRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        trackingId: true,
        type: true,
        status: true,
        nin: true,
        currentPhone: true,
        newFirstName: true,
        newLastName: true,
        newMiddleName: true,
        currentFullName: true,
        newPhoneNumber: true,
        newAddress: true,
        newState: true,
        newLga: true,
        adminNotes: true,
        rejectionReason: true,
        slipUrl: true,
        amountPaid: true,
        refundAmount: true,
        isRefunded: true,
        transactionRef: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Mask NIN for safe display (e.g., "123****7890")
    const formatted = requests.map((req) => ({
      ...req,
      amountPaid: Number(req.amountPaid),
      refundAmount: req.refundAmount ? Number(req.refundAmount) : null,
      ninMasked: req.nin ? `${req.nin.slice(0, 3)}****${req.nin.slice(-4)}` : "N/A",
    }));

    const total = formatted.length;
    const pending = formatted.filter((r) => r.status === "PENDING").length;
    const processing = formatted.filter((r) => r.status === "PROCESSING").length;
    const completed = formatted.filter((r) => r.status === "COMPLETED").length;
    const rejected = formatted.filter((r) => r.status === "REJECTED").length;

    return NextResponse.json({
      success: true,
      requests: formatted,
      stats: {
        total,
        pending,
        processing,
        completed,
        rejected,
      },
      walletBalance: user.wallet?.balance ? Number(user.wallet.balance) : 0,
    });
  } catch (error) {
    console.error("Error fetching NIN Modification history:", error);
    return NextResponse.json({ success: false, message: "Failed to load history." }, { status: 500 });
  }
}
