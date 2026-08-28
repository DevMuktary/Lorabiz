"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X, WhatsappLogo, ArrowUpRight, BellRinging, Sparkle } from "@phosphor-icons/react";

export function WelcomeBanner() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    // Only show on dashboard pages
    if (!pathname.startsWith("/dashboard")) {
      return;
    }
    
    // Check if user dismissed recently
    const isDismissed = localStorage.getItem("lorabiz_whatsapp_channel_banner_dismissed");
    if (!isDismissed) {
      setDismissed(false);
    }
  }, [pathname]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("lorabiz_whatsapp_channel_banner_dismissed", "true");
    } catch {
      // ignore storage errors
    }
  };

  if (dismissed) return null;

  return (
    <div className="bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/25 text-foreground p-4 sm:p-5 rounded-2xl mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in zoom-in-95 duration-300 relative text-left overflow-hidden">
      {/* Dismiss Button */}
      <button 
        onClick={handleDismiss}
        className="absolute top-2.5 right-2.5 p-1.5 text-muted-foreground hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-full transition-colors cursor-pointer"
        aria-label="Dismiss banner"
        title="Dismiss announcement"
      >
        <X className="h-4 w-4" weight="bold" />
      </button>

      {/* Left: Icon & Text */}
      <div className="flex items-start gap-3.5 pr-6 md:pr-0">
        <div className="h-11 w-11 rounded-2xl bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
          <WhatsappLogo className="h-6 w-6" weight="fill" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-[#25D366]/20 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-[#25D366]/30">
              <Sparkle weight="fill" className="h-2.5 w-2.5 text-[#25D366]" />
              Official Updates Channel
            </span>
          </div>
          <h3 className="font-black text-sm sm:text-base text-foreground tracking-tight">
            Join Our WhatsApp Channel for Announcements &amp; Updates
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-medium">
            Get instant notifications on portal server status, new services, regulatory changes, and exclusive compliance announcements in real-time.
          </p>
        </div>
      </div>

      {/* Right: Direct Action Button */}
      <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto pt-1 md:pt-0">
        <a
          href="https://whatsapp.com/channel/0029VbDVwWbFnSz6VvpMKl3M"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer text-center"
        >
          <WhatsappLogo className="h-4 w-4" weight="fill" />
          <span>Join Channel</span>
          <ArrowUpRight className="h-3.5 w-3.5" weight="bold" />
        </a>
      </div>
    </div>
  );
}
