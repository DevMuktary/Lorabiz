import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const admin = await prisma.user.findFirst({
      where: { email: session.user.email, role: "ADMIN" },
    });
    if (!admin) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const { id } = await props.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
      },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: "Client or wallet not found." }, { status: 404 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { walletId: user.wallet.id },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json({
      success: true,
      clientId: user.id,
      clientName: `${user.firstName} ${user.lastName}`,
      walletBalance: Number(user.wallet.balance),
      count: transactions.length,
      transactions,
    });
  } catch (error: any) {
    console.error("Client Transactions API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch client transactions." },
      { status: 500 }
    );
  }
}
