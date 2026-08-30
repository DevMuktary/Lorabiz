import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawCode = searchParams.get("code")?.trim();

    if (!rawCode) {
      return NextResponse.json({ success: true, valid: false, message: "No code provided" }, { status: 200 });
    }

    const matchedReferrer = await prisma.user.findFirst({
      where: {
        referralCode: {
          equals: rawCode,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        referralCode: true,
        isSuspended: true,
      },
    });

    if (!matchedReferrer || matchedReferrer.isSuspended) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: "Referral code not found or inactive",
      });
    }

    const lastNameInitial = matchedReferrer.lastName ? `${matchedReferrer.lastName.charAt(0)}.` : "";
    const referrerDisplayName = `${matchedReferrer.firstName} ${lastNameInitial}`.trim();

    return NextResponse.json({
      success: true,
      valid: true,
      code: matchedReferrer.referralCode,
      referrerName: referrerDisplayName,
    });
  } catch (error) {
    console.error("Referral validation error:", error);
    return NextResponse.json({ success: false, valid: false, message: "Validation error" }, { status: 500 });
  }
}
