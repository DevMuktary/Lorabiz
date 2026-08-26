// src/components/features/affidavit/AffidavitSealTierSelector.tsx
"use client";

import React from "react";
import { Gavel, ShieldCheck, CheckCircle, Sparkle } from "@phosphor-icons/react";
import { AffidavitSealTier } from "./types";

interface AffidavitSealTierSelectorProps {
  selectedTier: AffidavitSealTier;
  onSelectTier: (tier: AffidavitSealTier) => void;
  standardPrice: number;
  attestedPrice: number;
}

export function AffidavitSealTierSelector({
  selectedTier,
  onSelectTier,
  standardPrice,
  attestedPrice,
}: AffidavitSealTierSelectorProps) {
  return (
    <div className="p-5 sm:p-7 rounded-3xl bg-card border border-border shadow-xs space-y-4 text-left">
      <div className="border-b border-border pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
            2. Choose Court Stamping Format
          </h2>
          <p className="text-xs text-muted-foreground">
            Select standard registry stamping or certified high court attestation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tier 1: Standard Stamped Affidavit */}
        <div
          onClick={() => onSelectTier("STANDARD")}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 group ${
            selectedTier === "STANDARD"
              ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
              : "border-border bg-background hover:border-primary/40 hover:bg-secondary/20"
          }`}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                  selectedTier === "STANDARD"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground group-hover:text-primary"
                }`}
              >
                <Gavel size={20} weight="fill" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-secondary text-muted-foreground border border-border">
                Standard
              </span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-foreground">Standard Registry Stamped</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Official sworn affidavit stamped by the Commissioner for Oaths. Accepted for Banks, SIM retrieval, NIN &amp; general matters.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Fee</span>
              <span className="text-base font-black text-foreground font-mono">₦{standardPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold">
              <span className={selectedTier === "STANDARD" ? "text-primary font-black" : "text-muted-foreground"}>
                {selectedTier === "STANDARD" ? "Selected" : "Select Format"}
              </span>
              {selectedTier === "STANDARD" && <CheckCircle size={16} weight="fill" className="text-primary" />}
            </div>
          </div>
        </div>

        {/* Tier 2: Attested High Court Seal */}
        <div
          onClick={() => onSelectTier("HIGH_COURT_ATTESTED")}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 group ${
            selectedTier === "HIGH_COURT_ATTESTED"
              ? "border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/5"
              : "border-border bg-background hover:border-emerald-500/40 hover:bg-secondary/20"
          }`}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                  selectedTier === "HIGH_COURT_ATTESTED"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                }`}
              >
                <ShieldCheck size={20} weight="fill" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Sparkle size={10} weight="fill" />
                Priority Attested
              </span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-foreground">High Court Attested &amp; Sealed</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Priority court swearing with certified High Court verification seal. Recommended for CAC filings, Embassies, Visas, and Litigation.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-border/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Fee</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">₦{attestedPrice.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold">
              <span className={selectedTier === "HIGH_COURT_ATTESTED" ? "text-emerald-600 dark:text-emerald-400 font-black" : "text-muted-foreground"}>
                {selectedTier === "HIGH_COURT_ATTESTED" ? "Selected" : "Select Format"}
              </span>
              {selectedTier === "HIGH_COURT_ATTESTED" && <CheckCircle size={16} weight="fill" className="text-emerald-500" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
