"use client";

import React, { useState, useEffect, useRef } from "react";
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
  CaretDown,
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
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadBanks() {
      setLoadingBanks(true);
      try {
        const res = await fetch("/api/banks");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setBanksList(json.data);
        } else {
          // Fallback list of top Nigerian Commercial Banks
          setBanksList([
            { name: "Access Bank Plc", code: "044" },
            { name: "Zenith Bank Plc", code: "057" },
            { name: "Guaranty Trust Bank (GTBank)", code: "058" },
            { name: "First Bank of Nigeria", code: "011" },
            { name: "United Bank for Africa (UBA)", code: "033" },
            { name: "Fidelity Bank Plc", code: "070" },
            { name: "Stanbic IBTC Bank", code: "221" },
            { name: "Sterling Bank Plc", code: "232" },
            { name: "Union Bank of Nigeria", code: "032" },
            { name: "Wema Bank Plc / ALAT", code: "035" },
            { name: "Ecobank Nigeria", code: "050" },
            { name: "Polaris Bank", code: "076" },
            { name: "Providus Bank", code: "101" },
            { name: "Taj Bank", code: "302" },
            { name: "Jaiz Bank", code: "301" },
            { name: "Lotus Bank", code: "303" },
            { name: "Moniepoint Microfinance Bank", code: "50515" },
            { name: "Opay Digital Services", code: "999992" },
            { name: "Kuda Microfinance Bank", code: "50211" },
            { name: "Palmpay Limited", code: "999991" }
          ]);
        }
      } catch {
        // Fallback default list
        setBanksList([
          { name: "Access Bank Plc", code: "044" },
          { name: "Zenith Bank Plc", code: "057" },
          { name: "Guaranty Trust Bank (GTBank)", code: "058" },
          { name: "First Bank of Nigeria", code: "011" },
          { name: "United Bank for Africa (UBA)", code: "033" },
          { name: "Fidelity Bank Plc", code: "070" },
          { name: "Stanbic IBTC Bank", code: "221" },
          { name: "Providus Bank", code: "101" },
          { name: "Moniepoint Microfinance Bank", code: "50515" },
          { name: "Opay Digital Services", code: "999992" }
        ]);
      } finally {
        setLoadingBanks(false);
      }
    }

    loadBanks();
  }, []);

  // Close bank dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBankDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBanks = banksList.filter(b => 
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const handlePurposeCategoryChange = (category: typeof PURPOSE_CATEGORIES[number]["id"]) => {
    let defaultTarget = "";
    if (category === "PAYMENT_GATEWAY") defaultTarget = "Paystack Payments Limited";
    if (category === "BANK_ACCOUNT") defaultTarget = formData.targetInstitution || "Access Bank Plc";
    
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

        {/* Target Financial Institution Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
          {/* Institution Selector */}
          <div className="space-y-1.5 min-w-0" ref={dropdownRef}>
            <label className="text-xs font-bold text-foreground">
              {formData.purposeCategory === "PAYMENT_GATEWAY" 
                ? "Target Fintech / Payment Provider" 
                : "Target Bank / Institution"} <span className="text-primary">*</span>
            </label>

            {formData.purposeCategory === "PAYMENT_GATEWAY" ? (
              <div className="space-y-2">
                <select
                  value={formData.targetInstitution}
                  onChange={(e) => setFormData({ ...formData, targetInstitution: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl bg-secondary/50 border border-border text-xs font-bold focus:outline-none focus:border-primary text-foreground"
                >
                  {NIGERIAN_PAYMENT_GATEWAYS.map((gw) => (
                    <option key={gw} value={gw}>{gw}</option>
                  ))}
                  <option value="Other / Custom Fintech Provider">Other / Custom Fintech Provider</option>
                </select>
                {formData.targetInstitution === "Other / Custom Fintech Provider" && (
                  <input
                    type="text"
                    placeholder="Enter custom payment provider name..."
                    value={formData.targetInstitution === "Other / Custom Fintech Provider" ? "" : formData.targetInstitution}
                    onChange={(e) => setFormData({ ...formData, targetInstitution: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-secondary/50 border border-border text-xs font-medium focus:outline-none focus:border-primary text-foreground"
                  />
                )}
              </div>
            ) : (
              <div className="relative">
                <div 
                  onClick={() => setIsBankDropdownOpen(true)}
                  className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border flex items-center justify-between cursor-pointer focus-within:border-primary"
                >
                  <span className="text-sm font-medium text-foreground truncate">
                    {formData.targetInstitution || (loadingBanks ? "Loading banks..." : "Select or search bank...")}
                  </span>
                  <CaretDown className={`h-4 w-4 text-muted-foreground transition-transform ${isBankDropdownOpen ? "rotate-180" : ""}`} />
                </div>

                {isBankDropdownOpen && (
                  <div className="absolute top-12 left-0 right-0 z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-2 border-b border-border bg-secondary/30">
                      <div className="relative">
                        <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Type bank name..."
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-foreground"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto p-1">
                      {filteredBanks.length > 0 ? (
                        filteredBanks.map((bank) => (
                          <button
                            key={bank.code || bank.name}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, targetInstitution: bank.name });
                              setIsBankDropdownOpen(false);
                              setBankSearch("");
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-colors flex items-center justify-between"
                          >
                            <span>{bank.name}</span>
                            {formData.targetInstitution === bank.name && (
                              <Check className="h-3.5 w-3.5 text-primary" weight="bold" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-muted-foreground">
                          <p>No matching banks.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, targetInstitution: bankSearch });
                              setIsBankDropdownOpen(false);
                              setBankSearch("");
                            }}
                            className="mt-1 text-primary font-bold hover:underline"
                          >
                            Use &quot;{bankSearch}&quot;
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

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
          <div className="space-y-1.5 min-w-0 sm:col-span-2">
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
