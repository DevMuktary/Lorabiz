"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  CheckCircle,
  FileText,
  Buildings,
  UploadSimple,
  Trash,
  Eye,
  Download,
  WarningCircle,
  X,
  Wallet,
  Sparkle,
  PenNib,
  FilePdf,
  Check
} from "@phosphor-icons/react";
import { Loader2 } from "lucide-react";

type CompanyType = "BUSINESS_NAME" | "LLC";

interface PricingMap {
  BUSINESS_NAME: number;
  LLC: number;
}

interface AnnualReturnRecord {
  id: string;
  trackingId: string;
  companyType: "BUSINESS_NAME" | "LLC";
  companyName: string;
  registrationNumber: string;
  filingYears: string | null;
  documentType: string;
  documentUrl: string;
  designeeFullName: string;
  designeeRole: string;
  designeeSignatureUrl: string;
  status: "PENDING" | "PROCESSING" | "APPROVED" | "QUERIED" | "REJECTED";
  queryReason: string | null;
  rejectionReason: string | null;
  adminNotes: string | null;
  acknowledgementLetterUrl: string | null;
  amountPaid: number;
  transactionRef: string;
  createdAt: string;
  approvedAt: string | null;
}

export default function AnnualReturnsPage() {
  const [activeTab, setActiveTab] = useState<"APPLY" | "HISTORY">("APPLY");
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<AnnualReturnRecord[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [pricing, setPricing] = useState<PricingMap>({
    BUSINESS_NAME: 12000,
    LLC: 18000,
  });

  // Form State
  const [companyType, setCompanyType] = useState<CompanyType>("BUSINESS_NAME");
  const [companyName, setCompanyName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [filingYears, setFilingYears] = useState(new Date().getFullYear().toString());
  const [documentType, setDocumentType] = useState<"CERTIFICATE" | "STATUS_REPORT">("CERTIFICATE");
  const [documentUrl, setDocumentUrl] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Designee State
  const [designeeFullName, setDesigneeFullName] = useState("");
  const [designeeRole, setDesigneeRole] = useState("Director");
  const [designeeSignatureUrl, setDesigneeSignatureUrl] = useState("");
  const [signatureFileName, setSignatureFileName] = useState("");
  const [isUploadingSig, setIsUploadingSig] = useState(false);

  // Digital Signature Canvas
  const [isSignatureCanvasOpen, setIsSignatureCanvasOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Submission State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AnnualReturnRecord | null>(null);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [historyRes, walletRes] = await Promise.all([
        fetch("/api/cac/annual-returns"),
        fetch("/api/user/wallet"),
      ]);

      if (historyRes.ok) {
        const data = await historyRes.json();
        if (data.history) setHistory(data.history);
        if (data.pricing) setPricing(data.pricing);
      }

      if (walletRes.ok) {
        const wData = await walletRes.json();
        if (wData.balance !== undefined) setWalletBalance(Number(wData.balance));
      }
    } catch (err) {
      console.error("Failed to fetch annual returns data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const currentPrice = pricing[companyType] || (companyType === "LLC" ? 18000 : 12000);
  const isBalanceSufficient = walletBalance >= currentPrice;

  // Document Upload Handler
  const handleFileUpload = async (file: File, type: "DOC" | "SIG") => {
    const formData = new FormData();
    formData.append("file", file);

    if (type === "DOC") setIsUploadingDoc(true);
    else setIsUploadingSig(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to upload document. Please try again.");
        return;
      }

      if (type === "DOC") {
        setDocumentUrl(data.url);
        setDocumentName(file.name);
      } else {
        setDesigneeSignatureUrl(data.url);
        setSignatureFileName(file.name);
      }
    } catch {
      alert("Network error uploading file. Please check connection.");
    } finally {
      if (type === "DOC") setIsUploadingDoc(false);
      else setIsUploadingSig(false);
    }
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
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
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.lineTo(x, y);
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
    const dataUrl = canvas.toDataURL("image/png");
    setDesigneeSignatureUrl(dataUrl);
    setSignatureFileName("Digital Canvas Signature");
    setIsSignatureCanvasOpen(false);
  };

  const validateForm = () => {
    setFormError("");
    if (!companyName.trim()) {
      setFormError("Please enter the registered company or business name.");
      return false;
    }
    if (!registrationNumber.trim()) {
      setFormError(`Please enter the valid registration number (${companyType === "LLC" ? "RC Number" : "BN Number"}).`);
      return false;
    }
    if (!filingYears.trim()) {
      setFormError("Please enter the financial year(s) you are filing for (e.g. 2024).");
      return false;
    }
    if (!documentUrl) {
      setFormError(`Please upload the CAC ${documentType === "CERTIFICATE" ? "Certificate" : "Status Report"}.`);
      return false;
    }
    if (!designeeFullName.trim()) {
      setFormError("Please enter the full legal name of the authorizing officer.");
      return false;
    }
    if (!designeeRole.trim()) {
      setFormError("Please specify the designation of the authorizing officer.");
      return false;
    }
    if (!designeeSignatureUrl) {
      setFormError("Please provide the authorizing officer's signature.");
      return false;
    }
    if (!isBalanceSufficient) {
      setFormError(`Insufficient wallet balance. You have ₦${walletBalance.toLocaleString()}, but ₦${currentPrice.toLocaleString()} is required. Please fund your wallet.`);
      return false;
    }
    return true;
  };

  const handleProceedClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsConfirmModalOpen(true);
    }
  };

  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/cac/annual-returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyType,
          companyName: companyName.trim(),
          registrationNumber: registrationNumber.trim().toUpperCase(),
          filingYears: filingYears.trim(),
          documentType,
          documentUrl,
          designeeFullName: designeeFullName.trim(),
          designeeRole: designeeRole.trim(),
          designeeSignatureUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit Annual Returns application.");
      }

      // Reset form
      setCompanyName("");
      setRegistrationNumber("");
      setDocumentUrl("");
      setDocumentName("");
      setDesigneeFullName("");
      setDesigneeSignatureUrl("");
      setSignatureFileName("");
      setIsConfirmModalOpen(false);

      // Refresh data & switch to history
      await fetchInitialData();
      setActiveTab("HISTORY");
    } catch (err: any) {
      setFormError(err.message || "Failed to submit application.");
      setIsConfirmModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative pb-16 animate-in fade-in duration-200 font-sans max-w-4xl mx-auto">
      
      {/* Header Navigation */}
      <div className="flex flex-col gap-3">
        <Link 
          href="/dashboard/cac/post-incorporation"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" />
          Back to Post-Incorporation
        </Link>
        
        <div className="flex items-center justify-between border-b border-border pb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center p-1.5 border border-border shrink-0 shadow-sm">
              <Image 
                src="/cac.png" 
                width={40} 
                height={40} 
                alt="CAC Logo" 
                className="object-contain" 
                priority 
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-0.5">
                <ShieldCheck weight="bold" className="h-3 w-3" />
                CAC Post-Incorporation • Statutory Compliance
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                CAC Annual Returns Filing
              </h1>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                File statutory annual returns with the Corporate Affairs Commission and receive official acknowledgement.
              </p>
            </div>
          </div>

          {/* Wallet Balance Badge */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-xl shadow-sm text-xs font-bold">
            <Wallet size={16} className="text-primary" weight="duotone" />
            <span className="text-muted-foreground">Wallet:</span>
            <span className="text-foreground font-black">₦{walletBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("APPLY")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "APPLY"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          }`}
        >
          <FileText size={16} weight="bold" />
          <span>File Annual Returns</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("HISTORY")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "HISTORY"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
          }`}
        >
          <Clock size={16} weight="bold" />
          <span>Filing History</span>
          {history.length > 0 && (
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === "HISTORY" ? "bg-white/20 text-white" : "bg-secondary text-foreground"
            }`}>
              {history.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: APPLICATION FORM */}
      {activeTab === "APPLY" && (
        <form onSubmit={handleProceedClick} className="space-y-6 animate-in fade-in duration-200">
          
          {formError && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
              <WarningCircle size={16} className="shrink-0" weight="bold" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Entity Type Selection */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div>
              <span className="text-xs font-black text-primary uppercase tracking-wider block mb-1">
                Step 1: Entity Structure
              </span>
              <h3 className="text-base font-bold text-foreground">Select Company Classification</h3>
              <p className="text-xs text-muted-foreground">
                Pricing is determined automatically based on your statutory classification with the CAC.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Business Name */}
              <div 
                onClick={() => setCompanyType("BUSINESS_NAME")}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  companyType === "BUSINESS_NAME"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${companyType === "BUSINESS_NAME" ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>
                      <Buildings size={20} weight="duotone" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Business Name (BN)</h4>
                      <span className="text-[11px] text-muted-foreground">Enterprise, Ventures, Sole Trader</span>
                    </div>
                  </div>
                  <input 
                    type="radio" 
                    name="companyType" 
                    checked={companyType === "BUSINESS_NAME"} 
                    onChange={() => setCompanyType("BUSINESS_NAME")}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Statutory Filing Fee:</span>
                  <span className="text-sm font-black text-primary">₦{(pricing.BUSINESS_NAME || 12000).toLocaleString()}</span>
                </div>
              </div>

              {/* Option B: Limited Liability Company */}
              <div 
                onClick={() => setCompanyType("LLC")}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  companyType === "LLC"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${companyType === "LLC" ? "bg-primary text-white" : "bg-secondary text-muted-foreground"}`}>
                      <Buildings size={20} weight="duotone" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Limited Company (LLC / LTD)</h4>
                      <span className="text-[11px] text-muted-foreground">Private Limited by Shares</span>
                    </div>
                  </div>
                  <input 
                    type="radio" 
                    name="companyType" 
                    checked={companyType === "LLC"} 
                    onChange={() => setCompanyType("LLC")}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                </div>
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">Statutory Filing Fee:</span>
                  <span className="text-sm font-black text-primary">₦{(pricing.LLC || 18000).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Company Details */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div>
              <span className="text-xs font-black text-primary uppercase tracking-wider block mb-1">
                Step 2: Corporate Information
              </span>
              <h3 className="text-base font-bold text-foreground">Company & Registration Data</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-foreground">
                  Exact Company / Business Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. QUADROX INTEGRATED SERVICES LTD"
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium text-foreground outline-none focus:border-primary transition-colors uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {companyType === "LLC" ? "RC Number" : "BN Number"} <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder={companyType === "LLC" ? "e.g. RC-1849201" : "e.g. BN-2938471"}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium text-foreground outline-none focus:border-primary transition-colors uppercase font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Filing Financial Year(s) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={filingYears}
                  onChange={(e) => setFilingYears(e.target.value)}
                  placeholder="e.g. 2024 (or 2023, 2024)"
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium text-foreground outline-none focus:border-primary transition-colors"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Indicate the year(s) to be filed and regularized.
                </span>
              </div>
            </div>

            {/* Document Upload */}
            <div className="pt-3 border-t border-border/60 space-y-3">
              <label className="text-xs font-bold text-foreground block">
                Supporting Verification Document <span className="text-destructive">*</span>
              </label>

              {/* Selector */}
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="radio"
                    name="docType"
                    checked={documentType === "CERTIFICATE"}
                    onChange={() => setDocumentType("CERTIFICATE")}
                    className="text-primary focus:ring-primary"
                  />
                  <span>CAC Certificate of Registration</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="radio"
                    name="docType"
                    checked={documentType === "STATUS_REPORT"}
                    onChange={() => setDocumentType("STATUS_REPORT")}
                    className="text-primary focus:ring-primary"
                  />
                  <span>CAC Status Report</span>
                </label>
              </div>

              {/* Upload Dropzone */}
              {documentUrl ? (
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <FilePdf size={20} weight="duotone" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block truncate max-w-xs sm:max-w-md">
                        {documentName || "CAC Verification Document"}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">Uploaded successfully ✓</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                    >
                      <Eye size={16} />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setDocumentUrl("");
                        setDocumentName("");
                      }}
                      className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <label className={`border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-secondary/20 hover:bg-secondary/40 text-center ${
                  isUploadingDoc ? "opacity-60 pointer-events-none" : ""
                }`}>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "DOC");
                    }}
                    className="hidden"
                  />
                  {isUploadingDoc ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={24} className="animate-spin text-primary" />
                      <span className="text-xs font-bold text-foreground">Uploading document securely...</span>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 rounded-xl bg-primary/10 text-primary mb-2">
                        <UploadSimple size={24} weight="bold" />
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        Upload {documentType === "CERTIFICATE" ? "Certificate of Registration" : "Status Report"}
                      </span>
                      <span className="text-[11px] text-muted-foreground mt-0.5">
                        PDF, PNG, or JPG up to 5MB
                      </span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* 3. Designee / Authorizing Officer */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div>
              <span className="text-xs font-black text-primary uppercase tracking-wider block mb-1">
                Step 3: Officer Authorization
              </span>
              <h3 className="text-base font-bold text-foreground">Authorizing Officer Information</h3>
              <p className="text-xs text-muted-foreground">
                To guarantee legitimate authorization and satisfy CAC statutory audit rules, provide the details of the director, proprietor, or secretary ordering this filing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Authorizing Officer Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={designeeFullName}
                  onChange={(e) => setDesigneeFullName(e.target.value)}
                  placeholder="e.g. John Chukwuemeka Bello"
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Designation / Position in Entity <span className="text-destructive">*</span>
                </label>
                <select
                  value={designeeRole}
                  onChange={(e) => setDesigneeRole(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs font-medium text-foreground outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="Director">Director</option>
                  <option value="Managing Director">Managing Director</option>
                  <option value="Company Secretary">Company Secretary</option>
                  <option value="Sole Proprietor">Sole Proprietor</option>
                  <option value="Partner">Partner</option>
                  <option value="Trustee">Trustee</option>
                </select>
              </div>
            </div>

            {/* Signature Area */}
            <div className="pt-3 border-t border-border/60 space-y-2">
              <label className="text-xs font-bold text-foreground block">
                Officer Signature <span className="text-destructive">*</span>
              </label>

              {designeeSignatureUrl ? (
                <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-16 bg-white rounded border border-border overflow-hidden flex items-center justify-center p-1">
                      <img src={designeeSignatureUrl} alt="Signature" className="max-h-full object-contain" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block truncate">
                        {signatureFileName || "Signature attached"}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium">Verified Signature ✓</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDesigneeSignatureUrl("");
                      setSignatureFileName("");
                    }}
                    className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Option A: Upload Image */}
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-border transition-colors cursor-pointer shadow-sm">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "SIG");
                      }}
                      className="hidden"
                    />
                    <UploadSimple size={16} weight="bold" />
                    <span>{isUploadingSig ? "Uploading..." : "Upload Signature Image"}</span>
                  </label>

                  {/* Option B: Draw on Canvas */}
                  <button
                    type="button"
                    onClick={() => setIsSignatureCanvasOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl border border-primary/20 transition-colors cursor-pointer shadow-sm"
                  >
                    <PenNib size={16} weight="bold" />
                    <span>Draw Digital Signature</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Checkout & Submit Bar */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-md flex items-center justify-between gap-4 flex-wrap">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                Total Statutory Filing Fee
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-foreground">₦{currentPrice.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground font-medium">({companyType === "LLC" ? "LLC" : "Business Name"})</span>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer ml-auto"
            >
              <span>Proceed to Filing (₦{currentPrice.toLocaleString()})</span>
              <ArrowRight weight="bold" className="h-4 w-4" />
            </button>
          </div>

        </form>
      )}

      {/* TAB 2: FILING HISTORY */}
      {activeTab === "HISTORY" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              <Loader2 size={28} className="animate-spin text-primary mx-auto mb-2" />
              <span className="text-xs font-bold">Loading filing records...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center bg-card border border-border rounded-2xl space-y-3">
              <div className="h-12 w-12 rounded-xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
                <FileText size={24} weight="duotone" />
              </div>
              <h3 className="text-base font-bold text-foreground">No Annual Returns Filed Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Submit an annual return filing application to keep your CAC status compliant and download official acknowledgement letters here.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("APPLY")}
                className="px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow cursor-pointer mt-2"
              >
                Start First Filing
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record) => {
                const isApproved = record.status === "APPROVED";
                const isQueried = record.status === "QUERIED";
                const isRejected = record.status === "REJECTED";
                const isProcessing = record.status === "PROCESSING";

                return (
                  <div
                    key={record.id}
                    className="p-5 rounded-2xl bg-card border border-border hover:border-border/80 transition-all space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-black font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                            {record.trackingId}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">
                            {record.companyType === "LLC" ? "Limited Liability Company" : "Business Name"}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-foreground">{record.companyName}</h4>
                        <span className="text-xs text-muted-foreground font-mono">
                          Reg No: {record.registrationNumber} • Year(s): {record.filingYears || "N/A"}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle weight="fill" size={14} />
                            <span>APPROVED</span>
                          </span>
                        )}
                        {isProcessing && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <Clock weight="fill" size={14} />
                            <span>PROCESSING</span>
                          </span>
                        )}
                        {isQueried && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <WarningCircle weight="fill" size={14} />
                            <span>QUERIED</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-destructive/10 text-destructive border border-destructive/20">
                            <WarningCircle weight="fill" size={14} />
                            <span>REJECTED</span>
                          </span>
                        )}
                        {record.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                            <Clock weight="bold" size={14} />
                            <span>PENDING REVIEW</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Query Notice if any */}
                    {isQueried && record.queryReason && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                        <strong>CAC Query Note:</strong> {record.queryReason}
                      </div>
                    )}

                    {/* Footer Actions & Acknowledgement Download */}
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3 flex-wrap text-xs">
                      <span className="text-muted-foreground font-medium">
                        Filed: {format(new Date(record.createdAt), "MMM d, yyyy · h:mm a")}
                      </span>

                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(record)}
                          className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Eye size={14} />
                          <span>View Details</span>
                        </button>

                        {/* Download Acknowledgement Letter Button */}
                        {isApproved && record.acknowledgementLetterUrl && (
                          <a
                            href={record.acknowledgementLetterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download size={14} weight="bold" />
                            <span>Download Acknowledgement</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-black text-foreground">Confirm Filing & Payment</h3>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Entity Name:</span>
                <span className="font-bold text-foreground uppercase">{companyName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Reg Number:</span>
                <span className="font-mono font-bold text-foreground">{registrationNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Classification:</span>
                <span className="font-bold text-foreground">{companyType === "LLC" ? "LLC / LTD" : "Business Name"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Filing Year(s):</span>
                <span className="font-bold text-foreground">{filingYears}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Authorizing Officer:</span>
                <span className="font-bold text-foreground">{designeeFullName} ({designeeRole})</span>
              </div>

              <div className="p-3 bg-secondary/50 rounded-xl space-y-1.5 mt-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Current Wallet Balance:</span>
                  <span>₦{walletBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground">
                  <span>Statutory Filing Fee:</span>
                  <span className="text-destructive">-₦{currentPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-black text-emerald-600 border-t border-border/60 pt-1.5">
                  <span>Balance After Debit:</span>
                  <span>₦{(walletBalance - currentPrice).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm & Debit Wallet</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD DETAILS MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-primary">{selectedRecord.trackingId}</span>
                <h3 className="text-base font-bold text-foreground">Filing Application Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-secondary/30 rounded-xl">
                <div>
                  <span className="text-muted-foreground block text-[10px]">COMPANY NAME</span>
                  <strong className="text-foreground text-xs">{selectedRecord.companyName}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">REG NUMBER</span>
                  <strong className="text-foreground text-xs font-mono">{selectedRecord.registrationNumber}</strong>
                </div>
                <div className="mt-2">
                  <span className="text-muted-foreground block text-[10px]">CLASSIFICATION</span>
                  <strong className="text-foreground text-xs">{selectedRecord.companyType}</strong>
                </div>
                <div className="mt-2">
                  <span className="text-muted-foreground block text-[10px]">YEAR(S) FILED</span>
                  <strong className="text-foreground text-xs">{selectedRecord.filingYears || "N/A"}</strong>
                </div>
              </div>

              <div className="p-3 bg-secondary/30 rounded-xl space-y-1">
                <span className="text-muted-foreground block text-[10px]">AUTHORIZING OFFICER</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{selectedRecord.designeeFullName} ({selectedRecord.designeeRole})</span>
                  {selectedRecord.designeeSignatureUrl && (
                    <img src={selectedRecord.designeeSignatureUrl} alt="Signature" className="h-6 object-contain bg-white rounded px-1" />
                  )}
                </div>
              </div>

              {/* Uploaded Verification Document */}
              <div className="p-3 bg-secondary/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground block text-[10px]">VERIFICATION DOCUMENT</span>
                  <span className="font-bold text-foreground">
                    {selectedRecord.documentType === "CERTIFICATE" ? "CAC Certificate" : "CAC Status Report"}
                  </span>
                </div>
                <a
                  href={selectedRecord.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Eye size={14} />
                  <span>Preview</span>
                </a>
              </div>

              {/* Acknowledgement Letter Download if approved */}
              {selectedRecord.acknowledgementLetterUrl && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                      Official CAC Acknowledgement Letter
                    </span>
                    <span className="text-xs font-bold text-foreground">Filing Completed & Verified</span>
                  </div>
                  <a
                    href={selectedRecord.acknowledgementLetterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
                  >
                    <Download size={14} weight="bold" />
                    <span>Download</span>
                  </a>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              className="w-full py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* DIGITAL SIGNATURE CANVAS MODAL */}
      {isSignatureCanvasOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">Draw Digital Signature</h3>
              <button
                type="button"
                onClick={() => setIsSignatureCanvasOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Sign clearly inside the box below using your mouse or finger (touchscreen).
            </p>

            <div className="border border-border rounded-xl bg-white p-1 overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={380}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 cursor-crosshair touch-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={clearCanvas}
                className="px-3.5 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Clear
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSignatureCanvasOpen(false)}
                  className="px-3.5 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveCanvasSignature}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow cursor-pointer"
                >
                  Apply Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
