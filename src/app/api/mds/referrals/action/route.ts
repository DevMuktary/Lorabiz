import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await prisma.user.findFirst({ where: { email: session.user.email, role: "ADMIN" } });
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { actionType, withdrawalId, settings } = body;

    if (actionType === "UPDATE_SETTINGS") {
      if (!settings || typeof settings !== 'object') {
        return NextResponse.json({ error: "Invalid settings payload." }, { status: 400 });
      }

      // Use a transaction to safely upsert all provided settings dynamically
      await prisma.$transaction(
        Object.entries(settings).map(([key, value]) => 
          prisma.globalSetting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) }
          })
        )
      );
      
      return NextResponse.json({ success: true, message: "Partner Program settings updated successfully." });
    }

    if (actionType === "APPROVE_PAYOUT") {
      await prisma.referralWithdrawal.update({ where: { id: withdrawalId }, data: { status: "PAID" } });
      return NextResponse.json({ success: true, message: "Payout marked as Paid." });
    }

    if (actionType === "REJECT_PAYOUT") {
      const withdrawal = await prisma.referralWithdrawal.findUnique({ where: { id: withdrawalId } });
      if (!withdrawal || withdrawal.status !== "PENDING") return NextResponse.json({ error: "Invalid withdrawal." }, { status: 400 });

      await prisma.$transaction(async (tx) => {
        await tx.referralWithdrawal.update({ where: { id: withdrawalId }, data: { status: "REJECTED" } });
        await tx.user.update({ where: { id: withdrawal.userId }, data: { referralBalance: { increment: withdrawal.amount } } });
      });

      return NextResponse.json({ success: true, message: "Payout rejected and funds returned to user's referral balance." });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Referral Action Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
