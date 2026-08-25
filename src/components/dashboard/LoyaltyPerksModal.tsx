"use client";

import { 
  X, 
  Check, 
  Crown, 
  Info,
  Lightning,
  Sparkle
} from "@phosphor-icons/react";
import { TierConfig, LOYALTY_TIERS } from "@/lib/loyalty";

interface LoyaltyPerksModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTierLevel?: string;
  allTimeSpend?: number;
}

export default function LoyaltyPerksModal({
  isOpen,
  onClose,
  currentTierLevel = "TIER_1",
  allTimeSpend = 0,
}: LoyaltyPerksModalProps) {
  if (!isOpen) return null;

  const tiers = Object.values(LOYALTY_TIERS);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 dark:bg-background/80 backdrop-blur-md animate-in fade-in duration-150" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl max-h-[88vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 z-10">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-secondary/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#ff3f7a]/10 border border-[#ff3f7a]/20 flex items-center justify-center text-[#ff3f7a] shrink-0">
              <Crown size={18} weight="fill" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight leading-tight">
                VIP Agent Loyalty Tiers
              </h2>
              <p className="text-[11px] text-muted-foreground font-medium">
                Automatic rank upgrades based on confirmed service spend.
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-secondary hover:bg-secondary/80 border border-border text-foreground flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar text-left">
          
          {/* Tiers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tiers.map((tier: TierConfig) => {
              const isCurrent = tier.level === currentTierLevel;

              return (
                <div 
                  key={tier.level}
                  className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                    isCurrent 
                      ? "bg-secondary/70 border-[#ff3f7a] ring-2 ring-[#ff3f7a]/25 shadow-md" 
                      : "bg-secondary/20 border-border/70 hover:border-border"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#ff3f7a] text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                      Your Tier
                    </span>
                  )}

                  <div className="space-y-2.5">
                    {/* Top Tier Badge & Level */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xl">{tier.badge.split(" ")[0]}</span>
                      <span className="font-mono text-[10px] font-black uppercase text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-md border border-border/50">
                        Level {tier.tierNumber}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-sm text-foreground leading-tight">
                        {tier.name}
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                        {tier.maxSpend 
                          ? `₦${tier.minSpend.toLocaleString()} – ₦${tier.maxSpend.toLocaleString()}`
                          : `₦${tier.minSpend.toLocaleString()}+`
                        }
                      </p>
                    </div>

                    {/* Discount Highlight */}
                    <div className="py-1.5 px-2.5 rounded-xl bg-background/80 border border-border/80 text-center">
                      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Continuous Discount</div>
                      <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {tier.discountPct > 0 ? `${tier.discountPct}% OFF` : "Standard"}
                      </div>
                    </div>

                    {/* Key Specs */}
                    <ul className="space-y-1.5 text-[11px] text-muted-foreground pt-1">
                      <li className="flex items-center justify-between border-b border-border/40 pb-1">
                        <span>Referral Multiplier:</span>
                        <strong className="text-foreground">{tier.referralMultiplier}x</strong>
                      </li>
                      <li className="flex items-center justify-between border-b border-border/40 pb-1">
                        <span>Min. Cashout:</span>
                        <strong className="text-foreground">₦{tier.minWithdrawal.toLocaleString()}</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Queue:</span>
                        <strong className="text-foreground">
                          {tier.priorityQueue === "VIP" ? "⚡ VIP" : tier.priorityQueue === "FAST" ? "⚡ Fast" : "Standard"}
                        </strong>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-2.5 mt-2.5 border-t border-border/50 text-[10px] text-muted-foreground leading-tight">
                    {tier.description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Standard Rules Transparency Box */}
          <div className="p-3 rounded-2xl bg-secondary/40 border border-border flex items-start gap-2.5 text-[11px] text-muted-foreground">
            <Info size={16} className="text-primary shrink-0 mt-0.5" weight="bold" />
            <div className="space-y-0.5">
              <p className="font-bold text-foreground">Standard Rules &amp; Transparency</p>
              <p className="text-[10px] leading-relaxed">
                Rankings upgrade automatically from service debits (CAC, NIN, BVN, SCUML, Tax ID). Loyalty discounts apply continuously at checkout. Airtime vending is excluded to maintain national telecom rates.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-secondary/30 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-muted-foreground font-medium">
            Your All-Time Spend: <strong className="text-foreground font-bold">₦{allTimeSpend.toLocaleString()}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
