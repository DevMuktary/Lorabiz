import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: { email: session.user.email, role: { in: ["ADMIN", "STAFF"] } },
    });
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin or Staff access required." }, { status: 403 });
    }

    const body = await req.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required." }, { status: 400 });
    }

    const originalTx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true }
    });

    if (!originalTx) {
      return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    }

    if (originalTx.status === "REVERSED") {
      return NextResponse.json({ error: "This transaction has already been refunded." }, { status: 400 });
    }

    // Process the refund atomically
    await prisma.$transaction(async (tx) => {
      // 1. Credit the user's wallet back
      const balanceBefore = Number(originalTx.wallet.balance);
      const balanceAfter = balanceBefore + Number(originalTx.amount);
      const refundRef = `REF-AIR-${Math.floor(Math.random() * 1000000000)}`;

      await tx.wallet.update({
        where: { id: originalTx.walletId },
        data: { balance: balanceAfter }
      });

      // 2. Create the REFUND transaction log
      await tx.transaction.create({
        data: {
          walletId: originalTx.walletId,
          amount: originalTx.amount,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          type: "REFUND",
          status: "SUCCESS",
          reference: refundRef,
          serviceCategory: "AIRTIME",
          description: `Refund for disputed Airtime purchase [${originalTx.reference}]`
        }
      });

      // 3. Mark the original transaction as REVERSED so it can't be refunded again
      await tx.transaction.update({
        where: { id: originalTx.id },
        data: { status: "REVERSED" }
      });

      // 4. Log the admin action
      await tx.staffActionLog.create({
        data: {
          userId: admin.id,
          action: "AIRTIME_REFUND",
          targetId: originalTx.id,
          details: `Admin refunded ₦${originalTx.amount} for Airtime Reference: ${originalTx.reference}`
        }
      });
    });

    // NOTE: No emails or WhatsApp notifications are dispatched for this, per your request.

    return NextResponse.json({ success: true, message: `Airtime transaction refunded successfully.` });
  } catch (error) {
    console.error("Airtime Action API Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
