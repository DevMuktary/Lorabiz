"use client";

import { useState } from "react";
import { 
  X, 
  Check, 
  Crown, 
  Info,
  CaretDown,
  CaretUp,
  Tag,
  Bank,
  ShareNetwork,
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

const PLAIN_TIER_DETAILS: Record<string, {
  tagline: string;
  qualifyText: string;
  discountText: string;
  referralText: string;
  withdrawalText: string;
  speedText: string;
}> = {
  TIER_1: {
    tagline: "Starting level for new accounts",
    qualifyText: "Spend ₦0 – ₦24,999 on services",
    discountText: "Normal standard price (no discount yet)",
    referralText: "Standard referral bonus when people use your link",
    withdrawalText: "Withdraw to bank from ₦2,000 minimum",
    speedText: "Standard processing speed",
  },
  TIER_2: {
    tagline: "Save 2% on every service job",
    qualifyText: "Spend ₦25,000 – ₦99,999 on services",
    discountText: "2% discount deducted automatically on CAC, SCUML, NIN, BVN, Tax ID",
    referralText: "Earn 10% more referral bonus on invites",
    withdrawalText: "Withdraw to bank from ₦1,500 minimum",
    speedText: "Standard processing speed",
  },
  TIER_3: {
    tagline: "Save 4% on every service + Faster delivery",
    qualifyText: "Spend ₦100,000 – ₦499,999 on services",
    discountText: "4% discount deducted automatically on CAC, SCUML, NIN, BVN, Tax ID",
    referralText: "Earn 20% more referral bonus on invites",
    withdrawalText: "Withdraw to bank from ₦1,000 minimum",
    speedText: "Fast-track processing for your documents",
  },
  TIER_4: {
    tagline: "Save 6% on every service + VIP priority",
    qualifyText: "Spend ₦500,000 or more on services",
    discountText: "6% maximum discount deducted automatically on all services",
    referralText: "Earn 25% highest referral bonus on invites",
    withdrawalText: "Withdraw to bank from as low as ₦500",
    speedText: "VIP express instant priority queue",
  },
};

export default function LoyaltyPerksModal({
  isOpen,
  onClose,
  currentTierLevel = "TIER_1",
  allTimeSpend = 0,
}: LoyaltyPerksModalProps) {
  const [expandedTier, setExpandedTier] = useState<string>(currentTierLevel || "TIER_1");

  if (!isOpen) return null;

  const tiers = Object.values(LOYALTY_TIERS);

  const toggleTier = (level: string) => {
    // If clicking the currently open tier, collapse it; otherwise open this one and collapse others
    setExpandedTier((prev) => (prev === level ? "" : level));
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 dark:bg-background/80 backdrop-blur-md animate-in fade-in duration-150" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg max-h-[90vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 z-10">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-secondary/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#ff3f7a]/10 border border-[#ff3f7a]/20 flex items-center justify-center text-[#ff3f7a] shrink-0">
              <Crown size={18} weight="fill" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight leading-tight">
                Account Levels &amp; Discounts
              </h2>
              <p className="text-[11px] text-muted-foreground font-medium">
                The more services you do, the bigger your discount.
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

        {/* Accordion Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar text-left">
          
          {tiers.map((tier: TierConfig) => {
            const isCurrent = tier.level === currentTierLevel;
            const isExpanded = expandedTier === tier.level;
            const details = PLAIN_TIER_DETAILS[tier.level] || PLAIN_TIER_DETAILS.TIER_1;

            return (
              <div 
                key={tier.level}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isCurrent 
                    ? "border-[#ff3f7a]/60 bg-secondary/40 shadow-xs" 
                    : "border-border/80 bg-secondary/20 hover:border-border"
                }`}
              >
                {/* Accordion Trigger Row */}
                <button
                  type="button"
                  onClick={() => toggleTier(tier.level)}
                  className="w-full p-3.5 flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{tier.badge.split(" ")[0]}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs sm:text-sm text-foreground">
                          {tier.fullName}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.2 rounded-full bg-[#ff3f7a] text-white text-[9px] font-black uppercase tracking-wider shrink-0">
                            Your Level
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        {details.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg border ${
                      tier.discountPct > 0 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                        : "bg-secondary text-muted-foreground border-border"
                    }`}>
                      {tier.discountPct > 0 ? `${tier.discountPct}% OFF` : "No Discount"}
                    </span>
                    <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                      {isExpanded ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
                    </div>
                  </div>
                </button>

                {/* Accordion Expanded Content */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-1 border-t border-border/50 text-xs space-y-2 animate-in slide-in-from-top-2 duration-150">
                    <div className="grid grid-cols-1 gap-2 pt-1">
                      
                      <div className="flex items-start gap-2 bg-background/80 p-2.5 rounded-xl border border-border/70">
                        <span className="font-bold text-muted-foreground min-w-[90px] shrink-0 text-[11px]">
                          How to qualify:
                        </span>
                        <span className="font-semibold text-foreground text-[11px]">
                          {details.qualifyText}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 bg-background/80 p-2.5 rounded-xl border border-border/70">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 min-w-[90px] shrink-0 text-[11px]">
                          Discount:
                        </span>
                        <span className="font-semibold text-foreground text-[11px]">
                          {details.discountText}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 bg-background/80 p-2.5 rounded-xl border border-border/70">
                        <span className="font-bold text-muted-foreground min-w-[90px] shrink-0 text-[11px]">
                          Referral cash:
                        </span>
                        <span className="font-semibold text-foreground text-[11px]">
                          {details.referralText}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 bg-background/80 p-2.5 rounded-xl border border-border/70">
                        <span className="font-bold text-muted-foreground min-w-[90px] shrink-0 text-[11px]">
                          Withdrawal:
                        </span>
                        <span className="font-semibold text-foreground text-[11px]">
                          {details.withdrawalText}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 bg-background/80 p-2.5 rounded-xl border border-border/70">
                        <span className="font-bold text-muted-foreground min-w-[90px] shrink-0 text-[11px]">
                          Job speed:
                        </span>
                        <span className="font-semibold text-foreground text-[11px]">
                          {details.speedText}
                        </span>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Simple Note */}
          <div className="p-3 rounded-2xl bg-secondary/40 border border-border flex items-start gap-2.5 text-[11px] text-muted-foreground mt-2">
            <Info size={16} className="text-primary shrink-0 mt-0.5" weight="bold" />
            <p className="leading-relaxed">
              <strong className="text-foreground">Simple rule:</strong> Your level goes up automatically whenever you pay for CAC, SCUML, NIN, BVN, or Tax ID. Airtime is not discounted.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-secondary/30 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-muted-foreground font-medium">
            Your Total Spend: <strong className="text-foreground font-bold">₦{allTimeSpend.toLocaleString()}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
}
