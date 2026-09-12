import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { DeveloperProfileStatus } from "@prisma/client";
import { logUserActivity } from "@/lib/activity-logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { developerProfile: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (!user.developerProfile) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const profile = user.developerProfile;
    // Mask NIN for client UI security (e.g. 123*****789)
    const maskedNin =
      profile.ownerNin.length === 11
        ? `${profile.ownerNin.slice(0, 3)}*****${profile.ownerNin.slice(-3)}`
        : profile.ownerNin;

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        businessName: profile.businessName,
        websiteUrl: profile.websiteUrl,
        ownerNinMasked: maskedNin,
        useCase: profile.useCase,
        customUseCase: profile.customUseCase,
        status: profile.status,
        rejectionReason: profile.rejectionReason,
        approvedAt: profile.approvedAt,
        createdAt: profile.createdAt,
      },
    });
  } catch (err) {
    console.error("❌ [Developer Profile GET] Error:", err);
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
    const { businessName, websiteUrl, ownerNin, useCase, customUseCase } = body;

    // Strict Validations
    if (!businessName || typeof businessName !== "string" || businessName.trim().length < 2) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid Business or App Name." },
        { status: 400 }
      );
    }

    if (!ownerNin || !/^\d{11}$/.test(ownerNin.trim())) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 11-digit NIN for the account owner." },
        { status: 400 }
      );
    }

    if (!useCase || typeof useCase !== "string") {
      return NextResponse.json(
        { success: false, message: "Please select an intended use case." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { developerProfile: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // If already approved, prevent duplicate submission
    if (user.developerProfile?.status === DeveloperProfileStatus.APPROVED) {
      return NextResponse.json(
        { success: false, message: "Your developer profile has already been approved." },
        { status: 400 }
      );
    }

    const sanitizedBusinessName = businessName.trim();
    const sanitizedNin = ownerNin.trim();
    const sanitizedWebsite =
      typeof websiteUrl === "string" && websiteUrl.trim().length > 0 ? websiteUrl.trim() : null;
    const sanitizedCustomUseCase =
      useCase === "Other" && typeof customUseCase === "string" ? customUseCase.trim() : null;

    const profile = await prisma.developerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        businessName: sanitizedBusinessName,
        websiteUrl: sanitizedWebsite,
        ownerNin: sanitizedNin,
        useCase,
        customUseCase: sanitizedCustomUseCase,
        status: DeveloperProfileStatus.PENDING_APPROVAL,
      },
      update: {
        businessName: sanitizedBusinessName,
        websiteUrl: sanitizedWebsite,
        ownerNin: sanitizedNin,
        useCase,
        customUseCase: sanitizedCustomUseCase,
        status: DeveloperProfileStatus.PENDING_APPROVAL,
        rejectionReason: null, // Clear past rejection reason if resubmitting
      },
    });

    // Log Activity
    logUserActivity({
      userId: user.id,
      action: "DEVELOPER_LIVE_ACCESS_REQUESTED",
      category: "SERVICES",
      description: `Submitted application for Live API access under business name: ${sanitizedBusinessName}`,
      status: "PENDING",
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully. Our compliance team will review your profile shortly.",
      data: {
        status: profile.status,
      },
    });
  } catch (err) {
    console.error("❌ [Developer Profile POST] Error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
