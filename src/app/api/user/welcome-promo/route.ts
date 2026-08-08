import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ show: false });

    // 1. Check Kill Switch
    const isReferralActiveSetting = await prisma.globalSetting.findUnique({
      where: { key: 'REFERRAL_ACTIVE' }
    });
    
    if (isReferralActiveSetting && isReferralActiveSetting.value === 'false') {
      return NextResponse.json({ show: false });
    }

    // 2. Fetch User safely by email
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });
    
    if (!dbUser) return NextResponse.json({ show: false });

    // 3. Check for unused promo
    const shortId = dbUser.id.slice(-6).toUpperCase();
    const promo = await prisma.promoCode.findUnique({
      where: { code: `WELCOME-${shortId}` }
    });

    if (promo && promo.timesUsed === 0) {
      return NextResponse.json({ 
        show: true, 
        code: promo.code, 
        discountPct: promo.discountPct 
      });
    }

    return NextResponse.json({ show: false });
  } catch (error) {
    return NextResponse.json({ show: false });
  }
}
