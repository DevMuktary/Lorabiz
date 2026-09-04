"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { 
  ShieldCheck, 
  ArrowLeft, 
  CheckCircle,
  FileText,
  UploadSimple,
  Trash,
  Eye,
  WarningCircle,
  X,
  Wallet,
  PenNib,
  FilePdf,
  Check,
  Buildings,
  ListDashes,
  Info,
  Spinner
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

type CompanyType = "BUSINESS_NAME" | "LLC";

interface PricingMap {
  BUSINESS_NAME: number;
  LLC: number;
}

export default function AnnualReturnsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [pricing, setPricing] = useState<PricingMap>({
    BUSINESS_NAME: 12000,
    LLC: 18000,
  });

  // Form State
  const [companyType, setCompanyType] = useState<CompanyType>("BUSINESS_NAME");
  const [companyName, setCompanyName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [filingYears, setFilingYears] = useState("2026");

  // Document Upload State (Only 1 document required: Certificate OR Status Report)
  const [documentType, setDocumentType] = useState<"CERTIFICATE" | "STATUS_REPORT">("CERTIFICATE");
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadProgress, setDocUploadProgress] = useState(0);

  // Designee State
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

  // Slide-in Toast / Error State
  const [slideNotification, setSlideNotification] = useState<{
    type: "error" | "success" | "info";
    message: string;
  } | null>(null);

  // Confirmation / Checkout Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchPricingAndWallet();
  }, []);

  // Update default role when company type changes
  useEffect(() => {
    if (companyType === "BUSINESS_NAME") {
      setDesigneeRole("Proprietor");
    } else {
      setDesigneeRole("Director");
    }
  }, [companyType]);

  // Dismiss notification automatically after 7s
  useEffect(() => {
    if (slideNotification) {
      const timer = setTimeout(() => setSlideNotification(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [slideNotification]);

  const fetchPricingAndWallet = async () => {
    setIsLoadingPricing(true);
    try {
      const [pricingRes, walletRes] = await Promise.all([
        fetch("/api/cac/annual-returns"),
        fetch("/api/user/wallet"),
      ]);

      if (pricingRes.ok) {
        const data = await pricingRes.json();
        if (data.pricing) setPricing(data.pricing);
      }

      if (walletRes.ok) {
        const wData = await walletRes.json();
        if (wData.balance !== undefined) setWalletBalance(Number(wData.balance));
      }
    } catch (err) {
      console.error("Failed to load pricing or wallet info:", err);
    } finally {
      setIsLoadingPricing(false);
    }
  };

  const currentPrice = pricing[companyType] || (companyType === "LLC" ? 18000 : 12000);
  const isBalanceSufficient = walletBalance >= currentPrice;
  const shortfall = Math.max(0, currentPrice - walletBalance);
  const remainingBalance = Math.max(0, walletBalance - currentPrice);

  // Effective role considering "Other"
  const effectiveRole = designeeRole === "Other" ? otherDesigneeRole.trim() : designeeRole;

  // Upload with real percentage progress via XMLHttpRequest
  const uploadFileWithProgress = (file: File, type: "DOC" | "SIG") => {
    if (file.size > 5 * 1024 * 1024) {
      setSlideNotification({
        type: "error",
        message: "File exceeds 5MB limit. Please compress your document before uploading.",
      });
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
              setSlideNotification({
                type: "success",
                message: `Uploaded "${file.name}" successfully!`,
              });
            } else {
              setDesigneeSignatureUrl(res.url);
              setSignatureFileName(file.name);
              setSlideNotification({
                type: "success",
                message: "Signature image uploaded successfully!",
              });
            }
          } else {
            setSlideNotification({
              type: "error",
              message: res.error || "Upload failed. Please try again.",
            });
          }
        } catch {
          setSlideNotification({
            type: "error",
            message: "Failed to parse upload server response.",
          });
        }
      } else {
        setSlideNotification({
          type: "error",
          message: "Upload failed with HTTP error: " + xhr.statusText,
        });
      }
    };

    xhr.onerror = () => {
      if (type === "DOC") setIsUploadingDoc(false);
      else setIsUploadingSig(false);
      setSlideNotification({
        type: "error",
        message: "Network error during upload. Please check your internet connection.",
      });
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

  // Form Validation & Checkout Trigger
  const handleOpenConfirmation = () => {
    if (!companyName.trim()) {
      setSlideNotification({ type: "error", message: "Please provide the official registered company or business name." });
      return;
    }
    if (!registrationNumber.trim()) {
      setSlideNotification({ type: "error", message: "Please provide the CAC Registration Number (RC or BN number)." });
      return;
    }
    if (!documentUrl.trim()) {
      setSlideNotification({
        type: "error",
        message: `Please upload your ${documentType === "CERTIFICATE" ? "CAC Registration Certificate" : "CAC Status Report"}.`,
      });
      return;
    }
    if (!designeeFullName.trim()) {
      setSlideNotification({ type: "error", message: "Please provide the authorizing officer's full legal name." });
      return;
    }
    if (designeeRole === "Other" && !otherDesigneeRole.trim()) {
      setSlideNotification({ type: "error", message: "Please specify the officer's exact designation/role in the company." });
      return;
    }
    if (!designeeSignatureUrl.trim()) {
      setSlideNotification({ type: "error", message: "Please provide the authorizing officer's signature (upload or draw)." });
      return;
    }

    // Open checkout confirmation modal
    setIsConfirmModalOpen(true);
  };

  // Submit Final Application
  const handleConfirmSubmission = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/cac/annual-returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyType,
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
        setSlideNotification({
          type: "error",
          message: data.error || "Failed to process application. Please try again.",
        });
        return;
      }

      setIsConfirmModalOpen(false);
      // Navigate to dedicated history page
      router.push("/dashboard/cac/post-incorporation/annual-returns/history?submitted=true");
    } catch (err: any) {
      setIsConfirmModalOpen(false);
      setSlideNotification({
        type: "error",
        message: err?.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative pb-16 font-sans">
      
      {/* SLIDE-IN NOTIFICATION / ERROR BANNER (FIXED TOP/FLOAT) */}
      {slideNotification && (
        <div 
          className={`fixed top-4 right-4 z-[150] max-w-md w-[calc(100%-2rem)] p-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-4 duration-300 flex items-start gap-3 ${
            slideNotification.type === "error"
              ? "bg-destructive/95 text-destructive-foreground border-destructive/50"
              : slideNotification.type === "success"
              ? "bg-emerald-600/95 text-white border-emerald-500/50"
              : "bg-card/95 text-foreground border-border"
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {slideNotification.type === "error" ? (
              <WarningCircle size={22} weight="bold" />
            ) : slideNotification.type === "success" ? (
              <CheckCircle size={22} weight="bold" />
            ) : (
              <Info size={22} weight="bold" />
            )}
          </div>
          <div className="flex-1 text-xs sm:text-sm font-semibold leading-snug">
            {slideNotification.message}
          </div>
          <button
            type="button"
            onClick={() => setSlideNotification(null)}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link 
          href="/dashboard/cac/post-incorporation" 
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" /> Back to Post-Incorporation
        </Link>

        {/* Link to Dedicated History Page */}
        <Link
          href="/dashboard/cac/post-incorporation/annual-returns/history"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/15 border border-primary/20 px-3.5 py-1.5 rounded-xl cursor-pointer"
        >
          <ListDashes size={16} weight="bold" />
          <span>View Filing History</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-card via-card to-secondary/30 border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck weight="bold" className="h-3.5 w-3.5" />
              Corporate Affairs Commission (CAC) Authorized Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              File CAC Annual Returns
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Maintain statutory corporate compliance, protect your entity from CAMA penalties, and obtain an official CAC Acknowledgement Letter.
            </p>
          </div>

          <div className="shrink-0 flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-secondary/60 border border-border flex items-center justify-center p-3 shadow-inner">
              <Image 
                src="/cac-logo.png" 
                alt="CAC Nigeria" 
                width={64} 
                height={64} 
                className="object-contain" 
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Filing Form */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
        
        {/* Step 1: Corporate Entity Type */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center">1</span>
            <h2 className="text-base font-extrabold text-foreground">Select Company Structure</h2>
          </div>
          <p className="text-xs text-muted-foreground ml-8">
            Choose whether the entity is registered as an Enterprise/Business Name or a Limited Liability Company.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Business Name Option */}
            <div 
              onClick={() => setCompanyType("BUSINESS_NAME")}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                companyType === "BUSINESS_NAME"
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                  : "border-border bg-secondary/20 hover:border-border/80"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-foreground">Business Name / Enterprise</span>
                    {companyType === "BUSINESS_NAME" && (
                      <CheckCircle weight="fill" className="text-primary w-4 h-4" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Sole proprietorships, ventures, and general trading partnerships (BN Series).
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50 flex items-baseline justify-between">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Filing Fee:</span>
                <span className="text-base font-black text-foreground">
                  ₦{pricing.BUSINESS_NAME.toLocaleString()}
                </span>
              </div>
            </div>

            {/* LLC Option */}
            <div 
              onClick={() => setCompanyType("LLC")}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                companyType === "LLC"
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                  : "border-border bg-secondary/20 hover:border-border/80"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-foreground">Company (LLC / LTD)</span>
                    {companyType === "LLC" && (
                      <CheckCircle weight="fill" className="text-primary w-4 h-4" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Private Limited Liability Companies, Ltd by Guarantee (RC Series).
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/50 flex items-baseline justify-between">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Filing Fee:</span>
                <span className="text-base font-black text-foreground">
                  ₦{pricing.LLC.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Entity Identification & Year */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center">2</span>
            <h2 className="text-base font-extrabold text-foreground">Entity Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 ml-0 sm:ml-8">
            {/* Company Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-foreground">
                Registered {companyType === "LLC" ? "Company" : "Business"} Name *
              </label>
              <input 
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={
                  companyType === "LLC" 
                    ? "e.g. ACME COMMERCIAL ENTERPRISES LTD" 
                    : "e.g. ACME GLOBAL VENTURES & LOGISTICS"
                }
                className="w-full h-11 px-4 rounded-xl bg-secondary/30 border border-border text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"
              />
              <p className="text-[11px] text-muted-foreground">
                Enter the exact legal name as it appears on your official CAC Certificate.
              </p>
            </div>

            {/* Registration Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                CAC Registration Number ({companyType === "LLC" ? "RC Number" : "BN Number"}) *
              </label>
              <input 
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder={companyType === "LLC" ? "e.g. RC 1984250" : "e.g. BN 3829104"}
                className="w-full h-11 px-4 rounded-xl bg-secondary/30 border border-border text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 uppercase"
              />
            </div>

            {/* Filing Year (Defaulted to 2026, Single Year) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Filing Year *
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Statutory Filing
                </span>
              </div>
              <input 
                type="text"
                value={filingYears}
                onChange={(e) => setFilingYears(e.target.value)}
                placeholder="2026"
                className="w-full h-11 px-4 rounded-xl bg-secondary/30 border border-border text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p className="text-[10px] text-muted-foreground">
                Currently defaulted to current year statutory return. (Multi-year penalty settlement coming soon).
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Required Supporting Document */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center">3</span>
            <h2 className="text-base font-extrabold text-foreground">Verification Document</h2>
          </div>

          {/* Critical Clarification Notice: ONLY ONE DOCUMENT NEEDED */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 ml-0 sm:ml-8 flex items-start gap-3">
            <Info size={20} weight="bold" className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-extrabold text-foreground">
                Upload ONLY ONE Document (Not Both)
              </p>
              <p className="leading-relaxed">
                You only need to provide <strong>either</strong> your <strong>CAC Certificate of Registration</strong> OR your <strong>CAC Status Report / Extract</strong>. Uploading one is sufficient for filing.
              </p>
            </div>
          </div>

          <div className="space-y-4 ml-0 sm:ml-8">
            {/* Document Type Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="text-xs font-bold text-foreground">
                Choose Document to Upload:
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer text-foreground">
                  <input 
                    type="radio"
                    name="docType"
                    checked={documentType === "CERTIFICATE"}
                    onChange={() => setDocumentType("CERTIFICATE")}
                    className="accent-primary w-4 h-4 cursor-pointer"
                  />
                  <span>CAC Registration Certificate</span>
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

            {/* Document Upload Area */}
            {!documentUrl ? (
              <div className="relative border-2 border-dashed border-border rounded-2xl p-6 sm:p-8 text-center bg-secondary/10 hover:bg-secondary/20 transition-all flex flex-col items-center justify-center gap-3">
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

                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                  {isUploadingDoc ? (
                    <Spinner size={24} className="animate-spin" weight="bold" />
                  ) : (
                    <UploadSimple size={24} weight="bold" />
                  )}
                </div>

                <div>
                  <p className="text-xs sm:text-sm font-bold text-foreground">
                    {isUploadingDoc ? (
                      <span>Uploading document... <strong className="text-primary">{docUploadProgress}%</strong></span>
                    ) : (
                      <>Click or drag & drop your {documentType === "CERTIFICATE" ? "CAC Certificate" : "Status Report"}</>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Accepts PDF, JPG, or PNG (Max 5MB)
                  </p>
                </div>

                {/* Progress Bar */}
                {isUploadingDoc && (
                  <div className="w-full max-w-xs bg-secondary rounded-full h-2 overflow-hidden mt-1 border border-border">
                    <div 
                      className="bg-primary h-full transition-all duration-150"
                      style={{ width: `${docUploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Uploaded Document Card with IN-APP PREVIEW MODAL */
              <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <FilePdf size={22} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate max-w-[220px] sm:max-w-md">
                      {documentName || "Uploaded CAC Document"}
                    </p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                      <Check size={12} weight="bold" /> Ready for Filing
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* In-App Preview Modal Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewModalUrl(documentUrl);
                      setPreviewModalTitle(documentName || "CAC Verification Document");
                    }}
                    className="p-2 rounded-xl bg-card hover:bg-secondary border border-border text-foreground transition-colors cursor-pointer"
                    title="Preview Document in App"
                  >
                    <Eye size={16} weight="bold" />
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
                    <Trash size={16} weight="bold" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Authorizing Officer & Designation */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center">4</span>
            <h2 className="text-base font-extrabold text-foreground">Authorizing Officer & Signature</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 ml-0 sm:ml-8">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Authorizing Officer Full Legal Name *
              </label>
              <input 
                type="text"
                value={designeeFullName}
                onChange={(e) => setDesigneeFullName(e.target.value)}
                placeholder="e.g. Babatunde Adeyemi"
                className="w-full h-11 px-4 rounded-xl bg-secondary/30 border border-border text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Designation / Role with "Other" */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Official Designation / Role *
              </label>
              <select
                value={designeeRole}
                onChange={(e) => setDesigneeRole(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-secondary/30 border border-border text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {companyType === "BUSINESS_NAME" ? (
                  <>
                    <option value="Proprietor">Proprietor / Business Owner</option>
                    <option value="Partner">General Partner</option>
                    <option value="Accredited Agent / Solicitor">Accredited Agent / Solicitor</option>
                    <option value="Other">Other (Specify Below)</option>
                  </>
                ) : (
                  <>
                    <option value="Director">Managing Director / Director</option>
                    <option value="Company Secretary">Company Secretary</option>
                    <option value="Authorized Representative">Authorized Representative</option>
                    <option value="Other">Other (Specify Below)</option>
                  </>
                )}
              </select>
            </div>

            {/* If "Other" is selected, show custom role input */}
            {designeeRole === "Other" && (
              <div className="space-y-1.5 sm:col-span-2 animate-in fade-in duration-200">
                <label className="text-xs font-bold text-foreground">
                  Specify Officer Designation / Role *
                </label>
                <input 
                  type="text"
                  value={otherDesigneeRole}
                  onChange={(e) => setOtherDesigneeRole(e.target.value)}
                  placeholder="e.g. Managing Partner, Trustee, Legal Counsel, or Administrator"
                  className="w-full h-11 px-4 rounded-xl bg-secondary/30 border border-border text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}

            {/* Officer Signature (Upload OR Draw) */}
            <div className="space-y-3 sm:col-span-2">
              <label className="text-xs font-bold text-foreground">
                Authorizing Officer Signature *
              </label>

              {!designeeSignatureUrl ? (
                <div className="p-5 rounded-2xl bg-secondary/20 border border-border space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Upload button */}
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-card hover:bg-secondary text-foreground text-xs font-bold rounded-xl border border-border shadow-sm cursor-pointer transition-colors">
                      <UploadSimple size={16} weight="bold" />
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

                    {/* Draw button */}
                    <button
                      type="button"
                      onClick={() => setIsSignatureCanvasOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-card hover:bg-secondary text-foreground text-xs font-bold rounded-xl border border-border shadow-sm cursor-pointer transition-colors"
                    >
                      <PenNib size={16} weight="bold" />
                      <span>Draw Digital Signature</span>
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

                  <p className="text-[11px] text-muted-foreground">
                    Required for CAMA statutory compliance and filing attestation on CAC portal.
                  </p>
                </div>
              ) : (
                /* Uploaded Signature Card with In-App Preview */
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-16 h-10 rounded-lg bg-white p-1 border border-border flex items-center justify-center overflow-hidden shrink-0">
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
                      <Eye size={16} weight="bold" />
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
                      <Trash size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Action Button */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block">
              Total Statutory Filing Cost:
            </span>
            <div className="text-2xl font-black text-foreground">
              ₦{currentPrice.toLocaleString()}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleOpenConfirmation}
            className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>Proceed to Confirmation</span>
            <Check size={16} weight="bold" />
          </Button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* DIGITAL SIGNATURE CANVAS MODAL */}
      {/* ========================================================================= */}
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
              Draw your clean signature inside the white box below.
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

            <div className="flex gap-2.5 pt-2">
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

      {/* ========================================================================= */}
      {/* IN-APP DOCUMENT PREVIEW MODAL (NO EXTERNAL TAB) */}
      {/* ========================================================================= */}
      {previewModalUrl && (
        <div 
          className="fixed inset-0 z-[220] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div 
            className="relative w-full max-w-3xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={20} weight="bold" className="text-primary shrink-0" />
                <h3 className="font-extrabold text-sm text-foreground truncate">
                  {previewModalTitle || "Document Preview"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Modal Content - Auto switches between image and PDF iframe */}
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

            {/* Modal Footer */}
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

      {/* ========================================================================= */}
      {/* CHECKOUT CONFIRMATION MODAL (MATCHES BVN RETRIEVAL PATTERN) */}
      {/* ========================================================================= */}
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
                    Corporate Affairs Commission Statutory Portal
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

            {/* IF INSUFFICIENT WALLET BALANCE (CRYING EMOJI & FUND WALLET) */}
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
                        CAC Annual Returns ({companyType === "LLC" ? "LLC" : "Business Name"})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Required Fee:</span>
                      <span className="font-bold text-destructive">₦{currentPrice.toLocaleString()}</span>
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
              /* IF SUFFICIENT WALLET BALANCE */
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
                    <span className="font-bold text-foreground">{companyType === "LLC" ? "LLC / LTD" : "Business Name"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Filing Year:</span>
                    <span className="font-bold text-foreground">{filingYears || "2026"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statutory Fee:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">₦{currentPrice.toLocaleString()}</span>
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
                  Upon confirmation, <strong>₦{currentPrice.toLocaleString()}</strong> will be debited from your wallet and your filing will be submitted to our compliance desk.
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
