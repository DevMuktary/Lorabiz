"use client";

import React, { useRef, useState } from "react";
import { 
  FilePdf, 
  Image as ImageIcon, 
  Printer, 
  ShieldCheck,
  Calendar,
  MapPin,
  Stamp,
  Lock,
  Sparkle,
  Crown,
  Lightning,
  Scroll,
  Certificate,
  Buildings,
  EnvelopeSimple,
  PhoneCall,
  CheckCircle
} from "@phosphor-icons/react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ResolutionDesignTheme } from "@/lib/board-resolution-generator";

export interface ResolutionDocProps {
  data: {
    title?: string;
    subtitle?: string;
    theme?: ResolutionDesignTheme;
    accentColor?: string;
    letterhead: {
      companyName: string;
      rcNumber: string;
      registeredAddress: string;
      email?: string;
      phone?: string;
    };
    meetingMetadata?: {
      date: string;
      venue: string;
      commencementText?: string;
    };
    preambleText?: string;
    resolutionLeadIn?: string;
    numberedClauses?: string[];
    validityClause?: string;
    recitals?: string[];
    operativeClauses?: Array<{
      heading: string;
      text: string;
    }>;
    mandateClause?: string;
    certificationText?: string;
    signatories: Array<{
      name: string;
      role: string;
      isSignatory: boolean;
      signatureUrl?: string;
    }>;
    corporateMotto?: string;
    logoUrl?: string;
    sealUrl?: string;
    designNotes?: string;
  };
  accentColor?: string;
  logoUrl?: string;
  sealUrl?: string;
  isWatermarked?: boolean;
  documentRef?: string;
  onDownloadStart?: () => void;
  onDownloadEnd?: () => void;
}

const THEME_OPTIONS: Array<{
  id: ResolutionDesignTheme;
  name: string;
  icon: React.ComponentType<{ className?: string; weight?: any }>;
  description: string;
  defaultAccent: string;
}> = [
  {
    id: "classic-royal",
    name: "Corporate Standard",
    icon: Crown,
    description: "Official Nigerian corporate letterhead with clean numbered resolution clauses and signature docket",
    defaultAccent: "#1e3a8a"
  },
  {
    id: "modern-executive",
    name: "Modern Executive",
    icon: Lightning,
    description: "Contemporary tech letterhead with RC & Date top box and accent divider rule",
    defaultAccent: "#0f172a"
  },
  {
    id: "luxury-crest",
    name: "Certified Crest",
    icon: Certificate,
    description: "Heraldic security border with golden accents and formal docket",
    defaultAccent: "#78350f"
  },
  {
    id: "gazette-formal",
    name: "Official Gazette",
    icon: Scroll,
    description: "Statutory CAMA 2020 legal gazette extract layout",
    defaultAccent: "#334155"
  }
];

