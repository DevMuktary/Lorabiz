"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Crown, 
  Info,
  CaretDown,
  CaretUp
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
    referralText: "Standard referral commission when friends use your link",
    withdrawalText: "Withdraw referral & commission earnings to your Nigerian bank account (min ₦2,000)",
    speedText: "Standard job processing speed",
  },
  TIER_2: {
    tagline: "Save 2% on every service job",
    qualifyText: "Spend ₦25,000 – ₦99,999 on services",
    discountText: "2% discount deducted automatically on CAC, SCUML, NIN, BVN, Tax ID",
    referralText: "Earn 10% extra bonus on referral payouts",
    withdrawalText: "Withdraw referral & commission earnings to your Nigerian bank account (min ₦1,500)",
    speedText: "Standard job processing speed",
  },
  TIER_3: {
    tagline: "Save 4% on every service + Faster delivery",
    qualifyText: "Spend ₦100,000 – ₦499,999 on services",
    discountText: "4% discount deducted automatically on CAC, SCUML, NIN, BVN, Tax ID",
    referralText: "Earn 20% extra bonus on referral payouts",
    withdrawalText: "Withdraw referral & commission earnings to your Nigerian bank account (min ₦1,000)",
    speedText: "Fast-track document processing",
  },
  TIER_4: {
    tagline: "Save 6% on every service + VIP priority",
    qualifyText: "Spend ₦500,000 or more on services",
    discountText: "6% maximum discount deducted automatically on all services",
    referralText: "Earn 25% highest bonus on referral payouts",
    withdrawalText: "Withdraw referral & commission earnings to your Nigerian bank account (min ₦500)",
    speedText: "VIP express instant priority queue",
  },
};

export default function LoyaltyPerksModal({
  isOpen,
  onClose,
  currentTierLevel = "TIER_1",
  allTimeSpend = 0,
}: LoyaltyPerksModalProps) {
  const [mounted, setMounted] = useState(false);
  // All closed initially by default
  const [expandedTier, setExpandedTier] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const tiers = Object.values(LOYALTY_TIERS);

  const toggleTier = (level: string) => {
    // If clicking the open tier, collapse it; otherwise open this one and collapse others
    setExpandedTier((prev) => (prev === level ? "" : level));
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 font-sans overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 min-h-screen w-screen bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg max-h-[90dvh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 z-10 my-auto text-left">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border bg-secondary/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Crown size={16} weight="fill" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-foreground tracking-tight leading-tight">
                Account Levels &amp; Discounts
              </h2>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">
                Tap any level below to see what you get.
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-full bg-secondary hover:bg-secondary/80 border border-border text-foreground flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={13} weight="bold" />
          </button>
        </div>

        {/* Accordion Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2 custom-scrollbar text-left">
          
          {tiers.map((tier: TierConfig) => {
            const isCurrent = tier.level === currentTierLevel;
            const isExpanded = expandedTier === tier.level;
            const details = PLAIN_TIER_DETAILS[tier.level] || PLAIN_TIER_DETAILS.TIER_1;

            return (
              <div 
                key={tier.level}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isCurrent 
                    ? "border-primary/60 bg-secondary/40 shadow-xs" 
                    : "border-border/80 bg-secondary/20 hover:border-border"
                }`}
              >
                {/* Accordion Trigger Row */}
                <button
                  type="button"
                  onClick={() => toggleTier(tier.level)}
                  className="w-full p-3 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xl shrink-0">{tier.badge.split(" ")[0]}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-xs sm:text-sm text-foreground">
                          {tier.fullName}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.2 rounded-full bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-wider shrink-0">
                            Your Level
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                        {details.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-lg border ${
                      tier.discountPct > 0 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                        : "bg-secondary text-muted-foreground border-border"
                    }`}>
                      {tier.discountPct > 0 ? `${tier.discountPct}% OFF` : "No Discount"}
                    </span>
                    <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                      {isExpanded ? <CaretUp size={11} weight="bold" /> : <CaretDown size={11} weight="bold" />}
                    </div>
                  </div>
                </button>

                {/* Accordion Expanded Content */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-border/50 text-xs space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                    <div className="grid grid-cols-1 gap-1.5 pt-1">
                      
                      <div className="flex items-start gap-2 bg-background/80 p-2 rounded-xl border border-border/70">
                        <span className="font-bold text-muted-foreground min-w-[95px] shrink-0 text-[10px] sm:text-[11px]">
                          How to qualify:
                        </span>
                        <span className="font-semibold text-foreground text-[10px] sm:text-[11px]">
                          {details.qualifyText}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 bg-background/80 p-2 rounded-xl border border-border/70">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 min-w-[95px] shrink-0 text-[10px] sm:text-[11px]">
                          Discount:
                        </span>
                        <span className="font-semibold text-foreground text-[10px] sm:text-[11px]">
                          {details.discountText}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 bg-background/80 p-2 rounded-xl border border-border/70">
                        <span className="font-bold text-muted-foreground min-w-[95px] shrink-0 text-[10px] sm:text-[11px]">
                          Referral bonus:
                        </span>
                        <span className="font-semibold text-foreground text-[10px] sm:text-[11px]">
                          {details.referralText}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 bg-background/80 p-2 rounded-xl border border-border/70">
                        <span className="font-bold text-muted-foreground min-w-[95px] shrink-0 text-[10px] sm:text-[11px]">
                          Bank payout:
                        </span>
                        <span className="font-semibold text-foreground text-[10px] sm:text-[11px]">
                          {details.withdrawalText}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 bg-background/80 p-2 rounded-xl border border-border/70">
                        <span className="font-bold text-muted-foreground min-w-[95px] shrink-0 text-[10px] sm:text-[11px]">
                          Job speed:
                        </span>
                        <span className="font-semibold text-foreground text-[10px] sm:text-[11px]">
                          {details.speedText}
                        </span>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}

        </div>

        {/* Stagnant Bottom Simple Rule & Footer */}
        <div className="border-t border-border bg-secondary/30 shrink-0">
          <div className="px-4 py-2 border-b border-border/60 flex items-start gap-2 text-[10px] sm:text-[11px] text-muted-foreground bg-secondary/50">
            <Info size={14} className="text-primary shrink-0 mt-0.5" weight="bold" />
            <p className="leading-tight">
              <strong className="text-foreground">Simple rule:</strong> Levels upgrade automatically when you pay for CAC, SCUML, NIN, BVN, or Tax ID. Airtime is not discounted.
            </p>
          </div>

          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">
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
    </div>,
    document.body
  );
}
