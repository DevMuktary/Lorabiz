"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Clock,
  Folders
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

/**
 * Robust XHR File Uploader with Live Progress Percentage (0% - 100%)
 */
function uploadFileWithProgress(
  file: File,
  onProgress: (percent: number) => void
): Promise<{ success: boolean; url?: string; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const uploadData = new FormData();
    uploadData.append("file", file);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            resolve({ success: true, url: data.url });
          } else {
            resolve({ success: false, error: data.error || "Upload failed." });
          }
        } catch {
          resolve({ success: false, error: "Invalid server response." });
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ success: false, error: data.error || `Upload failed with status ${xhr.status}` });
        } catch {
          resolve({ success: false, error: `Upload failed with status ${xhr.status}` });
        }
      }
    });

    xhr.addEventListener("error", () => {
      resolve({ success: false, error: "Network error during upload." });
    });

    xhr.open("POST", "/api/upload");
    xhr.send(uploadData);
  });
}

function BoardResolutionBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState<number | null>(null);

  const [loadingBanks, setLoadingBanks] = useState(false);
  const [banksList, setBanksList] = useState<{ name: string; code: string }[]>([]);
  const [bankSearch, setBankSearch] = useState("");
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Upload Progress States (Percentage 0 - 100)
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadPercent, setLogoUploadPercent] = useState<number | null>(null);

  const [uploadingSeal, setUploadingSeal] = useState(false);
  const [sealUploadPercent, setSealUploadPercent] = useState<number | null>(null);

  const [uploadingSignatureId, setUploadingSignatureId] = useState<string | null>(null);
  const [signatureUploadPercent, setSignatureUploadPercent] = useState<Record<string, number>>({});
  
  const [drawingSignatureDirectorId, setDrawingSignatureDirectorId] = useState<string | null>(null);
  const [draftRestoredNotice, setDraftRestoredNotice] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [finalDocument, setFinalDocument] = useState<any | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const price = 3500;

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5500);
  };

  // 1. Load History count for Header badge
  const fetchHistoryCount = async () => {
    try {
      const res = await fetch("/api/documents/board-resolution/history");
      const data = await res.json();
      if (data.success && data.data) {
        setHistoryCount(data.data.total || 0);
      }
    } catch {}
  };

  // 2. Load Draft from backend ONLY if URL has explicit ?draftId=...
  useEffect(() => {
    const urlDraftId = searchParams.get("draftId");
    if (urlDraftId) {
      setDraftId(urlDraftId);
      const loadDraft = async () => {
        try {
          const res = await fetch(`/api/documents/board-resolution/draft?id=${urlDraftId}`);
          const json = await res.json();
          if (json.success && json.data?.formData) {
            const rawDraft = json.data.formData;
            setFormData({
              companyName: rawDraft.companyName || "",
              rcNumber: rawDraft.rcNumber || "",
              registeredAddress: rawDraft.registeredAddress || "",
              meetingDate: rawDraft.meetingDate || new Date().toISOString().split("T")[0],
              meetingVenue: rawDraft.meetingVenue || "",
              purposeCategory: rawDraft.purposeCategory || "BANK_ACCOUNT",
              targetInstitution: rawDraft.targetInstitution || "",
              institutionBranch: rawDraft.institutionBranch || "",
              accountCurrency: rawDraft.accountCurrency || "NGN (Nigerian Naira / ₦)",
              customPurposeDescription: rawDraft.customPurposeDescription || "",
              signingMandate: rawDraft.signingMandate || "ANY_ONE",
              customMandateText: rawDraft.customMandateText || "",
              directors: rawDraft.directors || [
                {
                  id: "dir_1",
                  fullName: "",
                  designation: "Managing Director / CEO",
                  isSignatory: true,
                  signatureUrl: "",
                }
              ],
              accentColor: rawDraft.accentColor || json.data.accentColor || "#0f172a",
              logoUrl: rawDraft.logoUrl || json.data.logoUrl || "",
              sealUrl: rawDraft.sealUrl || "",
            });
            if (rawDraft.savedCurrentStep && (rawDraft.savedCurrentStep === 1 || rawDraft.savedCurrentStep === 2 || rawDraft.savedCurrentStep === 3)) {
              setCurrentStep(rawDraft.savedCurrentStep);
            }
            setDraftRestoredNotice(`Draft resumed for "${json.data.companyName}"`);
            setTimeout(() => setDraftRestoredNotice(null), 6000);
          }
        } catch (err) {
          console.error("Failed to load draft:", err);
        }
      };
      loadDraft();
    } else {
      // Clear any legacy localstorage draft so opening fresh page never auto-fills
      try {
        localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
      } catch {}
    }

    fetchBanks();
    fetchWallet();
    fetchHistoryCount();
  }, [searchParams]);

  // 3. Save Draft to Backend API (Auto-saves seamlessly as user completes steps)
  const saveDraftToBackend = async (step: number = currentStep, silent: boolean = true) => {
    if (!formData.companyName && !formData.targetInstitution) {
      if (!silent) showToast("Please enter at least a company name before saving.", "info");
      return;
    }

    setIsSavingDraft(true);
    try {
      const res = await fetch("/api/documents/board-resolution/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draftId || undefined,
          formData: formData,
          currentStep: step,
        })
      });

      const data = await res.json();
      if (data.success && data.draftId) {
        setDraftId(data.draftId);
        fetchHistoryCount();
        if (!silent) showToast("Resolution draft saved to your History!", "success");
      }
    } catch (err) {
      if (!silent) showToast("Could not save draft. Please check your connection.", "error");
    } finally {
      setIsSavingDraft(false);
    }
  };

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
      if (json.success && json.wallet) {
        setWalletBalance(Number(json.wallet.balance));
      }
    } catch (err) {
      console.error("Failed to load wallet:", err);
    }
  };

  // Upload Handlers with Live Percentage Feedback
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Company logo exceeds the 5MB limit. Please upload a smaller image.", "error");
      return;
    }

    setUploadingLogo(true);
    setLogoUploadPercent(0);

    const result = await uploadFileWithProgress(file, (percent) => {
      setLogoUploadPercent(percent);
    });

    if (result.success && result.url) {
      setFormData(prev => ({ ...prev, logoUrl: result.url }));
      showToast("Company logo uploaded successfully!", "success");
    } else {
      showToast(result.error || "Failed to upload company logo.", "error");
    }

    setUploadingLogo(false);
    setLogoUploadPercent(null);
  };

  const handleSealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Company stamp file exceeds the 5MB limit.", "error");
      return;
    }

    setUploadingSeal(true);
    setSealUploadPercent(0);

    const result = await uploadFileWithProgress(file, (percent) => {
      setSealUploadPercent(percent);
    });

    if (result.success && result.url) {
      setFormData(prev => ({ ...prev, sealUrl: result.url }));
      showToast("Official seal uploaded successfully!", "success");
    } else {
      showToast(result.error || "Failed to upload seal image.", "error");
    }

    setUploadingSeal(false);
    setSealUploadPercent(null);
  };

  const handleDirectorSignatureUpload = async (directorId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Signature file exceeds the 5MB limit.", "error");
      return;
    }

    setUploadingSignatureId(directorId);
    setSignatureUploadPercent(prev => ({ ...prev, [directorId]: 0 }));

    const result = await uploadFileWithProgress(file, (percent) => {
      setSignatureUploadPercent(prev => ({ ...prev, [directorId]: percent }));
    });

    if (result.success && result.url) {
      updateDirector(directorId, { signatureUrl: result.url });
      showToast("Signature uploaded successfully!", "success");
    } else {
      showToast(result.error || "Failed to upload signature.", "error");
    }

    setUploadingSignatureId(null);
    setSignatureUploadPercent(prev => ({ ...prev, [directorId]: 0 }));
  };

  // Director Management Helpers
  const addDirector = () => {
    const newDirector: DirectorSignatory = {
      id: `dir_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      fullName: "",
      designation: "Director",
      isSignatory: true,
      signatureUrl: "",
    };
    setFormData(prev => ({
      ...prev,
      directors: [...prev.directors, newDirector]
    }));
  };

  const removeDirector = (id: string) => {
    if (formData.directors.length <= 1) {
      showToast("At least one director or company officer is required.", "error");
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

  const handleMandateChange = (mandate: BoardResolutionFormData["signingMandate"]) => {
    setFormData(prev => ({ ...prev, signingMandate: mandate }));
  };

  // Validations
  const validateStep1 = () => {
    if (!formData.companyName.trim()) {
      showToast("Please enter the registered company name.", "error");
      return false;
    }
    if (!formData.registeredAddress.trim()) {
      showToast("Please enter the company registered address.", "error");
      return false;
    }
    if (!formData.targetInstitution.trim()) {
      showToast("Please select or enter the bank or payment gateway name.", "error");
      return false;
    }
    if (formData.purposeCategory === "OTHER" && (!formData.customPurposeDescription || !formData.customPurposeDescription.trim())) {
      showToast("Please explain the custom resolution purpose under 'Specific Purpose Details'.", "error");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const emptyNames = formData.directors.some(d => !d.fullName.trim());
    if (emptyNames) {
      showToast("Please fill in the full legal name for all directors.", "error");
      return false;
    }
    const hasSignatories = formData.directors.some(d => d.isSignatory);
    if (!hasSignatories) {
      showToast("Please check at least one director as an authorized signatory.", "error");
      return false;
    }
    return true;
  };

  const handleStepClick = (step: 1 | 2 | 3) => {
    if (step === 2 && !validateStep1()) return;
    if (step === 3) {
      if (!validateStep1() || !validateStep2()) return;
      handleProceedToPreview();
      return;
    }
    saveDraftToBackend(step, true);
    setCurrentStep(step);
  };

  const handleProceedToPreview = async () => {
    if (!validateStep1() || !validateStep2()) return;

    setCurrentStep(3);
    setGeneratingPreview(true);
    saveDraftToBackend(3, true);

    try {
      const res = await fetch("/api/documents/board-resolution/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData })
      });
      const data = await res.json();
      const resolutionOutput = data.preview || data.data?.preview || data.data?.structuredResolution || data.data;

      if (data.success && resolutionOutput) {
        setPreviewData(resolutionOutput);
      } else {
        showToast(data.message || "Failed to generate preview. Please try again.", "error");
      }
    } catch {
      showToast("Network error generating preview.", "error");
    } finally {
      setGeneratingPreview(false);
    }
  };

  const filteredBanks = banksList.filter(b => 
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const activeDrawingDirector = formData.directors.find(d => d.id === drawingSignatureDirectorId);

  // Check if current accentColor is custom
  const isCustomColor = !PRESET_ACCENT_COLORS.some(c => c.hex.toLowerCase() === (formData.accentColor || "").toLowerCase());

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 px-4 sm:px-6">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 sm:right-8 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300 border ${
          toast.type === "error" 
            ? "bg-slate-900 border-red-500/50 text-red-400" 
            : toast.type === "info"
            ? "bg-slate-900 border-blue-500/50 text-blue-400"
            : "bg-slate-900 border-emerald-500/50 text-emerald-400"
        }`}>
          {toast.type === "error" ? (
            <Info className="h-5 w-5 text-red-400 shrink-0" weight="bold" />
          ) : (
            <CheckCircle weight="fill" className="h-5 w-5 text-emerald-400 shrink-0" />
          )}
          <p className="text-xs sm:text-sm font-semibold">{toast.message}</p>
        </div>
      )}

      {/* Restored Draft Notice Banner */}
      {draftRestoredNotice && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500 shrink-0" weight="bold" />
            <span>{draftRestoredNotice}</span>
          </div>
          <button
            onClick={() => setDraftRestoredNotice(null)}
            className="text-amber-700 dark:text-amber-400 hover:text-foreground text-[11px] underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DISTINCT TOP GLOBAL HEADER: HUB BACK LINK + ACTIONS (NO STEP CONFLICT)     */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
        {/* Left: Global Hub Back Breadcrumb */}
        <Link 
          href="/dashboard/documents"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <div className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center group-hover:bg-secondary transition-colors shadow-sm">
            <ArrowLeft className="h-4 w-4" weight="bold" />
          </div>
          <span>Back to Smart Legal Documents Hub</span>
        </Link>

        {/* Right: Actions (History Button, Wallet) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Resolution History Button */}
          <Link
            href="/dashboard/documents/board-resolution/history"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card hover:bg-secondary border border-border text-foreground text-xs font-bold shadow-sm transition-all"
            title="View Unsubmitted Drafts & Completed Resolutions"
          >
            <Folders className="h-4 w-4 text-primary" weight="bold" />
            <span>Resolution History</span>
            {historyCount !== null && historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                {historyCount}
              </span>
            )}
          </Link>

          {/* Wallet Balance Pill */}
          <div className="flex items-center gap-1.5 text-xs font-bold bg-secondary/80 px-3 py-2 rounded-xl border border-border text-foreground">
            <Wallet className="h-3.5 w-3.5 text-primary" weight="bold" />
            {walletBalance === null ? (
              <span className="text-muted-foreground font-medium">Loading...</span>
            ) : (
              <span>₦{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE TITLE & STEP WIZARD INDICATOR                                        */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-1">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-2">
            <Sparkle className="h-3.5 w-3.5" weight="fill" />
            <span>Corporate Secretarial & Compliance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Board Resolution Generator
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Create certified CAMA 2020 board extracts for Nigerian commercial banks & fintech KYC onboarding.
          </p>
        </div>

        {/* Step Progress Bar with Direct Click Navigation */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <button
            type="button"
            onClick={() => handleStepClick(1)}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              currentStep === 1 
                ? "bg-primary/10 border-primary text-primary shadow-sm" 
                : currentStep > 1
                ? "bg-card border-border text-foreground hover:border-primary/50"
                : "bg-secondary/40 border-border text-muted-foreground"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest block">Step 1</span>
            <span className="text-xs sm:text-sm font-bold">Company & Bank</span>
          </button>

          <button
            type="button"
            onClick={() => handleStepClick(2)}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              currentStep === 2 
                ? "bg-primary/10 border-primary text-primary shadow-sm" 
                : currentStep > 2
                ? "bg-card border-border text-foreground hover:border-primary/50"
                : "bg-secondary/40 border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest block">Step 2</span>
            <span className="text-xs sm:text-sm font-bold">Directors & Mandate</span>
          </button>

          <button
            type="button"
            onClick={() => handleStepClick(3)}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              currentStep === 3 
                ? "bg-primary/10 border-primary text-primary shadow-sm" 
                : "bg-secondary/40 border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest block">Step 3</span>
            <span className="text-xs sm:text-sm font-bold">Preview & Download</span>
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
              <h2 className="text-base font-bold text-foreground">Company & Institution Details</h2>
              <p className="text-xs text-muted-foreground">Provide verified company information and choose the target institution.</p>
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

            {/* Date of Board Meeting */}
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

            {/* Official Company Logo Upload with Percentage Progress Indicator */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-secondary/30 border border-border sm:col-span-2">
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
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle weight="fill" className="h-3.5 w-3.5" />
                      Logo attached to letterhead
                    </span>
                    <p className="text-[10px] text-muted-foreground">Ready for high-res export</p>
                  </div>
                </div>
              ) : (
                <div className="pt-1 space-y-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-sm">
                    {uploadingLogo ? (
                      <>
                        <Spinner className="h-4 w-4 animate-spin text-primary" weight="bold" />
                        <span>Uploading... {logoUploadPercent !== null ? `${logoUploadPercent}%` : ""}</span>
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

                  {/* Real Percentage Progress Bar */}
                  {uploadingLogo && logoUploadPercent !== null && (
                    <div className="space-y-1 max-w-xs animate-in fade-in">
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                        <span>Uploading file</span>
                        <span className="text-primary">{logoUploadPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border/60">
                        <div 
                          className="h-full bg-primary transition-all duration-200 rounded-full"
                          style={{ width: `${logoUploadPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Official Company Stamp / Seal Upload with Percentage Progress Indicator */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-secondary/30 border border-border sm:col-span-2">
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
                Renders as an authentic verification watermark badge beside the Director signature block.
              </p>

              {formData.sealUrl ? (
                <div className="flex items-center gap-3 pt-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={formData.sealUrl} 
                    alt="Company Stamp" 
                    className="h-14 max-w-[140px] rounded-xl border border-border object-contain bg-white p-1 shadow-sm" 
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle weight="fill" className="h-3.5 w-3.5" />
                      Seal attached
                    </span>
                    <p className="text-[10px] text-muted-foreground">Stamped on signature certification</p>
                  </div>
                </div>
              ) : (
                <div className="pt-1 space-y-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-sm">
                    {uploadingSeal ? (
                      <>
                        <Spinner className="h-4 w-4 animate-spin text-primary" weight="bold" />
                        <span>Uploading Seal... {sealUploadPercent !== null ? `${sealUploadPercent}%` : ""}</span>
                      </>
                    ) : (
                      <>
                        <UploadSimple className="h-4 w-4 text-primary" weight="bold" />
                        <span>Upload Stamp / Seal Image</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      onChange={handleSealUpload}
                      disabled={uploadingSeal}
                      className="hidden"
                    />
                  </label>

                  {/* Real Percentage Progress Bar */}
                  {uploadingSeal && sealUploadPercent !== null && (
                    <div className="space-y-1 max-w-xs animate-in fade-in">
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                        <span>Uploading seal</span>
                        <span className="text-primary">{sealUploadPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border/60">
                        <div 
                          className="h-full bg-primary transition-all duration-200 rounded-full"
                          style={{ width: `${sealUploadPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Purpose Category Selection */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-foreground">
                Primary Purpose of Resolution <span className="text-primary">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, purposeCategory: "BANK_ACCOUNT" })}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    formData.purposeCategory === "BANK_ACCOUNT"
                      ? "bg-primary/10 border-primary text-foreground shadow-sm"
                      : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Bank className="h-4 w-4 text-primary" weight="bold" />
                    <span className="text-xs font-bold text-foreground">Bank Account Opening</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Corporate accounts with Access, GTB, Zenith, Moniepoint, etc.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, purposeCategory: "PAYMENT_GATEWAY" })}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    formData.purposeCategory === "PAYMENT_GATEWAY"
                      ? "bg-primary/10 border-primary text-foreground shadow-sm"
                      : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="h-4 w-4 text-primary" weight="bold" />
                    <span className="text-xs font-bold text-foreground">Payment Gateway</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Merchant integration for Paystack, Flutterwave, Monnify, etc.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, purposeCategory: "OTHER" })}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    formData.purposeCategory === "OTHER"
                      ? "bg-primary/10 border-primary text-foreground shadow-sm"
                      : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkle className="h-4 w-4 text-primary" weight="bold" />
                    <span className="text-xs font-bold text-foreground">Custom Authority</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    General governance, regulatory authority, or commercial contracts.
                  </p>
                </button>
              </div>
            </div>

            {/* Target Institution Selection */}
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

            {/* Account Currency Selection */}
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

            {/* Custom Notes / Specific Purpose Explainer */}
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

            {/* Custom Accent Color Swatch & Palette Picker */}
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

                {/* Visible Custom Color Swatch (if user picked a custom color) */}
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

          {/* Step 1 Bottom Navigation Bar */}
          <div className="flex items-center justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) {
                  saveDraftToBackend(2, true);
                  setCurrentStep(2);
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
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
              {formData.directors.map((director, index) => {
                const isSigUploading = uploadingSignatureId === director.id;
                const sigPercent = signatureUploadPercent[director.id];

                return (
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

                            {/* Option 2: Upload Signature Image with percentage */}
                            <label className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-semibold text-[11px] rounded-lg cursor-pointer transition-colors">
                              {isSigUploading ? (
                                <>
                                  <Spinner className="h-3 w-3 animate-spin text-primary" weight="bold" />
                                  <span>{sigPercent ? `${sigPercent}%` : "Uploading..."}</span>
                                </>
                              ) : (
                                <>
                                  <UploadSimple className="h-3 w-3 text-muted-foreground" weight="bold" />
                                  <span>Upload File</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                                onChange={(e) => handleDirectorSignatureUpload(director.id, e)}
                                disabled={isSigUploading}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2 Bottom Navigation Bar (Clean separation) */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => {
                saveDraftToBackend(1, true);
                setCurrentStep(1);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-border transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Step 1</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToPreview}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
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
            <div className="p-12 rounded-3xl bg-card border border-border text-center space-y-4 shadow-sm">
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
                      <p className="text-xs opacity-90">Your high-resolution PDF has been sent to your email and saved to your Board Resolution History.</p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard/documents/board-resolution/history"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shrink-0"
                  >
                    Go to Resolution History
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

              {/* Step 3 Bottom Navigation Bar */}
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-border transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Step 2 (Directors)</span>
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
        draftId={draftId || undefined}
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

export default function BoardResolutionBuilderPage() {
  return (
    <Suspense fallback={
      <div className="max-w-5xl mx-auto p-12 text-center space-y-4">
        <Spinner className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm font-semibold text-muted-foreground">Loading Board Resolution Wizard...</p>
      </div>
    }>
      <BoardResolutionBuilderContent />
    </Suspense>
  );
}
