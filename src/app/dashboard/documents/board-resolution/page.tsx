"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Sparkle, 
  Bank, 
  CreditCard, 
  Plus, 
  Trash, 
  X, 
  MagnifyingGlass, 
  CaretDown, 
  Check, 
  Spinner, 
  FilePdf, 
  Image as ImageIcon,
  Wallet,
  ShieldCheck,
  Info,
  Buildings,
  User,
  Users,
  Palette,
  Eye
} from "@phosphor-icons/react";
import { 
  BoardResolutionFormData, 
  DirectorSignatory,
  StructuredResolutionOutput 
} from "@/lib/board-resolution-generator";
import ResolutionDocumentView from "@/components/features/documents/ResolutionDocumentView";
import FundWalletModal from "@/components/features/wallet/FundWalletModal";

const NIGERIAN_PAYMENT_GATEWAYS = [
  "Paystack Payments Limited",
  "Flutterwave Technology Solutions",
  "Moniepoint / TeamApt MFB",
  "Squad (HabariPay / GTCO)",
  "Interswitch Group / Quickteller",
  "Remita (SystemSpecs)",
  "Payaza Africa",
  "Korapay Technologies",
  "Nomba (Kudi)",
  "Kuda Business Gateway"
];

const PRESET_ACCENT_COLORS = [
  { name: "Royal Navy", hex: "#0f172a" },
  { name: "Executive Indigo", hex: "#1e3a8a" },
  { name: "Forest Emerald", hex: "#064e3b" },
  { name: "Corporate Burgundy", hex: "#881337" },
  { name: "Classic Slate", hex: "#334155" },
  { name: "Bronze Gold", hex: "#78350f" },
];

