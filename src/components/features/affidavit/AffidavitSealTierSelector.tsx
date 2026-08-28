// src/components/features/affidavit/AffidavitSealTierSelector.tsx
"use client";

import React from "react";
import { Gavel, ShieldCheck, CheckCircle, Sparkle, Eye, ArrowsClockwise } from "@phosphor-icons/react";
import { AffidavitSealTier } from "./types";

export interface StampingTierOption {
  id: AffidavitSealTier;
  serviceKey: string;
  name: string;
  badge: string;
  description: string;
  exampleImage: string;
}

export const STAMPING_TIERS: StampingTierOption[] = [
  {
    id: "STANDARD",
    serviceKey: "AFFIDAVIT_STATE",
    name: "State Judiciary",
    badge: "Official State Seal",
    description: "Sworn affidavit stamped by the Commissioner for Oaths across State High Courts & Magistrate Registries. Accepted for Banks, SIM Retrieval, NIN, BVN & general matters.",
    exampleImage: "/examples/state_affidavit.jpg",
  },
  {
    id: "HIGH_COURT_ATTESTED",
    serviceKey: "AFFIDAVIT_FEDERAL",
    name: "Federal High Court",
    badge: "Certified Federal Attestation",
    description: "Priority sworn affidavit certified with official Federal High Court legal seal and registry attestation. Recommended for CAC Filings, Foreign Embassies, Visas, and Federal compliance.",
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
}: AffidavitSealTierSelectorProps) {
  const currentTierObj = STAMPING_TIERS.find((t) => t.id === selectedTier);

  // If collapsed & selected, render sleek summary bar with "Change Type" button
  if (isCollapsed && currentTierObj) {
    const isAttested = currentTierObj.id === "HIGH_COURT_ATTESTED";
    const tierPrice = isAttested ? prices.AFFIDAVIT_FEDERAL : prices.AFFIDAVIT_STATE;

    return (
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in text-left">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div
            className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isAttested
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-primary/10 text-primary border border-primary/20"
            }`}
          >
            {isAttested ? <ShieldCheck size={24} weight="fill" /> : <Gavel size={24} weight="fill" />}
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                1. Court Stamping Format
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isAttested
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-primary/10 text-primary border-primary/20"
                }`}
              >
                {currentTierObj.badge}
              </span>
              <button
                type="button"
                onClick={() => onViewExample(currentTierObj.exampleImage, currentTierObj.name)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground bg-secondary/80 hover:bg-secondary px-2 py-0.5 rounded-md transition-colors cursor-pointer"
              >
                <Eye size={12} weight="bold" />
                <span>View Example</span>
              </button>
            </div>
            <h3 className="text-base sm:text-lg font-black text-foreground">
              {currentTierObj.name}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">
              {currentTierObj.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">Fee</span>
            <span className="text-base sm:text-lg font-black text-foreground font-mono">
              {isLoadingPricing ? (
                <span className="inline-block h-4 w-12 bg-secondary animate-pulse rounded"></span>
              ) : (
                `₦${Number(tierPrice || 0).toLocaleString()}`
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-foreground transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <ArrowsClockwise size={14} weight="bold" />
            <span>Change Type</span>
          </button>
        </div>
      </div>
    );
  }

  // Expanded View
  return (
    <div className="p-5 sm:p-7 rounded-3xl bg-card border border-border shadow-xs space-y-4 text-left animate-in fade-in">
      <div className="border-b border-border pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
            1. Select Kind of Affidavit (Court Stamping Format)
          </h2>
          <p className="text-xs text-muted-foreground">
            Choose whether your affidavit should be stamped at the State Judiciary or Federal High Court.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {STAMPING_TIERS.map((tier) => {
          const isSelected = selectedTier === tier.id;
          const isAttested = tier.id === "HIGH_COURT_ATTESTED";
          const isAvailable = activeMap[tier.serviceKey] !== false;
          const rawPrice = isAttested ? prices.AFFIDAVIT_FEDERAL : prices.AFFIDAVIT_STATE;
          const price = rawPrice ?? (isAttested ? 4000 : 2500);

          return (
            <div
              key={tier.id}
              onClick={() => {
                if (isAvailable) onSelectTier(tier.id);
              }}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-4 group ${
                !isAvailable
                  ? "opacity-50 bg-secondary/20 border-border/60 cursor-not-allowed"
                  : isSelected
                  ? isAttested
                    ? "border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/5 cursor-pointer ring-1 ring-emerald-500/30"
                    : "border-primary bg-primary/5 shadow-md shadow-primary/5 cursor-pointer ring-1 ring-primary/30"
                  : "border-border bg-background hover:border-primary/40 hover:bg-secondary/20 cursor-pointer"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className={`h-11 w-11 rounded-xl flex items-center justify-center transition-colors ${
                      !isAvailable
                        ? "bg-secondary text-muted-foreground"
                        : isSelected
                        ? isAttested
                          ? "bg-emerald-600 text-white"
                          : "bg-primary text-primary-foreground"
                        : isAttested
                        ? "bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                        : "bg-secondary text-foreground group-hover:text-primary"
                    }`}
                  >
                    {isAttested ? <ShieldCheck size={22} weight="fill" /> : <Gavel size={22} weight="fill" />}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        !isAvailable
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : isAttested
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-secondary text-muted-foreground border-border"
                      }`}
                    >
                      {!isAvailable ? "Offline" : tier.badge}
                    </span>

                    {/* View Example Button with Eye icon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewExample(tier.exampleImage, tier.name);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-emerald-600 bg-secondary hover:bg-secondary/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-border/60"
                      title={`View ${tier.name} Example`}
                    >
                      <Eye size={14} weight="bold" />
                      <span>View Example</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-base text-foreground">
                    {tier.name}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {tier.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Fee</span>
                  <span
                    className={`text-base font-black font-mono ${
                      !isAvailable
                        ? "text-muted-foreground line-through"
                        : isAttested
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground"
                    }`}
                  >
                    {isLoadingPricing ? (
                      <span className="inline-block h-4 w-12 bg-secondary animate-pulse rounded"></span>
                    ) : (
                      `₦${Number(price || 0).toLocaleString()}`
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold">
                  {!isAvailable ? (
                    <span className="text-rose-500 font-bold text-[11px]">Temporarily Unavailable</span>
                  ) : (
                    <>
                      <span
                        className={
                          isSelected
                            ? isAttested
                              ? "text-emerald-600 dark:text-emerald-400 font-black"
                              : "text-primary font-black"
                            : "text-muted-foreground"
                        }
                      >
                        {isSelected ? "Selected" : "Select Format"}
                      </span>
                      {isSelected && (
                        <CheckCircle
                          size={16}
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
