import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import DashboardLayoutClient from "./DashboardLayoutClient";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  let welcomePromo = null;

  // 1. Live Server-Side Check for Referral Status and Unused Welcome Code
  if (session?.user?.id) {
    try {
      const isReferralActiveSetting = await prisma.globalSetting.findUnique({
        where: { key: 'REFERRAL_ACTIVE' }
      });
      
      const isReferralActive = !isReferralActiveSetting || isReferralActiveSetting.value === 'true';

      if (isReferralActive) {
        const shortId = session.user.id.slice(-6).toUpperCase();
        const promo = await prisma.promoCode.findUnique({
          where: { code: `WELCOME-${shortId}` }
        });
        
        // Only pass it down if it exists AND has not been used
        if (promo && promo.timesUsed === 0) {
          welcomePromo = promo;
        }
      }
    } catch (error) {
      console.error("Error fetching welcome promo:", error);
    }
  }

  return (
    <DashboardLayoutClient sessionData={session} welcomePromo={welcomePromo}>
      {children}
    </DashboardLayoutClient>
  );
}
