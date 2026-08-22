"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  User, 
  Phone, 
  Calendar, 
  ArrowsClockwise, 
  CheckCircle, 
  WarningCircle, 
  ArrowRight, 
  ShieldCheck, 
  Spinner, 
  IdentificationCard, 
  Bank, 
  X, 
  Wallet, 
  Lock, 
  XCircle, 
  Check 
} from "@phosphor-icons/react";

export const ENROLLING_BANKS = [
  { id: "AGENCY_BVN", name: "Agency BVN" },
  { id: "ENTERPRISE", name: "Enterprise Bank" },
  { id: "AGRICULTURAL_BANK", name: "Agricultural Bank" },
  { id: "NIBSS_IMPORT", name: "NIBSS IMPORT" },
  { id: "HERITAGE_BANK", name: "Heritage Bank" },
  { id: "MICROFINANCE_BANK", name: "Microfinance Bank" },
];

export const MODIFICATION_OPTIONS = [
  {
    id: "CHANGE_OF_NAME",
    label: "Change of Name Only",
    hasName: true,
    hasDob: false,
    hasPhone: false,
    priceKey: "BVN_MOD_NAME",
    defaultPrice: 3000,
  },
  {
    id: "CHANGE_OF_DOB",
    label: "Change of Date of Birth (DOB) Only",
    hasName: false,
    hasDob: true,
    hasPhone: false,
    priceKey: "BVN_MOD_DOB",
    defaultPrice: 15000,
  },
  {
    id: "CHANGE_OF_PHONE",
    label: "Change of Phone Number Only",
    hasName: false,
    hasDob: false,
    hasPhone: true,
    priceKey: "BVN_MOD_PHONE",
    defaultPrice: 2500,
  },
  {
    id: "CHANGE_OF_NAME_PHONE",
    label: "Change of Name & Phone Number",
    hasName: true,
    hasDob: false,
    hasPhone: true,
    priceKey: "BVN_MOD_NAME_PHONE",
    defaultPrice: 5000,
  },
  {
    id: "CHANGE_OF_DOB_PHONE",
    label: "Change of Date of Birth & Phone Number",
    hasName: false,
    hasDob: true,
    hasPhone: true,
    priceKey: "BVN_MOD_DOB_PHONE",
    defaultPrice: 17000,
  },
  {
    id: "CHANGE_OF_NAME_DOB",
    label: "Change of Name & Date of Birth (DOB)",
    hasName: true,
    hasDob: true,
    hasPhone: false,
    priceKey: "BVN_MOD_NAME_DOB",
    defaultPrice: 17500,
  },
  {
    id: "CHANGE_OF_ALL",
    label: "Change of Name, DOB & Phone (All 3)",
    hasName: true,
    hasDob: true,
    hasPhone: true,
    priceKey: "BVN_MOD_ALL",
    defaultPrice: 19500,
  },
];

interface BvnModificationFormProps {
  pricing: Record<string, number>;
  walletBalance: number;
  dobOver5YearsAllowed?: boolean;
  onSuccess: (result: any) => void;
}

