import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { ApiKeyType } from "@prisma/client";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    let environment = "LIVE";
    try {
      const body = await req.json();
      if (body?.environment) environment = body.environment;
    } catch {
      // Body may be empty
    }

    const envEnum = String(environment).toUpperCase() === "TEST" ? ApiKeyType.TEST : ApiKeyType.LIVE;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const config = await prisma.webhookConfig.findUnique({
      where: {
        userId_environment: {
          userId: user.id,
          environment: envEnum,
        },
      },
    });

    if (!config || !config.url) {
      return NextResponse.json(
        { success: false, message: `No active ${envEnum} webhook URL configured. Please save a ${envEnum} webhook URL first.` },
        { status: 400 }
      );
    }

    const { url, secretKey } = config;
    const testPayload = {
      event: "webhook.test_ping",
      environment: envEnum.toLowerCase(),
      timestamp: new Date().toISOString(),
      developer: {
        userId: user.id,
        email: user.email,
      },
      message: `Hello from Lorabiz Developer Platform! ${envEnum} webhook connection verified successfully.`,
    };

    const payloadString = JSON.stringify(testPayload);
    const signature = crypto.createHmac("sha256", secretKey).update(payloadString).digest("hex");

    const startTime = Date.now();
    let responseStatus = 0;
    let responseText = "";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Lorabiz-Webhook-Bot/1.0",
          "X-Lorabiz-Signature": `sha256=${signature}`,
          "X-Lorabiz-Event": "webhook.test_ping",
        },
        body: payloadString,
        signal: AbortSignal.timeout(8000), // 8-second timeout
      });

      responseStatus = response.status;
      responseText = await response.text();
    } catch (networkErr: any) {
      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        success: false,
        message: `Failed to reach webhook endpoint: ${networkErr.message || "Connection timed out"}`,
        latencyMs,
      }, { status: 502 });
    }

    const latencyMs = Date.now() - startTime;
    const isSuccess = responseStatus >= 200 && responseStatus < 300;

    return NextResponse.json({
      success: isSuccess,
      message: isSuccess
        ? `Webhook endpoint responded with HTTP ${responseStatus} OK in ${latencyMs}ms.`
        : `Webhook endpoint responded with HTTP ${responseStatus} Error in ${latencyMs}ms.`,
      statusCode: responseStatus,
      latencyMs,
      responseSnippet: responseText.slice(0, 200),
    });
  } catch (err) {
    console.error("❌ [Developer Webhook Test POST] Error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