export default function ResolutionDocumentView({
  data,
  accentColor: propsAccentColor,
  logoUrl,
  sealUrl: propsSealUrl,
  isWatermarked = false,
  documentRef = "PREVIEW-DRAFT",
  onDownloadStart,
  onDownloadEnd,
}: ResolutionDocProps) {
  const docRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<"pdf" | "png" | null>(null);

  // Active theme: starts with AI's selected theme or defaults to classic-royal
  const [activeTheme, setActiveTheme] = useState<ResolutionDesignTheme>(
    data.theme || "classic-royal"
  );

  const effectiveAccentColor = propsAccentColor || data?.accentColor || 
    THEME_OPTIONS.find(t => t.id === activeTheme)?.defaultAccent || "#1e3a8a";
  const effectiveLogoUrl = logoUrl || data?.logoUrl;
  const effectiveSealUrl = propsSealUrl || data?.sealUrl;

  const companyName = data?.letterhead?.companyName || "THE COMPANY LIMITED";
  const rcNumber = data?.letterhead?.rcNumber || "";
  const registeredAddress = data?.letterhead?.registeredAddress || "Federal Republic of Nigeria";
  const companyEmail = data?.letterhead?.email;
  const companyPhone = data?.letterhead?.phone;
  const meetingDate = data?.meetingMetadata?.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const corporateMotto = data?.corporateMotto || "INNOVATING SOLUTIONS. | EMPOWERING BUSINESSES. | BUILDING TOMORROW.";

  // Dynamic Resolution Title & Subtitle matching sample
  const documentTitle = data?.title || "BOARD RESOLUTION";
  const documentSubtitle = data?.subtitle || "AUTHORIZING BANK & PAYMENT SETTLEMENT SERVICES";
  const preambleText = data?.preambleText || 
    `This resolution was duly passed by the Board of Directors of ${companyName} in accordance with the provisions of the Companies and Allied Matters Act (CAMA 2020) and the Company's Articles of Association.`;

  const resolutionLeadIn = data?.resolutionLeadIn || 
    `It is hereby resolved that ${companyName} is authorized to register, integrate, and utilize the financial and payment collection services for the purpose of supporting its business operations.\n\nThe Board hereby approves the Company to:`;

  const numberedClauses = (data?.numberedClauses && data.numberedClauses.length > 0) 
    ? data.numberedClauses 
    : (data?.operativeClauses && data.operativeClauses.length > 0)
    ? data.operativeClauses.map(c => c.text)
    : [
        "Receive electronic payments from customers, clients, partners, and other third parties across all approved payment channels.",
        "Process payments relating to airtime, data subscriptions, utility bills, digital services, and other financial operations.",
        "Operate and manage Virtual Accounts, settlement accounts, and digital financial solutions offered through the payment infrastructure.",
        "Open, manage, and maintain all necessary virtual collection accounts, settlement accounts, and disbursement channels required for operations.",
        "Execute all agreements, documents, integrations, API configurations, and compliance requirements necessary to facilitate operations.",
        "Authorize the designated executive officers or appointed representatives of the Company to act on behalf of the Company in matters relating to the administration of these services."
      ];

  const validityClause = data?.validityClause || "This resolution shall remain valid unless amended or revoked by a subsequent resolution of the Board.";
  const certificationText = data?.certificationText || `This resolution is certified as a true and correct copy of the resolution duly passed by the Board of Directors of ${companyName}.`;

  const signatories = (data?.signatories && data.signatories.length > 0)
    ? data.signatories
    : [{ name: "Managing Director", role: "Chief Executive Officer (CEO)", isSignatory: true }];

  const handleDownloadPDF = async () => {
    if (!docRef.current || isWatermarked) return;
    setDownloading("pdf");
    onDownloadStart?.();
    try {
      const element = docRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pdfHeight;
      }

      const fileName = `${companyName.replace(/[^a-zA-Z0-9]/g, "_")}_Board_Resolution.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF Generation Error:", error);
    } finally {
      setDownloading(null);
      onDownloadEnd?.();
    }
  };

  const handleDownloadPNG = async () => {
    if (!docRef.current || isWatermarked) return;
    setDownloading("png");
    onDownloadStart?.();
    try {
      const element = docRef.current;
      const canvas = await html2canvas(element, {
        scale: 3, // High-DPI 3x resolution for photorealistic crisp snapshot
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `${companyName.replace(/[^a-zA-Z0-9]/g, "_")}_Board_Resolution.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("PNG Generation Error:", error);
    } finally {
      setDownloading(null);
      onDownloadEnd?.();
    }
  };

  const handlePrint = () => {
    if (isWatermarked) return;
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Toolbar */}
      {isWatermarked ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-900 dark:text-amber-200 shadow-sm">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <Lock className="h-4 w-4 text-amber-600 shrink-0" weight="bold" />
            <span>
              <strong>Draft Preview Mode:</strong> Protected for preview. Complete payment to unlock the unwatermarked official certified extract with high-DPI image and PDF export.
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 shrink-0">
            Preview Mode
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-secondary/60 rounded-2xl border border-border">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" weight="fill" />
            <span>Official CAMA 2020 Extract Ready & Certified</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading !== null}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <FilePdf className="h-4 w-4" weight="bold" />
              <span>{downloading === "pdf" ? "Generating PDF..." : "Download PDF"}</span>
            </button>

            <button
              onClick={handleDownloadPNG}
              disabled={downloading !== null}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-secondary hover:bg-secondary/80 text-foreground border border-border font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Download High-DPI PNG Image snapshot"
            >
              <ImageIcon className="h-4 w-4" weight="bold" />
              <span>{downloading === "png" ? "Saving Image..." : "Download PNG Image"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-secondary hover:bg-secondary/80 text-foreground border border-border font-bold text-xs rounded-xl transition-all cursor-pointer"
              title="Print Document"
            >
              <Printer className="h-4 w-4" weight="bold" />
              <span>Print</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE AI THEME SELECTOR BAR                                         */}
      {/* ========================================================================= */}
      <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkle className="h-4 w-4 text-primary" weight="fill" />
          <span className="text-xs font-black uppercase tracking-wider text-foreground">
            Document Archetype:
          </span>
          {data.designNotes && (
            <span className="text-[11px] text-muted-foreground hidden md:inline truncate max-w-xs">
              ({data.designNotes})
            </span>
          )}
        </div>

        {/* Theme Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {THEME_OPTIONS.map((theme) => {
            const Icon = theme.icon;
            const isSelected = activeTheme === theme.id;
            const isAIChosen = (data.theme || "classic-royal") === theme.id;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setActiveTheme(theme.id)}
                className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                    : "bg-secondary/40 hover:bg-secondary text-foreground border-border"
                }`}
                title={theme.description}
              >
                <Icon className="h-3.5 w-3.5" weight={isSelected ? "fill" : "bold"} />
                <span>{theme.name}</span>
                {isAIChosen && (
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ${
                    isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  }`}>
                    AI Recommended
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN DOCUMENT CANVAS (A4 PHOTOREALISTIC RENDERING MATCHING IMAGE SAMPLES) */}
      {/* ========================================================================= */}
      <div className="w-full overflow-x-auto pb-6 flex justify-center custom-scrollbar">
        <div 
          ref={docRef}
          className="relative bg-white text-slate-900 shadow-2xl transition-all duration-300 max-w-[820px] w-full min-h-[1100px] select-text flex flex-col justify-between"
          style={{
            boxShadow: "0 15px 45px -10px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.06)",
            fontFamily: activeTheme === "modern-executive" ? "system-ui, -apple-system, sans-serif" : "'Times New Roman', Times, serif",
          }}
        >
          {/* ANTI-THEFT DRAFT WATERMARK OVERLAY (IF IN PREVIEW MODE) */}
          {isWatermarked && (
            <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden select-none flex flex-col justify-around py-12">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="transform -rotate-25 whitespace-nowrap text-center opacity-15 select-none">
                  <span className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-[0.25em] text-red-600 block">
                    LORABIZ PREVIEW DRAFT • NOT VALID FOR BANK SUBMISSION
                  </span>
                  <span className="text-xs font-bold font-sans uppercase tracking-[0.3em] text-slate-800 block mt-1">
                    PAYMENT REQUIRED TO UNLOCK CERTIFIED COPY • CAMA 2020 EXTRACT
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* INNER PADDING CONTAINER */}
          <div className="p-8 sm:p-12 pb-6 flex-1 space-y-6">

            {/* =================================================================== */}
            {/* CORPORATE LETTERHEAD (MATCHING IMAGE 1 / IMAGE 2 SAMPLES)          */}
            {/* =================================================================== */}
            <div className="border-b-[2.5px] pb-4" style={{ borderColor: effectiveAccentColor }}>
              <div className="flex items-start gap-4 justify-between">
                
                {/* Left: Logo & Full Company Identity */}
                <div className="flex items-start gap-4">
                  {effectiveLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={effectiveLogoUrl} 
                      alt="Company Logo" 
                      crossOrigin="anonymous"
                      className="max-h-16 max-w-[120px] object-contain shrink-0 pt-0.5" 
                    />
                  ) : (
                    <div 
                      className="h-14 w-14 rounded-lg flex items-center justify-center text-white font-sans font-black text-xl shadow-sm shrink-0"
                      style={{ backgroundColor: effectiveAccentColor }}
                    >
                      {companyName.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <h1 
                      className="text-base sm:text-lg font-black tracking-tight uppercase leading-tight"
                      style={{ color: effectiveAccentColor }}
                    >
                      {companyName}
                    </h1>
                    {rcNumber && (
                      <p className="text-xs font-bold text-slate-800 tracking-wide">
                        {rcNumber.toUpperCase().startsWith("RC") ? rcNumber : `RC: ${rcNumber.replace(/^RC:?\s*/i, "")}`}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-700 max-w-md leading-snug">
                      {registeredAddress}
                    </p>
                    {(companyEmail || companyPhone) && (
                      <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-600 font-medium pt-0.5">
                        {companyEmail && <span>Email: {companyEmail}</span>}
                        {companyPhone && <span>Phone: {companyPhone}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Date Box (Modern Executive Theme) */}
                {activeTheme === "modern-executive" && (
                  <div className="text-right shrink-0 hidden sm:block">
                    <div className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-sans text-slate-700">
                      <span className="block font-bold text-slate-900">{rcNumber || "REGISTERED"}</span>
                      <span>Date: {meetingDate}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* =================================================================== */}
            {/* DOCUMENT TITLE & SUBTITLE                                           */}
            {/* =================================================================== */}
            <div className="text-center pt-2 space-y-1">
              <h2 className="text-base sm:text-lg font-black tracking-wider text-slate-950 uppercase">
                {documentTitle}
              </h2>
              <h3 
                className="text-xs sm:text-sm font-bold tracking-wide uppercase"
                style={{ color: effectiveAccentColor }}
              >
                {documentSubtitle}
              </h3>
            </div>

            {/* =================================================================== */}
            {/* STATUTORY PREAMBLE                                                  */}
            {/* =================================================================== */}
            <div className="space-y-2 text-justify text-[12.5px] sm:text-[13px] leading-relaxed text-slate-800">
              <p className="font-bold text-slate-950 uppercase">
                BOARD RESOLUTION OF {companyName} {rcNumber ? `(${rcNumber.toUpperCase().startsWith("RC") ? rcNumber : `RC: ${rcNumber.replace(/^RC:?\s*/i, "")}`})` : ""}
              </p>
              <p>
                {preambleText}
              </p>
            </div>

            {/* =================================================================== */}
            {/* RESOLUTION SECTION HEADER & LEAD-IN                                 */}
            {/* =================================================================== */}
            <div className="space-y-2 text-justify text-[12.5px] sm:text-[13px] leading-relaxed text-slate-800 pt-1">
              <p className="font-black tracking-wider text-slate-950 uppercase text-xs sm:text-sm">
                RESOLUTION
              </p>
              <p className="whitespace-pre-line">
                {resolutionLeadIn}
              </p>

              {/* Numbered Clauses 1. to 6. */}
              <div className="space-y-2.5 pt-1 pl-1">
                {numberedClauses.map((clause, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="font-bold text-slate-950 shrink-0 select-none min-w-[18px]">
                      {idx + 1}.
                    </span>
                    <p className="leading-relaxed">
                      {clause}
                    </p>
                  </div>
                ))}
              </div>

              {/* Validity Clause */}
              <p className="pt-2 font-medium text-slate-900">
                {validityClause}
              </p>
            </div>

            {/* =================================================================== */}
            {/* STRUCTURED SIGNATORY DOCKETS (MATCHING IMAGE 1 SAMPLES)             */}
            {/* =================================================================== */}
            <div className="pt-4 border-t border-slate-300 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {signatories.map((sig, idx) => (
                  <div 
                    key={idx} 
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 font-sans text-xs space-y-1.5 leading-tight"
                  >
                    <div className="grid grid-cols-[85px_1fr] gap-1 items-baseline">
                      <span className="font-bold text-slate-700 tracking-wider text-[11px]">DIRECTOR</span>
                      <span className="font-bold text-slate-950 uppercase">: {sig.name}</span>
                    </div>
                    <div className="grid grid-cols-[85px_1fr] gap-1 items-baseline">
                      <span className="font-bold text-slate-700 tracking-wider text-[11px]">POSITION</span>
                      <span className="font-semibold text-slate-800">: {sig.role}</span>
                    </div>
                    <div className="grid grid-cols-[85px_1fr] gap-1 items-baseline">
                      <span className="font-bold text-slate-700 tracking-wider text-[11px]">COMPANY</span>
                      <span className="text-slate-800 uppercase">: {companyName}</span>
                    </div>
                    <div className="grid grid-cols-[85px_1fr] gap-1 items-baseline">
                      <span className="font-bold text-slate-700 tracking-wider text-[11px]">DATE</span>
                      <span className="text-slate-800">: {meetingDate}</span>
                    </div>
                    <div className="grid grid-cols-[85px_1fr] gap-1 items-center pt-1 border-t border-slate-200">
                      <span className="font-bold text-slate-700 tracking-wider text-[11px]">SIGNATURE</span>
                      <div className="h-10 flex items-center">
                        {sig.signatureUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={sig.signatureUrl} 
                            alt={`${sig.name} Signature`} 
                            crossOrigin="anonymous"
                            className="max-h-9 max-w-[130px] object-contain" 
                          />
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">: ____________________</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Company Seal Stamp Badge (If uploaded) */}
              {effectiveSealUrl && (
                <div className="flex justify-end pt-1">
                  <div className="h-20 w-20 rounded-full border-2 border-slate-300 p-0.5 flex items-center justify-center shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={effectiveSealUrl} 
                      alt="Official Seal" 
                      crossOrigin="anonymous"
                      className="h-full w-full object-contain rounded-full" 
                    />
                  </div>
                </div>
              )}

              {/* Certification Note */}
              <p className="text-[11.5px] italic text-slate-700 text-justify pt-1 leading-relaxed">
                {certificationText}
              </p>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* SOLID CORPORATE FOOTER BAR (MATCHING SAMPLE IMAGE 1)                  */}
          {/* ===================================================================== */}
          <div 
            className="w-full py-2.5 px-6 text-center text-white text-[10.5px] sm:text-[11px] font-sans font-bold uppercase tracking-widest select-none shrink-0"
            style={{ backgroundColor: effectiveAccentColor }}
          >
            {corporateMotto}
          </div>

        </div>
      </div>
    </div>
  );
}
