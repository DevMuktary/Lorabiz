import { NextResponse } from "next/server";
import { getMobileAuthUser } from "@/lib/mobile-auth";

export async function GET(req: Request) {
  try {
    const user = await getMobileAuthUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized or session expired." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`.trim(),
        phone: user.phone,
        role: user.role,
        image: user.image,
        isProfileComplete: user.isProfileComplete,
        twoFactorEnabled: user.twoFactorEnabled,
        referralCode: user.referralCode,
        wallet: {
          id: user.wallet?.id,
          balance: Number(user.wallet?.balance || 0),
        },
      },
    });
  } catch (error: any) {
    console.error("Mobile Session API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
