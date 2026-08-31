import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
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
  if (!session?.user?.id || !session.user?.email) {
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

    // Send Security Alert Email
    try {
      await sendEmail({
        to: session.user.email,
        subject: `Security Alert: New Lorabiz ${type} API Key Generated`,
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #0f172a; margin-bottom: 12px;">New API Key Generated</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Hello ${session.user.name || "Developer"},<br><br>
              A new <strong>${type}</strong> API key (<strong>${name}</strong>) with prefix <code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${keyPrefix}</code> was generated on your Lorabiz account on ${new Date().toUTCString()}.
            </p>
            <p style="color: #dc2626; font-size: 13px; font-weight: bold; margin-top: 16px;">
              If you did not perform this action, please log into your Lorabiz Developer Portal immediately to revoke this key and secure your account.
            </p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">Lorabiz Security Team</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.warn("⚠️ Failed to dispatch API Key generation email alert:", emailErr);
    }

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

// PATCH /api/developer/keys - Rotate an existing API key
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user?.email) {
    return NextResponse.json({ status: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { keyId } = body;

    if (!keyId) {
      return NextResponse.json({ status: false, error: "MISSING_KEY_ID" }, { status: 400 });
    }

    const existingKey = await prisma.apiKey.findFirst({
      where: { id: keyId, userId: session.user.id },
    });

    if (!existingKey) {
      return NextResponse.json({ status: false, error: "KEY_NOT_FOUND" }, { status: 404 });
    }

    // Generate new secret token
    const randomHex = crypto.randomBytes(24).toString("hex");
    const prefix = existingKey.type === "LIVE" ? "lora_live_" : "lora_test_";
    const rawKey = `${prefix}${randomHex}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.slice(0, 16) + "...";

    const updatedKey = await prisma.apiKey.update({
      where: { id: existingKey.id },
      data: {
        keyHash,
        keyPrefix,
        lastUsedAt: null,
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

    // Send Security Alert Email
    try {
      await sendEmail({
        to: session.user.email,
        subject: `Security Alert: Lorabiz ${existingKey.type} API Key Rotated`,
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #0f172a; margin-bottom: 12px;">API Key Rotated</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Hello ${session.user.name || "Developer"},<br><br>
              Your <strong>${existingKey.type}</strong> API key (<strong>${existingKey.name}</strong>) was rotated on ${new Date().toUTCString()}. The previous secret key has been invalidated immediately.
            </p>
            <p style="color: #dc2626; font-size: 13px; font-weight: bold; margin-top: 16px;">
              If you did not authorize this key rotation, please contact Lorabiz support immediately.
            </p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 12px;">Lorabiz Security Team</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.warn("⚠️ Failed to dispatch API Key rotation email alert:", emailErr);
    }

    return NextResponse.json({
      status: true,
      message: "API key rotated successfully. The previous key is now invalidated. Copy your new key.",
      key: updatedKey,
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
