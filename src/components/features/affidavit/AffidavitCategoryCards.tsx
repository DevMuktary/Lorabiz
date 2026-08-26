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
  title: string;
  subtitle: string;
  icon: any;
  badge?: string;
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: "CAC_CORPORATE",
    title: "CAC Corporate Affidavits",
    subtitle: "Loss of Certificate / MEMART, Signature Variation, Director / Shareholder corrections",
    icon: Buildings,
    badge: "Official CAC",
  },
  {
    id: "CHANGE_OF_NAME",
    title: "Change / Correction of Name",
    subtitle: "For NIN, BVN, Bank accounts, NYSC, International Passport, and Academic credentials",
    icon: TextT,
    badge: "Most Popular",
  },
  {
    id: "AGE_DECLARATION",
    title: "Age Declaration / DOB Correction",
    subtitle: "Official declaration of age or date of birth correction for NIN, pension, or employment",
    icon: Cake,
    badge: "High Demand",
  },
  {
    id: "LOSS_OF_ITEM",
    title: "Loss of Document / SIM Card",
    subtitle: "Sworn affidavit for lost MTN/Airtel/Glo SIM, original certificates, or vehicle papers",
    icon: FileText,
  },
  {
    id: "PROOF_OF_OWNERSHIP",
    title: "Proof of Ownership / Next of Kin",
    subtitle: "Vehicle ownership, property, electronics, or declaration of marital/single status",
    icon: Car,
  },
  {
    id: "GENERAL_PURPOSE",
    title: "General Purpose Sworn Affidavit",
    subtitle: "Custom sworn legal statement of facts stamped by the Commissioner for Oaths",
    icon: Scales,
  },
];

interface AffidavitCategoryCardsProps {
  selectedCategory: AffidavitCategoryType | null;
  isCollapsed: boolean;
  onSelectCategory: (cat: AffidavitCategoryType) => void;
  onToggleCollapse: () => void;
}

export function AffidavitCategoryCards({
  selectedCategory,
  isCollapsed,
  onSelectCategory,
  onToggleCollapse,
}: AffidavitCategoryCardsProps) {
  const currentCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory);

  // If collapsed, render sleek summary bar with change button
  if (isCollapsed && currentCategoryObj) {
    const Icon = currentCategoryObj.icon;
    return (
      <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-xs flex items-center justify-between gap-4 animate-in fade-in text-left">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Icon size={22} weight="bold" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Affidavit Type
              </span>
              {currentCategoryObj.badge && (
                <span className="px-2 py-0.2 rounded-full bg-primary/10 text-primary text-[9px] font-black border border-primary/20">
                  {currentCategoryObj.badge}
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-black text-foreground truncate">
              {currentCategoryObj.title}
            </h3>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">
              {currentCategoryObj.subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-foreground transition-all shrink-0 cursor-pointer shadow-xs"
        >
          <ArrowsClockwise size={14} weight="bold" />
          <span>Change Type</span>
        </button>
      </div>
    );
  }

  // Expanded Cards Selection View
  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4 animate-in fade-in text-left">
      <div className="border-b border-border pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-foreground tracking-tight">
            1. Select Affidavit Matter
          </h2>
          <p className="text-xs text-muted-foreground">
            Choose the specific type of sworn legal statement you wish to process.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative group ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                  : "border-border bg-background hover:border-primary/40 hover:bg-secondary/20"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground group-hover:text-primary"
                    }`}
                  >
                    <Icon size={20} weight="bold" />
                  </div>

                  {cat.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                      {cat.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-foreground">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                    {cat.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-[11px] font-bold">
                <span className={isSelected ? "text-primary font-black" : "text-muted-foreground"}>
                  {isSelected ? "Selected" : "Select Matter"}
                </span>
                {isSelected && <CheckCircle size={16} weight="fill" className="text-primary" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
