import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import {
  sendBvnModificationProcessingEmail,
  sendBvnModificationCompletedEmail,
  sendBvnModificationRejectedEmail,
} from "@/lib/email";
import { MODIFICATION_OPTIONS } from "@/app/api/bvn/modification/route";

export const dynamic = "force-dynamic";

// GET: Fetch all BVN modification requests for MDS Admin review
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const staffUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!staffUser || staffUser.role === "USER") {
      return NextResponse.json({ success: false, message: "Access forbidden. Admin only." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { trackingId: { contains: search, mode: "insensitive" } },
        { bvn: { contains: search, mode: "insensitive" } },
        { currentFullName: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const requests = await prisma.bvnModificationRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error: any) {
    console.error("❌ MDS BVN Modification GET Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load BVN modifications." },
      { status: 500 }
    );
  }
}

// POST/PATCH: Update request status (PROCESSING, COMPLETED, or REJECTED with refund)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const staffUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!staffUser || staffUser.role === "USER") {
      return NextResponse.json({ success: false, message: "Access forbidden. Admin only." }, { status: 403 });
    }

    const body = await req.json();
    const { id, action, adminNotes, rejectionReason, slipUrl } = body;

    if (!id || !action) {
      return NextResponse.json({ success: false, message: "Missing request ID or action." }, { status: 400 });
    }

    const modification = await prisma.bvnModificationRequest.findUnique({
      where: { id },
      include: { user: { include: { wallet: true } } },
    });

    if (!modification) {
      return NextResponse.json({ success: false, message: "BVN Modification request not found." }, { status: 404 });
    }

    const modLabel = (modification.modificationCategory && MODIFICATION_OPTIONS[modification.modificationCategory]?.label) || modification.type;

    // 1. ACTION: MARK AS PROCESSING / IN REVIEW
    if (action === "PROCESSING") {
      const updated = await prisma.bvnModificationRequest.update({
        where: { id },
        data: {
          status: "PROCESSING",
          adminNotes: adminNotes || modification.adminNotes,
        },
      });

      await prisma.inAppNotification.create({
        data: {
          userId: modification.userId,
          title: "BVN Modification In Progress",
          message: `Your BVN modification request (${modification.trackingId}) is currently being processed on NIBSS.`,
          type: "info",
          link: "/dashboard/bvn/modification/history",
        },
      });

      // Send Processing Email
      sendBvnModificationProcessingEmail({
        to: modification.user.email,
        firstName: modification.user.firstName || "Valued Client",
        trackingId: modification.trackingId,
        modificationType: modLabel,
        bvn: modification.bvn,
        adminNotes: adminNotes || modification.adminNotes,
      }).catch((err) => console.error("❌ Failed to send BVN processing email:", err));

      return NextResponse.json({ success: true, message: "Marked as processing.", request: updated });
    }

    // 2. ACTION: COMPLETE / APPROVE WITH SLIP
    if (action === "COMPLETE") {
      const updated = await prisma.bvnModificationRequest.update({
        where: { id },
        data: {
          status: "COMPLETED",
          slipUrl: slipUrl || modification.slipUrl,
          adminNotes: adminNotes || modification.adminNotes,
        },
      });

      await prisma.inAppNotification.create({
        data: {
          userId: modification.userId,
          title: "BVN Modification Completed! 🎉",
          message: `Your BVN modification request (${modification.trackingId}) has been successfully completed. You can download your updated slip.`,
          type: "success",
          link: "/dashboard/bvn/modification/history",
        },
      });

      // Send Completed Email
      sendBvnModificationCompletedEmail({
        to: modification.user.email,
        firstName: modification.user.firstName || "Valued Client",
        trackingId: modification.trackingId,
        modificationType: modLabel,
        bvn: modification.bvn,
        slipUrl: slipUrl || modification.slipUrl,
        adminNotes: adminNotes || modification.adminNotes,
      }).catch((err) => console.error("❌ Failed to send BVN completed email:", err));

      return NextResponse.json({ success: true, message: "Request approved and completed.", request: updated });
    }

    // 3. ACTION: REJECT WITH AUTOMATIC WALLET REFUND
    if (action === "REJECT") {
      if (!rejectionReason || rejectionReason.trim().length < 3) {
        return NextResponse.json({ success: false, message: "A clear rejection reason is required." }, { status: 400 });
      }

      if (modification.isRefunded) {
        return NextResponse.json({ success: false, message: "This request has already been refunded." }, { status: 400 });
      }

      const refundAmount = modification.amountPaid;
      const refundRef = `REFUND-BVN-${modification.trackingId}-${crypto.randomBytes(2).toString("hex")}`;

      const result = await prisma.$transaction(async (tx) => {
        // Refund user wallet
        const updatedWallet = await tx.wallet.update({
          where: { userId: modification.userId },
          data: {
            balance: {
              increment: refundAmount,
            },
          },
        });

        // Record refund ledger
        await tx.transaction.create({
          data: {
            walletId: modification.user.wallet!.id,
            amount: refundAmount,
            balanceBefore: Number(modification.user.wallet!.balance),
            balanceAfter: Number(updatedWallet.balance),
            type: "REFUND",
            status: "SUCCESS",
            reference: refundRef,
            serviceCategory: "BVN",
            description: `Refund: BVN Modification Rejected (${modification.trackingId}) - ${rejectionReason}`,
          },
        });

        // Update request status
        const updatedReq = await tx.bvnModificationRequest.update({
          where: { id },
          data: {
            status: "REJECTED",
            rejectionReason: rejectionReason.trim(),
            adminNotes: adminNotes || modification.adminNotes,
            isRefunded: true,
            refundAmount: refundAmount,
          },
        });

        // Send in-app notification
        await tx.inAppNotification.create({
          data: {
            userId: modification.userId,
            title: "BVN Modification Rejected & Refunded",
            message: `Your BVN modification request (${modification.trackingId}) could not be completed: "${rejectionReason}". ₦${Number(refundAmount).toLocaleString()} has been refunded to your wallet.`,
            type: "warning",
            link: "/dashboard/bvn/modification/history",
          },
        });

        return updatedReq;
      });

      // Send Rejection Email
      sendBvnModificationRejectedEmail({
        to: modification.user.email,
        firstName: modification.user.firstName || "Valued Client",
        trackingId: modification.trackingId,
        modificationType: modLabel,
        bvn: modification.bvn,
        reason: rejectionReason.trim(),
        refundAmount: Number(refundAmount),
        isRefunded: true,
      }).catch((err) => console.error("❌ Failed to send BVN rejected email:", err));

      return NextResponse.json({
        success: true,
        message: `Request rejected and ₦${Number(refundAmount).toLocaleString()} refunded to user wallet.`,
        request: result,
      });
    }

    return NextResponse.json({ success: false, message: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("❌ MDS BVN Modification Action Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process request." },
      { status: 500 }
    );
  }
}
