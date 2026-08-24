"use client";

import { 
  X, 
  Check, 
  Sparkle, 
  ShieldCheck, 
  Crown, 
  Lightning, 
  Tag, 
  Info,
  ArrowRight
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-border bg-secondary/30 flex items-start justify-between shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ff3f7a]/10 text-[#ff3f7a] border border-[#ff3f7a]/20 mb-2">
              <Crown size={14} weight="fill" />
              <span>VIP Agent Loyalty Program</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Agent Rankings &amp; Tier Benefits
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Your ranking updates automatically based on your all-time service spend. Level up to unlock continuous discounts and higher cashout limits.
            </p>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-xl bg-secondary/60 hover:bg-secondary transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-left">
          
          {/* Tiers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier: TierConfig) => {
              const isCurrent = tier.level === currentTierLevel;

              return (
                <div 
                  key={tier.level}
                  className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                    isCurrent 
                      ? "bg-secondary/60 border-[#ff3f7a] ring-2 ring-[#ff3f7a]/30 shadow-lg" 
                      : "bg-secondary/20 border-border hover:border-border/80"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#ff3f7a] text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                      Your Current Tier
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{tier.badge.split(" ")[0]}</span>
                      <span className="font-mono text-xs font-black uppercase text-muted-foreground">
                        Level {tier.tierNumber}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-base text-foreground">
                        {tier.fullName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tier.maxSpend 
                          ? `₦${tier.minSpend.toLocaleString()} – ₦${tier.maxSpend.toLocaleString()}`
                          : `₦${tier.minSpend.toLocaleString()}+ All-Time Spend`
                        }
                      </p>
                    </div>

                    <div className="py-2.5 px-3 rounded-xl bg-background border border-border space-y-1">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase">Continuous Discount</div>
                      <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                        {tier.discountPct > 0 ? `${tier.discountPct}% OFF` : "0% (Retail)"}
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs text-muted-foreground pt-1">
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500 shrink-0" weight="bold" />
                        <span><strong>{tier.referralMultiplier}x</strong> Referral Multiplier</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500 shrink-0" weight="bold" />
                        <span>Min. Cashout: <strong>₦{tier.minWithdrawal.toLocaleString()}</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500 shrink-0" weight="bold" />
                        <span>
                          Queue: <strong>{tier.priorityQueue === "VIP" ? "⚡⚡ VIP Express" : tier.priorityQueue === "FAST" ? "⚡ Fast-Track" : "Standard"}</strong>
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/60 text-[11px] text-muted-foreground">
                    {tier.description}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Important Rules Notice */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border flex items-start gap-3 text-xs text-muted-foreground">
            <Info size={18} className="text-[#ff3f7a] shrink-0 mt-0.5" weight="bold" />
            <div className="space-y-1">
              <p className="font-bold text-foreground">Program Rules &amp; Transparency:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Tier spend is calculated strictly from confirmed identity &amp; document service debits (wallet funding &amp; withdrawals do not count as spend).</li>
                <li>Continuous loyalty discounts apply automatically to all NIN, BVN, CAC, Tax ID, SCUML, and Data bundles.</li>
                <li><strong>Airtime vending is excluded</strong> from loyalty discounts to protect standard VTU telecommunication tariffs.</li>
                <li>All generated PDF slips and certificates remain 100% official, authentic, and unmodified.</li>
              </ul>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border bg-secondary/30 flex items-center justify-between shrink-0">
          <div className="text-xs text-muted-foreground">
            Your All-Time Spend: <strong className="text-foreground">₦{allTimeSpend.toLocaleString()}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#ff3f7a] hover:bg-[#e02b62] text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
}
