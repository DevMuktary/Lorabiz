import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateApiKey, invalidateKeyCache } from "@/lib/developer/keys";
import { ApiKeyStatus } from "@prisma/client";

export async function POST(
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

    // Verify key exists and belongs to user
    const existingKey = await prisma.apiKey.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingKey) {
      return NextResponse.json({ success: false, message: "API key not found" }, { status: 404 });
    }

    if (existingKey.status !== ApiKeyStatus.ACTIVE) {
      return NextResponse.json(
        { success: false, message: "Only active API keys can be rolled." },
        { status: 400 }
      );
    }

    // Generate replacement key
    const generated = generateApiKey(existingKey.type, existingKey.name);

    // Revoke old key and create new key in transaction
    const [_, newKey] = await prisma.$transaction([
      prisma.apiKey.update({
        where: { id: existingKey.id },
        data: {
          status: ApiKeyStatus.REVOKED,
          revokedAt: new Date(),
        },
      }),
      prisma.apiKey.create({
        data: {
          userId: user.id,
          name: existingKey.name,
          keyPrefix: generated.keyPrefix,
          keyHash: generated.keyHash,
          encryptedKey: generated.encryptedKey,
          type: existingKey.type,
          status: ApiKeyStatus.ACTIVE,
          ipWhitelist: existingKey.ipWhitelist,
        },
      }),
    ]);

    // Invalidate Redis cache for revoked key
    await invalidateKeyCache(existingKey.keyHash);

    return NextResponse.json({
      success: true,
      message: "API key rolled successfully. Old key is revoked and replacement is active.",
      data: {
        id: newKey.id,
        name: newKey.name,
        rawKey: generated.rawKey,
        keyPrefix: newKey.keyPrefix,
        type: newKey.type,
        createdAt: newKey.createdAt,
      },
    });
  } catch (err: any) {
    console.error("❌ [Developer Key ROLL] Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