export default function BvnModificationForm({
  pricing,
  walletBalance,
  dobOver5YearsAllowed = true,
  onSuccess,
}: BvnModificationFormProps) {
  // Step 1: Selected Bank (null if none chosen yet)
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  // Step 2: Selected Modification Type (null if none chosen yet)
  const [selectedModType, setSelectedModType] = useState<string | null>(null);

  // Step 3: Primary Identifiers
  const [nin, setNin] = useState("");
  const [bvn, setBvn] = useState("");
  const [oldFirstName, setOldFirstName] = useState("");
  const [oldLastName, setOldLastName] = useState("");
  const [oldMiddleName, setOldMiddleName] = useState("");

  // Step 4: Dynamic Fields
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newMiddleName, setNewMiddleName] = useState("");

  const [oldDob, setOldDob] = useState("");
  const [newDob, setNewDob] = useState("");

  const [oldPhone, setOldPhone] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Modal & Submission State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [statutoryConsent, setStatutoryConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Side Slide-In Error Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Active bank and mod config
  const activeBank = useMemo(() => {
    return ENROLLING_BANKS.find((b) => b.id === selectedBank) || null;
  }, [selectedBank]);

  const activeModConfig = useMemo(() => {
    return MODIFICATION_OPTIONS.find((m) => m.id === selectedModType) || null;
  }, [selectedModType]);

  // Real-time DOB calculation
  const dobCalculation = useMemo(() => {
    if (!activeModConfig?.hasDob || !oldDob || !newDob) {
      return { diffYears: 0, isOverFiveYears: false };
    }
    const current = new Date(oldDob);
    const updated = new Date(newDob);

    if (isNaN(current.getTime()) || isNaN(updated.getTime())) {
      return { diffYears: 0, isOverFiveYears: false };
    }

    const diffTime = Math.abs(updated.getTime() - current.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const diffYears = Number((diffDays / 365.2425).toFixed(2));
    const isOverFiveYears = diffDays > 1826.25;

    return { diffYears, isOverFiveYears };
  }, [activeModConfig?.hasDob, oldDob, newDob]);

  // Price Calculation
  const { totalPrice, basePrice, surchargeAmount } = useMemo(() => {
    if (!activeModConfig) return { totalPrice: 0, basePrice: 0, surchargeAmount: 0 };

    const base = pricing[activeModConfig.priceKey] || activeModConfig.defaultPrice;
    let surcharge = 0;

    if (activeModConfig.hasDob && dobCalculation.isOverFiveYears) {
      surcharge = pricing.BVN_MOD_DOB_SURCHARGE || 5000;
    }

    return {
      totalPrice: base + surcharge,
      basePrice: base,
      surchargeAmount: surcharge,
    };
  }, [activeModConfig, dobCalculation, pricing]);

  const isInsufficient = walletBalance < totalPrice && totalPrice > 0;
  const shortfall = Math.max(0, totalPrice - walletBalance);
  const remainingBalance = Math.max(0, walletBalance - totalPrice);

  // Validate inputs before showing review modal
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBank) {
      showToast("Please select your enrolling bank.");
      return;
    }

    if (!selectedModType || !activeModConfig) {
      showToast("Please select a modification service.");
      return;
    }

    const cleanNin = nin.trim().replace(/\D/g, "");
    if (!cleanNin || cleanNin.length !== 11) {
      showToast("NIN must be exactly 11 digits.");
      return;
    }

    const cleanBvn = bvn.trim().replace(/\D/g, "");
    if (!cleanBvn || cleanBvn.length !== 11) {
      showToast("BVN must be exactly 11 digits.");
      return;
    }

    if (!oldFirstName.trim() || !oldLastName.trim()) {
      showToast("Old First Name and Surname on BVN are required.");
      return;
    }

    if (activeModConfig.hasName) {
      if (!newFirstName.trim() || !newLastName.trim()) {
        showToast("New First Name and New Surname are required.");
        return;
      }
    }

    if (activeModConfig.hasDob) {
      if (!oldDob || !newDob) {
        showToast("Both Old Date of Birth and New Date of Birth are required.");
        return;
      }
      if (dobCalculation.isOverFiveYears && !dobOver5YearsAllowed) {
        showToast("DOB difference over 5 years is currently not accepted by policy.");
        return;
      }
    }

    if (activeModConfig.hasPhone) {
      const cleanNewPhone = newPhone.trim().replace(/\s+/g, "");
      if (!cleanNewPhone || !/^0\d{10}$/.test(cleanNewPhone)) {
        showToast("New Phone Number must be 11 digits starting with 0.");
        return;
      }
      if (!oldPhone.trim()) {
        showToast("Old Phone Number on BVN is required.");
        return;
      }
    }

    setShowReviewModal(true);
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    if (!selectedBank || !selectedModType || !activeModConfig) return;

    if (!statutoryConsent) {
      showToast("Please check the authorization and consent confirmation.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        enrollingBank: selectedBank,
        modificationType: selectedModType,
        nin: nin.trim().replace(/\D/g, ""),
        bvn: bvn.trim().replace(/\D/g, ""),
        oldFirstName: oldFirstName.trim(),
        oldLastName: oldLastName.trim(),
        oldMiddleName: oldMiddleName.trim() || null,
        newFirstName: activeModConfig.hasName ? newFirstName.trim() : null,
        newLastName: activeModConfig.hasName ? newLastName.trim() : null,
        newMiddleName: activeModConfig.hasName && newMiddleName.trim() ? newMiddleName.trim() : null,
        oldDob: activeModConfig.hasDob ? oldDob : null,
        newDob: activeModConfig.hasDob ? newDob : null,
        oldPhone: activeModConfig.hasPhone ? oldPhone.trim() : null,
        newPhone: activeModConfig.hasPhone ? newPhone.trim() : null,
      };

      const res = await fetch("/api/bvn/modification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowReviewModal(false);
        onSuccess(data);
      } else {
        showToast(data.message || "Failed to submit BVN modification request.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      showToast("Network connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans relative">
      
      {/* Floating Side Slide-In Error Notification Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[999999] max-w-sm w-full bg-rose-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-right-10 duration-300 border border-rose-500/50">
          <div className="flex items-center gap-2.5">
            <WarningCircle weight="fill" className="h-5 w-5 shrink-0 text-white" />
            <p className="text-xs font-bold leading-tight">{toastMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-rose-700 rounded-lg text-white transition-colors cursor-pointer shrink-0"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* STEP 1: ENROLLING BANK (Collapsing Accordion Flow) */}
      {!selectedBank ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
              Select Enrolling Bank
            </label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose the bank or agency where this BVN was originally registered.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ENROLLING_BANKS.map((bank) => (
              <button
                key={bank.id}
                type="button"
                onClick={() => {
                  setSelectedBank(bank.id);
                  setToastMessage(null);
                }}
                className="p-4 sm:p-5 rounded-2xl border border-border bg-card hover:bg-secondary/40 hover:border-primary/50 text-left transition-all flex items-center gap-3 cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div className="h-10 w-10 rounded-xl bg-secondary group-hover:bg-primary group-hover:text-primary-foreground text-foreground flex items-center justify-center font-bold transition-colors shrink-0">
                  <Bank weight="duotone" className="h-5 w-5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {bank.name}
                </h4>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Active Bank Banner (All others collapsed, clean responsive flex) */
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-primary/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <Bank weight="duotone" className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Selected Enrolling Bank
              </span>
              <h3 className="text-base font-black text-foreground truncate">
                {activeBank?.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedBank(null);
              setToastMessage(null);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-xs shrink-0 cursor-pointer shadow-sm self-start sm:self-auto"
          >
            <ArrowsClockwise weight="bold" className="h-3.5 w-3.5 text-primary" />
            <span>Change Bank</span>
          </button>
        </div>
      )}

      {/* STEP 2: MODIFICATION TYPE (Shown once bank is chosen; collapses once mod type is chosen) */}
      {selectedBank && (
        !selectedModType ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
                Select Modification Type
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose the specific record change you need to update on your BVN profile.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {MODIFICATION_OPTIONS.map((opt) => {
                const price = pricing[opt.priceKey] || opt.defaultPrice;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedModType(opt.id);
                      setToastMessage(null);
                    }}
                    className="p-4 sm:p-5 rounded-2xl border border-border bg-card hover:bg-secondary/40 hover:border-primary/50 text-left transition-all flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-md space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {opt.hasName && <User weight="duotone" className="h-4 w-4 text-blue-500" />}
                        {opt.hasDob && <Calendar weight="duotone" className="h-4 w-4 text-amber-500" />}
                        {opt.hasPhone && <Phone weight="duotone" className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ₦{price.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {opt.label}
                      </h4>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Active Modification Banner (All other options collapsed) */
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-emerald-500/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/20">
                {activeModConfig?.hasName && <User weight="duotone" className="h-5 w-5" />}
                {activeModConfig?.hasDob && !activeModConfig.hasName && <Calendar weight="duotone" className="h-5 w-5" />}
                {activeModConfig?.hasPhone && !activeModConfig.hasName && !activeModConfig.hasDob && <Phone weight="duotone" className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Active Service
                  </span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    ₦{totalPrice.toLocaleString()}
                  </span>
                </div>
                <h3 className="text-base font-black text-foreground truncate">
                  {activeModConfig?.label}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedModType(null);
                setToastMessage(null);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-xs shrink-0 cursor-pointer shadow-sm self-start sm:self-auto"
            >
              <ArrowsClockwise weight="bold" className="h-3.5 w-3.5 text-primary" />
              <span>Change Service</span>
            </button>
          </div>
        )
      )}

      {/* STEP 3: DIRECT DYNAMIC FORM (Rendered once Bank & Mod Type are chosen) */}
      {selectedBank && selectedModType && activeModConfig && (
        <form onSubmit={handleProceedToReview} className="p-5 sm:p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200">
          
          <div className="border-b border-border pb-4">
            <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
              BVN Modification Application
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter your current identifiers and the exact new details to be updated on your BVN profile.
            </p>
          </div>

          {/* Primary Identifiers Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <IdentificationCard weight="bold" className="h-4 w-4" />
              Primary Identifiers
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  11-Digit NIN Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={11}
                    value={nin}
                    onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 12345678901"
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background tracking-wider"
                    required
                  />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  {nin.length}/11 digits {nin.length === 11 && "✓"}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  11-Digit BVN Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={11}
                    value={bvn}
                    onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 22233344455"
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background tracking-wider"
                    required
                  />
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  {bvn.length}/11 digits {bvn.length === 11 && "✓"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Old First Name on BVN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={oldFirstName}
                  onChange={(e) => setOldFirstName(e.target.value.toUpperCase())}
                  placeholder="e.g. ADEWALE"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Old Middle Name on BVN <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={oldMiddleName}
                  onChange={(e) => setOldMiddleName(e.target.value.toUpperCase())}
                  placeholder="e.g. CHUKWUMA"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Old Surname on BVN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={oldLastName}
                  onChange={(e) => setOldLastName(e.target.value.toUpperCase())}
                  placeholder="e.g. MUSA"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                  required
                />
              </div>
            </div>
          </div>

          {/* Dynamic Name Modification Fields */}
          {activeModConfig.hasName && (
            <div className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-4 animate-in fade-in duration-200">
              <h4 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                <User weight="bold" className="h-4 w-4" />
                New Legal Name Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    New First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value.toUpperCase())}
                    placeholder="e.g. EMMANUEL"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    New Middle Name <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newMiddleName}
                    onChange={(e) => setNewMiddleName(e.target.value.toUpperCase())}
                    placeholder="e.g. CHUKWUEMEKA"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    New Surname <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value.toUpperCase())}
                    placeholder="e.g. OKONKWO"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Date of Birth Fields */}
          {activeModConfig.hasDob && (
            <div className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Calendar weight="bold" className="h-4 w-4" />
                  Date of Birth Modification
                </h4>
                <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded font-mono">
                  5-Year Rule Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Old Date of Birth on BVN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={oldDob}
                    onChange={(e) => setOldDob(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    New Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Surcharge Feedback */}
              {oldDob && newDob && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  dobCalculation.isOverFiveYears 
                    ? (!dobOver5YearsAllowed 
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300")
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span>Calculated Age Difference:</span>
                    <span className="font-mono text-sm">{dobCalculation.diffYears} Years</span>
                  </div>

                  {dobCalculation.isOverFiveYears ? (
                    !dobOver5YearsAllowed ? (
                      <p className="text-[11px] leading-relaxed font-semibold">
                        ❌ Administrative Policy: Date of birth modifications exceeding 5 years are currently not accepted.
                      </p>
                    ) : (
                      <p className="text-[11px] leading-relaxed">
                        ⚠️ Age difference exceeds <strong>5 years</strong>. A statutory surcharge of <strong>+₦{(pricing.BVN_MOD_DOB_SURCHARGE || 5000).toLocaleString()}</strong> is included in the total checkout fee.
                      </p>
                    )
                  ) : (
                    <p className="text-[11px] leading-relaxed">
                      ✅ Age adjustment is within the standard 5-year threshold. No statutory surcharge required.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Dynamic Phone Number Fields */}
          {activeModConfig.hasPhone && (
            <div className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-4 animate-in fade-in duration-200">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Phone weight="bold" className="h-4 w-4" />
                Phone Number Modification
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Old Phone on BVN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={11}
                    value={oldPhone}
                    onChange={(e) => setOldPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 08012345678"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    New Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={11}
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 08198765432"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Submit Trigger (Opens Review Modal) */}
          <div className="pt-4 border-t border-border flex items-center justify-end">
            <button
              type="submit"
              disabled={dobCalculation.isOverFiveYears && !dobOver5YearsAllowed}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Review &amp; Submit Modification</span>
              <ArrowRight weight="bold" className="h-4 w-4" />
            </button>
          </div>

        </form>
      )}

      {/* REVIEW & CONFIRMATION MODAL */}
      {showReviewModal && activeModConfig && activeBank && (
        <div className="fixed inset-0 z-50 p-3 sm:p-6 py-6 sm:py-10 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-2xl rounded-2xl sm:rounded-3xl max-w-lg w-full overflow-hidden text-foreground max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border bg-card flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                  <ShieldCheck weight="bold" className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {isInsufficient ? "Insufficient Balance" : "Confirm BVN Modification"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isInsufficient ? "Wallet top up required" : "Review your details before payment."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X weight="bold" className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              
              {/* Branch 1: Insufficient Balance Crying Emoji State */}
              {isInsufficient ? (
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl select-none">😭</span>
                      <div>
                        <h4 className="font-black text-sm text-foreground">You don&apos;t have enough balance</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Please top up your wallet to submit this BVN modification request.
                        </p>
                      </div>
                    </div>

                    <div className="bg-background/80 dark:bg-background/50 rounded-xl p-3.5 border border-border space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service:</span>
                        <span className="font-bold text-foreground">{activeModConfig.label} ({activeBank.name})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Required Fee:</span>
                        <span className="font-bold text-rose-500">₦{totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Balance:</span>
                        <span className="font-bold text-foreground">₦{walletBalance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-1.5 font-bold">
                        <span className="text-amber-600 dark:text-amber-400">Shortfall:</span>
                        <span className="text-amber-600 dark:text-amber-400 font-mono">₦{shortfall.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary of Data Entered */}
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2 text-xs">
                    <div className="flex justify-between border-b border-border/60 pb-1.5">
                      <span className="text-muted-foreground">Target BVN:</span>
                      <span className="font-mono font-bold text-foreground">{bvn}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/60 pb-1.5">
                      <span className="text-muted-foreground">Target NIN:</span>
                      <span className="font-mono font-bold text-foreground">{nin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank:</span>
                      <span className="font-bold text-foreground">{activeBank.name}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Branch 2: Sufficient Balance - Data Summary & Legal Certification */
                <div className="space-y-4">
                  {/* Data Summary Card */}
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between border-b border-border/60 pb-1.5">
                      <span className="text-muted-foreground">Enrolling Bank:</span>
                      <span className="font-bold text-foreground">{activeBank.name}</span>
                    </div>

                    <div className="flex justify-between border-b border-border/60 pb-1.5">
                      <span className="text-muted-foreground">Service Type:</span>
                      <span className="font-bold text-foreground">{activeModConfig.label}</span>
                    </div>

                    <div className="flex justify-between border-b border-border/60 pb-1.5">
                      <span className="text-muted-foreground">Target BVN:</span>
                      <span className="font-mono font-bold text-foreground">{bvn}</span>
                    </div>

                    <div className="flex justify-between border-b border-border/60 pb-1.5">
                      <span className="text-muted-foreground">Target NIN:</span>
                      <span className="font-mono font-bold text-foreground">{nin}</span>
                    </div>

                    <div className="flex justify-between border-b border-border/60 pb-1.5">
                      <span className="text-muted-foreground">Old Name on Record:</span>
                      <span className="font-bold text-foreground">
                        {[oldFirstName, oldMiddleName, oldLastName].filter(Boolean).join(" ")}
                      </span>
                    </div>

                    {activeModConfig.hasName && (
                      <div className="flex justify-between border-b border-border/60 pb-1.5">
                        <span className="text-muted-foreground">New Legal Name:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {[newFirstName, newMiddleName, newLastName].filter(Boolean).join(" ")}
                        </span>
                      </div>
                    )}

                    {activeModConfig.hasDob && (
                      <div className="flex justify-between border-b border-border/60 pb-1.5">
                        <span className="text-muted-foreground">New Date of Birth:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {newDob} {surchargeAmount > 0 && `(+₦${surchargeAmount.toLocaleString()} surcharge)`}
                        </span>
                      </div>
                    )}

                    {activeModConfig.hasPhone && (
                      <div className="flex justify-between border-b border-border/60 pb-1.5">
                        <span className="text-muted-foreground">New Phone Number:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{newPhone}</span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-border pt-2 text-xs">
                      <span className="text-muted-foreground">Wallet Balance:</span>
                      <span className="font-bold text-foreground">₦{walletBalance.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Balance After Debit:</span>
                      <span className="font-bold text-foreground">₦{remainingBalance.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between pt-1 border-t border-border font-bold">
                      <span className="text-foreground">Total Service Fee:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                        ₦{totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Mandatory Ownership, Consent & No-Refund Affirmation Checkbox */}
                  <div className="pt-2 border-t border-border">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={statutoryConsent}
                        onChange={(e) => setStatutoryConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                      />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        I hereby declare that I am the <strong>legitimate owner</strong> of this BVN or have been <strong>duly authorized</strong> by the owner to submit this request. I confirm all details are authentic and understand all fees are non-refundable once processed on NIBSS.
                      </span>
                    </label>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 border-t border-border bg-card flex items-center justify-end gap-3 shrink-0">
              {isInsufficient ? (
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="py-2.5 px-4 rounded-xl border border-border text-foreground font-bold text-xs hover:bg-secondary/50 transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>

                  <Link
                    href="/dashboard/wallet"
                    className="py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer text-center"
                  >
                    <Wallet weight="bold" className="h-4 w-4" />
                    <span>Fund Wallet</span>
                    <ArrowRight weight="bold" className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-border text-foreground font-bold text-xs hover:bg-secondary/50 transition-all cursor-pointer"
                  >
                    Back to Form
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting || !statutoryConsent}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle weight="bold" className="h-4 w-4" />
                        <span>Confirm &amp; Pay ₦{totalPrice.toLocaleString()}</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
