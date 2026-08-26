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
    title: "CAC Corporate Matters",
    subtitle: "Loss of Incorporation Certificate / MEMART, Specimen Signature Variation, Director/Shareholder data corrections & more",
    icon: Buildings,
    badge: "Corporate Legal",
  },
  {
    id: "CHANGE_OF_NAME",
    title: "Change & Correction of Name",
    subtitle: "For Commercial Banks, NIN, BVN, Employers, International Passports, NYSC, Marriage, Academic records & more",
    icon: TextT,
    badge: "Most Common",
  },
  {
    id: "AGE_DECLARATION",
    title: "Age Declaration & DOB Updates",
    subtitle: "Official declaration of age and date of birth correction for Banks, NIN, Pension, Civil Service, Employment & more",
    icon: Cake,
    badge: "Age Verification",
  },
  {
    id: "LOSS_OF_ITEM",
    title: "Loss of Document / SIM Card",
    subtitle: "For SIM Card Retrieval (MTN, Airtel, Glo, 9mobile), Lost Certificates, Vehicle Documents, Receipts & more",
    icon: FileText,
    badge: "SIM & Documents",
  },
  {
    id: "PROOF_OF_OWNERSHIP",
    title: "Proof of Ownership & Status",
    subtitle: "For Vehicles, Electronics, Land/Property, Declaration of Bachelorhood/Spinsterhood, Next-of-Kin & more",
    icon: Car,
    badge: "Asset & Status",
  },
  {
    id: "GENERAL_PURPOSE",
    title: "General Purpose Sworn Statement",
    subtitle: "Custom sworn legal statements and declarations for Embassies, Institutions, FinTechs, Agreements & more",
    icon: Scales,
    badge: "Custom Statement",
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

  // If collapsed, render sleek spacious summary bar with change button
  if (isCollapsed && currentCategoryObj) {
    const Icon = currentCategoryObj.icon;
    return (
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in text-left">
        <div className="flex items-start sm:items-center gap-4 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-xs">
            <Icon size={24} weight="bold" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Selected Matter
              </span>
              {currentCategoryObj.badge && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                  {currentCategoryObj.badge}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-foreground">
              {currentCategoryObj.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {currentCategoryObj.subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-foreground transition-all shrink-0 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <ArrowsClockwise size={14} weight="bold" />
          <span>Change Type</span>
        </button>
      </div>
    );
  }

  // Expanded Cards Selection View
  return (
    <div className="p-5 sm:p-7 rounded-3xl bg-card border border-border shadow-xs space-y-4 animate-in fade-in text-left">
      <div className="border-b border-border pb-3">
        <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
          1. Select Affidavit Matter
        </h2>
        <p className="text-xs text-muted-foreground">
          Choose the purpose of your sworn affidavit. Accepted across banks, telecom, CAC, embassies, and institutions nationwide.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative group ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                  : "border-border bg-background hover:border-primary/40 hover:bg-secondary/20"
              }`}
            >
              <div className="space-y-2.5">
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
                  <h3 className="font-bold text-sm text-foreground">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {cat.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-xs font-bold">
                <span className={isSelected ? "text-primary font-black" : "text-muted-foreground"}>
                  {isSelected ? "Selected" : "Select Matter"}
                </span>
                {isSelected && <CheckCircle size={18} weight="fill" className="text-primary" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
