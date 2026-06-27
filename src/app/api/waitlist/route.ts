import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    
    // Check if user is logged in
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { service } = await req.json();

    if (!service) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }

    // Find the actual user ID from the email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Attempt to add to waitlist
    await prisma.waitlist.create({
      data: {
        userId: user.id,
        service: service,
      },
    });

    return NextResponse.json({ message: "Successfully added to waitlist" }, { status: 200 });

  } catch (error: any) {
    // P2002 is Prisma's error code for a Unique Constraint Violation
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Already on waitlist" }, { status: 409 });
    }
    console.error("WAITLIST_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
