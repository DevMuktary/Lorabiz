"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ShieldCheck, AlertCircle, CheckCircle2, User, Phone, Calendar, 
  Wallet, Copy, Check, ArrowRight, X, Lock, FileText, Info, 
  Building2, Sparkles, AlertTriangle, XCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BvnTermsModal from "./BvnTermsModal";

export const ENROLLING_BANKS = [
  { id: "AGENCY_BVN", name: "Agency BVN", description: "POS Agent & Field Enrollment", isAvailable: true },
  { id: "ENTERPRISE", name: "Enterprise Bank", description: "Enterprise Commercial Banking", isAvailable: true },
  { id: "AGRICULTURAL_BANK", name: "Agricultural Bank", description: "Bank of Agriculture / Agribank", isAvailable: true },
  { id: "NIBSS_IMPORT", name: "NIBSS IMPORT", description: "Direct NIBSS Database Migration", isAvailable: true },
  { id: "HERITAGE_BANK", name: "HERITAGE BANK", description: "Heritage Commercial Banking", isAvailable: true },
  { id: "MICROFINANCE_BANK", name: "MICROFINANCE BANK", description: "Microfinance Banking Institutions", isAvailable: true },
];

export const MODIFICATION_OPTIONS = [
  {
    id: "CHANGE_OF_NAME",
    name: "Change of Name Only",
    description: "Update First, Middle, or Surname with official NIN record",
    hasName: true,
    hasDob: false,
    hasPhone: false,
    priceKey: "BVN_MOD_NAME",
    defaultPrice: 3000,
    isAvailable: true,
  },
  {
    id: "CHANGE_OF_DOB",
    name: "Change of Date of Birth (DOB) Only",
    description: "Correct your birth date on BVN record (5-year rule applies)",
    hasName: false,
    hasDob: true,
    hasPhone: false,
    priceKey: "BVN_MOD_DOB",
    defaultPrice: 15000,
    isAvailable: true,
  },
  {
    id: "CHANGE_OF_PHONE",
    name: "Change of Phone Number Only",
    description: "Link a new active SIM phone number to your BVN profile",
    hasName: false,
    hasDob: false,
    hasPhone: true,
    priceKey: "BVN_MOD_PHONE",
    defaultPrice: 2500,
    isAvailable: true,
  },
  {
    id: "CHANGE_OF_NAME_PHONE",
    name: "Change of Name & Phone Number",
    description: "Simultaneously update legal name and primary phone number",
    hasName: true,
    hasDob: false,
    hasPhone: true,
    priceKey: "BVN_MOD_NAME_PHONE",
    defaultPrice: 5000,
    isAvailable: true,
  },
  {
    id: "CHANGE_OF_DOB_PHONE",
    name: "Change of Date of Birth & Phone Number",
    description: "Update birth date alongside primary phone number",
    hasName: false,
    hasDob: true,
    hasPhone: true,
    priceKey: "BVN_MOD_DOB_PHONE",
    defaultPrice: 17000,
    isAvailable: true,
  },
  {
    id: "CHANGE_OF_NAME_DOB",
    name: "Change of Name & Date of Birth (DOB)",
    description: "Update legal name together with date of birth",
    hasName: true,
    hasDob: true,
    hasPhone: false,
    priceKey: "BVN_MOD_NAME_DOB",
    defaultPrice: 17500,
    isAvailable: true,
  },
  {
    id: "CHANGE_OF_ALL",
    name: "Change of Name, DOB & Phone Number (All 3)",
    description: "Comprehensive multi-field record update across all fields",
    hasName: true,
    hasDob: true,
    hasPhone: true,
    priceKey: "BVN_MOD_ALL",
    defaultPrice: 19500,
    isAvailable: true,
  },
];

interface PricingMap {
  [key: string]: number;
}

interface BvnModificationFormProps {
  pricing: PricingMap;
  walletBalance: number;
  onSuccess: (result: any) => void;
}

