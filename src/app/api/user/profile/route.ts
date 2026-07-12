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
        image: true, // Included
        role: true,
        phoneChangedAt: true,
      }
    });

    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Update basic details (name)
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
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Dedicated endpoint to update profile picture
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ message: "Image URL is required." }, { status: 400 });
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { image: imageUrl }
    });

    return NextResponse.json({ success: true, message: "Profile picture updated successfully." });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
