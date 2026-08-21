"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ShieldCheck, AlertCircle, CheckCircle2, User, Phone, Calendar, 
  UploadCloud, Wallet, Sparkles, Copy, Check, ArrowRight, X, Lock,
  FileText, Info, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BvnTermsModal from "./BvnTermsModal";

interface PricingMap {
  BVN_MOD_NAME: number;
  BVN_MOD_PHONE: number;
  BVN_MOD_DOB: number;
  BVN_MOD_DOB_SURCHARGE: number;
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
  // Form Inputs
  const [bvn, setBvn] = useState("");
  const [currentFullName, setCurrentFullName] = useState("");

  // Modification toggles
  const [modifyName, setModifyName] = useState(false);
  const [modifyPhone, setModifyPhone] = useState(false);
  const [modifyDob, setModifyDob] = useState(false);

  // Field Values
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newMiddleName, setNewMiddleName] = useState("");

  const [currentPhone, setCurrentPhone] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [currentDob, setCurrentDob] = useState("");
  const [newDob, setNewDob] = useState("");

  // Document Uploads
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Processing States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<any | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState(false);

  // 1. Calculate Real-Time DOB Difference & Surcharge
  const dobCalculation = useMemo(() => {
    if (!modifyDob || !currentDob || !newDob) {
      return { diffYears: 0, isOverFiveYears: false };
    }
    const current = new Date(currentDob);
    const updated = new Date(newDob);

    if (isNaN(current.getTime()) || isNaN(updated.getTime())) {
      return { diffYears: 0, isOverFiveYears: false };
    }

    const diffTime = Math.abs(updated.getTime() - current.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const diffYears = Number((diffDays / 365.2425).toFixed(2));
    const isOverFiveYears = diffDays > 1826.25;

    return { diffYears, isOverFiveYears };
  }, [modifyDob, currentDob, newDob]);

  // 2. Calculate Total Dynamic Price
  const { totalPrice, surchargeAmount, breakdown } = useMemo(() => {
    let total = 0;
    let surcharge = 0;
    const items: { label: string; amount: number }[] = [];

    if (modifyName) {
      const price = pricing.BVN_MOD_NAME || 3000;
      total += price;
      items.push({ label: "Change of Legal Name", amount: price });
    }

    if (modifyPhone) {
      const price = pricing.BVN_MOD_PHONE || 2500;
      total += price;
      items.push({ label: "Change of Phone Number", amount: price });
    }

    if (modifyDob) {
      const price = pricing.BVN_MOD_DOB || 15000;
      total += price;
      items.push({ label: "Change of Date of Birth (Base)", amount: price });

      if (dobCalculation.isOverFiveYears) {
        surcharge = pricing.BVN_MOD_DOB_SURCHARGE || 5000;
        total += surcharge;
        items.push({ label: `5-Year DOB Shift Surcharge (${dobCalculation.diffYears} yrs)`, amount: surcharge });
      }
    }

    return { totalPrice: total, surchargeAmount: surcharge, breakdown: items };
  }, [modifyName, modifyPhone, modifyDob, dobCalculation, pricing]);

  const isInsufficientBalance = walletBalance < totalPrice && totalPrice > 0;
  const isAnyFieldSelected = modifyName || modifyPhone || modifyDob;

  // Handle Mock/Cloudinary Document Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingDoc(true);
    setErrorMsg(null);

    try {
      // Use standard upload API endpoint if available or convert to Base64/ObjectURL for demonstration
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 5MB limit.`);
        }
        // In this environment, simulate Cloudinary or secure storage
        const objectUrl = URL.createObjectURL(file);
        uploaded.push(objectUrl);
      }
      setDocumentUrls((prev) => [...prev, ...uploaded]);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  // Validate inputs before opening statutory terms modal
  const handleValidateAndOpenTerms = () => {
    setErrorMsg(null);

    const cleanBvn = bvn.trim();
    if (!cleanBvn || !/^\d{11}$/.test(cleanBvn)) {
      setErrorMsg("Please enter a valid 11-digit BVN.");
      return;
    }

    if (!currentFullName.trim() || currentFullName.trim().length < 3) {
      setErrorMsg("Please enter the current full name registered on this BVN.");
      return;
    }

    if (!isAnyFieldSelected) {
      setErrorMsg("Please select at least one field to modify (Name, Phone Number, or Date of Birth).");
      return;
    }

    if (modifyName) {
      if (!newFirstName.trim() || !newLastName.trim()) {
        setErrorMsg("Please enter your New First Name and New Last Name.");
        return;
      }
    }

    if (modifyPhone) {
      const cleanNewPhone = newPhone.trim();
      if (!cleanNewPhone || !/^0\d{10}$/.test(cleanNewPhone)) {
        setErrorMsg("Please enter a valid 11-digit New Phone Number starting with 0.");
        return;
      }
    }

    if (modifyDob) {
      if (!currentDob || !newDob) {
        setErrorMsg("Please select both your current Date of Birth and your new Date of Birth.");
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
        bvn: bvn.trim(),
        currentFullName: currentFullName.trim(),
        modifyName,
        modifyPhone,
        modifyDob,
        newFirstName: modifyName ? newFirstName.trim() : null,
        newLastName: modifyName ? newLastName.trim() : null,
        newMiddleName: modifyName && newMiddleName ? newMiddleName.trim() : null,
        currentPhone: modifyPhone && currentPhone ? currentPhone.trim() : null,
        newPhone: modifyPhone ? newPhone.trim() : null,
        currentDob: modifyDob ? currentDob : null,
        newDob: modifyDob ? newDob : null,
        documentUrls,
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

      {/* STEP 1: BVN & Identity Identification */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
            1
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground">BVN Record Details</h3>
            <p className="text-xs text-muted-foreground">Enter the 11-digit BVN and current registered legal name.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              11-Digit BVN <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              maxLength={11}
              value={bvn}
              onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 22233344455"
              className="w-full h-12 px-4 rounded-xl border border-border bg-secondary/30 font-mono text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              Full Legal Name currently on BVN <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={currentFullName}
              onChange={(e) => setCurrentFullName(e.target.value.toUpperCase())}
              placeholder="e.g. ADEWALE CHUKWUMA MUSA"
              className="w-full h-12 px-4 rounded-xl border border-border bg-secondary/30 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 uppercase"
            />
          </div>
        </div>
      </div>

      {/* STEP 2: Select Fields to Modify */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
            2
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground">Select Fields to Modify</h3>
            <p className="text-xs text-muted-foreground">Choose one or any combination of fields you want to update.</p>
          </div>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Change of Name */}
          <div 
            onClick={() => setModifyName(!modifyName)}
            className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
              modifyName 
                ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30 text-foreground" 
                : "bg-secondary/20 border-border hover:border-zinc-500/40 text-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl ${modifyName ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground"}`}>
                <User size={20} />
              </div>
              <input 
                type="checkbox" 
                checked={modifyName} 
                onChange={() => {}} 
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 pointer-events-none"
              />
            </div>
            <div>
              <h4 className="text-sm font-black text-foreground">Change of Name</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Update First, Last, or Middle names with legal proof.</p>
            </div>
            <div className="pt-2 border-t border-border/60 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Fee:</span>
              <span className="font-bold text-foreground">₦{(pricing.BVN_MOD_NAME || 3000).toLocaleString()}</span>
            </div>
          </div>

          {/* Change of Phone */}
          <div 
            onClick={() => setModifyPhone(!modifyPhone)}
            className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
              modifyPhone 
                ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30 text-foreground" 
                : "bg-secondary/20 border-border hover:border-zinc-500/40 text-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl ${modifyPhone ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground"}`}>
                <Phone size={20} />
              </div>
              <input 
                type="checkbox" 
                checked={modifyPhone} 
                onChange={() => {}} 
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 pointer-events-none"
              />
            </div>
            <div>
              <h4 className="text-sm font-black text-foreground">Change of Phone Number</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Link a new active SIM phone number to your BVN profile.</p>
            </div>
            <div className="pt-2 border-t border-border/60 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Fee:</span>
              <span className="font-bold text-foreground">₦{(pricing.BVN_MOD_PHONE || 2500).toLocaleString()}</span>
            </div>
          </div>

          {/* Change of DOB */}
          <div 
            onClick={() => setModifyDob(!modifyDob)}
            className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
              modifyDob 
                ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30 text-foreground" 
                : "bg-secondary/20 border-border hover:border-zinc-500/40 text-muted-foreground"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl ${modifyDob ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground"}`}>
                <Calendar size={20} />
              </div>
              <input 
                type="checkbox" 
                checked={modifyDob} 
                onChange={() => {}} 
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 pointer-events-none"
              />
            </div>
            <div>
              <h4 className="text-sm font-black text-foreground">Change of Date of Birth</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Correct birth date with NPC Attestation or Birth Certificate.</p>
            </div>
            <div className="pt-2 border-t border-border/60 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Base Fee:</span>
              <span className="font-bold text-foreground">₦{(pricing.BVN_MOD_DOB || 15000).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* CONDITIONAL INPUT FIELDS BASED ON SELECTION */}
        {/* ======================================================== */}

        {/* 1. Name Inputs */}
        {modifyName && (
          <div className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-4 animate-in fade-in duration-200">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <User size={14} /> New Legal Name Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">New First Name <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value.toUpperCase())}
                  placeholder="e.g. EMMANUEL"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-bold uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">New Middle Name</label>
                <input
                  type="text"
                  value={newMiddleName}
                  onChange={(e) => setNewMiddleName(e.target.value.toUpperCase())}
                  placeholder="e.g. CHUKWUEMEKA"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-bold uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">New Last Name (Surname) <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value.toUpperCase())}
                  placeholder="e.g. OKONKWO"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-bold uppercase"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Phone Inputs */}
        {modifyPhone && (
          <div className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-4 animate-in fade-in duration-200">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Phone size={14} /> Phone Number Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Current Phone on BVN (Optional)</label>
                <input
                  type="text"
                  maxLength={11}
                  value={currentPhone}
                  onChange={(e) => setCurrentPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 08012345678"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background font-mono text-xs font-bold"
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
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background font-mono text-xs font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. DOB Inputs & Surcharge Visual Calculation */}
        {modifyDob && (
          <div className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Calendar size={14} /> Date of Birth Adjustment
              </h4>
              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded font-mono">5-Year Rule Active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Current Date of Birth on BVN <span className="text-destructive">*</span></label>
                <input
                  type="date"
                  value={currentDob}
                  onChange={(e) => setCurrentDob(e.target.value)}
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

            {/* Surcharge Banner if > 5 Years */}
            {currentDob && newDob && (
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

        {/* 4. Supporting Document Uploads */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-foreground flex items-center justify-between">
            <span>Supporting Documents (Affidavit, NPC Attestation, Birth Cert, ID)</span>
            <span className="text-[10px] text-muted-foreground">PNG, JPG, PDF (Max 5MB each)</span>
          </label>

          <div className="border-2 border-dashed border-border hover:border-emerald-500/50 rounded-2xl p-6 text-center bg-secondary/10 cursor-pointer transition-colors relative">
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UploadCloud size={20} />
              </div>
              <p className="text-xs font-bold text-foreground">Click to upload or drag and drop supporting files</p>
              <p className="text-[11px] text-muted-foreground">Court affidavits, newspaper publications, or birth certificates.</p>
            </div>
          </div>

          {documentUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {documentUrls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg text-xs font-mono text-foreground">
                  <FileText size={14} />
                  <span>Document #{idx + 1}</span>
                  <button 
                    type="button" 
                    onClick={() => setDocumentUrls(documentUrls.filter((_, i) => i !== idx))}
                    className="ml-1 text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* STEP 3: Dynamic Price Summary & Submission */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
            3
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-foreground">Order &amp; Pricing Summary</h3>
            <p className="text-xs text-muted-foreground">Review transparent fee breakdown and confirm wallet debit.</p>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="bg-secondary/30 rounded-2xl p-5 border border-border space-y-3 text-xs">
          {breakdown.length > 0 ? (
            <>
              {breakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-foreground">
                  <span className="font-medium text-muted-foreground">{item.label}:</span>
                  <span className="font-bold">₦{item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-border/80 pt-3 flex justify-between items-center text-sm">
                <span className="font-black text-foreground">Total Fee:</span>
                <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">₦{totalPrice.toLocaleString()}</span>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-2">Select at least one modification field above to calculate fee.</p>
          )}
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
          disabled={!isAnyFieldSelected || isInsufficientBalance || isSubmitting || !bvn || !currentFullName}
          onClick={handleValidateAndOpenTerms}
          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer transition-all"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting Modification Request...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Review &amp; Authorize Request (₦{totalPrice.toLocaleString()})
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
        applicantName={currentFullName}
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
                <span className="text-muted-foreground">BVN Number:</span>
                <span className="font-mono font-bold text-foreground">{bvn}</span>
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
                  setBvn("");
                  setCurrentFullName("");
                  setModifyName(false);
                  setModifyPhone(false);
                  setModifyDob(false);
                  setDocumentUrls([]);
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
