"use client";

import { useState, useEffect } from "react";
import { 
  ClockCounterClockwise, FilePdf, DownloadSimple, SpinnerGap, CheckCircle, 
  Eye, User, Phone, MapPin, Calendar, IdentificationBadge, X, Trash
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { parseDemographics } from "@/lib/demographics-parser";

export interface SlipHistoryItem {
  id: string;
  ninMasked: string;
  rawSlipType?: string;
  slipType: string;
  searchType?: string;
  amountCharged?: number;
  reference?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  gender?: string;
  dob?: string;
  phone?: string;
  address?: string;
  userData?: any;
  providerUsed?: string;
  createdAt: string;
  createdAtFull?: string;
  pdfBase64?: string;
  pdfUrl?: string;
}

interface NinHistorySectionProps {
  history: SlipHistoryItem[];
  title?: string;
  isLoading?: boolean;
}

export default function NinHistorySection({ history, title = "24-Hour Print History", isLoading = false }: NinHistorySectionProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<SlipHistoryItem | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // Silent Blob Downloader
  const handleDirectDownload = async (item: SlipHistoryItem) => {
    try {
      setDownloadingId(item.id);
      setDownloadToast(`Download started for ${item.fullName || item.ninMasked}! Check your downloads.`);
      setTimeout(() => setDownloadToast(null), 5000);

      const fileName = `NIMC_${item.slipType.replace(/\s+/g, "_")}_${item.ninMasked.replace(/\*/g, "X")}.pdf`;

      let blob: Blob;

      if (item.pdfBase64) {
        const cleanBase64 = item.pdfBase64.replace(/^data:application\/pdf;base64,/, "");
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: "application/pdf" });
      } else if (item.pdfUrl) {
        if (item.pdfUrl.startsWith("data:")) {
          const parts = item.pdfUrl.split(",");
          const cleanBase64 = parts[1] || parts[0];
          const byteCharacters = atob(cleanBase64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: "application/pdf" });
        } else {
          const response = await fetch(item.pdfUrl);
          if (!response.ok) throw new Error("Network response was not ok");
          blob = await response.blob();
        }
      } else {
        throw new Error("No file source available");
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.style.display = "none";
      downloadLink.href = blobUrl;
      downloadLink.download = fileName;
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(downloadLink);

      setDownloadingId(null);
      setSuccessId(item.id);
      setTimeout(() => setSuccessId(null), 3000);

    } catch (error) {
      console.error("Download failed:", error);
      alert("Could not download slip. Please check your connection and try again.");
      setDownloadingId(null);
    }
  };

  return (
    <div className="pt-8 border-t border-border space-y-4">
      {/* DOWNLOAD STARTED BANNER */}
      {downloadToast && (
        <div className="bg-emerald-500 text-white text-xs font-black py-2.5 px-4 rounded-2xl shadow-lg flex items-center justify-between gap-2 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} weight="bold" />
            <span>{downloadToast}</span>
          </div>
          <button onClick={() => setDownloadToast(null)} className="text-white/80 hover:text-white">
            <X size={16} weight="bold" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClockCounterClockwise size={20} className="text-[#ff3f7a]" weight="bold" />
          <h2 className="text-base font-black text-foreground">{title}</h2>
        </div>
        <span className="text-[11px] font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border">
          24-Hour Purge Window
        </span>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          {/* Animated Zigzag/Wave graphic */}
          <div className="flex items-center justify-center gap-1.5 py-2">
            <span className="w-1.5 h-4 bg-[#ff3f7a] rounded-full animate-bounce [animation-delay:-0.4s]" />
            <span className="w-1.5 h-7 bg-[#ff3f7a]/90 rounded-full animate-bounce [animation-delay:-0.2s]" />
            <span className="w-1.5 h-10 bg-[#ff3f7a] rounded-full animate-bounce" />
            <span className="w-1.5 h-7 bg-[#ff3f7a]/90 rounded-full animate-bounce [animation-delay:-0.2s]" />
            <span className="w-1.5 h-4 bg-[#ff3f7a] rounded-full animate-bounce [animation-delay:-0.4s]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-foreground tracking-tight">Loading your verification history...</p>
            <p className="text-xs text-muted-foreground">Retrieving recent 24-hour verification records from secure storage</p>
          </div>
          {/* Shimmer placeholders */}
          <div className="space-y-2.5 max-w-md mx-auto pt-2">
            <div className="h-12 bg-secondary/70 rounded-xl animate-pulse" />
            <div className="h-12 bg-secondary/40 rounded-xl animate-pulse" />
          </div>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm font-bold text-muted-foreground">No slips generated within the last 24 hours.</p>
          <p className="text-xs text-muted-foreground/70">Generated slips and applicant demographic data appear here for 24 hours.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {history.map((item) => {
            const isDownloading = downloadingId === item.id;
            const isSuccess = successId === item.id;
            const itemDemo = parseDemographics(item.userData, item.fullName);
            const displayFullName = itemDemo.fullName || item.fullName || item.slipType;

            return (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-2xl bg-[#ff3f7a]/10 text-[#ff3f7a] flex items-center justify-center shrink-0 border border-[#ff3f7a]/20">
                    <FilePdf size={24} weight="fill" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm text-foreground">
                        {displayFullName}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                        {item.slipType}
                      </span>
                      {item.searchType === "PHONE" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20">
                          PHONE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mt-0.5">
                      <span className="font-mono">{item.ninMasked}</span>
                      <span>•</span>
                      <span>Generated {item.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* View Details Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDetails(item)}
                    className="h-9 px-3 text-xs font-bold border-border bg-secondary/40 hover:bg-secondary text-foreground cursor-pointer"
                  >
                    <Eye size={14} className="mr-1.5" weight="bold" />
                    View Details
                  </Button>

                  {/* Download Button */}
                  {(item.pdfBase64 || item.pdfUrl) && (
                    <Button
                      variant={isSuccess ? "default" : "outline"}
                      disabled={isDownloading}
                      size="sm"
                      onClick={() => handleDirectDownload(item)}
                      className={`h-9 px-3.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isSuccess 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-sm" 
                          : "border-[#ff3f7a]/30 bg-[#ff3f7a]/10 hover:bg-[#ff3f7a] hover:text-white text-[#ff3f7a]"
                      }`}
                    >
                      {isDownloading ? (
                        <>
                          <SpinnerGap size={14} className="mr-1.5 animate-spin" weight="bold" />
                          Downloading...
                        </>
                      ) : isSuccess ? (
                        <>
                          <CheckCircle size={14} className="mr-1.5" weight="fill" />
                          Downloaded!
                        </>
                      ) : (
                        <>
                          <DownloadSimple size={14} className="mr-1.5" weight="bold" />
                          Re-Download
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* APPLICANT DETAILS MODAL */}
      {selectedDetails && (() => {
        const selectedDemo = parseDemographics(selectedDetails.userData, selectedDetails.fullName);
        const detailsFullName = selectedDemo.fullName || selectedDetails.fullName || "Applicant Identity";
        const detailsPhoto = selectedDemo.photo;
        const detailsDob = selectedDemo.dob || selectedDetails.dob;
        const detailsGender = selectedDemo.gender || selectedDetails.gender;
        const detailsPhone = selectedDemo.phone || selectedDetails.phone;
        const detailsNin = selectedDemo.nin || selectedDetails.userData?.nin || selectedDetails.ninMasked;
        const detailsAddress = selectedDemo.address || selectedDetails.address;

        return (
          <div className="fixed inset-0 z-[999999] h-[100dvh] w-screen flex items-center justify-center p-4 bg-background/80 dark:bg-background/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto overscroll-contain touch-none">
            <div className="bg-card border border-border rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 space-y-5 text-left relative max-h-[90vh] overflow-y-auto overscroll-contain touch-pan-y">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                    <IdentificationBadge size={22} weight="bold" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">Applicant Identity Details</h3>
                    <p className="text-xs text-muted-foreground">{selectedDetails.slipType} • {selectedDetails.reference}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDetails(null)}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              {/* Applicant Name & Photo */}
              <div className="bg-secondary/40 p-4 rounded-2xl border border-border flex items-center gap-3.5">
                {detailsPhoto ? (
                  <img
                    src={detailsPhoto}
                    alt={detailsFullName}
                    className="w-14 h-16 object-cover rounded-xl border border-[#ff3f7a]/30 shadow bg-secondary shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#ff3f7a]/10 border border-[#ff3f7a]/20 flex items-center justify-center text-[#ff3f7a] shrink-0">
                    <User size={24} weight="bold" />
                  </div>
                )}
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Full Name</span>
                  <p className="text-base font-black text-foreground break-words">{detailsFullName}</p>
                </div>
              </div>

              {/* Grid Information */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/30 p-3 rounded-xl border border-border">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <User size={12} className="text-[#ff3f7a]" /> National ID (NIN)
                  </span>
                  <p className="text-xs font-mono font-bold text-foreground mt-0.5">
                    {detailsNin}
                  </p>
                </div>

                {detailsDob && (
                  <div className="bg-secondary/30 p-3 rounded-xl border border-border">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <Calendar size={12} className="text-[#ff3f7a]" /> Date of Birth
                    </span>
                    <p className="text-xs font-bold text-foreground mt-0.5">{detailsDob}</p>
                  </div>
                )}

                {detailsGender && (
                  <div className="bg-secondary/30 p-3 rounded-xl border border-border">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Gender</span>
                    <p className="text-xs font-bold text-foreground mt-0.5 uppercase">{detailsGender}</p>
                  </div>
                )}

                {detailsPhone && (
                  <div className="bg-secondary/30 p-3 rounded-xl border border-border">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <Phone size={12} className="text-[#ff3f7a]" /> Phone Number
                    </span>
                    <p className="text-xs font-mono font-bold text-foreground mt-0.5">{detailsPhone}</p>
                  </div>
                )}
              </div>

              {detailsAddress && (
                <div className="bg-secondary/30 p-3 rounded-xl border border-border">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <MapPin size={12} className="text-[#ff3f7a]" /> Residential Address
                  </span>
                  <p className="text-xs font-medium text-foreground mt-0.5">{detailsAddress}</p>
                </div>
              )}

              {/* Retention alert */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2.5">
                <Trash size={16} className="text-amber-500 shrink-0 mt-0.5" weight="fill" />
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  This verification record will be automatically deleted from our servers 24 hours after generation.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 pt-2">
                <Button
                  onClick={() => handleDirectDownload(selectedDetails)}
                  className="flex-1 h-11 font-black bg-[#ff3f7a] text-white hover:bg-[#e02b62] rounded-xl cursor-pointer"
                >
                  <DownloadSimple size={16} className="mr-2" weight="bold" /> Re-Download Official PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedDetails(null)}
                  className="h-11 px-5 font-bold bg-secondary/60 border-border text-foreground hover:bg-secondary rounded-xl cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
