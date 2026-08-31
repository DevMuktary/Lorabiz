import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// GET /api/developer/webhooks - Fetch developer webhook endpoint
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ status: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    let webhook = await prisma.webhookEndpoint.findFirst({
      where: { userId: session.user.id },
    });

    if (!webhook) {
      // Auto-initialize webhook endpoint configuration with secret
      const secret = `whsec_${crypto.randomBytes(20).toString("hex")}`;
      webhook = await prisma.webhookEndpoint.create({
        data: {
          userId: session.user.id,
          url: "",
          secret,
          events: ["*"],
          isActive: false,
        },
      });
    }

    return NextResponse.json({ status: true, webhook });
  } catch (error: any) {
    return NextResponse.json({ status: false, error: error.message }, { status: 500 });
  }
}

// POST /api/developer/webhooks - Save / update webhook URL
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ status: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const url = String(body.url || "").trim();

    if (url && !url.startsWith("https://") && !url.startsWith("http://localhost")) {
      return NextResponse.json(
        { status: false, error: "INVALID_URL", message: "Webhook URL must start with https://" },
        { status: 400 }
      );
    }

    const existing = await prisma.webhookEndpoint.findFirst({
      where: { userId: session.user.id },
    });

    let webhook;
    if (existing) {
      webhook = await prisma.webhookEndpoint.update({
        where: { id: existing.id },
        data: {
          url,
          isActive: Boolean(url),
        },
      });
    } else {
      const secret = `whsec_${crypto.randomBytes(20).toString("hex")}`;
      webhook = await prisma.webhookEndpoint.create({
        data: {
          userId: session.user.id,
          url,
          secret,
          events: ["*"],
          isActive: Boolean(url),
        },
      });
    }

    return NextResponse.json({
      status: true,
      message: "Webhook configuration saved successfully.",
      webhook,
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, error: error.message }, { status: 500 });
  }
}
