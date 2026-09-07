import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { invalidateKeyCache } from "@/lib/developer/keys";
import { ApiKeyStatus } from "@prisma/client";

export async function DELETE(
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
      return NextResponse.json({ success: false, message: "Key ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Verify key belongs to user
    const existingKey = await prisma.apiKey.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingKey) {
      return NextResponse.json({ success: false, message: "API key not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const isPermanent = searchParams.get("permanent") === "true";

    // If key is already revoked OR permanent deletion is requested: delete permanently
    if (existingKey.status === ApiKeyStatus.REVOKED || isPermanent) {
      await invalidateKeyCache(existingKey.keyHash);
      await prisma.apiKey.delete({
        where: { id: existingKey.id },
      });
      return NextResponse.json({
        success: true,
        message: "API key permanently deleted",
      });
    }

    // Update status to REVOKED
    await prisma.apiKey.update({
      where: { id: existingKey.id },
      data: {
        status: ApiKeyStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    // Invalidate Redis cache immediately
    await invalidateKeyCache(existingKey.keyHash);

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (err) {
    console.error("❌ [Developer Key DELETE] Error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
