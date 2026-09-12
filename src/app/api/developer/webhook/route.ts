import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateWebhookSecret } from "@/lib/developer/keys";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const envParam: "LIVE" | "TEST" = searchParams.get("environment")?.toUpperCase() === "TEST" ? "TEST" : "LIVE";

    const config = await prisma.webhookConfig.findUnique({
      where: {
        userId_environment: {
          userId: user.id,
          environment: envParam,
        },
      },
    });

    if (!config) {
      return NextResponse.json({ success: true, data: null, environment: envParam });
    }

    const maskedSecret =
      config.secretKey.length > 10
        ? `${config.secretKey.slice(0, 8)}••••••••${config.secretKey.slice(-4)}`
        : config.secretKey;

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        environment: config.environment,
        url: config.url,
        secretKey: config.secretKey,
        maskedSecret,
        isActive: config.isActive,
        updatedAt: config.updatedAt,
      },
    });
  } catch (err) {
    console.error("❌ [Developer Webhook GET] Error:", err);
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
    const { url, isActive = true, rotateSecret = false, environment = "LIVE" } = body;
    const envType: "LIVE" | "TEST" = String(environment).toUpperCase() === "TEST" ? "TEST" : "LIVE";

    if (!url || typeof url !== "string" || (!url.startsWith("http://") && !url.startsWith("https://"))) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid URL starting with https:// (or http:// for local testing)." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const existingConfig = await prisma.webhookConfig.findUnique({
      where: {
        userId_environment: {
          userId: user.id,
          environment: envType,
        },
      },
    });

    let secretKey = existingConfig?.secretKey;
    if (!secretKey || rotateSecret) {
      secretKey = generateWebhookSecret(envType);
    }

    const updatedConfig = await prisma.webhookConfig.upsert({
      where: {
        userId_environment: {
          userId: user.id,
          environment: envType,
        },
      },
      create: {
        userId: user.id,
        environment: envType,
        url: url.trim(),
        secretKey,
        isActive: Boolean(isActive),
      },
      update: {
        url: url.trim(),
        secretKey,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${envType} webhook configuration saved successfully.`,
      data: {
        environment: updatedConfig.environment,
        url: updatedConfig.url,
        secretKey: updatedConfig.secretKey,
        isActive: updatedConfig.isActive,
      },
    });
  } catch (err) {
    console.error("❌ [Developer Webhook POST] Error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
