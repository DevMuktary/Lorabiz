"use client";

import { useState, useEffect } from "react";
import { 
  Crown, 
  Sparkle, 
  ArrowRight, 
  Tag, 
  CaretRight,
  ShieldCheck,
  Lightning,
  Info
} from "@phosphor-icons/react";
import LoyaltyPerksModal from "./LoyaltyPerksModal";
import { UserLoyaltyProfile } from "@/lib/loyalty";

export default function LoyaltyTierCard() {
  const [profile, setProfile] = useState<UserLoyaltyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchLoyalty() {
      try {
        const res = await fetch("/api/user/loyalty", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.profile) {
            setProfile(json.profile);
          }
        }
      } catch (err) {
        console.error("Failed to fetch loyalty profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLoyalty();
  }, []);

  if (isLoading) {
    return (
      <div className="p-5 rounded-3xl bg-card border border-border animate-pulse flex items-center justify-between">
        <div className="space-y-2 w-2/3">
          <div className="h-4 bg-secondary/80 rounded w-1/3" />
          <div className="h-3 bg-secondary/50 rounded w-1/2" />
        </div>
        <div className="h-8 w-24 bg-secondary/80 rounded-xl" />
      </div>
    );
  }

  if (!profile) return null;

  const { currentTier, nextTier, progressPct, remainingSpendToNextTier, allTimeSpend } = profile;

  return (
    <>
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-card via-card to-secondary/30 border border-border shadow-xs space-y-4 text-left transition-all hover:border-border/80">
        
        {/* Top Tier Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentTier.badge.split(" ")[0]}</span>
              <span className="font-black text-foreground text-base tracking-tight">
                {currentTier.fullName}
              </span>
              {currentTier.discountPct > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {currentTier.discountPct}% OFF Active
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              All-Time Service Spend: <strong className="text-foreground">₦{allTimeSpend.toLocaleString()}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Crown size={14} className="text-[#ff3f7a]" weight="fill" />
            <span>Tier Perks &amp; Rules</span>
            <CaretRight size={12} weight="bold" />
          </button>
        </div>

        {/* Progress Bar towards Next Tier */}
        {nextTier ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Progress to <strong className="text-foreground">{nextTier.fullName}</strong>
              </span>
              <span className="font-bold font-mono text-foreground">
                {progressPct}%
              </span>
            </div>

            <div className="w-full bg-secondary/80 rounded-full h-2 overflow-hidden border border-border/40">
              <div 
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#ff3f7a] to-emerald-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
              <span>Spend <strong>₦{remainingSpendToNextTier.toLocaleString()}</strong> more</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                ➔ Unlocks {nextTier.discountPct}% Continuous Discount
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center gap-2.5 text-xs text-sky-500 dark:text-sky-400 font-bold">
            <Sparkle size={16} weight="fill" />
            <span>You have reached the maximum Tier 4 (Platinum VIP) level! Enjoy top-tier 6% discounts and ₦500 cashouts.</span>
          </div>
        )}

      </div>

      {/* Perks Modal */}
      <LoyaltyPerksModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentTierLevel={currentTier.level}
        allTimeSpend={allTimeSpend}
      />
    </>
  );
}
