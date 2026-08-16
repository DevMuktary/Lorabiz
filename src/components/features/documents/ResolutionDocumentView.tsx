"use client";

import React, { useRef, useState, useEffect } from "react";
import { 
  FilePdf, 
  Image as ImageIcon, 
  Printer, 
  ShieldCheck,
  Lock,
  Sparkle,
  Crown,
  Lightning,
  Scroll,
  Certificate,
  Buildings,
  Bank,
  Gavel,
  Globe,
  Medal,
  TerminalWindow,
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
  hideToolbar?: boolean;
  hideThemeSelector?: boolean;
  hideWatermarkNotice?: boolean;
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
    id: "gazette-formal",
    name: "Official Gazette",
    icon: Scroll,
    description: "Statutory CAMA 2020 legal gazette extract layout with double border",
    defaultAccent: "#334155"
  },
  {
    id: "certified-crest",
    name: "Certified Crest",
    icon: Certificate,
    description: "Heraldic security border with golden accents and formal notary docket",
    defaultAccent: "#78350f"
  },
  {
    id: "minimalist-tech",
    name: "Minimalist Tech",
    icon: TerminalWindow,
    description: "Ultra-sleek typography with monospace tags and clean hairline dividers",
    defaultAccent: "#0284c7"
  },
  {
    id: "continental-banking",
    name: "Continental Banking",
    icon: Bank,
    description: "Tier-1 Nigerian commercial banking format with structured KYC mandate docket",
    defaultAccent: "#0f766e"
  },
  {
    id: "maritime-energy",
    name: "Maritime & Energy",
    icon: Buildings,
    description: "Heavy corporate industrial header with boxed clause framing and mandate grid",
    defaultAccent: "#1e293b"
  },
  {
    id: "chancery-legal",
    name: "Chancery Legalist",
    icon: Gavel,
    description: "Classical barrister parchment aesthetic with formal recitals and execution testatum",
    defaultAccent: "#581c87"
  },
  {
    id: "apex-enterprise",
    name: "Apex Enterprise",
    icon: Globe,
    description: "Fortune-500 style multilateral corporate band header and executive badges",
    defaultAccent: "#09090b"
  },
  {
    id: "heritage-corporate",
    name: "Heritage Corporate",
    icon: Medal,
    description: "Dignified legacy corporate layout with deep burgundy accents and ornate corner geometry",
    defaultAccent: "#831843"
  }
];

