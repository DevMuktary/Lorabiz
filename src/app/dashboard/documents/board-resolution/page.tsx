"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  ArrowLeft, 
  Sparkle, 
  Wallet, 
  Folders, 
  CheckCircle, 
  X, 
  Spinner,
  Eye,
  Check
} from "@phosphor-icons/react";
import { 
  BoardResolutionFormData, 
  StructuredResolutionOutput 
} from "@/lib/board-resolution-generator";
import DocumentPaymentModal from "@/components/features/documents/DocumentPaymentModal";
import {
  CompanyStep,
  PurposeStep,
  DirectorsStep,
  PreviewStep,
  ExampleTemplatesModal,
  LOCAL_STORAGE_DRAFT_KEY,
  validateStep1,
  validateStep2,
  validateStep3
} from "@/components/features/documents/board-resolution";

function BoardResolutionBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Wizard Step State (1 to 4)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [historyCount, setHistoryCount] = useState<number | null>(null);
  const [pricingAmount, setPricingAmount] = useState<number>(3500);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Modals & UI States
  const [isExampleModalOpen, setIsExampleModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [finalDocument, setFinalDocument] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [draftRestoredNotice, setDraftRestoredNotice] = useState<string | null>(null);

  // Form State (Default Clean State — No Auto-Prefilling with foreign inputs)
  const [formData, setFormData] = useState<BoardResolutionFormData>({
    companyName: "",
    rcNumber: "",
    registeredAddress: "",
    companyEmail: "",
    companyPhone: "",
    corporateMotto: "",
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
      }
    ],
    accentColor: "#0f172a",
  });

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Scroll to top whenever step changes
  const goToStep = (step: 1 | 2 | 3 | 4) => {
    setCurrentStep(step);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // 1. Fetch Live Pricing
  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch("/api/pricing");
        const data = await res.json();
        if (data.success) {
          const docPrice = data.data?.DOC_BOARD_RESOLUTION || data.pricing?.DOC_BOARD_RESOLUTION;
          if (typeof docPrice === "number" && docPrice > 0) {
            setPricingAmount(docPrice);
          }
        }
      } catch (err) {
        console.error("Failed to fetch live pricing:", err);
      }
    }
    fetchPricing();
  }, []);

  // 2. Fetch User Wallet Balance
  useEffect(() => {
    async function fetchWallet() {
      if (!session?.user) return;
      try {
        const res = await fetch("/api/wallet/balance");
        const data = await res.json();
        if (data.success && typeof data.balance === "number") {
          setWalletBalance(data.balance);
        }
      } catch (err) {
        console.error("Failed to fetch wallet balance:", err);
      }
    }
    fetchWallet();
  }, [session?.user]);

  // 3. Fetch History Count
  useEffect(() => {
    async function fetchHistory() {
      if (!session?.user) return;
      try {
        const res = await fetch("/api/documents/board-resolution/history");
        const json = await res.json();
        if (json.success && json.data) {
          const total = (json.data.completed?.length || 0) + (json.data.drafts?.length || 0);
          setHistoryCount(total);
        }
      } catch (err) {
        console.error("Failed to fetch history count:", err);
      }
    }
    fetchHistory();
  }, [session?.user]);

  // 4. Save Draft to Backend (Redis)
  const saveDraftToBackend = async (
    stepToSave: number = currentStep, 
    silent: boolean = false, 
    cachedStructuredData?: StructuredResolutionOutput
  ) => {
    if (!formData.companyName?.trim() && !draftId) return;

    try {
      const payload: any = {
        draftId: draftId || undefined,
        formData: {
          ...formData,
          savedCurrentStep: stepToSave,
        },
        documentType: "BOARD_RESOLUTION",
        title: `Board Resolution - ${formData.companyName || "Untitled"}`,
      };

      if (cachedStructuredData || finalDocument?.structuredData) {
        payload.structuredData = cachedStructuredData || finalDocument?.structuredData;
      }

      const res = await fetch("/api/documents/board-resolution/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.draftId) {
        setDraftId(json.draftId);
        if (!silent) {
          showToast("Draft saved successfully.", "success");
        }
      }
    } catch (err) {
      console.error("Auto-save draft error:", err);
    }
  };

  // 5. Handle Draft Resumption from URL
  useEffect(() => {
    const resumeDraftId = searchParams.get("draftId");
    if (!resumeDraftId) return;

    async function loadDraft(id: string) {
      try {
        const res = await fetch(`/api/documents/board-resolution/draft?id=${id}`);
        const json = await res.json();
        if (json.success && json.draft) {
          const loadedData = json.draft.formData || {};
          setDraftId(id);
          setFormData(prev => ({
            ...prev,
            ...loadedData,
            directors: loadedData.directors?.length ? loadedData.directors : prev.directors
          }));

          if (json.draft.structuredData) {
            setFinalDocument({
              structuredData: json.draft.structuredData,
              status: json.draft.status || "DRAFT",
              transactionRef: json.draft.transactionRef
            });
          }

          // Always start at Step 1 for full verification
          goToStep(1);
          setDraftRestoredNotice(`Resumed draft for "${loadedData.companyName || "Company"}"`);
        }
      } catch (err) {
        console.error("Failed to restore draft:", err);
      }
    }

    loadDraft(resumeDraftId);
  }, [searchParams]);

  // Step Click Navigation Handler
  const handleStepClick = (targetStep: 1 | 2 | 3 | 4) => {
    if (targetStep === currentStep) return;

    if (targetStep === 2) {
      const check = validateStep1(formData);
      if (!check.isValid) {
        showToast(check.error || "Please complete Step 1 first.", "error");
        return;
      }
    } else if (targetStep === 3) {
      const check1 = validateStep1(formData);
      if (!check1.isValid) {
        showToast(check1.error || "Please complete Step 1 first.", "error");
        return;
      }
      const check2 = validateStep2(formData);
      if (!check2.isValid) {
        showToast(check2.error || "Please complete Step 2 first.", "error");
        return;
      }
    } else if (targetStep === 4) {
      const check1 = validateStep1(formData);
      if (!check1.isValid) {
        showToast(check1.error || "Please complete Step 1 first.", "error");
        return;
      }
      const check2 = validateStep2(formData);
      if (!check2.isValid) {
        showToast(check2.error || "Please complete Step 2 first.", "error");
        return;
      }
      const check3 = validateStep3(formData);
      if (!check3.isValid) {
        showToast(check3.error || "Please complete Step 3 first.", "error");
        return;
      }
    }

    saveDraftToBackend(targetStep, true);
    goToStep(targetStep);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 px-4 sm:px-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-20 right-4 sm:right-8 z-[9999] flex items-center gap-3 bg-card border px-5 py-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300 ${
          toastMessage.type === "success" ? "border-emerald-500/40 text-foreground" :
          toastMessage.type === "error" ? "border-red-500/40 text-foreground" : "border-border text-foreground"
        }`}>
          <CheckCircle weight="fill" className={`h-5 w-5 shrink-0 ${
            toastMessage.type === "success" ? "text-emerald-500" :
            toastMessage.type === "error" ? "text-red-500" : "text-primary"
          }`} />
          <p className="text-xs sm:text-sm font-semibold">{toastMessage.text}</p>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-4 pt-1">
        {/* Left: Back Link */}
        <Link 
          href="/dashboard/documents"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group shrink-0"
        >
          <div className="h-8 w-8 rounded-xl bg-card border border-border flex items-center justify-center group-hover:bg-secondary transition-colors">
            <ArrowLeft className="h-4 w-4" weight="bold" />
          </div>
          <span className="hidden sm:inline">Legal Documents Hub</span>
        </Link>

        {/* Right: Action Buttons (View Examples, Resolution History, Wallet) - Always side-by-side */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-nowrap shrink-0">
          {/* View Examples Button */}
          <button
            type="button"
            onClick={() => setIsExampleModalOpen(true)}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-[11px] sm:text-xs font-bold shadow-sm transition-all cursor-pointer shrink-0"
            title="Preview 10 A4 Document Archetypes"
          >
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" weight="bold" />
            <span className="hidden xs:inline sm:inline">Examples</span>
            <span className="xs:hidden sm:hidden">Templates</span>
          </button>

          {/* Resolution History Button */}
          <Link
            href="/dashboard/documents/board-resolution/history"
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-[11px] sm:text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer active:scale-95"
            title="View Drafts & Completed Resolutions"
          >
            <Folders className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" weight="bold" />
            <span>History</span>
            {historyCount !== null && historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-black bg-primary/10 text-primary border border-primary/20">
                {historyCount}
              </span>
            )}
          </Link>

          {/* Wallet Balance Pill */}
          <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold bg-card px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-border text-foreground shrink-0 shadow-sm">
            <Wallet className="h-3.5 w-3.5 text-primary shrink-0" weight="bold" />
            {walletBalance === null ? (
              <span className="text-muted-foreground font-medium">...</span>
            ) : (
              <span>₦{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
            )}
          </div>
        </div>
      </div>

      {/* Page Title & Description */}
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

        {/* Restored Draft Notice */}
        {draftRestoredNotice && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between gap-3 text-xs text-primary animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" weight="bold" />
              <span>{draftRestoredNotice}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setDraftRestoredNotice(null)}
              className="text-primary hover:text-primary/70 p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 4-Step Wizard Navigation Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {/* Step 1 */}
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
            <span className="text-xs sm:text-sm font-bold truncate block">Company Details</span>
          </button>

          {/* Step 2 */}
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
            <span className="text-xs sm:text-sm font-bold truncate block">Purpose & Design</span>
          </button>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => handleStepClick(3)}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              currentStep === 3 
                ? "bg-primary/10 border-primary text-primary shadow-sm" 
                : currentStep > 3
                ? "bg-card border-border text-foreground hover:border-primary/50"
                : "bg-secondary/40 border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest block">Step 3</span>
            <span className="text-xs sm:text-sm font-bold truncate block">Directors & Mandate</span>
          </button>

          {/* Step 4 */}
          <button
            type="button"
            onClick={() => handleStepClick(4)}
            className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              currentStep === 4 
                ? "bg-primary/10 border-primary text-primary shadow-sm" 
                : "bg-secondary/40 border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest block">Step 4</span>
            <span className="text-xs sm:text-sm font-bold truncate block">Preview & Pay</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: COMPANY DETAILS                                                   */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <CompanyStep
          formData={formData}
          setFormData={setFormData}
          onContinue={() => {
            saveDraftToBackend(2, true);
            goToStep(2);
          }}
          showToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PURPOSE & BRAND DESIGN                                            */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <PurposeStep
          formData={formData}
          setFormData={setFormData}
          onBack={() => goToStep(1)}
          onContinue={() => {
            saveDraftToBackend(3, true);
            goToStep(3);
          }}
          showToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* STEP 3: DIRECTORS & MANDATE                                               */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <DirectorsStep
          formData={formData}
          setFormData={setFormData}
          onBack={() => goToStep(2)}
          onContinue={() => {
            saveDraftToBackend(4, true);
            goToStep(4);
          }}
          showToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* STEP 4: PREVIEW & PAYMENT                                                 */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <PreviewStep
          formData={formData}
          draftId={draftId}
          pricingAmount={pricingAmount}
          finalDocument={finalDocument}
          setFinalDocument={setFinalDocument}
          onBack={() => goToStep(3)}
          onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
          onSaveDraftToBackend={saveDraftToBackend}
          showToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* EXAMPLE TEMPLATES MODAL (10 ARCHETYPES PREVIEW)                           */}
      {/* ========================================================================= */}
      <ExampleTemplatesModal
        isOpen={isExampleModalOpen}
        onClose={() => setIsExampleModalOpen(false)}
      />

      {/* ========================================================================= */}
      {/* DEDICATED SMART DOCUMENT PAYMENT MODAL                                    */}
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
