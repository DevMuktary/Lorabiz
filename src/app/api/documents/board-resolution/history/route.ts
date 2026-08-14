import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized. Please log in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const allResolutions = await prisma.generatedDocument.findMany({
      where: {
        userId: user.id,
        documentType: "BOARD_RESOLUTION"
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        documentType: true,
        title: true,
        companyName: true,
        status: true,
        accentColor: true,
        logoUrl: true,
        formData: true,
        structuredData: true,
        pdfUrl: true,
        imageUrl: true,
        amountPaid: true,
        transactionRef: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    const completed = allResolutions.filter(r => r.status === "COMPLETED");
    const drafts = allResolutions.filter(r => r.status === "DRAFT");

    return NextResponse.json({
      success: true,
      data: {
        completed,
        drafts,
        total: allResolutions.length,
        completedCount: completed.length,
        draftsCount: drafts.length,
      }
    });

  } catch (error: any) {
    console.error("Board Resolution History API Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to load board resolution history." 
    }, { status: 500 });
  }
}
