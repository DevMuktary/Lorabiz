"use client";

import React, { useState, useEffect } from "react";
import { 
  Bank, 
  CreditCard, 
  Sparkle, 
  Palette, 
  Check, 
  Plus, 
  ArrowLeft, 
  ArrowRight,
  MagnifyingGlass,
  Info
} from "@phosphor-icons/react";
import { BoardResolutionFormData } from "@/lib/board-resolution-generator";
import { 
  PURPOSE_CATEGORIES, 
  ACCOUNT_CURRENCIES, 
  NIGERIAN_PAYMENT_GATEWAYS, 
  PRESET_ACCENT_COLORS,
  validateStep2 
} from "./schema";

interface PurposeStepProps {
  formData: BoardResolutionFormData;
  setFormData: React.Dispatch<React.SetStateAction<BoardResolutionFormData>>;
  onBack: () => void;
  onContinue: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function PurposeStep({
  formData,
  setFormData,
  onBack,
  onContinue,
  showToast
}: PurposeStepProps) {
  // Commercial Banks Fetching
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [banksList, setBanksList] = useState<{ name: string; code: string }[]>([]);
  const [bankSearch, setBankSearch] = useState("");

  useEffect(() => {
    async function loadBanks() {
      setLoadingBanks(true);
      try {
        const res = await fetch("/api/documents/banks");
        const json = await res.json();
        if (json.success && Array.isArray(json.banks)) {
          setBanksList(json.banks);
        } else {
          // Fallback list of top Nigerian Commercial Banks
          setBanksList([
            { name: "Access Bank", code: "044" },
            { name: "Guaranty Trust Bank (GTBank)", code: "058" },
            { name: "Zenith Bank", code: "057" },
            { name: "First Bank of Nigeria", code: "011" },
            { name: "United Bank for Africa (UBA)", code: "033" },
            { name: "Fidelity Bank", code: "070" },
            { name: "Stanbic IBTC Bank", code: "221" },
            { name: "Sterling Bank", code: "232" },
            { name: "Union Bank of Nigeria", code: "032" },
            { name: "Wema Bank", code: "035" },
            { name: "Ecobank Nigeria", code: "050" },
            { name: "Polaris Bank", code: "076" },
            { name: "Providus Bank", code: "101" },
            { name: "Taj Bank", code: "302" },
            { name: "Jaiz Bank", code: "301" },
            { name: "Lotus Bank", code: "303" },
            { name: "Moniepoint MFB", code: "50515" },
            { name: "OPay Digital Services", code: "999992" },
            { name: "Kuda Bank", code: "50211" },
            { name: "Palmpay", code: "999991" }
          ]);
        }
      } catch {
        setBanksList([
          { name: "Access Bank", code: "044" },
          { name: "Guaranty Trust Bank (GTBank)", code: "058" },
          { name: "Zenith Bank", code: "057" },
          { name: "First Bank of Nigeria", code: "011" },
          { name: "United Bank for Africa (UBA)", code: "033" },
          { name: "Fidelity Bank", code: "070" },
          { name: "Stanbic IBTC Bank", code: "221" },
          { name: "Providus Bank", code: "101" },
          { name: "Moniepoint MFB", code: "50515" },
          { name: "OPay Digital Services", code: "999992" }
        ]);
      } finally {
        setLoadingBanks(false);
      }
    }

    loadBanks();
  }, []);

  const POPULAR_BANKS = [
    "Access Bank",
    "Guaranty Trust Bank (GTBank)",
    "Zenith Bank",
    "First Bank of Nigeria",
    "United Bank for Africa (UBA)",
    "Moniepoint MFB",
    "OPay Digital Services",
    "Providus Bank",
    "Kuda Bank",
    "Fidelity Bank",
    "Stanbic IBTC Bank",
    "Wema Bank"
  ];

  const filteredBanks = banksList.filter(b => 
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const handlePurposeCategoryChange = (category: typeof PURPOSE_CATEGORIES[number]["id"]) => {
    let defaultTarget = "";
    if (category === "PAYMENT_GATEWAY") defaultTarget = "Paystack Payments Limited";
    if (category === "BANK_ACCOUNT") defaultTarget = formData.targetInstitution || "Access Bank";
    
    setFormData(prev => ({
      ...prev,
      purposeCategory: category,
      targetInstitution: defaultTarget
    }));
  };

  const handleNext = () => {
    const check = validateStep2(formData);
    if (!check.isValid) {
      showToast(check.error || "Please fill all required purpose fields.", "error");
      return;
    }
    onContinue();
  };

  const isCustomColor = !PRESET_ACCENT_COLORS.some(
    c => c.hex.toLowerCase() === (formData.accentColor || "").toLowerCase()
  ) && !!formData.accentColor;

  const isCustomFintech = formData.purposeCategory === "PAYMENT_GATEWAY" && 
    !NIGERIAN_PAYMENT_GATEWAYS.includes(formData.targetInstitution) && 
    formData.targetInstitution !== "";

  const isCustomBank = formData.purposeCategory === "BANK_ACCOUNT" && 
    !banksList.some(b => b.name.toLowerCase() === (formData.targetInstitution || "").toLowerCase()) && 
    formData.targetInstitution !== "";

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Step Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Bank className="h-5 w-5" weight="bold" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Resolution Purpose & Brand Accent</h2>
          <p className="text-xs text-muted-foreground">
            Select the target banking or fintech institution and customize letterhead styling.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Purpose Category Selection */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-foreground">
            Primary Resolution Purpose <span className="text-primary">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PURPOSE_CATEGORIES.map((cat) => {
              const isSelected = formData.purposeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handlePurposeCategoryChange(cat.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border-primary text-foreground shadow-sm ring-1 ring-primary/20"
                      : "bg-secondary/30 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground">{cat.title}</span>
                    {isSelected && <Check className="h-4 w-4 text-primary" weight="bold" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {cat.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Financial Institution Selector (NO DROPDOWNS - PURE BUTTON CARDS & CHIPS) */}
        <div className="space-y-4 pt-1">
          {formData.purposeCategory === "PAYMENT_GATEWAY" ? (
            /* FINTECH / PAYMENT GATEWAY BUTTONS */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Select Payment Gateway / Fintech Provider <span className="text-primary">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">Click to select provider</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {NIGERIAN_PAYMENT_GATEWAYS.map((gw) => {
                  const isSelected = formData.targetInstitution === gw;
                  return (
                    <button
                      key={gw}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, targetInstitution: gw }))}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? "bg-primary/10 border-primary text-foreground font-bold shadow-sm ring-1 ring-primary/20"
                          : "bg-secondary/30 border-border text-foreground hover:border-primary/40 hover:bg-secondary/50 font-medium"
                      }`}
                    >
                      <span className="text-xs truncate">{gw}</span>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" weight="bold" />}
                    </button>
                  );
                })}

                {/* Custom Fintech Button */}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    targetInstitution: isCustomFintech ? prev.targetInstitution : "Custom Fintech" 
                  }))}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isCustomFintech || formData.targetInstitution === "Custom Fintech"
                      ? "bg-primary/10 border-primary text-foreground font-bold shadow-sm ring-1 ring-primary/20"
                      : "bg-secondary/30 border-border text-muted-foreground hover:border-primary/40 font-medium"
                  }`}
                >
                  <span className="text-xs truncate">+ Other / Custom Provider</span>
                  {(isCustomFintech || formData.targetInstitution === "Custom Fintech") && (
                    <Check className="h-4 w-4 text-primary shrink-0" weight="bold" />
                  )}
                </button>
              </div>

              {/* Custom Fintech Name Input */}
              {(isCustomFintech || formData.targetInstitution === "Custom Fintech") && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Enter Custom Fintech / Provider Name <span className="text-primary">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Leatherback, BudPay, Nomba, Flutterwave Ghana..."
                    value={formData.targetInstitution === "Custom Fintech" ? "" : formData.targetInstitution}
                    onChange={(e) => setFormData({ ...formData, targetInstitution: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-xs font-semibold focus:outline-none focus:border-primary text-foreground"
                    autoFocus
                  />
                </div>
              )}
            </div>
          ) : (
            /* COMMERCIAL BANK SELECTION (PAYSTACK POWERED BUTTON CHIPS - NO SELECT DROPDOWN) */
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-bold text-foreground">
                  Target Commercial Bank / Microfinance Institution <span className="text-primary">*</span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Fetched live from Paystack ({banksList.length} banks available)
                </span>
              </div>

              {/* Live Bank Search Filter */}
              <div className="relative">
                <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Type to filter banks (e.g. Access, GTB, Zenith, Moniepoint, Providus)..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  className="w-full pl-10 pr-4 h-11 text-xs bg-secondary/40 border border-border rounded-xl focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground font-medium"
                />
                {bankSearch && (
                  <button
                    type="button"
                    onClick={() => setBankSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Popular Banks Quick Select */}
              {!bankSearch && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Popular Nigerian Banks:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_BANKS.map((bName) => {
                      const isSelected = formData.targetInstitution?.toLowerCase() === bName.toLowerCase();
                      return (
                        <button
                          key={bName}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, targetInstitution: bName }))}
                          className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm scale-[1.02]"
                              : "bg-secondary/40 border-border text-foreground hover:border-primary/40 hover:bg-secondary/70"
                          }`}
                        >
                          <span>{bName}</span>
                          {isSelected && <Check className="h-3.5 w-3.5" weight="bold" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Filtered Bank List Grid (Pure Clickable Buttons) */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  {bankSearch ? `Search Results (${filteredBanks.length}):` : "All Nigerian Banks (Scroll to view):"}
                </span>

                <div className="max-h-48 overflow-y-auto p-2 rounded-xl border border-border bg-secondary/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 custom-scrollbar">
                  {filteredBanks.map((bank) => {
                    const isSelected = formData.targetInstitution?.toLowerCase() === bank.name.toLowerCase();
                    return (
                      <button
                        key={bank.code || bank.name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, targetInstitution: bank.name }))}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-primary/10 border-primary text-foreground font-bold ring-1 ring-primary/20 shadow-sm"
                            : "bg-card border-border/70 text-foreground hover:border-primary/40 hover:bg-secondary/50 font-medium"
                        }`}
                      >
                        <span className="truncate">{bank.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" weight="bold" />}
                      </button>
                    );
                  })}

                  {filteredBanks.length === 0 && (
                    <div className="col-span-full p-4 text-center text-xs text-muted-foreground space-y-2">
                      <p>No banks match &quot;{bankSearch}&quot;</p>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, targetInstitution: bankSearch }));
                          setBankSearch("");
                        }}
                        className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs hover:bg-primary/90 transition-all cursor-pointer"
                      >
                        Use &quot;{bankSearch}&quot; as Bank Name
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Selection Display Pill */}
              {formData.targetInstitution && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" weight="bold" />
                    <span className="text-muted-foreground">Selected Institution:</span>
                    <span className="font-bold text-foreground">{formData.targetInstitution}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Account Currency & Branch Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start pt-2 border-t border-border">
          {/* Account Currency */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-xs font-bold text-foreground">
              Account / Facility Currency
            </label>
            <select
              value={formData.accountCurrency || "NGN (Nigerian Naira / ₦)"}
              onChange={(e) => setFormData({ ...formData, accountCurrency: e.target.value })}
              className="w-full h-11 px-3 rounded-xl bg-secondary/50 border border-border text-xs font-bold focus:outline-none focus:border-primary text-foreground"
            >
              {ACCOUNT_CURRENCIES.map((curr) => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>

          {/* Institution Branch */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-xs font-bold text-foreground">
              Bank Branch / Digital Division <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.institutionBranch || ""}
              onChange={(e) => setFormData({ ...formData, institutionBranch: e.target.value })}
              placeholder="e.g. Victoria Island Commercial Branch, Marina Head Office, or Digital Channels Division"
              className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Custom Purpose Notes / Specific Directives */}
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                Specific Purpose Directives & Notes <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] text-muted-foreground font-medium">Included in legal operative clauses</span>
            </div>
            <textarea
              rows={3}
              value={formData.customPurposeDescription || ""}
              onChange={(e) => setFormData({ ...formData, customPurposeDescription: e.target.value })}
              placeholder={
                formData.purposeCategory === "OTHER"
                  ? "Describe the exact resolution purpose, directive, or authority granted by the Board of Directors..."
                  : "e.g. Authorize corporate debit cards, mobile app access, virtual account collections, or POS terminal issuance."
              }
              className={`w-full p-3.5 rounded-xl bg-secondary/50 border text-xs font-medium focus:outline-none focus:border-primary resize-none text-foreground placeholder:text-muted-foreground ${
                formData.purposeCategory === "OTHER" && !formData.customPurposeDescription?.trim()
                  ? "border-primary/50"
                  : "border-border"
              }`}
            />
          </div>

          {/* Brand Accent Color Swatch & Palette Picker */}
          <div className="space-y-3 sm:col-span-2 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" weight="bold" />
                <label className="text-xs font-bold text-foreground">
                  Letterhead Brand Accent Color
                </label>
              </div>

              {/* Active Color Preview Tag */}
              <div className="flex items-center gap-2 bg-secondary/70 border border-border/80 px-2.5 py-1 rounded-xl">
                <div 
                  className="h-3.5 w-3.5 rounded-full shadow-sm border border-border/40"
                  style={{ backgroundColor: formData.accentColor || "#0f172a" }}
                />
                <span className="font-mono text-[11px] font-bold text-foreground uppercase">
                  {formData.accentColor || "#0f172a"}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {PRESET_ACCENT_COLORS.map((c) => {
                const isSelected = (formData.accentColor || "").toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setFormData({ ...formData, accentColor: c.hex })}
                    className="group flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-110"
                    title={c.name}
                  >
                    <div 
                      className={`h-8 w-8 rounded-full shadow-md transition-all flex items-center justify-center ${
                        isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : "border border-border/40"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 text-white" weight="bold" />}
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">
                      {c.name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}

              {/* Visible Custom Color Swatch */}
              {isCustomColor && (
                <button
                  type="button"
                  className="group flex flex-col items-center gap-1 cursor-pointer transition-transform scale-110"
                  title="Active Custom Swatch"
                >
                  <div 
                    className="h-8 w-8 rounded-full shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background flex items-center justify-center"
                    style={{ backgroundColor: formData.accentColor }}
                  >
                    <Check className="h-3.5 w-3.5 text-white" weight="bold" />
                  </div>
                  <span className="text-[10px] font-bold text-primary">Custom</span>
                </button>
              )}

              {/* Custom Color Input Trigger */}
              <div className="flex flex-col items-center gap-1">
                <label 
                  className="h-8 w-8 rounded-full border border-dashed border-border bg-secondary flex items-center justify-center cursor-pointer hover:border-primary transition-colors shadow-sm relative overflow-hidden"
                  title="Choose Custom HEX Color"
                >
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" weight="bold" />
                  <input
                    type="color"
                    value={formData.accentColor || "#0f172a"}
                    onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                </label>
                <span className="text-[10px] font-medium text-muted-foreground">Pick</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Step 2 Bottom Navigation Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground font-bold text-xs hover:bg-secondary transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" weight="bold" />
          <span>Back to Company Details</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
        >
          <span>Continue to Directors & Signatures</span>
          <ArrowRight className="h-4 w-4" weight="bold" />
        </button>
      </div>
    </div>
  );
}
