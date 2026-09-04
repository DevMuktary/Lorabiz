"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck, 
  CheckCircle, 
  ListDashes, 
  Spinner,
  Buildings,
  CursorClick,
  ArrowsClockwise,
  WarningCircle,
  X,
  Wallet,
  Check,
  FilePdf,
  Eye,
  Trash,
  UploadSimple,
  PenNib,
  FileText,
  Info
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export type CompanyType = "BUSINESS_NAME" | "LLC";

export interface PricingConfig {
  price: number;
  originalPrice?: number;
  hasDiscount?: boolean;
  discountBadge?: string;
  savedAmount?: number;
  isActive?: boolean;
  label: string;
}

export default function AnnualReturnsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [pricing, setPricing] = useState<Record<CompanyType, PricingConfig>>({
    BUSINESS_NAME: { price: 12000, label: "Business Name / Enterprise" },
    LLC: { price: 18000, label: "Company (LLC / LTD)" },
  });

  // Category Selection State (matches NIN Modification)
  const [selectedType, setSelectedType] = useState<CompanyType | null>(null);

  // Form Fields
  const [companyName, setCompanyName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [filingYears, setFilingYears] = useState("2026");

  // Document Upload (Only 1 document required: Certificate OR Status Report)
  const [documentType, setDocumentType] = useState<"CERTIFICATE" | "STATUS_REPORT">("CERTIFICATE");
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadProgress, setDocUploadProgress] = useState(0);

  // Authorizing Officer & Signature
  const [designeeFullName, setDesigneeFullName] = useState("");
  const [designeeRole, setDesigneeRole] = useState("Proprietor");
  const [otherDesigneeRole, setOtherDesigneeRole] = useState("");
  const [designeeSignatureUrl, setDesigneeSignatureUrl] = useState("");
  const [signatureFileName, setSignatureFileName] = useState("");
  const [isUploadingSig, setIsUploadingSig] = useState(false);
  const [sigUploadProgress, setSigUploadProgress] = useState(0);

  // Digital Signature Canvas
  const [isSignatureCanvasOpen, setIsSignatureCanvasOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // In-App Preview Modal State
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState("");

  // Slide-in Toast / Error Banner
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Checkout / Confirmation Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchInitialData();
  }, []);

  // Update default role when company type changes
  useEffect(() => {
    if (selectedType === "BUSINESS_NAME") {
      setDesigneeRole("Proprietor");
    } else if (selectedType === "LLC") {
      setDesigneeRole("Director");
    }
  }, [selectedType]);

  // Dismiss error automatically
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [pricingRes, walletRes] = await Promise.all([
        fetch("/api/cac/annual-returns"),
        fetch("/api/user/wallet"),
      ]);

      if (pricingRes.ok) {
        const data = await pricingRes.json();
        if (data.pricing) {
          setPricing({
            BUSINESS_NAME: {
              price: Number(data.pricing.BUSINESS_NAME?.price) || 12000,
              originalPrice: data.pricing.BUSINESS_NAME?.originalPrice,
              hasDiscount: data.pricing.BUSINESS_NAME?.hasDiscount,
              discountBadge: data.pricing.BUSINESS_NAME?.discountBadge,
              savedAmount: data.pricing.BUSINESS_NAME?.savedAmount,
              label: "Business Name / Enterprise",
            },
            LLC: {
              price: Number(data.pricing.LLC?.price) || 18000,
              originalPrice: data.pricing.LLC?.originalPrice,
              hasDiscount: data.pricing.LLC?.hasDiscount,
              discountBadge: data.pricing.LLC?.discountBadge,
              savedAmount: data.pricing.LLC?.savedAmount,
              label: "Company (LLC / LTD)",
            },
          });
        }
      }

      if (walletRes.ok) {
        const wData = await walletRes.json();
        if (wData.balance !== undefined) setWalletBalance(Number(wData.balance));
      }
    } catch (err) {
      console.error("Failed to load CAC Annual Returns data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const activePricing = selectedType ? pricing[selectedType] : null;
  const currentPrice = activePricing ? activePricing.price : 0;
  const isBalanceSufficient = walletBalance >= currentPrice;
  const shortfall = Math.max(0, currentPrice - walletBalance);
  const remainingBalance = Math.max(0, walletBalance - currentPrice);
  const effectiveRole = designeeRole === "Other" ? otherDesigneeRole.trim() : designeeRole;

  // File Upload with accurate Progress Percentage
  const uploadFileWithProgress = (file: File, type: "DOC" | "SIG") => {
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("File exceeds 5MB limit. Please compress your document before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    if (type === "DOC") {
      setIsUploadingDoc(true);
      setDocUploadProgress(0);
    } else {
      setIsUploadingSig(true);
      setSigUploadProgress(0);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        if (type === "DOC") setDocUploadProgress(percent);
        else setSigUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      if (type === "DOC") setIsUploadingDoc(false);
      else setIsUploadingSig(false);

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.url) {
            if (type === "DOC") {
              setDocumentUrl(res.url);
              setDocumentName(file.name);
            } else {
              setDesigneeSignatureUrl(res.url);
              setSignatureFileName(file.name);
            }
          } else {
            setErrorMessage(res.error || "Upload failed. Please try again.");
          }
        } catch {
          setErrorMessage("Failed to parse upload server response.");
        }
      } else {
        setErrorMessage("Upload failed with error: " + xhr.statusText);
      }
    };

    xhr.onerror = () => {
      if (type === "DOC") setIsUploadingDoc(false);
      else setIsUploadingSig(false);
      setErrorMessage("Network error during upload. Please check your internet connection.");
    };

    xhr.open("POST", "/api/upload", true);
    xhr.send(formData);
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvasSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "digital-signature.png", { type: "image/png" });
      setIsSignatureCanvasOpen(false);
      uploadFileWithProgress(file, "SIG");
    }, "image/png");
  };

  // Validate fields and open confirmation modal
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedType) {
      setErrorMessage("Please select a company structure first.");
      return;
    }
    if (!companyName.trim()) {
      setErrorMessage("Please enter the registered company or business name.");
      return;
    }
    if (!registrationNumber.trim()) {
      setErrorMessage("Please enter the CAC Registration Number (RC/BN).");
      return;
    }
    if (!documentUrl.trim()) {
      setErrorMessage(`Please upload your ${documentType === "CERTIFICATE" ? "CAC Registration Certificate" : "CAC Status Report"}.`);
      return;
    }
    if (!designeeFullName.trim()) {
      setErrorMessage("Please provide the authorizing officer's full legal name.");
      return;
    }
    if (designeeRole === "Other" && !otherDesigneeRole.trim()) {
      setErrorMessage("Please specify the officer's exact designation/role in the company.");
      return;
    }
    if (!designeeSignatureUrl.trim()) {
      setErrorMessage("Please provide the authorizing officer's signature (upload or draw).");
      return;
    }

    setIsConfirmModalOpen(true);
  };

  // Submit Final Application
  const handleConfirmSubmission = async () => {
    if (!selectedType) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/cac/annual-returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyType: selectedType,
          companyName: companyName.trim(),
          registrationNumber: registrationNumber.trim().toUpperCase(),
          filingYears: filingYears.trim() || "2026",
          documentType,
          documentUrl,
          designeeFullName: designeeFullName.trim(),
          designeeRole: effectiveRole,
          designeeSignatureUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setIsConfirmModalOpen(false);
        setErrorMessage(data.error || "Failed to process filing. Please try again.");
        return;
      }

      setIsConfirmModalOpen(false);
      router.push("/dashboard/cac/post-incorporation/annual-returns/history?submitted=true");
    } catch (err: any) {
      setIsConfirmModalOpen(false);
      setErrorMessage(err?.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative pb-16 animate-in fade-in duration-200 font-sans">
      
      {/* SLIDE-IN ERROR BANNER (FIXED TOP-RIGHT) */}
      {errorMessage && (
        <div className="fixed top-5 right-5 z-[250] max-w-md p-4 rounded-2xl bg-destructive text-destructive-foreground shadow-2xl border border-destructive/50 flex items-start gap-3 animate-in slide-in-from-top-4 duration-200">
          <WarningCircle size={22} weight="bold" className="shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm font-semibold leading-snug">
            {errorMessage}
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 rounded-lg hover:bg-black/10 transition-colors shrink-0 cursor-pointer"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* Back Breadcrumb (Exact NIN Modification Layout) */}
      <Link 
        href="/dashboard/cac/post-incorporation" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to Post-Incorporation
      </Link>

      {/* Page Header (Exact Standard IPE Layout with cac.png) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center p-2 border border-border shrink-0 shadow-sm">
            <Image 
              src="/cac.png" 
              alt="CAC Logo" 
              width={40} 
              height={40} 
              className="object-contain" 
              priority 
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-0.5">
              <ShieldCheck weight="bold" className="h-3 w-3" />
              Corporate Affairs Commission
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">CAC Annual Returns</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Official statutory compliance filing for Business Names and Limited Liability Companies.
            </p>
          </div>
        </div>

        {/* Action Button: Filing History */}
        <Link 
          href="/dashboard/cac/post-incorporation/annual-returns/history" 
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground text-sm font-bold rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group shrink-0 shadow-sm cursor-pointer"
        >
          <ListDashes weight="bold" className="h-4 w-4" />
          <span>Filing History</span>
          <ArrowRight weight="bold" className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Loading Indicator */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner className="h-8 w-8 animate-spin text-primary" weight="bold" />
          <p className="text-sm font-bold text-muted-foreground">Loading annual returns service...</p>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          
          {/* 1. Structure Selection State with Slashed Price Support */}
          {!selectedType ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Select Company Structure
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose the corporate structure you want to file statutory annual returns for.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                
                {/* Business Name Card */}
                {(() => {
                  const cfg = pricing.BUSINESS_NAME;
                  const hasDisc = cfg.hasDiscount && cfg.originalPrice && cfg.originalPrice > cfg.price;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedType("BUSINESS_NAME");
                        setErrorMessage(null);
                      }}
                      className="p-4 sm:p-5 rounded-2xl border border-border bg-card hover:bg-secondary/40 hover:border-primary/50 text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-secondary group-hover:bg-primary group-hover:text-primary-foreground text-foreground flex items-center justify-center font-bold transition-colors">
                          <Buildings weight="duotone" className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {hasDisc && (
                            <span className="line-through text-muted-foreground opacity-70 text-[10px] font-normal">
                              ₦{cfg.originalPrice!.toLocaleString()}
                            </span>
                          )}
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            ₦{cfg.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                          Business Name / Enterprise
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Sole proprietorships, ventures, and general trading partnerships (BN Series).
                        </p>
                      </div>
                    </button>
                  );
                })()}

                {/* Company (LLC / LTD) Card */}
                {(() => {
                  const cfg = pricing.LLC;
                  const hasDisc = cfg.hasDiscount && cfg.originalPrice && cfg.originalPrice > cfg.price;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedType("LLC");
                        setErrorMessage(null);
                      }}
                      className="p-4 sm:p-5 rounded-2xl border border-border bg-card hover:bg-secondary/40 hover:border-primary/50 text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-secondary group-hover:bg-primary group-hover:text-primary-foreground text-foreground flex items-center justify-center font-bold transition-colors">
                          <Buildings weight="duotone" className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {hasDisc && (
                            <span className="line-through text-muted-foreground opacity-70 text-[10px] font-normal">
                              ₦{cfg.originalPrice!.toLocaleString()}
                            </span>
                          )}
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            ₦{cfg.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                          Company (LLC / LTD)
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Private Limited Liability Companies and Ltd by Guarantee (RC Series).
                        </p>
                      </div>
                    </button>
                  );
                })()}

              </div>

              {/* Prompt Placeholder when no structure is selected */}
              <div className="p-8 sm:p-12 rounded-3xl bg-card border border-dashed border-border text-center space-y-3">
                <div className="h-14 w-14 rounded-2xl bg-secondary/80 text-muted-foreground flex items-center justify-center mx-auto">
                  <CursorClick weight="duotone" className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Please Select Company Structure Above
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Click on <strong>Business Name</strong> or <strong>Company (LLC)</strong> above to open the statutory filing form.
                </p>
              </div>
            </div>
          ) : (
            /* Selected Structure Active Banner (With Price Slash Display) */
            <div className="p-4 sm:p-5 rounded-3xl bg-card border border-primary/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 shadow-sm">
                  <Buildings weight="duotone" className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                      Active Structure
                    </span>
                    {activePricing?.hasDiscount && activePricing?.originalPrice && activePricing.originalPrice > activePricing.price && (
                      <span className="line-through text-muted-foreground opacity-70 text-xs font-normal">
                        ₦{activePricing.originalPrice.toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      ₦{currentPrice.toLocaleString()}
                    </span>
                    {activePricing?.discountBadge && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {activePricing.discountBadge}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-foreground mt-0.5">
                    {pricing[selectedType].label} Annual Returns
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedType === "LLC" 
                      ? "Statutory CAMA annual returns filing for Private Limited Liability Companies."
                      : "Statutory annual returns compliance for Registered Business Names."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedType(null);
                  setErrorMessage(null);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-xs transition-all shrink-0 cursor-pointer shadow-sm"
              >
                <ArrowsClockwise weight="bold" className="h-4 w-4 text-primary" />
                <span>Change Structure</span>
              </button>
            </div>
          )}

          {/* Dynamic Application Form: Rendered when a structure is active */}
          {selectedType && (
            <form 
              onSubmit={handleProceedToReview}
              className="p-5 sm:p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200"
            >
              {/* Form Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                    {pricing[selectedType].label} Application Form
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Provide exact registered details as recorded on the CAC Portal.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">Fee:</span>
                  {activePricing?.hasDiscount && activePricing?.originalPrice && activePricing.originalPrice > activePricing.price && (
                    <span className="line-through text-muted-foreground opacity-70 text-xs font-normal">
                      ₦{activePricing.originalPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    ₦{currentPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Entity Name */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Official Registered {selectedType === "LLC" ? "Company" : "Business"} Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={
                    selectedType === "LLC" 
                      ? "e.g. ACME COMMERCIAL ENTERPRISES LTD" 
                      : "e.g. ACME GLOBAL VENTURES & LOGISTICS"
                  }
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background uppercase"
                  required
                />
              </div>

              {/* Reg Number and Filing Year Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    CAC Registration Number ({selectedType === "LLC" ? "RC Number" : "BN Number"}) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder={selectedType === "LLC" ? "e.g. RC 1984250" : "e.g. BN 3829104"}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground font-mono font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Filing Year <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={filingYears}
                    onChange={(e) => setFilingYears(e.target.value)}
                    placeholder="2026"
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                    required
                  />
                </div>
              </div>

              {/* Document Notice: Professional phrasing */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200 flex items-start gap-3">
                <Info size={18} weight="bold" className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-foreground">
                    Upload Either CAC Certificate OR Status Report (Only One is Required)
                  </p>
                  <p className="leading-relaxed opacity-90">
                    Please upload either your <strong>CAC Registration Certificate</strong> or your <strong>CAC Status Report / Extract</strong>. Uploading one document is sufficient to verify your entity.
                  </p>
                </div>
              </div>

              {/* Document Type Selector & Upload Zone */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="text-xs font-bold text-foreground">
                    Document Type:
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer text-foreground">
                      <input 
                        type="radio"
                        name="docType"
                        checked={documentType === "CERTIFICATE"}
                        onChange={() => setDocumentType("CERTIFICATE")}
                        className="accent-primary w-4 h-4 cursor-pointer"
                      />
                      <span>CAC Certificate</span>
                    </label>

                    <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer text-foreground">
                      <input 
                        type="radio"
                        name="docType"
                        checked={documentType === "STATUS_REPORT"}
                        onChange={() => setDocumentType("STATUS_REPORT")}
                        className="accent-primary w-4 h-4 cursor-pointer"
                      />
                      <span>CAC Status Report</span>
                    </label>
                  </div>
                </div>

                {!documentUrl ? (
                  <div className="relative border-2 border-dashed border-border rounded-2xl p-6 sm:p-8 text-center bg-secondary/20 hover:bg-secondary/30 transition-all flex flex-col items-center justify-center gap-3">
                    <input 
                      type="file"
                      accept="image/png,image/jpeg,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadFileWithProgress(file, "DOC");
                      }}
                      disabled={isUploadingDoc}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />

                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      {isUploadingDoc ? (
                        <Spinner size={22} className="animate-spin" weight="bold" />
                      ) : (
                        <UploadSimple size={22} weight="bold" />
                      )}
                    </div>

                    <div>
                      <p className="text-xs sm:text-sm font-bold text-foreground">
                        {isUploadingDoc ? (
                          <span>Uploading document... <strong className="text-primary font-mono">{docUploadProgress}%</strong></span>
                        ) : (
                          <>Click or drag & drop {documentType === "CERTIFICATE" ? "CAC Certificate" : "Status Report"}</>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Accepts PDF, JPG, or PNG (Max 5MB)
                      </p>
                    </div>

                    {isUploadingDoc && (
                      <div className="w-full max-w-xs bg-secondary rounded-full h-2 overflow-hidden border border-border mt-1">
                        <div 
                          className="bg-primary h-full transition-all duration-150"
                          style={{ width: `${docUploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <FilePdf size={20} weight="bold" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate max-w-[200px] sm:max-w-md">
                          {documentName || "Uploaded CAC Document"}
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                          <Check size={12} weight="bold" /> Ready for Filing
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewModalUrl(documentUrl);
                          setPreviewModalTitle(documentName || "CAC Verification Document");
                        }}
                        className="p-2 rounded-xl bg-card hover:bg-secondary border border-border text-foreground transition-colors cursor-pointer"
                        title="Preview Document"
                      >
                        <Eye size={15} weight="bold" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDocumentUrl("");
                          setDocumentName("");
                        }}
                        className="p-2 rounded-xl bg-card hover:bg-destructive/10 border border-border text-destructive transition-colors cursor-pointer"
                        title="Remove Document"
                      >
                        <Trash size={15} weight="bold" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Authorizing Officer & Full Comprehensive Designation List with "Other" */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Authorizing Officer Full Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={designeeFullName}
                    onChange={(e) => setDesigneeFullName(e.target.value)}
                    placeholder="e.g. Babatunde Adeyemi"
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Official Designation / Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={designeeRole}
                    onChange={(e) => setDesigneeRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background cursor-pointer"
                  >
                    {selectedType === "BUSINESS_NAME" ? (
                      <>
                        <option value="Proprietor">Proprietor / Business Owner</option>
                        <option value="Partner">General Partner / Co-Owner</option>
                        <option value="Shareholder">Shareholder / Equity Holder</option>
                        <option value="Director">Managing Director / Executive</option>
                        <option value="Manager">General / Operations Manager</option>
                        <option value="Company Secretary">Company Secretary / Administrator</option>
                        <option value="Accredited Agent / Legal Practitioner">Accredited Agent / Legal Practitioner</option>
                        <option value="Other">Other (Specify Below)</option>
                      </>
                    ) : (
                      <>
                        <option value="Director">Managing Director / Board Member</option>
                        <option value="Shareholder">Shareholder / Equity Holder</option>
                        <option value="Company Secretary">Company Secretary / Legal Counsel</option>
                        <option value="Chairman / Board President">Chairman / Board President</option>
                        <option value="Chief Executive Officer (CEO)">Chief Executive Officer (CEO)</option>
                        <option value="Proprietor / Partner">Proprietor / Partner</option>
                        <option value="General Manager / Authorized Representative">General Manager / Authorized Representative</option>
                        <option value="Accredited Agent / Solicitor">Accredited Agent / Solicitor</option>
                        <option value="Other">Other (Specify Below)</option>
                      </>
                    )}
                  </select>
                </div>

                {designeeRole === "Other" && (
                  <div className="sm:col-span-2 animate-in fade-in duration-200">
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Specify Officer Designation / Role <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text"
                      value={otherDesigneeRole}
                      onChange={(e) => setOtherDesigneeRole(e.target.value)}
                      placeholder="e.g. Managing Partner, Trustee, Executive Secretary, or Legal Representative"
                      className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Authorizing Signature (Upload OR Draw) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-foreground">
                  Authorizing Officer Signature <span className="text-rose-500">*</span>
                </label>

                {!designeeSignatureUrl ? (
                  <div className="p-4 rounded-2xl bg-secondary/20 border border-border space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-card hover:bg-secondary text-foreground text-xs font-bold rounded-xl border border-border shadow-sm cursor-pointer transition-colors">
                        <UploadSimple size={15} weight="bold" />
                        <span>{isUploadingSig ? `Uploading (${sigUploadProgress}%)...` : "Upload Signature Image"}</span>
                        <input 
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadFileWithProgress(file, "SIG");
                          }}
                          disabled={isUploadingSig}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setIsSignatureCanvasOpen(true)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 bg-card hover:bg-secondary text-foreground text-xs font-bold rounded-xl border border-border shadow-sm cursor-pointer transition-colors"
                      >
                        <PenNib size={15} weight="bold" />
                        <span>Draw Signature</span>
                      </button>
                    </div>

                    {isUploadingSig && (
                      <div className="w-full max-w-xs bg-secondary rounded-full h-2 overflow-hidden border border-border">
                        <div 
                          className="bg-primary h-full transition-all duration-150"
                          style={{ width: `${sigUploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-9 rounded-lg bg-white p-1 border border-border flex items-center justify-center overflow-hidden shrink-0">
                        <img 
                          src={designeeSignatureUrl} 
                          alt="Signature" 
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {signatureFileName || "Officer Digital Signature"}
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                          <Check size={12} weight="bold" /> Attached to Attestation
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewModalUrl(designeeSignatureUrl);
                          setPreviewModalTitle("Officer Signature Preview");
                        }}
                        className="p-2 rounded-xl bg-card hover:bg-secondary border border-border text-foreground transition-colors cursor-pointer"
                        title="Preview Signature"
                      >
                        <Eye size={15} weight="bold" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDesigneeSignatureUrl("");
                          setSignatureFileName("");
                        }}
                        className="p-2 rounded-xl bg-card hover:bg-destructive/10 border border-border text-destructive transition-colors cursor-pointer"
                        title="Remove Signature"
                      >
                        <Trash size={15} weight="bold" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Action with Price Slash Summary */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Total Statutory Filing Fee:
                  </span>
                  <div className="flex items-baseline gap-2">
                    {activePricing?.hasDiscount && activePricing?.originalPrice && activePricing.originalPrice > activePricing.price && (
                      <span className="line-through text-muted-foreground opacity-70 text-sm font-bold">
                        ₦{activePricing.originalPrice.toLocaleString()}
                      </span>
                    )}
                    <span className="text-xl font-black text-foreground font-mono">
                      ₦{currentPrice.toLocaleString()}
                    </span>
                    {activePricing?.discountBadge && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {activePricing.discountBadge}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-11 px-7 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs sm:text-sm rounded-xl shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>Proceed to Confirmation</span>
                  <ArrowRight size={15} weight="bold" />
                </Button>
              </div>

            </form>
          )}

        </div>
      )}

      {/* ---------------- DRAW DIGITAL SIGNATURE MODAL ---------------- */}
      {isSignatureCanvasOpen && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsSignatureCanvasOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-card border border-border rounded-3xl p-6 space-y-4 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <PenNib size={18} weight="bold" className="text-primary" />
                <h3 className="font-black text-sm text-foreground">Sign with Finger / Stylus</h3>
              </div>
              <button 
                onClick={() => setIsSignatureCanvasOpen(false)}
                className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Sign clearly inside the box below using your mouse or finger (touchscreen).
            </p>

            <div className="bg-white rounded-2xl border-2 border-dashed border-border p-2 flex justify-center">
              <canvas 
                ref={canvasRef}
                width={360}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="cursor-crosshair touch-none bg-white rounded-xl"
              />
            </div>

            <div className="flex gap-2.5 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={clearCanvas}
                className="flex-1 h-10 text-xs font-bold cursor-pointer"
              >
                Clear
              </Button>
              <Button
                type="button"
                onClick={saveCanvasSignature}
                className="flex-1 h-10 bg-primary text-primary-foreground text-xs font-black rounded-xl cursor-pointer"
              >
                Save & Attach
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- IN-APP PREVIEW MODAL ---------------- */}
      {previewModalUrl && (
        <div 
          className="fixed inset-0 z-[220] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div 
            className="relative w-full max-w-3xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={18} weight="bold" className="text-primary shrink-0" />
                <h3 className="font-extrabold text-sm text-foreground truncate">
                  {previewModalTitle || "Document Preview"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0"
              >
                <X size={15} weight="bold" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-black/5 dark:bg-black/20 flex items-center justify-center min-h-[300px]">
              {previewModalUrl.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewModalUrl}
                  title="PDF Preview"
                  className="w-full h-[70vh] rounded-2xl border border-border bg-white"
                />
              ) : (
                <img 
                  src={previewModalUrl} 
                  alt="Document Preview" 
                  className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-md"
                />
              )}
            </div>

            <div className="px-6 py-3 border-t border-border bg-secondary/20 flex justify-end">
              <Button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="h-9 px-5 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- CONFIRMATION / INSUFFICIENT BALANCE MODAL ---------------- */}
      {isConfirmModalOpen && mounted && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !isSubmitting && setIsConfirmModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-md bg-card text-card-foreground rounded-3xl border border-border shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 fade-in duration-300 text-left my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Buildings size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {!isBalanceSufficient ? "Insufficient Balance" : "Confirm Annual Returns"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Corporate Affairs Commission Filing Portal
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* INSUFFICIENT BALANCE (CRYING EMOJI & FUND WALLET) */}
            {!isBalanceSufficient ? (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl select-none">😭</span>
                    <div>
                      <h4 className="font-black text-sm text-foreground">You don&apos;t have enough balance</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Please top up your wallet to file this Annual Return.
                      </p>
                    </div>
                  </div>

                  <div className="bg-background/80 dark:bg-background/50 rounded-xl p-3 border border-border space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service:</span>
                      <span className="font-bold text-foreground">
                        CAC Annual Returns ({selectedType === "LLC" ? "LLC" : "Business Name"})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Required Fee:</span>
                      <div className="flex items-center gap-1.5">
                        {activePricing?.hasDiscount && activePricing?.originalPrice && activePricing.originalPrice > activePricing.price && (
                          <span className="line-through text-muted-foreground text-xs">
                            ₦{activePricing.originalPrice.toLocaleString()}
                          </span>
                        )}
                        <span className="font-bold text-destructive">₦{currentPrice.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Balance:</span>
                      <span className="font-bold text-foreground">₦{walletBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/60 pt-1.5">
                      <span className="text-muted-foreground font-semibold">Shortfall Amount:</span>
                      <span className="font-black text-destructive">₦{shortfall.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Link 
                    href="/dashboard/wallet"
                    className="w-full h-11 bg-primary text-primary-foreground font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:opacity-90 transition-opacity"
                  >
                    <Wallet size={16} weight="bold" />
                    <span>Fund Wallet</span>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="w-full h-10 text-xs font-bold text-muted-foreground cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* SUFFICIENT BALANCE */
              <div className="space-y-4">
                <div className="bg-secondary/40 border border-border rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entity Name:</span>
                    <span className="font-bold text-foreground text-right truncate max-w-[200px]">{companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reg Number:</span>
                    <span className="font-mono font-bold text-foreground">{registrationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Structure / Type:</span>
                    <span className="font-bold text-foreground">{selectedType === "LLC" ? "LLC / LTD" : "Business Name"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Filing Year:</span>
                    <span className="font-bold text-foreground">{filingYears || "2026"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statutory Fee:</span>
                    <div className="flex items-center gap-1.5">
                      {activePricing?.hasDiscount && activePricing?.originalPrice && activePricing.originalPrice > activePricing.price && (
                        <span className="line-through text-muted-foreground text-xs">
                          ₦{activePricing.originalPrice.toLocaleString()}
                        </span>
                      )}
                      <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        ₦{currentPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Balance:</span>
                    <span className="font-bold text-foreground">₦{walletBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-2">
                    <span className="text-muted-foreground">Remaining Balance:</span>
                    <span className="font-bold text-foreground">₦{remainingBalance.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Upon confirmation, <strong>₦{currentPrice.toLocaleString()}</strong> will be debited from your wallet and your filing will be queued for compliance processing.
                </p>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsConfirmModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 h-11 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmSubmission}
                    disabled={isSubmitting}
                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner size={14} className="animate-spin" weight="bold" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} weight="bold" />
                        <span>Yes, Submit Filing</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
