"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X, Sparkle, Tag } from "@phosphor-icons/react";

export function WelcomeBanner() {
  const pathname = usePathname();
  const [promo, setPromo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only fetch and show on the exact dashboard home
    if (pathname !== "/dashboard") {
        setLoading(false);
        return;
    }
    
    fetch("/api/user/welcome-promo")
      .then(res => res.json())
      .then(data => {
        if (data.show) setPromo(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pathname]);

  if (pathname !== "/dashboard" || loading || !promo || dismissed) return null;

  return (
    <div className="bg-primary/10 border border-primary/20 text-foreground p-5 rounded-2xl mb-6 flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm animate-in fade-in zoom-in-95 duration-300 relative">
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:bg-primary/20 hover:text-primary rounded-full transition-colors cursor-pointer"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" weight="bold" />
      </button>
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <Sparkle className="h-5 w-5" weight="fill" />
        </div>
        <div>
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            Welcome to LoraBiz Promotion
          </h3>
          <p className="text-xs sm:text-sm mt-0.5 text-muted-foreground leading-relaxed pr-6 md:pr-0">
            Exclusive referral perk: enjoy an additional <strong>{promo.discountPct}% discount</strong> on your first compliance order.
          </p>
        </div>
      </div>
      <div className="mt-4 md:mt-0 flex items-center gap-2.5 bg-background p-2 rounded-xl border border-border shrink-0 self-stretch sm:self-auto">
        <Tag className="h-4 w-4 text-primary ml-1" weight="bold" />
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Code:</span>
        <span className="font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg select-all text-sm">
          {promo.code}
        </span>
      </div>
    </div>
  );
}

