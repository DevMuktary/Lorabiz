import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateApiKey, decryptApiKey } from "@/lib/developer/keys";
import { ApiKeyType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const envParam = searchParams.get("environment")?.toUpperCase();
    const environment = envParam === "LIVE" ? ApiKeyType.LIVE : ApiKeyType.TEST;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const keys = await prisma.apiKey.findMany({
      where: {
        userId: user.id,
        type: environment,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        encryptedKey: true,
        type: true,
        status: true,
        ipWhitelist: true,
        lastUsedAt: true,
        createdAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedKeys = keys.map((k) => {
      let rawKey: string | null = null;
      if (k.type === "TEST" && k.encryptedKey) {
        rawKey = decryptApiKey(k.encryptedKey);
      }
      return {
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        rawKey, // Available for TEST keys; strictly null for LIVE keys
        type: k.type,
        status: k.status,
        ipWhitelist: k.ipWhitelist,
        lastUsedAt: k.lastUsedAt,
        createdAt: k.createdAt,
        revokedAt: k.revokedAt,
      };
    });

    return NextResponse.json({ success: true, data: formattedKeys });
  } catch (err) {
    console.error("❌ [Developer Keys GET] Error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, type = "TEST", ipWhitelist = [] } = body;

    const trimmedName = typeof name === "string" && name.trim() ? name.trim() : "Default Key";
    const keyType = type === "LIVE" ? ApiKeyType.LIVE : ApiKeyType.TEST;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        developerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Security Gate: Live keys require an APPROVED developer profile
    if (keyType === "LIVE") {
      if (!user.developerProfile || user.developerProfile.status !== "APPROVED") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Generating a Live API Key requires an approved developer profile. Please submit your application for Live Mode activation.",
          },
          { status: 403 }
        );
      }
    }

    // Limit active keys to 5 per type
    const activeCount = await prisma.apiKey.count({
      where: {
        userId: user.id,
        type: keyType,
        status: "ACTIVE",
      },
    });

    if (activeCount >= 5) {
      return NextResponse.json(
        {
          success: false,
          message: `You have reached the maximum limit of 5 active ${keyType} API keys. Please revoke an unused key before creating a new one.`,
        },
        { status: 400 }
      );
    }

    // Generate cryptographically secure key
    const generated = generateApiKey(keyType, trimmedName);

    // Save in database
    const createdKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name: trimmedName,
        keyPrefix: generated.keyPrefix,
        keyHash: generated.keyHash,
        encryptedKey: generated.encryptedKey,
        type: keyType,
        status: "ACTIVE",
        ipWhitelist: Array.isArray(ipWhitelist) ? ipWhitelist.filter((ip) => typeof ip === "string") : [],
      },
    });

    // Return the RAW secret key ONCE
    return NextResponse.json({
      success: true,
      data: {
        id: createdKey.id,
        name: createdKey.name,
        rawKey: generated.rawKey,
        keyPrefix: createdKey.keyPrefix,
        type: createdKey.type,
        createdAt: createdKey.createdAt,
      },
    });
  } catch (err) {
    console.error("❌ [Developer Keys POST] Error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
