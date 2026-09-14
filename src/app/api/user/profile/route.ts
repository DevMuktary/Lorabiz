import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        phoneChangedAt: true,
        twoFactorEnabled: true,
        twoFactorMethod: true,
        twoFactorBackupCodes: true,
        emailLoginAlerts: true,
      }
    });

    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
    const computedName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    return NextResponse.json({ 
      success: true, 
      user: {
        ...user,
        name: computedName || user.email.split("@")[0],
        backupCodesCount: user.twoFactorBackupCodes?.length || 0,
      } 
    });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Update settings / preferences (e.g. emailLoginAlerts)
export async function PUT(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const dataToUpdate: any = {};

    if (typeof body.emailLoginAlerts === "boolean") {
      dataToUpdate.emailLoginAlerts = body.emailLoginAlerts;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ message: "No valid settings provided." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: authUser.id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, message: "Settings updated successfully." });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Dedicated endpoint to update profile picture
export async function PATCH(req: Request) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ message: "Image URL is required." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: authUser.id },
      data: { image: imageUrl }
    });

    return NextResponse.json({ success: true, message: "Profile picture updated successfully." });
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
