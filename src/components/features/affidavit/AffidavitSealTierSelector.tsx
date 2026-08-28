// src/components/features/affidavit/AffidavitSealTierSelector.tsx
"use client";

import React from "react";
import { Gavel, ShieldCheck, CheckCircle, Eye, ArrowsClockwise } from "@phosphor-icons/react";
import { AffidavitSealTier } from "./types";

export interface StampingTierOption {
  id: AffidavitSealTier;
  serviceKey: string;
  name: string;
  description: string;
  exampleImage: string;
}

export const STAMPING_TIERS: StampingTierOption[] = [
  {
    id: "STANDARD",
    serviceKey: "AFFIDAVIT_STATE",
    name: "State Judiciary",
    description: "Sworn & stamped by Commissioner for Oaths for State Courts, Magistrates & more.",
    exampleImage: "/examples/state_affidavit.jpg",
  },
  {
    id: "HIGH_COURT_ATTESTED",
    serviceKey: "AFFIDAVIT_FEDERAL",
    name: "Federal High Court",
    description: "Certified Federal High Court attestation seal for CAC, Embassies, Visas & more.",
    exampleImage: "/examples/fcj_affidavit.jpg",
  },
];

interface AffidavitSealTierSelectorProps {
  selectedTier: AffidavitSealTier | null;
  isCollapsed: boolean;
  onSelectTier: (tier: AffidavitSealTier) => void;
  onToggleCollapse: () => void;
  onViewExample: (src: string, label: string) => void;
  prices: Record<string, number>;
  activeMap: Record<string, boolean>;
  isLoadingPricing: boolean;
  discountPct?: number;
}

export function AffidavitSealTierSelector({
  selectedTier,
  isCollapsed,
  onSelectTier,
  onToggleCollapse,
  onViewExample,
  prices,
  activeMap,
  isLoadingPricing,
  discountPct = 0,
}: AffidavitSealTierSelectorProps) {
  const currentTierObj = STAMPING_TIERS.find((t) => t.id === selectedTier);

  // Collapsed summary bar with "Change Type" button
  if (isCollapsed && currentTierObj) {
    const isAttested = currentTierObj.id === "HIGH_COURT_ATTESTED";
    const rawPrice = isAttested ? prices.AFFIDAVIT_FEDERAL : prices.AFFIDAVIT_STATE;
    const basePrice = rawPrice ?? (isAttested ? 4000 : 2500);
    const finalPrice = discountPct > 0 ? Math.max(0, basePrice - Math.round((basePrice * discountPct) / 100)) : basePrice;

    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left w-full overflow-hidden">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              isAttested
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-primary/10 text-primary border border-primary/20"
            }`}
          >
            {isAttested ? <ShieldCheck size={20} weight="fill" /> : <Gavel size={20} weight="fill" />}
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                1. Court Stamping Format
              </span>
              <button
                type="button"
                onClick={() => onViewExample(currentTierObj.exampleImage, currentTierObj.name)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                <Eye size={12} weight="bold" />
                <span>View Example</span>
              </button>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
              {currentTierObj.name}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <div className="text-right">
            <span className="text-xs font-black text-foreground font-mono">
              {isLoadingPricing ? (
                <span className="inline-block h-3 w-12 bg-secondary animate-pulse rounded"></span>
              ) : (
                <>
                  {discountPct > 0 && (
                    <span className="line-through text-muted-foreground text-[11px] mr-1.5 font-normal">
                      ₦{basePrice.toLocaleString()}
                    </span>
                  )}
                  <span>₦{finalPrice.toLocaleString()}</span>
                </>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-foreground transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <ArrowsClockwise size={13} weight="bold" />
            <span>Change Type</span>
          </button>
        </div>
      </div>
    );
  }

  // Expanded Cards View
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3.5 text-left w-full overflow-hidden">
      <div className="border-b border-border pb-2.5">
        <h2 className="text-sm sm:text-base font-black text-foreground tracking-tight">
          1. Select Kind of Affidavit (Court Stamping Format)
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Choose whether your affidavit should be stamped at State Judiciary or Federal High Court.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STAMPING_TIERS.map((tier) => {
          const isSelected = selectedTier === tier.id;
          const isAttested = tier.id === "HIGH_COURT_ATTESTED";
          const isAvailable = activeMap[tier.serviceKey] !== false;
          const rawPrice = isAttested ? prices.AFFIDAVIT_FEDERAL : prices.AFFIDAVIT_STATE;
          const basePrice = rawPrice ?? (isAttested ? 4000 : 2500);
          const finalPrice = discountPct > 0 ? Math.max(0, basePrice - Math.round((basePrice * discountPct) / 100)) : basePrice;

          return (
            <div
              key={tier.id}
              onClick={() => {
                if (isAvailable) onSelectTier(tier.id);
              }}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between space-y-3 ${
                !isAvailable
                  ? "opacity-50 bg-secondary/20 border-border/60 cursor-not-allowed"
                  : isSelected
                  ? isAttested
                    ? "border-emerald-500 bg-emerald-500/5 shadow-xs cursor-pointer ring-1 ring-emerald-500/30"
                    : "border-primary bg-primary/5 shadow-xs cursor-pointer ring-1 ring-primary/30"
                  : "border-border bg-background hover:border-primary/40 hover:bg-secondary/20 cursor-pointer"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${
                        !isAvailable
                          ? "bg-secondary text-muted-foreground"
                          : isSelected
                          ? isAttested
                            ? "bg-emerald-600 text-white"
                            : "bg-primary text-primary-foreground"
                          : isAttested
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {isAttested ? <ShieldCheck size={18} weight="fill" /> : <Gavel size={18} weight="fill" />}
                    </div>

                    <h3 className="font-bold text-sm text-foreground">
                      {tier.name}
                    </h3>
                  </div>

                  {/* View Example Button with Eye icon */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewExample(tier.exampleImage, tier.name);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-emerald-600 bg-secondary hover:bg-secondary/80 px-2 py-1 rounded-md transition-colors cursor-pointer border border-border/60"
                  >
                    <Eye size={12} weight="bold" />
                    <span>View Example</span>
                  </button>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tier.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-border/60 flex items-center justify-between">
                <div>
                  <span
                    className={`text-sm font-black font-mono ${
                      !isAvailable
                        ? "text-muted-foreground line-through"
                        : isAttested
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground"
                    }`}
                  >
                    {isLoadingPricing ? (
                      <span className="inline-block h-3 w-12 bg-secondary animate-pulse rounded"></span>
                    ) : (
                      <>
                        {discountPct > 0 && isAvailable && (
                          <span className="line-through text-muted-foreground text-[11px] mr-1.5 font-normal">
                            ₦{basePrice.toLocaleString()}
                          </span>
                        )}
                        <span>₦{finalPrice.toLocaleString()}</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold">
                  {!isAvailable ? (
                    <span className="text-rose-500 font-bold text-[11px]">Unavailable</span>
                  ) : (
                    <>
                      <span
                        className={
                          isSelected
                            ? isAttested
                              ? "text-emerald-600 dark:text-emerald-400 font-bold text-xs"
                              : "text-primary font-bold text-xs"
                            : "text-muted-foreground text-xs"
                        }
                      >
                        {isSelected ? "Selected" : "Select Format"}
                      </span>
                      {isSelected && (
                        <CheckCircle
                          size={15}
                          weight="fill"
                          className={isAttested ? "text-emerald-500" : "text-primary"}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
