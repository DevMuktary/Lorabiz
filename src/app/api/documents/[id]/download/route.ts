import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const document = await prisma.generatedDocument.findUnique({
      where: { id: id },
    });

    if (!document || document.userId !== user.id) {
      return NextResponse.json({ success: false, message: "Document not found or unauthorized access." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: document
    });

  } catch (error: any) {
    console.error("Document Fetch Error:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch document." }, { status: 500 });
  }
}
