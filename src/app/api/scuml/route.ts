// src/app/api/scuml/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { generateNumericId } from "@/utils/generateId";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Prisma returns all columns by default, so finalCertificateUrl and failureReason are safely included!
    const history = await prisma.scumlRegistration.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error("SCUML History Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { type, companyName, documents } = data;

    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check service killswitch
    const scumlPricing = await prisma.servicePricing.findUnique({
      where: { serviceKey: "SCUML" }
    });
    if (scumlPricing && !scumlPricing.isActive) {
      return NextResponse.json({ 
        success: false, 
        error: scumlPricing.maintenanceMsg || "SCUML registration is currently undergoing maintenance." 
      }, { status: 400 });
    }

    // Generate a unique draft key for Redis
    const draftId = `scuml_draft_${generateNumericId(8)}`;

    const payload = {
      userId: user.id,
      type,
      companyName,
      documents
    };

    // Save payload to Redis with a 24-hour expiration (86400 seconds)
    await redis.set(draftId, JSON.stringify(payload), "EX", 86400);

    // Return the cache key as the ID so the payment modal can lock onto it
    return NextResponse.json({ success: true, data: { id: draftId } });

  } catch (error) {
    console.error("SCUML Submission Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
