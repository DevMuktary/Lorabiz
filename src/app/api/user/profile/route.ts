import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        phoneChangedAt: true, // Needed for frontend to know if they are in the 30-day cooldown
      }
    });

    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { firstName, lastName } = await req.json();

    if (!firstName || !lastName) {
      return NextResponse.json({ message: "First and last names are required." }, { status: 400 });
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { firstName, lastName }
    });

    return NextResponse.json({ success: true, message: "Profile updated successfully." });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