export default function BvnModificationForm({
  pricing,
  walletBalance,
  onSuccess,
}: BvnModificationFormProps) {
  // Step 1: Enrolling Bank & Modification Type
  const [selectedBank, setSelectedBank] = useState<string>("AGENCY_BVN");
  const [selectedModType, setSelectedModType] = useState<string>("CHANGE_OF_NAME");

  // Step 2: Primary Identifiers
  const [nin, setNin] = useState("");
  const [bvn, setBvn] = useState("");
  const [oldFirstName, setOldFirstName] = useState("");
  const [oldLastName, setOldLastName] = useState("");
  const [oldMiddleName, setOldMiddleName] = useState("");

  // Step 3: Dynamic Update Fields
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newMiddleName, setNewMiddleName] = useState("");

  const [oldDob, setOldDob] = useState("");
  const [newDob, setNewDob] = useState("");

  const [oldPhone, setOldPhone] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // UI States
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<any | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState(false);

  // Active modification config
  const currentModConfig = useMemo(() => {
    return MODIFICATION_OPTIONS.find((m) => m.id === selectedModType) || MODIFICATION_OPTIONS[0];
  }, [selectedModType]);

  const activeBank = useMemo(() => {
    return ENROLLING_BANKS.find((b) => b.id === selectedBank) || ENROLLING_BANKS[0];
  }, [selectedBank]);

  // 1. Calculate Real-Time DOB Difference & Surcharge
  const dobCalculation = useMemo(() => {
    if (!currentModConfig.hasDob || !oldDob || !newDob) {
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
  }, [currentModConfig.hasDob, oldDob, newDob]);

  // 2. Dynamic Price Calculation
  const { totalPrice, baseFee, surchargeAmount, breakdown } = useMemo(() => {
    const base = pricing[currentModConfig.priceKey] || currentModConfig.defaultPrice;
    let surcharge = 0;
    const items: { label: string; amount: number }[] = [
      { label: `${currentModConfig.name} (${activeBank.name})`, amount: base },
    ];

    if (currentModConfig.hasDob && dobCalculation.isOverFiveYears) {
      surcharge = pricing.BVN_MOD_DOB_SURCHARGE || 5000;
      items.push({ label: `5-Year DOB Shift Surcharge (${dobCalculation.diffYears} yrs)`, amount: surcharge });
    }

    return {
      totalPrice: base + surcharge,
      baseFee: base,
      surchargeAmount: surcharge,
      breakdown: items,
    };
  }, [currentModConfig, activeBank, dobCalculation, pricing]);

  const isInsufficientBalance = walletBalance < totalPrice && totalPrice > 0;

  // Validate form inputs
  const handleValidateAndOpenTerms = () => {
    setErrorMsg(null);

    // Bank Validation
    if (!selectedBank) {
      setErrorMsg("Please select your enrolling bank.");
      return;
    }

    // NIN Validation
    const cleanNin = nin.trim().replace(/\D/g, "");
    if (!cleanNin || cleanNin.length !== 11) {
      setErrorMsg("Please enter a valid 11-digit NIN Number.");
      return;
    }

    // BVN Validation
    const cleanBvn = bvn.trim().replace(/\D/g, "");
    if (!cleanBvn || cleanBvn.length !== 11) {
      setErrorMsg("Please enter a valid 11-digit BVN Number.");
      return;
    }

    // Old Name Validation
    if (!oldFirstName.trim() || !oldLastName.trim()) {
      setErrorMsg("Please enter your Old First Name and Old Surname as registered on your BVN.");
      return;
    }

    // Dynamic New Details Validation
    if (currentModConfig.hasName) {
      if (!newFirstName.trim() || !newLastName.trim()) {
        setErrorMsg("Please enter your New First Name and New Surname for Name Modification.");
        return;
      }
    }

    if (currentModConfig.hasDob) {
      if (!oldDob || !newDob) {
        setErrorMsg("Please select both your Old Date of Birth and New Date of Birth.");
        return;
      }
    }

    if (currentModConfig.hasPhone) {
      const cleanNewPhone = newPhone.trim().replace(/\s+/g, "");
      if (!cleanNewPhone || !/^0\d{10}$/.test(cleanNewPhone)) {
        setErrorMsg("Please enter a valid 11-digit New Phone Number starting with 0.");
        return;
      }
      if (!oldPhone.trim()) {
        setErrorMsg("Please enter your Old Phone Number on BVN.");
        return;
      }
    }

    if (isInsufficientBalance) {
      setErrorMsg(`Insufficient wallet balance. You need ₦${totalPrice.toLocaleString()} but currently have ₦${walletBalance.toLocaleString()}.`);
      return;
    }

    setShowTermsModal(true);
  };

  // Execute Submission
  const handleExecuteSubmission = async () => {
    setShowTermsModal(false);
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        enrollingBank: selectedBank,
        modificationType: selectedModType,
        nin: nin.trim(),
        bvn: bvn.trim(),
        oldFirstName: oldFirstName.trim(),
        oldLastName: oldLastName.trim(),
        oldMiddleName: oldMiddleName.trim() || null,
        newFirstName: currentModConfig.hasName ? newFirstName.trim() : null,
        newLastName: currentModConfig.hasName ? newLastName.trim() : null,
        newMiddleName: currentModConfig.hasName && newMiddleName.trim() ? newMiddleName.trim() : null,
        oldDob: currentModConfig.hasDob ? oldDob : null,
        newDob: currentModConfig.hasDob ? newDob : null,
        oldPhone: currentModConfig.hasPhone ? oldPhone.trim() : null,
        newPhone: currentModConfig.hasPhone ? newPhone.trim() : null,
      };

      const res = await fetch("/api/bvn/modification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit BVN modification request.");
      }

      setSubmissionReceipt(data);
      onSuccess(data);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTrackingId(true);
    setTimeout(() => setCopiedTrackingId(false), 2000);
  };

  const oldFullName = [oldFirstName.trim(), oldMiddleName.trim(), oldLastName.trim()].filter(Boolean).join(" ");

  return (
    <div className="space-y-8">
      
      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button 
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-xs text-destructive hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MANDATORY STATUTORY GUIDELINES & NO-REFUND POLICY BANNER */}
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-3xl p-5 sm:p-6 text-foreground space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-amber-700 dark:text-amber-300 font-black text-sm uppercase tracking-wide">
            <ShieldCheck size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Mandatory Guidelines &amp; Compliance Rules</span>
          </div>
          <button
            type="button"
            onClick={() => setShowGuidelines(!showGuidelines)}
            className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
          >
            <span>{showGuidelines ? "Hide Rules" : "Show Rules"}</span>
            {showGuidelines ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showGuidelines && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed pt-1 animate-in fade-in duration-200">
            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <span className="font-black text-amber-700 dark:text-amber-400">1.</span>
                <p><strong>Mandatory Ownership &amp; Authorization:</strong> You must be the <strong>legitimate owner</strong> of the BVN or <strong>duly authorized</strong> with explicit consent by the owner. Unauthorized modifications constitute identity fraud.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black text-amber-700 dark:text-amber-400">2.</span>
                <p><strong>Supported Enrolling Banks Only:</strong> Ensure your BVN originated from an <strong>Agency Enrollment</strong> or one of our <strong>6 listed supported banks</strong>.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black text-amber-700 dark:text-amber-400">3.</span>
                <p><strong>Must Reflect on VNIN Slip First:</strong> If you previously modified your NIN, verify that your new details are <strong>fully reflecting on your NIMC VNIN Slip</strong>. NIBSS rejects double / unreflected modifications.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black text-amber-700 dark:text-amber-400">4.</span>
                <p><strong>One-Time Modification Rule:</strong> Under NIBSS regulations, each BVN detail category can only be legally modified <strong>once</strong>.</p>
              </div>
            </div>

            <div className="space-y-2 bg-background/70 p-3.5 rounded-2xl border border-border/80">
              <h5 className="font-black text-[11px] uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <XCircle size={14} /> Strict No-Refund &amp; Rejection Conditions:
              </h5>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-muted-foreground">
                <li><strong>No Refund:</strong> If bank enrollment is not among our listed supported banks.</li>
                <li><strong>No Refund:</strong> If you submit old/unreflected NIN details.</li>
                <li><strong>No Refund:</strong> If you have previously completed similar modifications.</li>
                <li><strong>No Refund:</strong> If the request is an attempt at a complete change of identity.</li>
                <li><strong>Instant Rejection:</strong> If you submit invalid details or bundle duplicate requests.</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* STEP 1: SELECT ENROLLING BANK */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
            1
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground">Select Enrolling Bank</h3>
            <p className="text-xs text-muted-foreground">Choose the bank or agency where this BVN was originally registered.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ENROLLING_BANKS.map((bank) => {
            const isSelected = selectedBank === bank.id;
            return (
              <button
                key={bank.id}
                type="button"
                disabled={!bank.isAvailable}
                onClick={() => {
                  setSelectedBank(bank.id);
                  if (errorMsg) setErrorMsg(null);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? "border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-500/10 shadow-sm"
                    : "bg-secondary/30 border-border hover:border-emerald-500/40"
                } ${!bank.isAvailable ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-xl ${isSelected ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground"}`}>
                    <Building2 size={16} />
                  </div>
                  {isSelected && <Check size={14} strokeWidth={2.5} className="text-emerald-600 dark:text-emerald-400" />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-foreground">{bank.name}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{bank.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 2: SELECT MODIFICATION TYPE (7 Distinct Options) */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
            2
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground">Select Modification Type</h3>
            <p className="text-xs text-muted-foreground">Select the specific record change you need to process.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {MODIFICATION_OPTIONS.map((opt) => {
            const isSelected = selectedModType === opt.id;
            const price = pricing[opt.priceKey] || opt.defaultPrice;

            return (
              <button
                key={opt.id}
                type="button"
                disabled={!opt.isAvailable}
                onClick={() => {
                  setSelectedModType(opt.id);
                  if (errorMsg) setErrorMsg(null);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-500/10 shadow-sm"
                    : "bg-secondary/30 border-border hover:border-emerald-500/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {opt.hasName && <User size={14} className="text-emerald-600 dark:text-emerald-400" />}
                    {opt.hasDob && <Calendar size={14} className="text-amber-500" />}
                    {opt.hasPhone && <Phone size={14} className="text-sky-500" />}
                  </div>
                  {isSelected && <Check size={14} className="text-emerald-600 dark:text-emerald-400" />}
                </div>

                <div>
                  <h4 className="text-xs font-black text-foreground">{opt.name}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{opt.description}</p>
                </div>

                <div className="pt-2 border-t border-border/60 flex justify-between items-center text-xs">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Standard Fee:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">₦{price.toLocaleString()}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 3: PRIMARY IDENTIFIERS (Always required) */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
            3
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground">Current BVN &amp; NIN Profile</h3>
            <p className="text-xs text-muted-foreground">Enter primary identifiers and current legal names as registered on BVN.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>11-Digit NIN Number <span className="text-destructive">*</span></span>
              <span className="text-[10px] font-mono text-muted-foreground">{nin.length}/11</span>
            </label>
            <input
              type="text"
              maxLength={11}
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 12345678901"
              className="w-full h-11 px-4 rounded-xl border border-border bg-background font-mono text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>11-Digit BVN Number <span className="text-destructive">*</span></span>
              <span className="text-[10px] font-mono text-muted-foreground">{bvn.length}/11</span>
            </label>
            <input
              type="text"
              maxLength={11}
              value={bvn}
              onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 22233344455"
              className="w-full h-11 px-4 rounded-xl border border-border bg-background font-mono text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Old First Name (on BVN) <span className="text-destructive">*</span></label>
            <input
              type="text"
              value={oldFirstName}
              onChange={(e) => setOldFirstName(e.target.value.toUpperCase())}
              placeholder="e.g. ADEWALE"
              className="w-full h-11 px-4 rounded-xl border border-border bg-background text-xs font-bold uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Old Middle Name (Optional)</label>
            <input
              type="text"
              value={oldMiddleName}
              onChange={(e) => setOldMiddleName(e.target.value.toUpperCase())}
              placeholder="e.g. CHUKWUMA"
              className="w-full h-11 px-4 rounded-xl border border-border bg-background text-xs font-bold uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Old Surname / Last Name <span className="text-destructive">*</span></label>
            <input
              type="text"
              value={oldLastName}
              onChange={(e) => setOldLastName(e.target.value.toUpperCase())}
              placeholder="e.g. MUSA"
              className="w-full h-11 px-4 rounded-xl border border-border bg-background text-xs font-bold uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>
      </div>

      {/* STEP 4: DYNAMIC UPDATE DETAILS (Based on selected modification type) */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
            4
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground">New Modification Details</h3>
            <p className="text-xs text-muted-foreground">Provide the exact new information to be updated on your BVN profile.</p>
          </div>
        </div>

        {/* 1. New Legal Name Inputs */}
        {currentModConfig.hasName && (
          <div className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-4 animate-in fade-in duration-200">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <User size={15} /> New Legal Name Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">New First Name <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value.toUpperCase())}
                  placeholder="e.g. EMMANUEL"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-bold uppercase text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">New Middle Name (Optional)</label>
                <input
                  type="text"
                  value={newMiddleName}
                  onChange={(e) => setNewMiddleName(e.target.value.toUpperCase())}
                  placeholder="e.g. CHUKWUEMEKA"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-bold uppercase text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">New Surname / Last Name <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value.toUpperCase())}
                  placeholder="e.g. OKONKWO"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-bold uppercase text-foreground"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Date of Birth Inputs & Real-Time Surcharge Calculator */}
        {currentModConfig.hasDob && (
          <div className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Calendar size={15} /> Date of Birth Adjustment
              </h4>
              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded font-mono">5-Year Rule Active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Old Date of Birth on BVN <span className="text-destructive">*</span></label>
                <input
                  type="date"
                  value={oldDob}
                  onChange={(e) => setOldDob(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Correct / New Date of Birth <span className="text-destructive">*</span></label>
                <input
                  type="date"
                  value={newDob}
                  onChange={(e) => setNewDob(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground"
                />
              </div>
            </div>

            {/* Real-Time Surcharge Banner if > 5 Years */}
            {oldDob && newDob && (
              <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                dobCalculation.isOverFiveYears 
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span>Calculated Age Difference:</span>
                  <span className="font-mono text-sm">{dobCalculation.diffYears} Years</span>
                </div>
                {dobCalculation.isOverFiveYears ? (
                  <p className="text-[11px] leading-relaxed">
                    ⚠️ The requested age adjustment exceeds <strong>5 years</strong>. In accordance with NIBSS statutory regulations, an additional surcharge of <strong>+₦{(pricing.BVN_MOD_DOB_SURCHARGE || 5000).toLocaleString()}</strong> is dynamically applied to your request.
                  </p>
                ) : (
                  <p className="text-[11px] leading-relaxed">
                    ✅ Age adjustment is within the standard 5-year threshold. No statutory surcharge applied.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. Phone Number Inputs */}
        {currentModConfig.hasPhone && (
          <div className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-4 animate-in fade-in duration-200">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Phone size={15} /> Phone Number Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Old Phone on BVN <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  maxLength={11}
                  value={oldPhone}
                  onChange={(e) => setOldPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 08012345678"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background font-mono text-xs font-bold text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">New Registered Phone Number <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  maxLength={11}
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 08198765432"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background font-mono text-xs font-bold text-foreground"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 5: ORDER SUMMARY & SUBMISSION */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
            5
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground">Order &amp; Pricing Summary</h3>
            <p className="text-xs text-muted-foreground">Review fee breakdown and authorize wallet debit.</p>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="bg-secondary/30 rounded-2xl p-5 border border-border space-y-3 text-xs">
          <div className="flex justify-between items-center text-foreground">
            <span className="font-medium text-muted-foreground">Enrolling Bank:</span>
            <span className="font-bold">{activeBank.name}</span>
          </div>
          <div className="flex justify-between items-center text-foreground">
            <span className="font-medium text-muted-foreground">Modification Type:</span>
            <span className="font-bold">{currentModConfig.name}</span>
          </div>

          {breakdown.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-foreground">
              <span className="font-medium text-muted-foreground">{item.label}:</span>
              <span className="font-bold">₦{item.amount.toLocaleString()}</span>
            </div>
          ))}

          <div className="border-t border-border/80 pt-3 flex justify-between items-center text-sm">
            <span className="font-black text-foreground">Total Payable:</span>
            <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">₦{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* Insufficient Balance Crying Emoji State */}
        {isInsufficientBalance && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <span className="text-3xl select-none">😭</span>
              <div>
                <h4 className="font-black text-sm text-foreground">You don&apos;t have enough wallet balance</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Please fund your wallet with at least ₦{(totalPrice - walletBalance).toLocaleString()} to proceed.</p>
              </div>
            </div>
            <Link 
              href="/dashboard/wallet"
              className="inline-flex items-center justify-center gap-2 w-full h-11 bg-primary text-primary-foreground font-black text-xs rounded-xl shadow-md hover:opacity-90 cursor-pointer"
            >
              <Wallet size={16} />
              <span>Fund Wallet Now</span>
            </Link>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="button"
          disabled={isInsufficientBalance || isSubmitting || !bvn || !nin || !oldFirstName || !oldLastName}
          onClick={handleValidateAndOpenTerms}
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer transition-all"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting Request...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Review &amp; Authorize Modification (₦{totalPrice.toLocaleString()})
              <ArrowRight size={16} />
            </span>
          )}
        </Button>
      </div>

      {/* Statutory Terms & Conditions Modal */}
      <BvnTermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleExecuteSubmission}
        bvn={bvn}
        nin={nin}
        applicantName={oldFullName}
        enrollingBankName={activeBank.name}
        modificationLabel={currentModConfig.name}
        totalFee={totalPrice}
      />

      {/* Instant Success Receipt Modal */}
      {submissionReceipt && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/98 dark:bg-background/98 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card text-card-foreground border border-border rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-300 text-center my-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="drop-shadow-md" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Application Received
              </span>
              <h3 className="text-2xl font-black text-foreground">BVN Modification Queued</h3>
              <p className="text-xs text-muted-foreground">Your request has been registered and sent to compliance.</p>
            </div>

            {/* Tracking ID Badge */}
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Tracking Reference</span>
                <p className="text-base font-mono font-black text-foreground">{submissionReceipt.trackingId}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(submissionReceipt.trackingId)}
                className="h-9 px-3 text-xs font-bold cursor-pointer"
              >
                {copiedTrackingId ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span className="ml-1">{copiedTrackingId ? "Copied" : "Copy"}</span>
              </Button>
            </div>

            <div className="bg-secondary/30 rounded-2xl p-4 text-xs space-y-2 text-left border border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Enrolling Bank:</span>
                <span className="font-bold text-foreground">{activeBank.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modification:</span>
                <span className="font-bold text-foreground">{currentModConfig.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">BVN / NIN:</span>
                <span className="font-mono font-bold text-foreground">{bvn} / {nin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Debited:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">₦{Number(submissionReceipt.amountPaid).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Turnaround:</span>
                <span className="font-bold text-foreground">24 – 48 Hours</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                href="/dashboard/bvn/modification/history"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>View My Applications History</span>
                <ArrowRight size={14} />
              </Link>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSubmissionReceipt(null);
                  setNin("");
                  setBvn("");
                  setOldFirstName("");
                  setOldLastName("");
                  setOldMiddleName("");
                  setNewFirstName("");
                  setNewLastName("");
                  setNewMiddleName("");
                  setOldDob("");
                  setNewDob("");
                  setOldPhone("");
                  setNewPhone("");
                }}
                className="w-full h-10 text-xs font-bold cursor-pointer"
              >
                Start Another Modification
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
