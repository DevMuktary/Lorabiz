import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function WelcomeBanner() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) return null;

  // 1. Live Check: Is the program active globally?
  const isReferralActiveSetting = await prisma.globalSetting.findUnique({
    where: { key: 'REFERRAL_ACTIVE' }
  });
  
  const isReferralActive = !isReferralActiveSetting || isReferralActiveSetting.value === 'true';

  if (!isReferralActive) return null;

  // 2. Fetch the specific welcome code for this user
  const shortId = session.user.id.slice(-6).toUpperCase();
  const welcomePromo = await prisma.promoCode.findUnique({
    where: { code: `WELCOME-${shortId}` }
  });

  // 3. Only show if the code exists AND has never been used
  if (!welcomePromo || welcomePromo.timesUsed > 0) return null;

  return (
    <div className="bg-[#ff3f7a]/10 border border-[#ff3f7a]/20 text-foreground p-5 rounded-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h3 className="font-bold text-lg text-[#ff3f7a] flex items-center gap-2">
          🎉 Welcome to LoraBiz!
        </h3>
        <p className="text-sm mt-1 text-muted-foreground leading-relaxed">
          Because you were invited, you have an exclusive <strong>{welcomePromo.discountPct}% discount</strong> on your first compliance service. 
        </p>
      </div>
      <div className="mt-4 md:mt-0 flex items-center gap-3 bg-background p-2 rounded-xl border border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-2">Use Code:</span>
        <span className="font-mono font-bold text-[#ff3f7a] bg-[#ff3f7a]/10 px-3 py-1.5 rounded-lg select-all">
          {welcomePromo.code}
        </span>
      </div>
    </div>
  );
}
