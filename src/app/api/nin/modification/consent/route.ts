import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { logUserActivity } from "@/lib/activity-logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { ninModificationConsent: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      hasConsented: !!user.ninModificationConsent,
      consent: user.ninModificationConsent
        ? {
            fullName: user.ninModificationConsent.fullName,
            agreedAt: user.ninModificationConsent.agreedAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Error checking NIN Modification consent:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized. Please log in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { ninModificationConsent: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    // If already consented, return ok
    if (user.ninModificationConsent) {
      return NextResponse.json({
        success: true,
        message: "Consent already recorded.",
        consent: {
          fullName: user.ninModificationConsent.fullName,
          agreedAt: user.ninModificationConsent.agreedAt,
        },
      });
    }

    const body = await req.json();
    const { fullName, signature } = body;

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json({ success: false, message: "Full legal name is required." }, { status: 400 });
    }

    if (!signature || typeof signature !== "string" || !signature.trim()) {
      return NextResponse.json({ success: false, message: "Digital signature is required." }, { status: 400 });
    }

    // Extract client IP and user agent for legal compliance & security audit
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "Unknown IP";
    const userAgent = req.headers.get("user-agent") || "Unknown Browser";

    const consent = await prisma.ninModificationConsent.create({
      data: {
        userId: user.id,
        fullName: fullName.trim(),
        signature: signature.trim(),
        ipAddress,
        userAgent,
      },
    });

    // Log user activity
    await logUserActivity({
      userId: user.id,
      action: "NIN_MODIFICATION_CONSENT_SIGNED",
      category: "SECURITY",
      description: `Signed NIN Modification Terms of Agreement and Legal Authorization as '${fullName.trim()}'.`,
      referenceId: consent.id,
      status: "SUCCESS",
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Terms of Agreement successfully accepted and recorded.",
      consent: {
        fullName: consent.fullName,
        agreedAt: consent.agreedAt,
      },
    });
  } catch (error) {
    console.error("Error recording NIN Modification consent:", error);
    return NextResponse.json({ success: false, message: "Failed to record consent." }, { status: 500 });
  }
}
