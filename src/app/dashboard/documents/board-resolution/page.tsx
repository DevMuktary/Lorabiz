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
  Eye,
  UploadSimple,
  Stamp,
  Lock,
  Pen,
  ArrowCounterClockwise
} from "@phosphor-icons/react";
import { 
  BoardResolutionFormData, 
  DirectorSignatory,
  StructuredResolutionOutput 
} from "@/lib/board-resolution-generator";
import ResolutionDocumentView from "@/components/features/documents/ResolutionDocumentView";
import CanvasSignatureModal from "@/components/features/documents/CanvasSignatureModal";
import DocumentPaymentModal from "@/components/features/documents/DocumentPaymentModal";

const NIGERIAN_PAYMENT_GATEWAYS = [
  "Paystack Payments Limited",
  "Flutterwave Technology Solutions",
  "Monnify (TeamApt)",
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
  { name: "Regal Purple", hex: "#581c87" },
  { name: "Crimson Red", hex: "#991b1b" },
  { name: "Deep Teal", hex: "#115e59" },
];

const LOCAL_STORAGE_DRAFT_KEY = "lorabiz_board_res_draft";

export default function BoardResolutionBuilderPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [banksList, setBanksList] = useState<{ name: string; code: string }[]>([]);
  const [bankSearch, setBankSearch] = useState("");
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Upload & Signature States
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSeal, setUploadingSeal] = useState(false);
  const [uploadingSignatureId, setUploadingSignatureId] = useState<string | null>(null);
  const [drawingSignatureDirectorId, setDrawingSignatureDirectorId] = useState<string | null>(null);
  const [draftRestoredNotice, setDraftRestoredNotice] = useState(false);

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
    accountCurrency: "NGN (Nigerian Naira / ₦)",
    customPurposeDescription: "",
    signingMandate: "ANY_ONE",
    customMandateText: "",
    directors: [
      {
        id: "dir_1",
        fullName: "",
        designation: "Managing Director / CEO",
        isSignatory: true,
        signatureUrl: "",
      }
    ],
    accentColor: "#0f172a",
    logoUrl: "",
    sealUrl: "",
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
    setTimeout(() => setToast(null), 5500);
  };

  // Restore Draft from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.companyName) {
          setFormData(parsed);
          setDraftRestoredNotice(true);
          setTimeout(() => setDraftRestoredNotice(false), 6000);
        }
      }
    } catch {}
    fetchBanks();
    fetchWallet();
  }, []);

  // Auto-Save Draft to LocalStorage
  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        if (formData.companyName || formData.targetInstitution || formData.directors[0]?.fullName) {
          localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(formData));
        }
      } catch {}
    }, 500);

    return () => clearTimeout(handler);
  }, [formData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBankDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClearDraft = () => {
    localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
    setFormData({
      companyName: "",
      rcNumber: "",
      registeredAddress: "",
      meetingDate: new Date().toISOString().split("T")[0],
      meetingVenue: "",
      purposeCategory: "BANK_ACCOUNT",
      targetInstitution: "",
      institutionBranch: "",
      accountCurrency: "NGN (Nigerian Naira / ₦)",
      customPurposeDescription: "",
      signingMandate: "ANY_ONE",
      customMandateText: "",
      directors: [
        {
          id: "dir_1",
          fullName: "",
          designation: "Managing Director / CEO",
          isSignatory: true,
          signatureUrl: "",
        }
      ],
      accentColor: "#0f172a",
      logoUrl: "",
      sealUrl: "",
    });
    setDraftRestoredNotice(false);
    showToast("Draft cleared successfully.", "info");
  };

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
      } else {
        setWalletBalance(0);
      }
    } catch {
      setWalletBalance(0);
    }
  };

  // Upload Handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Company logo file exceeds the 5MB limit. Please upload a smaller file.", "error");
      return;
    }

    setUploadingLogo(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData(prev => ({ ...prev, logoUrl: data.url }));
        showToast("Company logo uploaded successfully!", "success");
      } else {
        showToast(data.error || "Failed to upload logo.", "error");
      }
    } catch {
      showToast("Network error uploading logo. Please try again.", "error");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Company stamp file exceeds the 5MB limit. Please upload a smaller file.", "error");
      return;
    }

    setUploadingSeal(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData(prev => ({ ...prev, sealUrl: data.url }));
        showToast("Company seal uploaded successfully!", "success");
      } else {
        showToast(data.error || "Failed to upload seal image.", "error");
      }
    } catch {
      showToast("Network error uploading seal. Please try again.", "error");
    } finally {
      setUploadingSeal(false);
    }
  };

  const handleDirectorSignatureUpload = async (directorId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Signature image exceeds the 5MB limit.", "error");
      return;
    }

    setUploadingSignatureId(directorId);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        updateDirector(directorId, { signatureUrl: data.url });
        showToast("Signature uploaded successfully!", "success");
      } else {
        showToast(data.error || "Failed to upload signature.", "error");
      }
    } catch {
      showToast("Network error uploading signature.", "error");
    } finally {
      setUploadingSignatureId(null);
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
          signatureUrl: "",
        }
      ]
    }));
  };

  const removeDirector = (id: string) => {
    if (formData.directors.length <= 1) {
      showToast("You need at least one director or officer in the resolution.", "error");
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

  const handleMandateChange = (mandate: "ANY_ONE" | "ANY_TWO" | "CHAIRMAN_AND_SECRETARY" | "ALL_DIRECTORS" | "CUSTOM") => {
    setFormData(prev => {
      let updatedDirectors = [...prev.directors];
      if (mandate === "ANY_TWO" && updatedDirectors.length < 2) {
        updatedDirectors.push({
          id: `dir_${Date.now()}`,
          fullName: "",
          designation: "Director",
          isSignatory: true,
          signatureUrl: "",
        });
      }
      return {
        ...prev,
        signingMandate: mandate,
        directors: updatedDirectors,
      };
    });
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
    if (formData.purposeCategory === "OTHER" && !formData.customPurposeDescription?.trim()) {
      showToast("Please enter the specific business purpose or custom directives (compulsory for Custom/Other purpose).", "error");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const emptyName = formData.directors.find(d => !d.fullName.trim());
    if (emptyName) {
      showToast("Please fill in the full legal names for all directors in the list.", "error");
      return false;
    }
    const hasSignatory = formData.directors.some(d => d.isSignatory);
    if (!hasSignatory) {
      showToast("At least one director must be marked as an Authorized Signatory.", "error");
      return false;
    }
    if (formData.signingMandate === "ANY_TWO" && formData.directors.length < 2) {
      showToast("The 'Any Two Jointly' mandate requires at least 2 directors. Please add another director.", "error");
      return false;
    }
    return true;
  };

  // Step Indicator Click Navigation
  const handleStepClick = (targetStep: 1 | 2 | 3) => {
    if (targetStep === 1) {
      setCurrentStep(1);
    } else if (targetStep === 2) {
      if (validateStep1()) setCurrentStep(2);
    } else if (targetStep === 3) {
      if (validateStep1() && validateStep2()) {
        handleProceedToPreview();
      }
    }
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
    } catch {
      showToast("Network error generating preview. Please try again.", "error");
    } finally {
      setGeneratingPreview(false);
    }
  };

  const filteredBanks = banksList.filter(b => 
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const activeDrawingDirector = formData.directors.find(d => d.id === drawingSignatureDirectorId);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* High-Contrast Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-4 z-[100000] animate-in slide-in-from-right-8 fade-in duration-300">
          <div className={`flex items-center gap-3 p-4 pr-10 rounded-2xl shadow-2xl border font-bold text-xs ${
            toast.type === "success" 
              ? "bg-emerald-600 border-emerald-500 text-white"
              : toast.type === "error"
              ? "bg-red-600 border-red-500 text-white shadow-red-950/40"
              : "bg-slate-900 border-slate-700 text-white"
          }`}>
            <CheckCircle className="h-5 w-5 shrink-0" weight="fill" />
            <p>{toast.message}</p>
            <button 
              onClick={() => setToast(null)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/80 hover:text-white"
            >
              <X className="h-4 w-4" weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* Auto-Draft Restored Banner */}
      {draftRestoredNotice && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/80 border border-border text-xs text-foreground animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" weight="fill" />
            <span>Auto-saved draft restored from your last session.</span>
          </div>
          <button
            type="button"
            onClick={handleClearDraft}
            className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
          >
            <ArrowCounterClockwise className="h-3.5 w-3.5" />
            <span>Clear Draft & Reset</span>
          </button>
        </div>
      )}

      {/* Top Nav Bar: High-Contrast Back Button + Wallet Balance Display */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/documents"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border text-foreground hover:bg-secondary text-xs font-bold transition-all shadow-sm group"
        >
          <ArrowLeft className="h-4 w-4 text-foreground group-hover:-translate-x-0.5 transition-transform" weight="bold" />
          <span>Back to Legal Documents Hub</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-bold bg-secondary px-3.5 py-2 rounded-xl border border-border text-foreground">
          <Wallet className="h-4 w-4 text-primary" weight="bold" />
          {walletBalance === null ? (
            <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
              <Spinner className="h-3 w-3 animate-spin text-primary" />
              <span>Loading...</span>
            </div>
          ) : (
            <span>Wallet: ₦{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          )}
        </div>
      </div>

      {/* Header & Step Wizard Indicator (Clickable Steps) */}
      <div className="space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-2">
            <Sparkle className="h-3.5 w-3.5" weight="fill" />
            <span>Corporate Secretarial & Compliance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Corporate Board Resolution Generator
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Answer a few simple questions to generate your official CAMA 2020 certified board extract for Nigerian banks & fintech KYC.
          </p>
        </div>

        {/* Step Progress Bar with Direct Click Navigation */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            type="button"
            onClick={() => handleStepClick(1)}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              currentStep === 1 
                ? "bg-primary/10 border-primary text-primary shadow-sm" 
                : currentStep > 1
                ? "bg-card border-border text-foreground hover:border-primary/50"
                : "bg-secondary/40 border-border text-muted-foreground"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest block">Step 1</span>
            <span className="text-xs font-bold">Company Details</span>
          </button>

          <button
            type="button"
            onClick={() => handleStepClick(2)}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              currentStep === 2 
                ? "bg-primary/10 border-primary text-primary shadow-sm" 
                : currentStep > 2
                ? "bg-card border-border text-foreground hover:border-primary/50"
                : "bg-secondary/40 border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest block">Step 2</span>
            <span className="text-xs font-bold">Directors & Mandate</span>
          </button>

          <button
            type="button"
            onClick={() => handleStepClick(3)}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              currentStep === 3 
                ? "bg-primary/10 border-primary text-primary shadow-sm" 
                : "bg-secondary/40 border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest block">Step 3</span>
            <span className="text-xs font-bold">Preview & Download</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: COMPANY DETAILS & PURPOSE                                         */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Buildings className="h-5 w-5" weight="bold" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Company Details</h2>
              <p className="text-xs text-muted-foreground">Tell us about your company and the financial institution you are opening with.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
            {/* Company Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-foreground">
                Registered Company Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g. ABC GLOBAL VENTURES LIMITED or PRIME HORIZON NIG LTD"
                className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* RC / BN Number */}
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-bold text-foreground">
                RC Number or Business Name Number <span className="text-muted-foreground text-[10px] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.rcNumber}
                onChange={(e) => setFormData({ ...formData, rcNumber: e.target.value })}
                placeholder="e.g. RC 1928374 or BN 482910"
                className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Date of Board Meeting (No overlapping bug) */}
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-bold text-foreground">
                Date of Board Meeting <span className="text-primary">*</span>
              </label>
              <input
                type="date"
                value={formData.meetingDate}
                onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary text-foreground"
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
                placeholder="e.g. 123 Commercial Avenue, Victoria Island, Lagos State"
                className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Official Company Logo Upload (Compulsory / Strongly Recommended) */}
            <div className="space-y-2 p-4 rounded-2xl bg-secondary/30 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Buildings className="h-4 w-4 text-primary" weight="bold" />
                  <label className="text-xs font-bold text-foreground">
                    Official Company Logo <span className="text-primary text-[10px] font-bold">(Recommended)</span>
                  </label>
                </div>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logoUrl: "" })}
                    className="text-xs text-red-500 hover:underline font-semibold"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Renders on the top letterhead of your certified board extract. Max 5MB • PNG, JPG, or SVG.
              </p>

              {formData.logoUrl ? (
                <div className="flex items-center gap-3 pt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={formData.logoUrl} 
                    alt="Company Logo" 
                    className="h-14 max-w-[140px] rounded-xl border border-border object-contain bg-white p-1 shadow-sm" 
                  />
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Logo attached to letterhead
                  </span>
                </div>
              ) : (
                <div className="pt-1">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-sm">
                    {uploadingLogo ? (
                      <>
                        <Spinner className="h-4 w-4 animate-spin text-primary" weight="bold" />
                        <span>Uploading Logo...</span>
                      </>
                    ) : (
                      <>
                        <UploadSimple className="h-4 w-4 text-primary" weight="bold" />
                        <span>Upload Company Logo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Official Company Stamp / Seal Upload */}
            <div className="space-y-2 p-4 rounded-2xl bg-secondary/30 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stamp className="h-4 w-4 text-primary" weight="bold" />
                  <label className="text-xs font-bold text-foreground">
                    Official Company Stamp / Seal <span className="text-muted-foreground text-[10px] font-normal">(Optional)</span>
                  </label>
                </div>
                {formData.sealUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sealUrl: "" })}
                    className="text-xs text-red-500 hover:underline font-semibold"
                  >
                    Remove Seal
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Official seal will be stamped on the resolution extract. Max 5MB • PNG or JPG.
              </p>

              {formData.sealUrl ? (
                <div className="flex items-center gap-3 pt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={formData.sealUrl} 
                    alt="Company Stamp" 
                    className="h-14 w-14 rounded-full border border-border object-contain bg-white p-1 shadow-sm" 
                  />
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Official seal attached
                  </span>
                </div>
              ) : (
                <div className="pt-1">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-sm">
                    {uploadingSeal ? (
                      <>
                        <Spinner className="h-4 w-4 animate-spin text-primary" weight="bold" />
                        <span>Uploading Seal...</span>
                      </>
                    ) : (
                      <>
                        <UploadSimple className="h-4 w-4 text-primary" weight="bold" />
                        <span>Upload Company Seal</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleSealUpload}
                      disabled={uploadingSeal}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
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
                  <span className="text-[10px] text-muted-foreground">Paystack, Flutterwave, Monnify, Squad, etc.</span>
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

            {/* Target Institution */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-foreground">
                {formData.purposeCategory === "PAYMENT_GATEWAY" ? "Payment Gateway Name" : "Bank / Financial Institution Name"} <span className="text-primary">*</span>
              </label>

              {formData.purposeCategory === "BANK_ACCOUNT" ? (
                <div className="relative" ref={dropdownRef}>
                  <div
                    onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                    className="flex items-center justify-between h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium cursor-pointer hover:border-primary transition-colors text-foreground"
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
                            className="w-full h-9 pl-9 pr-3 text-xs bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
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
                    className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={formData.targetInstitution}
                  onChange={(e) => setFormData({ ...formData, targetInstitution: e.target.value })}
                  placeholder="e.g. Federal Ministry of Industry or Commercial Partner Name"
                  className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
                />
              )}
            </div>

            {/* Optional Branch Location */}
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-bold text-foreground">
                Branch / Location <span className="text-muted-foreground text-[10px] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.institutionBranch}
                onChange={(e) => setFormData({ ...formData, institutionBranch: e.target.value })}
                placeholder="e.g. Victoria Island Branch or Digital Channel"
                className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Account Currency Selection (Includes GHS Cedi & Beautified UI) */}
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-bold text-foreground">
                Account Currency
              </label>
              <div className="relative">
                <select
                  value={formData.accountCurrency}
                  onChange={(e) => setFormData({ ...formData, accountCurrency: e.target.value })}
                  className="w-full h-11 px-4 pr-10 rounded-xl bg-secondary/50 border border-border text-xs sm:text-sm font-semibold focus:outline-none focus:border-primary text-foreground appearance-none cursor-pointer shadow-inner"
                >
                  <option value="NGN (Nigerian Naira / ₦)">NGN (Nigerian Naira / ₦)</option>
                  <option value="USD (United States Dollar / $)">USD (United States Dollar / $)</option>
                  <option value="GBP (British Pound / £)">GBP (British Pound / £)</option>
                  <option value="EUR (Euro / €)">EUR (Euro / €)</option>
                  <option value="GHS (Ghanaian Cedi / GH₵)">GHS (Ghanaian Cedi / GH₵)</option>
                  <option value="Multi-Currency (NGN & Domiciliary)">Multi-Currency (NGN & Domiciliary)</option>
                </select>
                <CaretDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Custom Notes / Specific Purpose Explainer (Compulsory when 'OTHER') */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Specific Purpose / Custom Clause Details{" "}
                  {formData.purposeCategory === "OTHER" ? (
                    <span className="text-primary font-bold">(Compulsory) *</span>
                  ) : (
                    <span className="text-muted-foreground text-[10px] font-normal">(Optional)</span>
                  )}
                </label>
              </div>
              <textarea
                rows={3}
                value={formData.customPurposeDescription}
                onChange={(e) => setFormData({ ...formData, customPurposeDescription: e.target.value })}
                placeholder={
                  formData.purposeCategory === "OTHER"
                    ? "Explain the exact resolution purpose, directive, or authority granted by the Board of Directors..."
                    : "e.g. Authorize mobile banking app access, corporate debit card issuance, or POS terminal collection."
                }
                className={`w-full p-3.5 rounded-xl bg-secondary/50 border text-xs font-medium focus:outline-none focus:border-primary resize-none text-foreground placeholder:text-muted-foreground ${
                  formData.purposeCategory === "OTHER" && !formData.customPurposeDescription?.trim()
                    ? "border-primary/50"
                    : "border-border"
                }`}
              />
            </div>

            {/* Canva-Style Circular Color Palette Picker */}
            <div className="space-y-2.5 sm:col-span-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" weight="bold" />
                <label className="text-xs font-bold text-foreground">
                  Letterhead Brand Accent Color
                </label>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {PRESET_ACCENT_COLORS.map((c) => {
                  const isSelected = formData.accentColor === c.hex;
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

                {/* Custom Color Input Circle */}
                <div className="flex flex-col items-center gap-1">
                  <label 
                    className="h-8 w-8 rounded-full border border-dashed border-border bg-secondary flex items-center justify-center cursor-pointer hover:border-primary transition-colors shadow-sm relative overflow-hidden"
                    title="Choose Custom Color"
                  >
                    <Plus className="h-3.5 w-3.5 text-muted-foreground" weight="bold" />
                    <input
                      type="color"
                      value={formData.accentColor || "#0f172a"}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </label>
                  <span className="text-[10px] font-medium text-muted-foreground">Custom</span>
                </div>
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
              <p className="text-xs text-muted-foreground">List the directors, designate signatories, and draw or upload digital signatures.</p>
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
                onClick={() => handleMandateChange("ANY_ONE")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.signingMandate === "ANY_ONE"
                    ? "bg-primary/10 border-primary text-foreground shadow-sm"
                    : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-xs font-bold block text-foreground">Any One (1) Director Alone</span>
                <span className="text-[10px] text-muted-foreground">Sole signatory mandate (Managing Director or designated Director)</span>
              </button>

              <button
                type="button"
                onClick={() => handleMandateChange("ANY_TWO")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.signingMandate === "ANY_TWO"
                    ? "bg-primary/10 border-primary text-foreground shadow-sm"
                    : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-xs font-bold block text-foreground">Any Two (2) Directors Jointly</span>
                <span className="text-[10px] text-muted-foreground">Standard Nigerian corporate banking requirement (Category A + Category B)</span>
              </button>

              <button
                type="button"
                onClick={() => handleMandateChange("CHAIRMAN_AND_SECRETARY")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.signingMandate === "CHAIRMAN_AND_SECRETARY"
                    ? "bg-primary/10 border-primary text-foreground shadow-sm"
                    : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-xs font-bold block text-foreground">Chairman + Secretary Jointly</span>
                <span className="text-[10px] text-muted-foreground">Traditional secretarial mandate</span>
              </button>

              <button
                type="button"
                onClick={() => handleMandateChange("ALL_DIRECTORS")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.signingMandate === "ALL_DIRECTORS"
                    ? "bg-primary/10 border-primary text-foreground shadow-sm"
                    : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl transition-colors cursor-pointer border border-primary/20"
              >
                <Plus className="h-3.5 w-3.5" weight="bold" />
                <span>Add Another Director</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.directors.map((director, index) => (
                <div 
                  key={director.id}
                  className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-primary">
                      Director / Officer #{index + 1}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground">
                        Full Legal Name <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        value={director.fullName}
                        onChange={(e) => updateDirector(director.id, { fullName: e.target.value })}
                        placeholder="e.g. Adebayo Olumide or Chinedu Eze"
                        className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-foreground">Designation</label>
                      <div className="relative">
                        <select
                          value={director.designation}
                          onChange={(e) => updateDirector(director.id, { designation: e.target.value as any })}
                          className="w-full h-10 px-3 pr-8 rounded-xl bg-background border border-border text-xs font-medium focus:outline-none focus:border-primary text-foreground appearance-none cursor-pointer"
                        >
                          <option value="Managing Director / CEO">Managing Director / CEO</option>
                          <option value="Director">Director</option>
                          <option value="Company Secretary">Company Secretary</option>
                          <option value="Chairman">Chairman</option>
                          <option value="Executive Director">Executive Director</option>
                          <option value="Other">Other Designation</option>
                        </select>
                        <CaretDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Signatory Checkbox & Canvas Signature / File Upload */}
                  <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={director.isSignatory}
                        onChange={(e) => updateDirector(director.id, { isSignatory: e.target.checked })}
                        className="h-4 w-4 accent-primary rounded cursor-pointer"
                      />
                      <span>Authorized to operate/sign on account & gateway</span>
                    </label>

                    {/* Signature Options */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {director.signatureUrl ? (
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={director.signatureUrl} 
                            alt="Signature" 
                            className="h-9 max-w-[110px] object-contain border border-border rounded-lg bg-white p-1 shadow-sm" 
                          />
                          <button
                            type="button"
                            onClick={() => updateDirector(director.id, { signatureUrl: "" })}
                            className="text-[11px] text-red-500 hover:underline font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {/* Option 1: Draw Signature Pad */}
                          <button
                            type="button"
                            onClick={() => setDrawingSignatureDirectorId(director.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                          >
                            <Pen className="h-3.5 w-3.5" weight="bold" />
                            <span>Draw Signature</span>
                          </button>

                          {/* Option 2: Upload Signature Image */}
                          <label className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold text-[11px] rounded-lg cursor-pointer transition-colors">
                            {uploadingSignatureId === director.id ? (
                              <>
                                <Spinner className="h-3 w-3 animate-spin text-primary" weight="bold" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <UploadSimple className="h-3 w-3 text-muted-foreground" weight="bold" />
                                <span>Upload File</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/png, image/jpeg"
                              onChange={(e) => handleDirectorSignatureUpload(director.id, e)}
                              disabled={uploadingSignatureId === director.id}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
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
              
              {/* Payment Checkout Banner (Top) */}
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
                      Remove draft preview watermarks and get immediate high-resolution downloads and email delivery.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="text-center sm:text-right">
                      <span className="text-[10px] font-bold text-muted-foreground block uppercase">Fee</span>
                      <span className="text-2xl font-black text-foreground">₦{price.toLocaleString()}</span>
                    </div>

                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
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
                      <p className="text-xs opacity-90">Your high-resolution PDF has been sent to your email and saved to your Document History.</p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard/documents"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
                  >
                    Go to Document History
                  </Link>
                </div>
              )}

              {/* Live Rendered Document Canvas */}
              <ResolutionDocumentView
                data={previewData}
                accentColor={formData.accentColor}
                logoUrl={formData.logoUrl}
                sealUrl={formData.sealUrl}
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

      {/* ========================================================================= */}
      {/* DRAW SIGNATURE MODAL                                                      */}
      {/* ========================================================================= */}
      <CanvasSignatureModal
        isOpen={drawingSignatureDirectorId !== null}
        onClose={() => setDrawingSignatureDirectorId(null)}
        signerName={activeDrawingDirector?.fullName || "Director / Signatory"}
        onSave={(dataUrl) => {
          if (drawingSignatureDirectorId) {
            updateDirector(drawingSignatureDirectorId, { signatureUrl: dataUrl });
            showToast("Digital signature saved!", "success");
          }
        }}
      />

      {/* ========================================================================= */}
      {/* DEDICATED SMART DOCUMENT PAYMENT MODAL (WALLET & ONLINE KORAPAY)           */}
      {/* ========================================================================= */}
      <DocumentPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        formData={formData}
        documentType="BOARD_RESOLUTION"
        onSuccess={(doc) => {
          setFinalDocument(doc);
          setIsPaymentModalOpen(false);
          showToast("Payment successful! Your official certified document is unlocked and emailed to you.", "success");
        }}
      />

    </div>
  );
}

