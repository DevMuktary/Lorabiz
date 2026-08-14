"use client";

import React, { useRef } from "react";
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
  Lock
} from "@phosphor-icons/react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface ResolutionDocProps {
  data: {
    title: string;
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
  };
  accentColor?: string;
  logoUrl?: string;
  sealUrl?: string;
  isWatermarked?: boolean;
  documentRef?: string;
  onDownloadStart?: () => void;
  onDownloadEnd?: () => void;
}

export default function ResolutionDocumentView({
  data,
  accentColor = "#0f172a",
  logoUrl,
  sealUrl: propsSealUrl,
  isWatermarked = false,
  documentRef = "PREVIEW-DRAFT",
  onDownloadStart,
  onDownloadEnd,
}: ResolutionDocProps) {
  const docRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = React.useState<"pdf" | "png" | null>(null);

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
        scale: 2.5,
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
              <strong>Draft Preview Mode:</strong> Watermarked for preview. Confirm and pay ₦3,500 to unlock official certified extract, remove watermarks, and download PDF & PNG.
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 shrink-0">
            Preview Protection Active
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-secondary/60 rounded-2xl border border-border">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" weight="fill" />
            <span>Official CAMA 2020 Extract Ready</span>
          </div>

          <div className="flex items-center gap-2">
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
              title="Download PNG Image for online bank/gateway upload"
            >
              <ImageIcon className="h-4 w-4" weight="bold" />
              <span>{downloading === "png" ? "Saving Image..." : "Download PNG"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-secondary hover:bg-secondary/80 text-foreground border border-border font-bold text-xs rounded-xl transition-all cursor-pointer"
              title="Print Document"
            >
              <Printer className="h-4 w-4" weight="bold" />
              <span>Print</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Document Canvas (Styled as an elegant A4 Paper Sheet) */}
      <div className="w-full overflow-x-auto pb-4 flex justify-center custom-scrollbar">
        <div 
          ref={docRef}
          className="relative bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-200 p-8 sm:p-12 font-serif text-[13px] sm:text-[14px] leading-relaxed max-w-[800px] w-full min-h-[1050px] select-text"
          style={{
            boxShadow: "0 10px 35px -5px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)"
          }}
        >
          {/* Top Decorative Brand Accent Strip */}
          <div 
            className="absolute top-0 left-0 right-0 h-2.5 rounded-t-sm"
            style={{ backgroundColor: accentColor }}
          />

          {/* Heavy Anti-Theft Watermark Overlay (If Preview Mode) */}
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

          {/* ========================================================================= */}
          {/* LETTERHEAD HEADER                                                         */}
          {/* ========================================================================= */}
          <div className="border-b-2 pb-6 mb-6" style={{ borderColor: accentColor }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              {effectiveLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={effectiveLogoUrl} 
                  alt="Company Logo" 
                  className="max-h-16 max-w-[180px] object-contain shrink-0" 
                />
              ) : (
                <div 
                  className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-sans font-black text-xl shadow-md shrink-0"
                  style={{ backgroundColor: accentColor }}
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

          {/* ========================================================================= */}
          {/* DOCUMENT TITLE & METADATA                                                 */}
          {/* ========================================================================= */}
          <div className="text-center my-6 space-y-2">
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-slate-900 underline underline-offset-4 decoration-2" style={{ textDecorationColor: accentColor }}>
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

          {/* ========================================================================= */}
          {/* COMMENCEMENT & RECITALS                                                   */}
          {/* ========================================================================= */}
          <div className="space-y-4 my-6 text-justify text-slate-800">
            <p className="font-semibold italic">
              {data.meetingMetadata?.commencementText}
            </p>

            <div className="space-y-2.5 pl-3 border-l-2 border-slate-200">
              {data.recitals?.map((recital, index) => (
                <p key={index} className="leading-relaxed">
                  {recital}
                </p>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* OPERATIVE RESOLUTIONS (RESOLVED THAT...)                                  */}
          {/* ========================================================================= */}
          <div className="space-y-5 my-6 text-slate-800">
            {data.operativeClauses?.map((clause, idx) => (
              <div key={idx} className="space-y-1.5 text-justify">
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900">
                  {clause.heading}
                </h3>
                <p className="leading-relaxed whitespace-pre-line pl-2">
                  {clause.text}
                </p>
              </div>
            ))}
          </div>

          {/* ========================================================================= */}
          {/* CERTIFICATION TEXT                                                        */}
          {/* ========================================================================= */}
          <div className="my-8 p-4 bg-slate-50 border border-slate-200 rounded text-justify text-slate-700 italic text-xs leading-relaxed">
            <p>
              <strong>CERTIFICATION:</strong> {data.certificationText}
            </p>
          </div>

          {/* ========================================================================= */}
          {/* SIGNATORIES & SEAL SECTION                                                */}
          {/* ========================================================================= */}
          <div className="mt-10 pt-4 space-y-8 font-sans">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1">
              Duly Executed by the Board of Directors:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-2">
              {data.signatories?.map((sig, index) => (
                <div key={index} className="space-y-2">
                  <div className="h-12 border-b-2 border-slate-800 flex items-end pb-1">
                    {sig.signatureUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={sig.signatureUrl} 
                        alt={`${sig.name} Signature`} 
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

            {/* Corporate Seal Box (Only rendered if seal is uploaded) */}
            {effectiveSealUrl && (
              <div className="flex justify-end pt-4">
                <div className="h-24 w-24 rounded-full border-2 border-slate-300 p-1 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={effectiveSealUrl} 
                    alt="Company Stamp" 
                    className="h-full w-full object-contain rounded-full" 
                  />
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* COMPLIANCE & FOOTER AUDIT                                                 */}
          {/* ========================================================================= */}
          <div className="mt-12 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-sans text-slate-500">
            <div>
              <span>Doc Ref: <strong>{documentRef}</strong></span>
              <span className="mx-2">&bull;</span>
              <span>Companies and Allied Matters Act (CAMA 2020)</span>
            </div>
            <div>
              <span>Generated on LoraBiz Legal Tech</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
