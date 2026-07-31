// src/app/api/scuml/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma"; 
import { generateNumericId } from "@/utils/generateId"; 

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

    return NextResponse.json({ success: true, history });
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
    const { type, companyName, documents } = data;

    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Since Prisma requires amountPaid and transactionRef, we set placeholders.
    // These will be properly overwritten by our checkout/webhook route upon actual payment.
    const tempTransactionRef = `UNPAID_SCUML_${generateNumericId(8)}`;

    const scumlReq = await prisma.scumlRegistration.create({
      data: {
        userId: user.id,
        type,
        companyName,
        certificateUrl: documents.certificateUrl,
        statusReportUrl: documents.statusReportUrl,
        memorandumUrl: documents.memorandumUrl || null,
        constitutionUrl: documents.constitutionUrl || null,
        amountPaid: 0, 
        transactionRef: tempTransactionRef,
        status: "PENDING" // Awaiting payment
      }
    });

    // Return the created application ID so the frontend can launch the Payment Modal
    return NextResponse.json({ success: true, data: scumlReq });

  } catch (error) {
    console.error("SCUML Submission Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