export default function ResolutionDocumentView({
  data,
  accentColor: propsAccentColor,
  logoUrl,
  sealUrl: propsSealUrl,
  isWatermarked = false,
  documentRef = "PREVIEW-DRAFT",
  hideToolbar = false,
  hideThemeSelector = false,
  hideWatermarkNotice = false,
  onDownloadStart,
  onDownloadEnd,
}: ResolutionDocProps) {
  const docRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState<"pdf" | "png" | null>(null);

  // Normalize active theme (mapping legacy luxury-crest to certified-crest)
  const initialTheme = (data?.theme === "luxury-crest" ? "certified-crest" : data?.theme) || "classic-royal";
  const [activeTheme, setActiveTheme] = useState<ResolutionDesignTheme>(initialTheme);

  // Keep activeTheme in sync when parent passes new data/theme (e.g. carousel switcher)
  useEffect(() => {
    if (data?.theme) {
      const nextTheme = (data.theme === "luxury-crest" ? "certified-crest" : data.theme) as ResolutionDesignTheme;
      setActiveTheme(nextTheme);
    }
  }, [data?.theme]);

  const effectiveAccentColor = propsAccentColor || data?.accentColor || 
    THEME_OPTIONS.find(t => t.id === activeTheme)?.defaultAccent || "#1e3a8a";
  const effectiveLogoUrl = logoUrl || data?.logoUrl;
  const effectiveSealUrl = propsSealUrl || data?.sealUrl;

  const companyName = data?.letterhead?.companyName || "THE COMPANY LIMITED";
  const rcNumber = data?.letterhead?.rcNumber || "";
  const registeredAddress = data?.letterhead?.registeredAddress || "Lagos State, Nigeria";
  const companyEmail = data?.letterhead?.email;
  const companyPhone = data?.letterhead?.phone;
  const meetingDate = data?.meetingMetadata?.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const corporateMotto = data?.corporateMotto || "";

  // Dynamic Resolution Title & Subtitle
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
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      
      const safeName = (companyName || "Board_Resolution").replace(/[^a-zA-Z0-9_-]/g, "_");
      pdf.save(`${safeName}_Board_Resolution.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to export PDF. Please try again.");
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
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const safeName = (companyName || "Board_Resolution").replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `${safeName}_Board_Resolution.png`;
      link.href = imgData;
      link.click();
    } catch (err) {
      console.error("PNG export failed:", err);
      alert("Failed to export PNG. Please try again.");
    } finally {
      setDownloading(null);
      onDownloadEnd?.();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Font family helper based on archetype
  const getFontFamily = () => {
    switch (activeTheme) {
      case "modern-executive":
      case "minimalist-tech":
      case "continental-banking":
      case "apex-enterprise":
        return "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      case "chancery-legal":
      case "heritage-corporate":
      case "certified-crest":
      case "luxury-crest":
      case "gazette-formal":
      case "classic-royal":
      default:
        return "'Times New Roman', Times, Georgia, serif";
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Toolbar */}
      {!hideToolbar && (
        <>
          {isWatermarked ? (
            !hideWatermarkNotice && (
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
            )
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
        </>
      )}

      {/* ========================================================================= */}
      {/* 10-ARCHETYPE SELECTOR TOOLBAR                                             */}
      {/* ========================================================================= */}
      {!hideThemeSelector && (
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkle className="h-4 w-4 text-primary" weight="fill" />
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                Select Document Archetype (10 Templates Available):
              </span>
            </div>
            <span className="text-[11px] font-bold text-muted-foreground">
              Active: <span className="text-foreground font-black">{THEME_OPTIONS.find(t => t.id === activeTheme)?.name || "Corporate Standard"}</span>
            </span>
          </div>

          {/* 10 Theme Pills Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {THEME_OPTIONS.map((theme) => {
              const Icon = theme.icon;
              const isSelected = activeTheme === theme.id;
              // Never show AI match on gazette-formal as per guidelines
              const isAIChosen = theme.id !== "gazette-formal" && (data?.theme === "luxury-crest" ? "certified-crest" : data?.theme || "classic-royal") === theme.id;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setActiveTheme(theme.id)}
                  className={`relative flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02] ring-2 ring-primary/20"
                      : "bg-secondary/40 hover:bg-secondary text-foreground border-border"
                  }`}
                  title={theme.description}
                >
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-white/20 text-white" : "bg-card border border-border text-primary"
                  }`}>
                    <Icon className="h-4 w-4" weight={isSelected ? "fill" : "bold"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-bold">{theme.name}</span>
                    {isAIChosen && (
                      <span className={`text-[9px] font-black uppercase tracking-wider block ${
                        isSelected ? "text-white/80" : "text-primary"
                      }`}>
                        AI Match
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN DOCUMENT CANVAS (A4 PHOTOREALISTIC RENDERING)                         */}
      {/* ========================================================================= */}
      <div className="w-full overflow-x-auto pb-6 flex justify-center custom-scrollbar">
        <div 
          ref={docRef}
          className={`relative text-slate-900 shadow-2xl transition-all duration-300 max-w-[820px] w-full min-h-[1100px] select-text flex flex-col justify-between ${
            activeTheme === "chancery-legal" ? "bg-[#faf8f3]" : "bg-white"
          }`}
          style={{
            boxShadow: "0 15px 45px -10px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.06)",
            fontFamily: getFontFamily(),
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

          {/* INNER PADDING CONTAINER WITH BESPOKE ARCHETYPE FRAMING */}
          <div className={`p-8 sm:p-12 pb-6 flex-1 space-y-6 ${
            activeTheme === "gazette-formal" ? "border-[3px] border-double border-slate-800 m-3" :
            activeTheme === "certified-crest" || activeTheme === "luxury-crest" ? "border-2 border-amber-800/40 m-2 outline outline-1 outline-amber-800/20 outline-offset-4" :
            activeTheme === "heritage-corporate" ? "border border-rose-950/30 m-2" : 
            activeTheme === "maritime-energy" ? "border-l-[6px] border-slate-900 pl-6 sm:pl-10" : ""
          }`}>

            {/* =================================================================== */}
            {/* ARCHETYPE 1: MODERN EXECUTIVE / QUADROX BOX STYLE                   */}
            {/* =================================================================== */}
            {activeTheme === "modern-executive" && (
              <div className="border-b-[3px] pb-4" style={{ borderColor: effectiveAccentColor }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {effectiveLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={effectiveLogoUrl} alt="Logo" crossOrigin="anonymous" className="max-h-16 max-w-[120px] object-contain shrink-0 pt-0.5" />
                    ) : (
                      <div className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-sans font-black text-xl shadow-sm shrink-0" style={{ backgroundColor: effectiveAccentColor }}>
                        {companyName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <h1 className="text-lg sm:text-xl font-black tracking-tight uppercase leading-tight font-sans" style={{ color: effectiveAccentColor }}>
                        {companyName}
                      </h1>
                      <p className="text-[11.5px] text-slate-700 max-w-md leading-snug font-sans">{registeredAddress}</p>
                      {(companyEmail || companyPhone) && (
                        <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-600 font-sans pt-0.5">
                          {companyEmail && <span>Email: {companyEmail}</span>}
                          {companyPhone && <span>Phone: {companyPhone}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-[11px] font-sans text-slate-800 space-y-0.5 shadow-sm">
                      <span className="block font-black text-slate-950 uppercase">{rcNumber || "RC: REGISTERED"}</span>
                      <span className="block text-slate-600">Date: {meetingDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* ARCHETYPE 2: MINIMALIST TECH (SILICON BORDERLESS)                    */}
            {/* =================================================================== */}
            {activeTheme === "minimalist-tech" && (
              <div className="border-b border-slate-300 pb-4 font-sans">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                  <span>{rcNumber ? `[ID: ${rcNumber.toUpperCase()}]` : "[STATUS: CERTIFIED]"}</span>
                  <span>[DATE: {meetingDate}]</span>
                  <span>[JURISDICTION: NIGERIA / CAMA 2020]</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {effectiveLogoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={effectiveLogoUrl} alt="Logo" crossOrigin="anonymous" className="max-h-12 max-w-[100px] object-contain shrink-0" />
                    )}
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-slate-950">
                        {companyName}
                      </h1>
                      <p className="text-xs text-slate-600 mt-0.5">{registeredAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* ARCHETYPE 3: CONTINENTAL BANKING (TIER-1 COMPLIANCE)                */}
            {/* =================================================================== */}
            {activeTheme === "continental-banking" && (
              <div className="border-b-2 pb-4 font-sans" style={{ borderColor: effectiveAccentColor }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {effectiveLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={effectiveLogoUrl} alt="Logo" crossOrigin="anonymous" className="max-h-14 max-w-[110px] object-contain shrink-0 pt-0.5" />
                    ) : (
                      <div className="h-14 w-14 rounded-lg flex items-center justify-center text-white font-sans font-black text-xl shadow-sm shrink-0" style={{ backgroundColor: effectiveAccentColor }}>
                        {companyName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-950">
                        {companyName}
                      </h1>
                      {rcNumber && <p className="text-xs font-bold text-slate-700">{rcNumber.toUpperCase().startsWith("RC") ? rcNumber : `RC: ${rcNumber}`}</p>}
                      <p className="text-[11.5px] text-slate-600 max-w-md">{registeredAddress}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs space-y-1 shrink-0">
                    <p className="font-bold text-slate-900">DATE: {meetingDate}</p>
                    {companyEmail && <p className="text-[11px] text-slate-600">{companyEmail}</p>}
                    {companyPhone && <p className="text-[11px] text-slate-600">{companyPhone}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* ARCHETYPE 4: OFFICIAL GAZETTE                                       */}
            {/* =================================================================== */}
            {activeTheme === "gazette-formal" && (
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                {effectiveLogoUrl && (
                  <div className="flex justify-center pb-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={effectiveLogoUrl} alt="Logo" crossOrigin="anonymous" className="max-h-12 max-w-[110px] object-contain" />
                  </div>
                )}
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">
                  {companyName}
                </h1>
                <p className="text-xs font-bold text-slate-800">{rcNumber ? (rcNumber.toUpperCase().startsWith("RC") ? rcNumber : `RC: ${rcNumber}`) : "REGISTERED IN ACCORDANCE WITH CAMA"}</p>
                <p className="text-[11px] text-slate-600 italic">{registeredAddress}</p>
                <p className="text-[10.5px] text-slate-500 font-bold uppercase pt-0.5">DATE: {meetingDate}</p>
              </div>
            )}

            {/* =================================================================== */}
            {/* ARCHETYPE 5: APEX ENTERPRISE (MULTILATERAL)                         */}
            {/* =================================================================== */}
            {activeTheme === "apex-enterprise" && (
              <div className="pb-4 font-sans">
                <div className="p-4 rounded-xl bg-slate-950 text-white flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {effectiveLogoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={effectiveLogoUrl} alt="Logo" crossOrigin="anonymous" className="max-h-12 max-w-[100px] object-contain shrink-0 rounded bg-white/10 p-1" />
                    )}
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">CORPORATE GOVERNANCE RESOLUTION</span>
                      <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">{companyName}</h1>
                      <p className="text-[11px] text-slate-300 truncate max-w-sm">{registeredAddress}</p>
                    </div>
                  </div>
                  <div className="text-right text-[11px] space-y-0.5 shrink-0">
                    <span className="block font-bold text-amber-400">{rcNumber || "RC: REGISTERED"}</span>
                    <span className="block text-slate-300">{meetingDate}</span>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* ARCHETYPE 6: CHANCERY LEGALIST (WARM PARCHMENT / BARRISTER)        */}
            {/* =================================================================== */}
            {activeTheme === "chancery-legal" && (
              <div className="border-b-[2.5px] border-double border-purple-900/60 pb-4">
                <div className="flex items-start gap-4 justify-between">
                  <div className="flex items-start gap-4">
                    {effectiveLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={effectiveLogoUrl} alt="Logo" crossOrigin="anonymous" className="max-h-16 max-w-[120px] object-contain shrink-0 pt-0.5" />
                    ) : (
                      <div className="h-14 w-14 rounded-lg flex items-center justify-center text-white font-sans font-black text-xl shadow-sm shrink-0" style={{ backgroundColor: effectiveAccentColor }}>
                        {companyName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <p className="text-[10.5px] uppercase tracking-widest text-purple-950 font-bold">Chancery Legal Chambers Extract</p>
                      <h1 className="text-base sm:text-lg font-black tracking-tight uppercase leading-tight" style={{ color: effectiveAccentColor }}>
                        {companyName}
                      </h1>
                      {rcNumber && (
                        <p className="text-xs font-bold text-slate-800 tracking-wide">
                          {rcNumber.toUpperCase().startsWith("RC") ? rcNumber : `RC: ${rcNumber.replace(/^RC:?\s*/i, "")}`}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-700 max-w-md leading-snug">{registeredAddress}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-700 shrink-0">
                    <p className="font-bold">Date: {meetingDate}</p>
                    {companyEmail && <p className="text-[11px] text-slate-600">{companyEmail}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* ARCHETYPE 7: MARITIME & ENERGY (INDUSTRIAL SLATE BOXED)            */}
            {/* =================================================================== */}
            {activeTheme === "maritime-energy" && (
              <div className="border-b-[3px] border-slate-900 pb-4 font-sans">
                <div className="flex items-start gap-4 justify-between">
                  <div className="flex items-start gap-4">
                    {effectiveLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={effectiveLogoUrl} alt="Logo" crossOrigin="anonymous" className="max-h-16 max-w-[120px] object-contain shrink-0 pt-0.5" />
                    ) : (
                      <div className="h-14 w-14 rounded-lg flex items-center justify-center text-white font-sans font-black text-xl shadow-sm shrink-0 bg-slate-900">
                        {companyName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <div className="inline-block px-2 py-0.5 bg-slate-900 text-white text-[9.5px] font-black uppercase tracking-wider rounded mb-1">
                        Maritime & Energy Corporate Extract
                      </div>
                      <h1 className="text-lg sm:text-xl font-black tracking-tight uppercase leading-tight text-slate-950">
                        {companyName}
                      </h1>
                      {rcNumber && (
                        <p className="text-xs font-bold text-slate-800">
                          {rcNumber.toUpperCase().startsWith("RC") ? rcNumber : `RC: ${rcNumber.replace(/^RC:?\s*/i, "")}`}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-700 max-w-md leading-snug">{registeredAddress}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-900 shrink-0">
                    <p className="font-black">DATE: {meetingDate}</p>
                    {companyEmail && <p className="text-[11px] text-slate-600">{companyEmail}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* DEFAULT ARCHETYPES (CLASSIC ROYAL, CREST, HERITAGE)                */}
            {/* =================================================================== */}
            {!["modern-executive", "minimalist-tech", "continental-banking", "gazette-formal", "apex-enterprise", "chancery-legal", "maritime-energy"].includes(activeTheme) && (
              <div className="border-b-[2.5px] pb-4" style={{ borderColor: effectiveAccentColor }}>
                <div className="flex items-start gap-4 justify-between">
                  <div className="flex items-start gap-4">
                    {effectiveLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={effectiveLogoUrl} alt="Logo" crossOrigin="anonymous" className="max-h-16 max-w-[120px] object-contain shrink-0 pt-0.5" />
                    ) : (
                      <div className="h-14 w-14 rounded-lg flex items-center justify-center text-white font-sans font-black text-xl shadow-sm shrink-0" style={{ backgroundColor: effectiveAccentColor }}>
                        {companyName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <h1 className="text-base sm:text-lg font-black tracking-tight uppercase leading-tight" style={{ color: effectiveAccentColor }}>
                        {companyName}
                      </h1>
                      {rcNumber && (
                        <p className="text-xs font-bold text-slate-800 tracking-wide">
                          {rcNumber.toUpperCase().startsWith("RC") ? rcNumber : `RC: ${rcNumber.replace(/^RC:?\s*/i, "")}`}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-700 max-w-md leading-snug">{registeredAddress}</p>
                      {(companyEmail || companyPhone) && (
                        <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-slate-600 font-medium pt-0.5">
                          {companyEmail && <span>Email: {companyEmail}</span>}
                          {companyPhone && <span>Phone: {companyPhone}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-700 shrink-0 hidden sm:block">
                    <p className="font-bold">Date: {meetingDate}</p>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* DOCUMENT TITLE & SUBTITLE                                           */}
            {/* =================================================================== */}
            <div className="text-center pt-2 space-y-1">
              <h2 className="text-lg sm:text-xl font-black tracking-wider uppercase underline underline-offset-4 decoration-slate-400" style={{ color: effectiveAccentColor }}>
                {documentTitle}
              </h2>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-800">
                {documentSubtitle}
              </p>
            </div>

            {/* =================================================================== */}
            {/* PREAMBLE & COMMENCEMENT                                             */}
            {/* =================================================================== */}
            <div className="text-[12px] sm:text-[12.5px] text-slate-800 leading-relaxed text-justify space-y-3">
              <p>{preambleText}</p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11.5px] italic text-slate-700">
                {data?.meetingMetadata?.commencementText || `At a meeting of the Board of Directors of ${companyName} duly convened and held on ${meetingDate}, the following resolutions were unanimously passed:`}
              </div>
              <p className="whitespace-pre-line font-medium text-slate-900 pt-1">
                {resolutionLeadIn}
              </p>
            </div>

            {/* =================================================================== */}
            {/* NUMBERED RESOLUTION CLAUSES (1 THROUGH 6)                           */}
            {/* =================================================================== */}
            <div className="space-y-2.5 pt-1">
              {numberedClauses.map((clause, idx) => (
                <div key={idx} className={`flex items-start gap-3 text-[12px] sm:text-[12.5px] text-slate-900 leading-relaxed text-justify ${
                  activeTheme === "maritime-energy" ? "p-2.5 bg-slate-50 border border-slate-200 rounded-lg" : ""
                }`}>
                  <span 
                    className="h-5 w-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-sans"
                    style={{ backgroundColor: effectiveAccentColor }}
                  >
                    {idx + 1}
                  </span>
                  <p className="flex-1">
                    {clause}
                  </p>
                </div>
              ))}
            </div>

            {/* =================================================================== */}
            {/* VALIDITY STATEMENT                                                  */}
            {/* =================================================================== */}
            <div className="text-[12px] sm:text-[12.5px] text-slate-800 leading-relaxed text-justify pt-1">
              <p className="font-medium text-slate-900">
                {validityClause}
              </p>
            </div>

            {/* =================================================================== */}
            {/* STRUCTURED SIGNATORY DOCKETS                                        */}
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

              {/* Company Seal Stamp Badge (ONLY IF UPLOADED BY USER) */}
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
          {/* USER-DRIVEN MOTTO FOOTER BAR (ONLY IF MOTTO IS PROVIDED BY USER)      */}
          {/* ===================================================================== */}
          {corporateMotto && corporateMotto.trim().length > 0 && (
            <div 
              className="w-full py-2.5 px-6 text-center text-white text-[10.5px] sm:text-[11px] font-sans font-bold uppercase tracking-widest select-none shrink-0"
              style={{ backgroundColor: effectiveAccentColor }}
            >
              {corporateMotto}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
