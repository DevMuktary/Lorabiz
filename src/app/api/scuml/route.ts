// src/app/api/scuml/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma"; // FIXED: Changed to named import
import { generateNumericId } from "@/utils/generateId"; // FIXED: Corrected function name

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Fetch user's SCUML history
    const history = await prisma.scumlRegistration.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("SCUML History Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { type, companyName, documents, price } = data;

    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      include: { wallet: true }
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: "User or wallet not found" }, { status: 404 });
    }

    // Check Wallet Balance
    if (Number(user.wallet.balance) < price) {
      return NextResponse.json({ error: "Insufficient wallet balance." }, { status: 400 });
    }

    // FIXED: Using generateNumericId here
    const transactionRef = `SCUML-${generateNumericId(10)}`;

    // Process Transaction & Create Application atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct from wallet
      const updatedWallet = await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { balance: { decrement: price } }
      });

      // 2. Record Transaction
      await tx.transaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: price,
          balanceBefore: user.wallet!.balance,
          balanceAfter: updatedWallet.balance,
          type: "DEBIT",
          status: "SUCCESS",
          reference: transactionRef,
          description: `SCUML Registration Fee for ${companyName}`
        }
      });

      // 3. Create SCUML Record
      const scumlReq = await tx.scumlRegistration.create({
        data: {
          userId: user.id,
          type,
          companyName,
          certificateUrl: documents.certificateUrl,
          statusReportUrl: documents.statusReportUrl,
          memorandumUrl: documents.memorandumUrl || null,
          constitutionUrl: documents.constitutionUrl || null,
          amountPaid: price,
          transactionRef
        }
      });

      return scumlReq;
    });

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error("SCUML Submission Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
