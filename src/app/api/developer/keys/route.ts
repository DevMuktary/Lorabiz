import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// GET /api/developer/keys - List developer API keys
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ status: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const keys = await prisma.apiKey.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        type: true,
        ipWhitelist: true,
        rateLimit: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ status: true, keys });
  } catch (error: any) {
    return NextResponse.json({ status: false, error: error.message }, { status: 500 });
  }
}

// POST /api/developer/keys - Generate a new API key
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ status: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = (body.name || "Default Key").trim();
    const type = body.type === "LIVE" ? "LIVE" : "SANDBOX";
    const ipWhitelist = Array.isArray(body.ipWhitelist)
      ? body.ipWhitelist.map((ip: string) => String(ip).trim()).filter(Boolean)
      : [];

    // Generate cryptographically secure random key
    const randomHex = crypto.randomBytes(24).toString("hex");
    const prefix = type === "LIVE" ? "lora_live_" : "lora_test_";
    const rawKey = `${prefix}${randomHex}`;

    // SHA-256 hash for database storage
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.slice(0, 16) + "...";

    const newKey = await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        name,
        type,
        keyPrefix,
        keyHash,
        ipWhitelist,
        rateLimit: type === "LIVE" ? 300 : 120,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        type: true,
        ipWhitelist: true,
        rateLimit: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Return the rawKey ONCE to the user
    return NextResponse.json({
      status: true,
      message: "API key generated successfully. Copy your secret key now—it will not be shown again.",
      key: newKey,
      rawKey,
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/developer/keys - Revoke an API key
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ status: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("keyId");

    if (!keyId) {
      return NextResponse.json({ status: false, error: "MISSING_KEY_ID" }, { status: 400 });
    }

    await prisma.apiKey.deleteMany({
      where: {
        id: keyId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ status: true, message: "API key revoked successfully." });
  } catch (error: any) {
    return NextResponse.json({ status: false, error: error.message }, { status: 500 });
  }
}
