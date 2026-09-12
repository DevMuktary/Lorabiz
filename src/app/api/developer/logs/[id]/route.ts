import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, message: "Log ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const log = await prisma.apiRequestLog.findFirst({
      where: {
        id,
        userId: user.id, // Strictly scoped to authenticated user
      },
      include: {
        apiKey: {
          select: {
            name: true,
            keyPrefix: true,
          },
        },
      },
    });

    if (!log) {
      return NextResponse.json({ success: false, message: "Log record not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: log,
    });
  } catch (err) {
    console.error("❌ [Developer Log Detail GET] Error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
