"use client";

import React, { useRef, useState } from "react";
import { 
  FilePdf, 
  Image as ImageIcon, 
  Printer, 
  CheckCircle, 
  ShieldCheck,
  Building,
  Calendar,
  MapPin,
  Stamp,
  Lock,
  Sparkle,
  Crown,
  Lightning,
  Scroll,
  Certificate,
  Check
} from "@phosphor-icons/react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ResolutionDesignTheme } from "@/lib/board-resolution-generator";

export interface ResolutionDocProps {
  data: {
    title: string;
    theme?: ResolutionDesignTheme;
    accentColor?: string;
    letterhead: {
      companyName: string;
      rcNumber: string;
      registeredAddress: string;
    };
    meetingMetadata: {
      date: string;
      venue: string;
      commencementText: string;
    };
    recitals: string[];
    operativeClauses: Array<{
      heading: string;
      text: string;
    }>;
    mandateClause: string;
    certificationText: string;
    signatories: Array<{
      name: string;
      role: string;
      isSignatory: boolean;
      signatureUrl?: string;
    }>;
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
    name: "Royal Corporate",
    icon: Crown,
    description: "Ornate heraldic double-line borders with classic serif elegance",
    defaultAccent: "#0f172a"
  },
  {
    id: "modern-executive",
    name: "Modern FinTech",
    icon: Lightning,
    description: "Contemporary geometric letterhead with clean recital cards",
    defaultAccent: "#1e3a8a"
  },
  {
    id: "luxury-crest",
    name: "Luxury Crest",
    icon: Certificate,
    description: "Sovereign certificate with security guilloche corners & gold accents",
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
    THEME_OPTIONS.find(t => t.id === activeTheme)?.defaultAccent || "#0f172a";
  const effectiveLogoUrl = logoUrl || data?.logoUrl;
  const effectiveSealUrl = propsSealUrl || data?.sealUrl;

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

      const fileName = `${(data.letterhead?.companyName || "Company").replace(/[^a-zA-Z0-9]/g, "_")}_Board_Resolution.pdf`;
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
      link.download = `${(data.letterhead?.companyName || "Company").replace(/[^a-zA-Z0-9]/g, "_")}_Board_Resolution.png`;
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
            AI Layout Archetype:
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
                    AI Choice
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN DOCUMENT CANVAS (A4 PHOTOREALISTIC RENDERING)                         */}
      {/* ========================================================================= */}
      <div className="w-full overflow-x-auto pb-6 flex justify-center custom-scrollbar">
        <div 
          ref={docRef}
          className={`relative bg-white text-slate-900 shadow-2xl transition-all duration-300 max-w-[820px] w-full min-h-[1100px] select-text p-8 sm:p-12 leading-relaxed ${
            activeTheme === "classic-royal" ? "font-serif" :
            activeTheme === "modern-executive" ? "font-sans" :
            activeTheme === "luxury-crest" ? "font-serif" :
            "font-serif"
          }`}
          style={{
            boxShadow: "0 15px 45px -10px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.06)",
            fontSize: activeTheme === "modern-executive" ? "13px" : "13.5px"
          }}
        >
          {/* ===================================================================== */}
          {/* THEME BORDERS & ORNATE FRAMING                                        */}
          {/* ===================================================================== */}
          
