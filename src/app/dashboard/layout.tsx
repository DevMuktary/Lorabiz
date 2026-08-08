import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import DashboardLayoutClient from "./DashboardLayoutClient";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  
  let welcomePromo = null;

  // 1. Live Server-Side Check using email (since NextAuth types don't include id by default)
  if (session?.user?.email) {
    try {
      const isReferralActiveSetting = await prisma.globalSetting.findUnique({
        where: { key: 'REFERRAL_ACTIVE' }
      });
      
      const isReferralActive = !isReferralActiveSetting || isReferralActiveSetting.value === 'true';

      if (isReferralActive) {
        // Fetch the user from the DB to get their ID safely for TypeScript
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true }
        });

        if (dbUser) {
          const shortId = dbUser.id.slice(-6).toUpperCase();
          const promo = await prisma.promoCode.findUnique({
            where: { code: `WELCOME-${shortId}` }
          });
          
          if (promo && promo.timesUsed === 0) {
            welcomePromo = promo;
          }
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
