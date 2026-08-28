// src/components/features/affidavit/AffidavitCategoryCards.tsx
"use client";

import React from "react";
import {
  Buildings,
  TextT,
  Cake,
  FileText,
  Car,
  Scales,
  CheckCircle,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { AffidavitCategoryType } from "./types";

interface CategoryDef {
  id: AffidavitCategoryType;
  serviceKey: string;
  title: string;
  subtitle: string;
  icon: any;
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: "CHANGE_OF_NAME",
    serviceKey: "AFFIDAVIT_CHANGE_OF_NAME",
    title: "Change / Correction of Name",
    subtitle: "For Banks, NIN, BVN, Passports & Official Records.",
    icon: TextT,
  },
  {
    id: "AGE_DECLARATION",
    serviceKey: "AFFIDAVIT_AGE_DECLARATION",
    title: "Declaration of Age / DOB",
    subtitle: "Official age declaration for Banks, NIN & Civil Service.",
    icon: Cake,
  },
  {
    id: "CAC_CORPORATE",
    serviceKey: "AFFIDAVIT_CAC_CORPORATE",
    title: "CAC Corporate Matters",
    subtitle: "Loss of CAC Certificate, MEMART, Signatures & Corrections.",
    icon: Buildings,
  },
  {
    id: "LOSS_OF_ITEM",
    serviceKey: "AFFIDAVIT_LOSS_OF_ITEM",
    title: "Loss of Document / SIM Card",
    subtitle: "For SIM Retrieval (MTN, Airtel, Glo), Lost IDs & Papers.",
    icon: FileText,
  },
  {
    id: "PROOF_OF_OWNERSHIP",
    serviceKey: "AFFIDAVIT_PROOF_OF_OWNERSHIP",
    title: "Proof of Ownership & Status",
    subtitle: "For Vehicles, Electronics, Property & Marital Status.",
    icon: Car,
  },
  {
    id: "GENERAL_PURPOSE",
    serviceKey: "AFFIDAVIT_GENERAL_PURPOSE",
    title: "General Purpose Statement",
    subtitle: "Custom sworn legal declarations for Embassies & Offices.",
    icon: Scales,
  },
];

interface AffidavitCategoryCardsProps {
  selectedCategory: AffidavitCategoryType | null;
  isCollapsed: boolean;
  onSelectCategory: (cat: AffidavitCategoryType) => void;
  onToggleCollapse: () => void;
  activeMap?: Record<string, boolean>;
}

export function AffidavitCategoryCards({
  selectedCategory,
  isCollapsed,
  onSelectCategory,
  onToggleCollapse,
  activeMap = {},
}: AffidavitCategoryCardsProps) {
  const currentCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory);

  // If collapsed, render sleek summary bar with change button
  if (isCollapsed && currentCategoryObj) {
    const Icon = currentCategoryObj.icon;
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left w-full overflow-hidden">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Icon size={20} weight="bold" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
              2. Selected Matter
            </span>
            <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
              {currentCategoryObj.title}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-foreground transition-all shrink-0 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <ArrowsClockwise size={13} weight="bold" />
          <span>Change Type</span>
        </button>
      </div>
    );
  }

  // Expanded Cards Selection View
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3.5 text-left w-full overflow-hidden">
      <div className="border-b border-border pb-2.5">
        <h2 className="text-sm sm:text-base font-black text-foreground tracking-tight">
          2. Select Affidavit Matter
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Choose the purpose of your sworn affidavit.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          const isAvailable = activeMap[cat.serviceKey] !== false;

          return (
            <div
              key={cat.id}
              onClick={() => {
                if (isAvailable) onSelectCategory(cat.id);
              }}
              className={`p-3.5 sm:p-4 rounded-xl border-2 transition-all flex flex-col justify-between space-y-2.5 ${
                !isAvailable
                  ? "opacity-50 bg-secondary/20 border-border/60 cursor-not-allowed"
                  : isSelected
                  ? "border-primary bg-primary/5 shadow-xs cursor-pointer ring-1 ring-primary/30"
                  : "border-border bg-background hover:border-primary/40 hover:bg-secondary/20 cursor-pointer"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      !isAvailable
                        ? "bg-secondary text-muted-foreground"
                        : isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground group-hover:text-primary"
                    }`}
                  >
                    <Icon size={16} weight="bold" />
                  </div>

                  <h3 className="font-bold text-xs sm:text-sm text-foreground leading-snug">
                    {cat.title}
                  </h3>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {cat.subtitle}
                </p>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs font-bold">
                {!isAvailable ? (
                  <span className="text-rose-500 font-bold text-[10px]">Unavailable</span>
                ) : (
                  <>
                    <span className={isSelected ? "text-primary font-bold text-xs" : "text-muted-foreground text-xs"}>
                      {isSelected ? "Selected" : "Select"}
                    </span>
                    {isSelected && <CheckCircle size={15} weight="fill" className="text-primary" />}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
