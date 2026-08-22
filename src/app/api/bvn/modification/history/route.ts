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
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    const requests = await prisma.bvnModificationRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      total: requests.length,
      pending: requests.filter((r) => r.status === "PENDING").length,
      processing: requests.filter((r) => r.status === "PROCESSING").length,
      completed: requests.filter((r) => r.status === "COMPLETED").length,
      rejected: requests.filter((r) => r.status === "REJECTED").length,
    };

    return NextResponse.json({
      success: true,
      requests,
      stats,
      walletBalance: Number(user.wallet?.balance || 0),
    });
  } catch (error: any) {
    console.error("❌ BVN Modification History Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load BVN modification history." },
      { status: 500 }
    );
  }
}
