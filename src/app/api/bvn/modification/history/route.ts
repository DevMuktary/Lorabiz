import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const requests = await prisma.bvnModificationRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error: any) {
    console.error("❌ BVN Modification History Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load BVN modification history." },
      { status: 500 }
    );
  }
}
