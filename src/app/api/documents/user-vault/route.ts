import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const documents = await prisma.generatedDocument.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        documentType: true,
        title: true,
        companyName: true,
        status: true,
        accentColor: true,
        logoUrl: true,
        amountPaid: true,
        transactionRef: true,
        createdAt: true,
        formData: true,
        structuredData: true,
      }
    });

    // Also fetch current document pricing for catalogue display
    const pricing = await prisma.servicePricing.findMany({
      where: {
        serviceKey: {
          startsWith: "DOC_"
        }
      }
    });

    const pricingMap: Record<string, number> = {
      DOC_BOARD_RESOLUTION: 3500,
      DOC_NDA: 5000,
      DOC_TERMS_OF_SERVICE: 7500,
      DOC_PRIVACY_POLICY: 5000,
      DOC_FOUNDERS_AGREEMENT: 10000,
      DOC_EMPLOYMENT_CONTRACT: 6000,
      DOC_SERVICE_AGREEMENT: 6000,
      DOC_MOU: 6000,
    };

    pricing.forEach(p => {
      pricingMap[p.serviceKey] = Number(p.price);
    });

    return NextResponse.json({
      success: true,
      data: {
        documents,
        pricing: pricingMap,
        totalGenerated: documents.length
      }
    });

  } catch (error: any) {
    console.error("Fetch User Documents Error:", error);
    return NextResponse.json({ success: false, message: "Failed to load documents vault." }, { status: 500 });
  }
}
