"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X } from "@phosphor-icons/react";

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
    <div className="bg-[#ff3f7a]/10 border border-[#ff3f7a]/20 text-foreground p-5 rounded-2xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm animate-in fade-in zoom-in-95 duration-500 relative">
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:bg-[#ff3f7a]/20 hover:text-[#ff3f7a] rounded-full transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" weight="bold" />
      </button>
      <div>
        <h3 className="font-bold text-lg text-[#ff3f7a] flex items-center gap-2">
          🎉 Welcome to LoraBiz!
        </h3>
        <p className="text-sm mt-1 text-muted-foreground leading-relaxed pr-6 md:pr-0">
          Because you were invited, you have an exclusive <strong>{promo.discountPct}% discount</strong> on your first compliance service. 
        </p>
      </div>
      <div className="mt-4 md:mt-0 flex items-center gap-3 bg-background p-2 rounded-xl border border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-2">Use Code:</span>
        <span className="font-mono font-bold text-[#ff3f7a] bg-[#ff3f7a]/10 px-3 py-1.5 rounded-lg select-all">
          {promo.code}
        </span>
      </div>
    </div>
  );
}