export default function BoardResolutionBuilderPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [banksList, setBanksList] = useState<{ name: string; code: string }[]>([]);
  const [bankSearch, setBankSearch] = useState("");
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // User Wallet State
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isFundWalletOpen, setIsFundWalletOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<BoardResolutionFormData>({
    companyName: "",
    rcNumber: "",
    registeredAddress: "",
    meetingDate: new Date().toISOString().split("T")[0],
    meetingVenue: "",
    purposeCategory: "BANK_ACCOUNT",
    targetInstitution: "",
    institutionBranch: "",
    accountCurrency: "NGN (Nigerian Naira)",
    customPurposeDescription: "",
    signingMandate: "ANY_TWO",
    customMandateText: "",
    directors: [
      {
        id: "dir_1",
        fullName: "",
        designation: "Managing Director / CEO",
        isSignatory: true,
        bvnOrNin: "",
      },
      {
        id: "dir_2",
        fullName: "",
        designation: "Director",
        isSignatory: true,
        bvnOrNin: "",
      }
    ],
    accentColor: "#0f172a",
    logoUrl: "",
  });

  // Preview & Final Generation State
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<StructuredResolutionOutput | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [finalDocument, setFinalDocument] = useState<any | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const price = 3500;

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    fetchBanks();
    fetchWallet();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBankDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchBanks = async () => {
    setLoadingBanks(true);
    try {
      const res = await fetch("/api/documents/banks");
      const json = await res.json();
      if (json.success && Array.isArray(json.banks)) {
        setBanksList(json.banks);
      }
    } catch (error) {
      console.error("Failed to load banks:", error);
    } finally {
      setLoadingBanks(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await fetch("/api/user/wallet");
      const json = await res.json();
      if (json?.wallet?.balance !== undefined) {
        setWalletBalance(Number(json.wallet.balance));
      } else if (json?.balance !== undefined) {
        setWalletBalance(Number(json.balance));
      }
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    }
  };

  // Director Management
  const addDirector = () => {
    setFormData(prev => ({
      ...prev,
      directors: [
        ...prev.directors,
        {
          id: `dir_${Date.now()}`,
          fullName: "",
          designation: "Director",
          isSignatory: true,
        }
      ]
    }));
  };

  const removeDirector = (id: string) => {
    if (formData.directors.length <= 1) {
      showToast("You need at least one director or secretary.", "error");
      return;
    }
    setFormData(prev => ({
      ...prev,
      directors: prev.directors.filter(d => d.id !== id)
    }));
  };

  const updateDirector = (id: string, updates: Partial<DirectorSignatory>) => {
    setFormData(prev => ({
      ...prev,
      directors: prev.directors.map(d => d.id === id ? { ...d, ...updates } : d)
    }));
  };

  // Validation
  const validateStep1 = () => {
    if (!formData.companyName.trim()) {
      showToast("Please enter your registered Company Name.", "error");
      return false;
    }
    if (!formData.registeredAddress.trim()) {
      showToast("Please enter your Company Registered Address.", "error");
      return false;
    }
    if (!formData.targetInstitution.trim()) {
      showToast("Please select or enter the target Bank or Payment Gateway.", "error");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const emptyName = formData.directors.find(d => !d.fullName.trim());
    if (emptyName) {
      showToast("Please fill in the full names for all directors in the list.", "error");
      return false;
    }
    const hasSignatory = formData.directors.some(d => d.isSignatory);
    if (!hasSignatory) {
      showToast("At least one director must be marked as an Authorized Signatory.", "error");
      return false;
    }
    return true;
  };

  // Move to Preview
  const handleProceedToPreview = async () => {
    if (!validateStep2()) return;
    setGeneratingPreview(true);
    setCurrentStep(3);

    try {
      const res = await fetch("/api/documents/board-resolution/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData })
      });

      const json = await res.json();
      if (json.success && json.data?.structuredResolution) {
        setPreviewData(json.data.structuredResolution);
      } else {
        showToast(json.message || "Failed to generate preview.", "error");
      }
    } catch (e) {
      showToast("Network error generating preview. Please try again.", "error");
    } finally {
      setGeneratingPreview(false);
    }
  };

  // Final Generation & Payment
  const handleConfirmAndPay = async () => {
    if (walletBalance < price) {
      setIsFundWalletOpen(true);
      return;
    }

    setIsProcessingPayment(true);
    try {
      const res = await fetch("/api/documents/board-resolution/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
          paymentMethod: "WALLET",
          promoCode: promoCode || undefined,
        })
      });

      const json = await res.json();
      if (json.success && json.document) {
        setFinalDocument(json.document);
        showToast("Payment successful! Your official document is ready and emailed to you.", "success");
        fetchWallet();
      } else {
        showToast(json.message || "Generation failed.", "error");
      }
    } catch (e) {
      showToast("Network error during payment. Please try again.", "error");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const filteredBanks = banksList.filter(b => 
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-4 z-[100] animate-in slide-in-from-right-8 fade-in duration-300">
          <div className={`flex items-center gap-3 p-4 pr-10 rounded-2xl shadow-2xl border text-foreground ${
            toast.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : toast.type === "error"
              ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
              : "bg-card border-border"
          }`}>
            <CheckCircle className="h-5 w-5 shrink-0" weight="fill" />
            <p className="text-xs font-semibold">{toast.message}</p>
            <button 
              onClick={() => setToast(null)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-70 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* Top Nav Back Link */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/documents"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" weight="bold" />
          <span>Back to Legal Documents Hub</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-bold bg-secondary px-3 py-1.5 rounded-full border border-border">
          <Wallet className="h-3.5 w-3.5 text-primary" weight="bold" />
          <span>Wallet: ₦{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Header & Step Wizard Indicator */}
      <div className="space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-2">
            <Sparkle className="h-3 w-3" weight="fill" />
            <span>Smart Resolution Builder</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Corporate Board Resolution Generator
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Answer a few simple questions to generate your official CAMA 2020 certified board extract for Nigerian banks & fintech KYC.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className={`p-3 rounded-2xl border transition-all ${
            currentStep >= 1 ? "bg-primary/10 border-primary text-primary" : "bg-secondary/40 border-border text-muted-foreground"
          }`}>
            <span className="text-[10px] font-black uppercase tracking-widest block">Step 1</span>
            <span className="text-xs font-bold">Company & Bank</span>
          </div>

          <div className={`p-3 rounded-2xl border transition-all ${
            currentStep >= 2 ? "bg-primary/10 border-primary text-primary" : "bg-secondary/40 border-border text-muted-foreground"
          }`}>
            <span className="text-[10px] font-black uppercase tracking-widest block">Step 2</span>
            <span className="text-xs font-bold">Directors & Mandate</span>
          </div>

          <div className={`p-3 rounded-2xl border transition-all ${
            currentStep === 3 ? "bg-primary/10 border-primary text-primary" : "bg-secondary/40 border-border text-muted-foreground"
          }`}>
            <span className="text-[10px] font-black uppercase tracking-widest block">Step 3</span>
            <span className="text-xs font-bold">Preview & Download</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: COMPANY & BANK / GATEWAY DETAILS                                  */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Buildings className="h-5 w-5" weight="bold" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Company & Purpose Details</h2>
              <p className="text-xs text-muted-foreground">Tell us about your company and the financial institution you are opening with.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Company Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-foreground">
                Registered Company Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. QUADROX TECHNOLOGIES LIMITED or GLORIOUS VENTURES"
                className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>

            {/* RC / BN Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                RC Number or Business Name Number <span className="text-muted-foreground text-[10px] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.rcNumber}
                onChange={(e) => setFormData({ ...formData, rcNumber: e.target.value })}
                placeholder="e.g. RC 1928374 or BN 482910"
                className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>

            {/* Meeting Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Date of Board Meeting <span className="text-primary">*</span>
              </label>
              <input
                type="date"
                value={formData.meetingDate}
                onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>

            {/* Registered Address */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-foreground">
                Company Registered Office Address <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={formData.registeredAddress}
                onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                placeholder="e.g. Plot 14, Adeola Odeku Street, Victoria Island, Lagos State"
                className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>

            {/* Resolution Purpose Type */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-foreground">
                What is this resolution for? <span className="text-primary">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, purposeCategory: "BANK_ACCOUNT" })}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    formData.purposeCategory === "BANK_ACCOUNT"
                      ? "bg-primary/10 border-primary text-foreground shadow-sm"
                      : "bg-secondary/30 border-border text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <Bank className="h-5 w-5 text-primary mb-1.5" weight="bold" />
                  <span className="text-xs font-bold block text-foreground">Corporate Bank Account</span>
                  <span className="text-[10px] text-muted-foreground">Access, GTB, Zenith, Moniepoint, etc.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, purposeCategory: "PAYMENT_GATEWAY" })}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    formData.purposeCategory === "PAYMENT_GATEWAY"
                      ? "bg-primary/10 border-primary text-foreground shadow-sm"
                      : "bg-secondary/30 border-border text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-primary mb-1.5" weight="bold" />
                  <span className="text-xs font-bold block text-foreground">Payment Gateway KYC</span>
                  <span className="text-[10px] text-muted-foreground">Paystack, Flutterwave, Squad, etc.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, purposeCategory: "OTHER" })}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    formData.purposeCategory === "OTHER"
                      ? "bg-primary/10 border-primary text-foreground shadow-sm"
                      : "bg-secondary/30 border-border text-muted-foreground hover:border-border/80"
                  }`}
                >
                  <Sparkle className="h-5 w-5 text-primary mb-1.5" weight="bold" />
                  <span className="text-xs font-bold block text-foreground">Custom / Other Purpose</span>
                  <span className="text-[10px] text-muted-foreground">Contracts, facility, or specific clause</span>
                </button>
              </div>
            </div>

            {/* Target Institution (Searchable Paystack Bank List or Gateway Selector) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-foreground">
                {formData.purposeCategory === "PAYMENT_GATEWAY" ? "Payment Gateway Name" : "Bank / Financial Institution Name"} <span className="text-primary">*</span>
              </label>

              {formData.purposeCategory === "BANK_ACCOUNT" ? (
                <div className="relative" ref={dropdownRef}>
                  <div
                    onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                    className="flex items-center justify-between h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium cursor-pointer hover:border-primary transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Bank className="h-4 w-4 text-muted-foreground" />
                      <span className={formData.targetInstitution ? "text-foreground font-semibold" : "text-muted-foreground"}>
                        {formData.targetInstitution || "Select Nigerian Bank (or search)"}
                      </span>
                    </div>
                    <CaretDown className={`h-4 w-4 text-muted-foreground transition-transform ${isBankDropdownOpen ? "rotate-180" : ""}`} />
                  </div>

                  {isBankDropdownOpen && (
                    <div className="absolute top-12 left-0 w-full z-50 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-2 border-b border-border bg-muted/30">
                        <div className="relative">
                          <MagnifyingGlass className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <input
                            autoFocus
                            placeholder="Type bank name (e.g. Access, GTB, Zenith, Moniepoint)..."
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 text-xs bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      <ul className="max-h-56 overflow-y-auto p-1 custom-scrollbar">
                        {filteredBanks.map((bank) => (
                          <li
                            key={bank.code}
                            onClick={() => {
                              setFormData({ ...formData, targetInstitution: bank.name });
                              setIsBankDropdownOpen(false);
                              setBankSearch("");
                            }}
                            className="px-3 py-2 text-xs font-semibold hover:bg-secondary rounded-lg cursor-pointer flex items-center justify-between text-foreground"
                          >
                            <span>{bank.name}</span>
                            {formData.targetInstitution === bank.name && <Check className="h-4 w-4 text-primary" weight="bold" />}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : formData.purposeCategory === "PAYMENT_GATEWAY" ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {NIGERIAN_PAYMENT_GATEWAYS.map((gw) => (
                      <button
                        key={gw}
                        type="button"
                        onClick={() => setFormData({ ...formData, targetInstitution: gw })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                          formData.targetInstitution === gw
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                        }`}
                      >
                        {gw.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.targetInstitution}
                    onChange={(e) => setFormData({ ...formData, targetInstitution: e.target.value })}
                    placeholder="e.g. Paystack Payments Limited"
                    className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={formData.targetInstitution}
                  onChange={(e) => setFormData({ ...formData, targetInstitution: e.target.value })}
                  placeholder="e.g. Federal Ministry of Industry or Commercial Partner Name"
                  className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary"
                />
              )}
            </div>

            {/* Optional Branch & Currency */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Branch / Location <span className="text-muted-foreground text-[10px] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.institutionBranch}
                onChange={(e) => setFormData({ ...formData, institutionBranch: e.target.value })}
                placeholder="e.g. Victoria Island Branch or Digital Channel"
                className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Account Currency
              </label>
              <select
                value={formData.accountCurrency}
                onChange={(e) => setFormData({ ...formData, accountCurrency: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary"
              >
                <option value="NGN (Nigerian Naira)">NGN (Nigerian Naira)</option>
                <option value="USD (United States Dollar)">USD (United States Dollar)</option>
                <option value="EUR (Euro)">EUR (Euro)</option>
                <option value="GBP (British Pound)">GBP (British Pound)</option>
                <option value="Multi-Currency (NGN / Domiciliary)">Multi-Currency (NGN & Domiciliary)</option>
              </select>
            </div>

            {/* Custom Notes / Specific Purpose Explainer */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-foreground">
                Specific Purpose / Custom Clause Instructions <span className="text-muted-foreground text-[10px] font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={formData.customPurposeDescription}
                onChange={(e) => setFormData({ ...formData, customPurposeDescription: e.target.value })}
                placeholder="e.g. Authorize mobile banking app access, corporate debit card issuance, or POS terminal collection."
                className="w-full p-3 rounded-xl bg-secondary/50 border border-border text-xs font-medium focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Brand Letterhead Accent Color */}
            <div className="space-y-2 sm:col-span-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <label className="text-xs font-bold text-foreground">
                  Letterhead Brand Accent Color
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_ACCENT_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setFormData({ ...formData, accentColor: c.hex })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      formData.accentColor === c.hex
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: c.hex }} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setCurrentStep(2);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <span>Continue to Directors & Mandate</span>
              <ArrowRight className="h-4 w-4" weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: DIRECTORS & SIGNING MANDATE                                       */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" weight="bold" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Board of Directors & Signing Mandate</h2>
              <p className="text-xs text-muted-foreground">List the directors and specify who is authorized to operate the account.</p>
            </div>
          </div>

          {/* Mandate Rule Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">
              Account Signing Mandate Rule <span className="text-primary">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, signingMandate: "ANY_TWO" })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.signingMandate === "ANY_TWO"
                    ? "bg-primary/10 border-primary text-foreground shadow-sm"
                    : "bg-secondary/30 border-border text-muted-foreground"
                }`}
              >
                <span className="text-xs font-bold block text-foreground">Any Two (2) Directors Jointly</span>
                <span className="text-[10px] text-muted-foreground">Standard Nigerian corporate banking requirement (Category A + Category B)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, signingMandate: "ANY_ONE" })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.signingMandate === "ANY_ONE"
                    ? "bg-primary/10 border-primary text-foreground shadow-sm"
                    : "bg-secondary/30 border-border text-muted-foreground"
                }`}
              >
                <span className="text-xs font-bold block text-foreground">Any One (1) Director Alone</span>
                <span className="text-[10px] text-muted-foreground">Sole signatory mandate (Managing Director or designated Director)</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, signingMandate: "CHAIRMAN_AND_SECRETARY" })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.signingMandate === "CHAIRMAN_AND_SECRETARY"
                    ? "bg-primary/10 border-primary text-foreground shadow-sm"
                    : "bg-secondary/30 border-border text-muted-foreground"
                }`}
              >
                <span className="text-xs font-bold block text-foreground">Chairman + Secretary Jointly</span>
                <span className="text-[10px] text-muted-foreground">Traditional secretarial mandate</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, signingMandate: "ALL_DIRECTORS" })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.signingMandate === "ALL_DIRECTORS"
                    ? "bg-primary/10 border-primary text-foreground shadow-sm"
                    : "bg-secondary/30 border-border text-muted-foreground"
                }`}
              >
                <span className="text-xs font-bold block text-foreground">All Directors Together</span>
                <span className="text-[10px] text-muted-foreground">Unanimous operational mandate</span>
              </button>
            </div>
          </div>

          {/* Dynamic Directors List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                Directors & Company Officers ({formData.directors.length})
              </label>
              <button
                type="button"
                onClick={addDirector}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" weight="bold" />
                <span>Add Another Director</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.directors.map((director, index) => (
                <div 
                  key={director.id}
                  className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Director #{index + 1}
                    </span>
                    {formData.directors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDirector(director.id)}
                        className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                        title="Remove Director"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground">Full Legal Name</label>
                      <input
                        type="text"
                        value={director.fullName}
                        onChange={(e) => updateDirector(director.id, { fullName: e.target.value })}
                        placeholder="e.g. John Chukwuemeka Okafor"
                        className="w-full h-10 px-3 rounded-lg bg-background border border-border text-xs font-medium focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground">Designation</label>
                      <select
                        value={director.designation}
                        onChange={(e) => updateDirector(director.id, { designation: e.target.value as any })}
                        className="w-full h-10 px-3 rounded-lg bg-background border border-border text-xs font-medium focus:outline-none focus:border-primary"
                      >
                        <option value="Managing Director / CEO">Managing Director / CEO</option>
                        <option value="Director">Director</option>
                        <option value="Company Secretary">Company Secretary</option>
                        <option value="Chairman">Chairman</option>
                        <option value="Executive Director">Executive Director</option>
                        <option value="Other">Other Designation</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={director.isSignatory}
                        onChange={(e) => updateDirector(director.id, { isSignatory: e.target.checked })}
                        className="h-4 w-4 accent-primary rounded cursor-pointer"
                      />
                      <span>Authorized to sign on bank account / gateway</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-border transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Step 1</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToPreview}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <span>Preview Resolution</span>
              <ArrowRight className="h-4 w-4" weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: REAL-TIME PREVIEW + PAYMENT & DOWNLOAD MODAL                      */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-6">
          
          {generatingPreview ? (
            <div className="p-12 rounded-3xl bg-card border border-border text-center space-y-4">
              <Spinner className="h-10 w-10 animate-spin text-primary mx-auto" weight="bold" />
              <h3 className="text-base font-bold text-foreground">Formatting Your Board Resolution...</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Applying CAMA 2020 operative clauses and tailoring the extract for {formData.targetInstitution}.
              </p>
            </div>
          ) : previewData ? (
            <div className="space-y-6">
              
              {/* Payment Checkout Dock (Top) */}
              {!finalDocument && (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-card via-card to-secondary/40 border border-primary/40 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-500" weight="fill" />
                      <span className="text-xs font-black uppercase tracking-wider text-primary">
                        Resolution Ready for Certification
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-foreground">
                      Unlock Official Certified Extract (PDF + PNG)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Remove preview watermarks and get immediate high-resolution downloads and email delivery.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="text-center sm:text-right">
                      <span className="text-[10px] font-bold text-muted-foreground block uppercase">Fee</span>
                      <span className="text-2xl font-black text-foreground">₦{price.toLocaleString()}</span>
                    </div>

                    <button
                      onClick={handleConfirmAndPay}
                      disabled={isProcessingPayment}
                      className="w-full sm:w-auto px-6 py-3.5 bg-primary text-primary-foreground font-black text-xs rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Spinner className="h-4 w-4 animate-spin" weight="bold" />
                          <span>Generating Official Copy...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" weight="fill" />
                          <span>Confirm & Pay ₦{price.toLocaleString()}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Success Banner if Paid */}
              {finalDocument && (
                <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-6 w-6" weight="fill" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black">Official Document Unlocked & Emailed!</h3>
                      <p className="text-xs opacity-90">Your high-resolution PDF has been sent to your email and saved to your vault.</p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard/documents"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
                  >
                    Go to My Vault
                  </Link>
                </div>
              )}

              {/* Live Rendered Document Canvas */}
              <ResolutionDocumentView
                data={previewData}
                accentColor={formData.accentColor}
                logoUrl={formData.logoUrl}
                isWatermarked={!finalDocument}
                documentRef={finalDocument?.transactionRef || "PREVIEW-DRAFT-CAMA-2020"}
              />

              {/* Navigation Back */}
              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-border transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Edit Details</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-card border border-border text-center space-y-3">
              <Info className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-xs font-bold text-foreground">Could not generate preview.</p>
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl"
              >
                Go Back and Verify Details
              </button>
            </div>
          )}

        </div>
      )}

      {/* Fund Wallet Modal if balance is low */}
      <FundWalletModal
        isOpen={isFundWalletOpen}
        onClose={() => setIsFundWalletOpen(false)}
        onSuccess={() => {
          setIsFundWalletOpen(false);
          fetchWallet();
          showToast("Wallet funded! You can now proceed with your document generation.", "success");
        }}
        onFailure={(msg) => {
          showToast(msg || "Wallet funding incomplete.", "error");
        }}
      />

    </div>
  );
}
