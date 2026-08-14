import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, email, token } = body;

    if (!uid || !email || !token) {
      return NextResponse.json(
        { error: "Missing required unsubscribe parameters." },
        { status: 400 }
      );
    }

    const isValid = verifyUnsubscribeToken(uid, email, token);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired security token. Please contact support if you need assistance." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        id: uid,
        email: { equals: email.toLowerCase().trim(), mode: "insensitive" },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isSubscribedToMarketing: false },
    });

    return NextResponse.json({
      success: true,
      message: "You have successfully unsubscribed from LoraBiz marketing and promotional emails.",
    });
  } catch (error: any) {
    console.error("Unsubscribe API Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
