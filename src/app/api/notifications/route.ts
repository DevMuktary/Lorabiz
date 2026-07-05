import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET: Fetch recent notifications for logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) return NextResponse.json({ success: false }, { status: 404 });

  const notifications = await prisma.inAppNotification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20, // Keep dropdown fast
  });

  return NextResponse.json({ success: true, notifications });
}

// PATCH: Mark all notifications as read
export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ success: false }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ success: false }, { status: 404 });

  await prisma.inAppNotification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}
