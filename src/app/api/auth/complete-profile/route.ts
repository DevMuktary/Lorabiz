import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { Gender } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ message: "Unauthorized. Please sign in again." }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await req.json();

    const {
      phone,
      whatsapp,
      gender,
      state,
      lga,
      street,
      buildingNo,
      referralCode,
      termsAccepted,
    } = body;

    if (!phone || !phone.trim()) {
      return NextResponse.json({ message: "Phone number is required." }, { status: 400 });
    }

    if (!state || !state.trim()) {
      return NextResponse.json({ message: "State is required." }, { status: 400 });
    }

    if (!lga || !lga.trim()) {
      return NextResponse.json({ message: "LGA is required." }, { status: 400 });
    }

    if (!termsAccepted) {
      return NextResponse.json({ message: "You must accept the Terms and Conditions." }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    const cleanWhatsapp = (whatsapp || phone).trim();

    // Check if user is already complete
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, isProfileComplete: true },
    });

    if (currentUser?.phone) {
      return NextResponse.json({
        success: true,
        message: "Profile is already completed.",
      });
    }

    // Check duplicate phone or whatsapp on other accounts
    const existingConflict = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        OR: [
          { phone: cleanPhone },
          { whatsapp: cleanWhatsapp },
        ],
      },
    });

    if (existingConflict) {
      return NextResponse.json({ message: "This phone number is already registered. Please use your personal number." }, { status: 409 });
    }

    // Process referral code
    const cookieStore = await cookies();
    const cookieRef = cookieStore.get("lorabiz_ref")?.value;
    const rawRefCode = (referralCode || cookieRef || "")?.trim();

    let matchedReferrer: { id: string; referralCode: string | null } | null = null;
    if (rawRefCode) {
      matchedReferrer = await prisma.user.findFirst({
        where: {
          id: { not: userId }, // Prevent self-referral
          referralCode: {
            equals: rawRefCode,
            mode: "insensitive",
          },
          isSuspended: false,
        },
        select: { id: true, referralCode: true },
      });
    }

    // Update user record
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          phone: cleanPhone,
          whatsapp: cleanWhatsapp,
          gender: gender ? (gender as Gender) : undefined,
          state: state.trim(),
          lga: lga.trim(),
          street: street?.trim() || null,
          buildingNo: buildingNo?.trim() || null,
          isProfileComplete: true,
          referredBy: matchedReferrer?.referralCode || undefined,
        },
      });

      // Record referral link if valid
      if (matchedReferrer && matchedReferrer.referralCode) {
        const existingRefRecord = await tx.referral.findFirst({
          where: { referredUserId: userId },
        });

        if (!existingRefRecord) {
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

          await tx.referral.create({
            data: {
              referrerId: matchedReferrer.id,
              referredUserId: userId,
              expiresAt: oneYearFromNow,
            },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Profile completed successfully.",
    });
  } catch (error: any) {
    console.error("Complete profile error:", error);
    return NextResponse.json({ message: error?.message || "Failed to complete profile." }, { status: 500 });
  }
}
