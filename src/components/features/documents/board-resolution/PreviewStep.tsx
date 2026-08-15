"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Sparkle, 
  CreditCard, 
  Lock, 
  ShieldCheck, 
  CheckCircle, 
  WarningCircle, 
  ArrowClockwise,
  Crown
} from "@phosphor-icons/react";
import { 
  BoardResolutionFormData, 
  StructuredResolutionOutput 
} from "@/lib/board-resolution-generator";
import ResolutionDocumentView from "@/components/features/documents/ResolutionDocumentView";
import GenerationLoader from "./GenerationLoader";

interface PreviewStepProps {
  formData: BoardResolutionFormData;
  draftId: string | null;
  pricingAmount: number;
  finalDocument: any | null;
  setFinalDocument: React.Dispatch<React.SetStateAction<any | null>>;
  onBack: () => void;
  onOpenPaymentModal: () => void;
  onSaveDraftToBackend: (step: number, silent?: boolean, structuredData?: StructuredResolutionOutput) => Promise<void>;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function PreviewStep({
  formData,
  draftId,
  pricingAmount,
  finalDocument,
  setFinalDocument,
  onBack,
  onOpenPaymentModal,
  onSaveDraftToBackend,
  showToast
}: PreviewStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Check if we already have generated structured data
  const hasExistingStructuredData = !!(finalDocument?.structuredData);

  const generateResolution = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch("/api/documents/board-resolution/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData,
          draftId: draftId || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setFinalDocument(data.data);
        showToast("Board resolution generated successfully!", "success");

        // Cache the generated structured data back to draft in Redis
        if (data.data.structuredData) {
          onSaveDraftToBackend(4, true, data.data.structuredData);
        }
      } else {
        setGenerationError(data.error || "Failed to generate board resolution. Please try again.");
        showToast(data.error || "Generation encountered an issue.", "error");
      }
    } catch (err: any) {
      console.error("AI Generation error:", err);
      setGenerationError("A network error occurred while generating the resolution. Please check your connection and retry.");
      showToast("Network error during document synthesis.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate ONLY if not already generated
  useEffect(() => {
    if (!hasExistingStructuredData && !isGenerating && !generationError) {
      generateResolution();
    }
  }, [hasExistingStructuredData]);

  // Loading State
  if (isGenerating) {
    return (
      <GenerationLoader
        companyName={formData.companyName}
        targetInstitution={formData.targetInstitution}
      />
    );
  }

  // Error State
  if (generationError && !finalDocument?.structuredData) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-card border border-red-500/30 text-center space-y-5 animate-in fade-in duration-300">
        <div className="h-16 w-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
          <WarningCircle className="h-8 w-8" weight="bold" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="text-lg font-black text-foreground">Generation Incomplete</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {generationError}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-border text-foreground font-bold text-xs hover:bg-secondary transition-all cursor-pointer"
          >
            Back to Step 3
          </button>
          <button
            type="button"
            onClick={generateResolution}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
          >
            <ArrowClockwise className="h-4 w-4" weight="bold" />
            <span>Retry Generation</span>
          </button>
        </div>
      </div>
    );
  }

  const structuredData: StructuredResolutionOutput = finalDocument?.structuredData || {
    title: "BOARD RESOLUTION",
    subtitle: `AUTHORIZING ${formData.targetInstitution.toUpperCase()}`,
    theme: "classic-royal",
    accentColor: formData.accentColor || "#1e3a8a",
    letterhead: {
      companyName: formData.companyName,
      rcNumber: formData.rcNumber || "",
      registeredAddress: formData.registeredAddress,
      email: formData.companyEmail,
      phone: formData.companyPhone,
    },
    meetingMetadata: {
      date: formData.meetingDate,
      venue: formData.meetingVenue || "The Boardroom, Registered Head Office",
      commencementText: `At a meeting of the Board of Directors of ${formData.companyName} duly convened and held on ${formData.meetingDate}:`
    },
    preambleText: `This resolution was duly passed in accordance with CAMA 2020 and the Company's Articles of Association.`,
    resolutionLeadIn: `It is hereby resolved that ${formData.companyName} authorize ${formData.targetInstitution} services.`,
    numberedClauses: [
      `Open and operate corporate account channels with ${formData.targetInstitution}.`,
      `Designate executive signatories in accordance with the ${formData.signingMandate} signing rule.`,
      `Execute all agreements, KYC verification mandates, and compliance filings.`
    ],
    validityClause: "This resolution shall remain in full force and effect until formal written notice of revocation.",
    recitals: [],
    operativeClauses: [],
    mandateClause: formData.signingMandate === "ANY_ONE" ? "Any One (1) Director Alone" : "Any Two (2) Directors Jointly",
    certificationText: `Certified as a true copy of the resolution passed by the Board of Directors of ${formData.companyName}.`,
    signatories: formData.directors.map(d => ({
      name: d.fullName,
      role: d.designation === "Other" ? (d.customDesignation || "Director") : d.designation,
      isSignatory: d.isSignatory,
      signatureUrl: d.signatureUrl
    })),
    corporateMotto: formData.corporateMotto,
    logoUrl: formData.logoUrl,
    sealUrl: formData.sealUrl
  };

  const isUnlocked = finalDocument?.status === "COMPLETED";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
            isUnlocked 
              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
              : "bg-primary/10 text-primary border border-primary/20"
          }`}>
            {isUnlocked ? (
              <ShieldCheck className="h-6 w-6" weight="fill" />
            ) : (
              <Sparkle className="h-6 w-6" weight="fill" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                {isUnlocked ? "Official Certified Document Unlocked" : "Preview Draft Generated"}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isUnlocked 
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
              }`}>
                {isUnlocked ? "Certified CAMA 2020" : "Unpaid Watermarked Draft"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isUnlocked
                ? "Your document is certified and ready for bank KYC submission and high-res PDF export."
                : `Review your document layout below. Unlock watermark-free PDF & PNG download for ₦${pricingAmount.toLocaleString()}.`}
            </p>
          </div>
        </div>

        {/* Action Button */}
        {!isUnlocked && (
          <button
            type="button"
            onClick={onOpenPaymentModal}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-lg hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
          >
            <CreditCard className="h-4 w-4" weight="bold" />
            <span>Pay & Unlock Certified Copy (₦{pricingAmount.toLocaleString()})</span>
          </button>
        )}
      </div>

      {/* Main Resolution Document View with 10 Archetypes Selector */}
      <ResolutionDocumentView
        data={structuredData}
        accentColor={formData.accentColor}
        logoUrl={formData.logoUrl}
        sealUrl={formData.sealUrl}
        isWatermarked={!isUnlocked}
        documentRef={finalDocument?.transactionRef || "DRAFT-PREVIEW"}
      />

      {/* Bottom Step Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border">
        <button
          type="button"
          onClick={onBack}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border text-foreground font-bold text-xs hover:bg-secondary transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" weight="bold" />
          <span>Back to Directors & Signatures</span>
        </button>

        {!isUnlocked ? (
          <button
            type="button"
            onClick={onOpenPaymentModal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground font-bold text-xs sm:text-sm rounded-xl shadow-xl hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Lock className="h-4 w-4" weight="bold" />
            <span>Unlock Certified Resolution & PDF (₦{pricingAmount.toLocaleString()})</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
            <CheckCircle className="h-5 w-5" weight="fill" />
            <span>Document Verified & Active in History</span>
          </div>
        )}
      </div>
    </div>
  );
}