          {/* Theme 1: Classic Royal (Double gold/navy frame with ornate corner flourishes) */}
          {activeTheme === "classic-royal" && (
            <>
              <div 
                className="absolute inset-3 border-2 pointer-events-none rounded-none"
                style={{ borderColor: effectiveAccentColor }}
              />
              <div 
                className="absolute inset-4 border pointer-events-none opacity-40"
                style={{ borderColor: effectiveAccentColor }}
              />
              {/* Corner flourishes */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: effectiveAccentColor }} />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: effectiveAccentColor }} />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: effectiveAccentColor }} />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: effectiveAccentColor }} />
            </>
          )}

          {/* Theme 2: Modern Executive (Clean top accent bar + geometric side accent) */}
          {activeTheme === "modern-executive" && (
            <>
              <div 
                className="absolute top-0 left-0 right-0 h-2.5"
                style={{ backgroundColor: effectiveAccentColor }}
              />
              <div 
                className="absolute bottom-0 left-0 right-0 h-1.5 opacity-60"
                style={{ backgroundColor: effectiveAccentColor }}
              />
              <div 
                className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-5"
                style={{
                  background: `radial-gradient(circle at top right, ${effectiveAccentColor}, transparent)`
                }}
              />
            </>
          )}

          {/* Theme 3: Luxury Crest (Certificate guilloche patterned security frame) */}
          {activeTheme === "luxury-crest" && (
            <>
              <div 
                className="absolute inset-2 border-[3px] border-double pointer-events-none"
                style={{ borderColor: effectiveAccentColor }}
              />
              <div 
                className="absolute inset-4 border border-dashed pointer-events-none opacity-50"
                style={{ borderColor: effectiveAccentColor }}
              />
              {/* Ornate crest corner diamonds */}
              <div className="absolute top-3 left-3 text-[10px] select-none opacity-80" style={{ color: effectiveAccentColor }}>❖</div>
              <div className="absolute top-3 right-3 text-[10px] select-none opacity-80" style={{ color: effectiveAccentColor }}>❖</div>
              <div className="absolute bottom-3 left-3 text-[10px] select-none opacity-80" style={{ color: effectiveAccentColor }}>❖</div>
              <div className="absolute bottom-3 right-3 text-[10px] select-none opacity-80" style={{ color: effectiveAccentColor }}>❖</div>
            </>
          )}

          {/* Theme 4: Official Gazette (Traditional Federal Gazette double black/slate rules) */}
          {activeTheme === "gazette-formal" && (
            <>
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-900" />
              <div className="absolute top-2 left-0 right-0 h-[1px] bg-slate-400" />
            </>
          )}

          {/* ===================================================================== */}
          {/* ANTI-THEFT DRAFT WATERMARK OVERLAY (IF IN PREVIEW MODE)               */}
          {/* ===================================================================== */}
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

          {/* ===================================================================== */}
          {/* LETTERHEAD HEADER                                                     */}
          {/* ===================================================================== */}
          {activeTheme === "classic-royal" && (
            <div className="border-b-2 pb-6 mb-6" style={{ borderColor: effectiveAccentColor }}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                {effectiveLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={effectiveLogoUrl} 
                    alt="Company Logo" 
                    crossOrigin="anonymous"
                    className="max-h-16 max-w-[180px] object-contain shrink-0" 
                  />
                ) : (
                  <div 
                    className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-sans font-black text-xl shadow-md shrink-0"
                    style={{ backgroundColor: effectiveAccentColor }}
                  >
                    {(data.letterhead?.companyName || "AB").substring(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 text-center sm:text-right font-sans">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 uppercase">
                    {data.letterhead?.companyName}
                  </h1>
                  {data.letterhead?.rcNumber && (
                    <p className="text-xs font-bold text-slate-700 tracking-wider mt-0.5">
                      {data.letterhead.rcNumber}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-600 max-w-sm ml-auto mt-1 leading-tight">
                    {data.letterhead?.registeredAddress}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTheme === "modern-executive" && (
            <div className="mb-6 pb-5 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {effectiveLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={effectiveLogoUrl} 
                      alt="Company Logo" 
                      crossOrigin="anonymous"
                      className="max-h-14 max-w-[160px] object-contain shrink-0 rounded" 
                    />
                  ) : (
                    <div 
                      className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-sans font-black text-lg shadow-sm shrink-0"
                      style={{ backgroundColor: effectiveAccentColor }}
                    >
                      {(data.letterhead?.companyName || "AB").substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                      {data.letterhead?.companyName}
                    </h1>
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                      {data.letterhead?.rcNumber && <span>{data.letterhead.rcNumber}</span>}
                      <span>&bull;</span>
                      <span>Federal Republic of Nigeria</span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500 font-medium sm:max-w-xs">
                  <p>{data.letterhead?.registeredAddress}</p>
                </div>
              </div>
            </div>
          )}

          {activeTheme === "luxury-crest" && (
            <div className="text-center pb-6 mb-6 border-b border-slate-300">
              {effectiveLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={effectiveLogoUrl} 
                  alt="Company Logo" 
                  crossOrigin="anonymous"
                  className="max-h-16 max-w-[180px] object-contain mx-auto mb-2" 
                />
              ) : (
                <div 
                  className="h-14 w-14 rounded-full flex items-center justify-center text-white font-sans font-black text-lg shadow-md mx-auto mb-2 border-2 border-amber-300/60"
                  style={{ backgroundColor: effectiveAccentColor }}
                >
                  {(data.letterhead?.companyName || "AB").substring(0, 2).toUpperCase()}
                </div>
              )}
              <h1 className="text-lg sm:text-xl font-bold tracking-widest text-slate-900 uppercase">
                {data.letterhead?.companyName}
              </h1>
              {data.letterhead?.rcNumber && (
                <p className="text-xs font-bold text-slate-700 tracking-wider mt-0.5">
                  {data.letterhead.rcNumber}
                </p>
              )}
              <p className="text-[11px] text-slate-600 max-w-md mx-auto mt-1">
                {data.letterhead?.registeredAddress}
              </p>
            </div>
          )}

          {activeTheme === "gazette-formal" && (
            <div className="text-center pb-6 mb-6 border-b-2 border-slate-900">
              <div className="inline-block px-3 py-0.5 text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white rounded mb-2">
                OFFICIAL EXTRACT &bull; CAMA 2020
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-wide text-slate-900 uppercase font-sans">
                {data.letterhead?.companyName}
              </h1>
              <p className="text-xs font-bold text-slate-700 tracking-wider mt-0.5 font-sans">
                {data.letterhead?.rcNumber || "REGISTERED ENTITY"} &bull; {data.letterhead?.registeredAddress}
              </p>
            </div>
          )}

          {/* ===================================================================== */}
          {/* DOCUMENT TITLE & METADATA                                             */}
          {/* ===================================================================== */}
          <div className="text-center my-6 space-y-2">
            <h2 
              className={`font-bold uppercase tracking-wider text-slate-900 ${
                activeTheme === "modern-executive" 
                  ? "text-sm sm:text-base font-sans" 
                  : "text-base sm:text-lg underline underline-offset-4 decoration-2"
              }`}
              style={{ textDecorationColor: effectiveAccentColor }}
            >
              {data.title}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-sans text-slate-600 pt-1">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Calendar className="h-3.5 w-3.5" /> Date: {data.meetingMetadata?.date}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold">
                <MapPin className="h-3.5 w-3.5" /> Venue: {data.meetingMetadata?.venue}
              </span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* COMMENCEMENT & RECITALS                                               */}
          {/* ===================================================================== */}
          <div className="space-y-4 my-6 text-justify text-slate-800">
            <p className="font-semibold italic">
              {data.meetingMetadata?.commencementText}
            </p>

            <div className={`space-y-2.5 ${
              activeTheme === "modern-executive" 
                ? "bg-slate-50 p-4 rounded-xl border border-slate-200" 
                : "pl-3 border-l-2 border-slate-200"
            }`}>
              {data.recitals?.map((recital, index) => (
                <p key={index} className="leading-relaxed">
                  {recital}
                </p>
              ))}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* OPERATIVE RESOLUTIONS (RESOLVED THAT...)                              */}
          {/* ===================================================================== */}
          <div className="space-y-5 my-6 text-slate-800">
            {data.operativeClauses?.map((clause, idx) => (
              <div key={idx} className="space-y-1.5 text-justify">
                <h3 
                  className={`font-sans font-bold text-xs uppercase tracking-wider ${
                    activeTheme === "modern-executive" ? "text-primary flex items-center gap-1.5" : "text-slate-900"
                  }`}
                  style={activeTheme === "modern-executive" ? { color: effectiveAccentColor } : {}}
                >
                  {activeTheme === "modern-executive" && <span className="h-1.5 w-1.5 rounded-full bg-current inline-block" />}
                  {clause.heading}
                </h3>
                <p className="leading-relaxed whitespace-pre-line pl-2">
                  {clause.text}
                </p>
              </div>
            ))}
          </div>

          {/* ===================================================================== */}
          {/* CERTIFICATION TEXT                                                    */}
          {/* ===================================================================== */}
          <div className={`my-8 p-4 rounded text-justify text-slate-700 italic text-xs leading-relaxed ${
            activeTheme === "luxury-crest" 
              ? "bg-amber-500/5 border border-amber-500/20" 
              : "bg-slate-50 border border-slate-200"
          }`}>
            <p>
              <strong>CERTIFICATION:</strong> {data.certificationText}
            </p>
          </div>

          {/* ===================================================================== */}
          {/* SIGNATORIES & SEAL SECTION                                            */}
          {/* ===================================================================== */}
          <div className="mt-10 pt-4 space-y-8 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-800">
                Duly Executed by the Board of Directors:
              </p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                <ShieldCheck className="h-3.5 w-3.5" weight="fill" />
                <span>Verified CAMA Attestation</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-2">
              {data.signatories?.map((sig, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-12 border-b-2 border-slate-800 flex items-end pb-1">
                    {sig.signatureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={sig.signatureUrl} 
                        alt={`${sig.name} Signature`} 
                        crossOrigin="anonymous"
                        className="max-h-11 max-w-[150px] object-contain" 
                      />
                    ) : (
                      <div className="w-full" />
                    )}
                  </div>
                  <div className="text-xs leading-tight">
                    <p className="font-bold text-slate-900 uppercase">{sig.name}</p>
                    <p className="text-slate-600 font-semibold">{sig.role}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Status: {sig.isSignatory ? "Authorized Signatory" : "Director"} &bull; Date: {data.meetingMetadata?.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Corporate Seal Box */}
            <div className="flex justify-end pt-4">
              {effectiveSealUrl ? (
                <div className="h-24 w-24 rounded-full border-2 border-slate-300 p-1 flex items-center justify-center shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={effectiveSealUrl} 
                    alt="Company Stamp" 
                    crossOrigin="anonymous"
                    className="h-full w-full object-contain rounded-full" 
                  />
                </div>
              ) : (
                <div 
                  className="h-20 w-20 rounded-full border-2 border-dashed flex flex-col items-center justify-center text-center p-1 opacity-70 select-none"
                  style={{ borderColor: effectiveAccentColor, color: effectiveAccentColor }}
                >
                  <Stamp className="h-4 w-4" weight="bold" />
                  <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">
                    Official Seal
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* COMPLIANCE & FOOTER AUDIT                                             */}
          {/* ===================================================================== */}
          <div className="mt-12 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-sans text-slate-500">
            <div>
              <span>Doc Ref: <strong>{documentRef}</strong></span>
              <span className="mx-2">&bull;</span>
              <span>Companies and Allied Matters Act (CAMA 2020)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Theme: <strong>{THEME_OPTIONS.find(t => t.id === activeTheme)?.name}</strong></span>
              <span>&bull;</span>
              <span>LoraBiz Legal Tech</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
