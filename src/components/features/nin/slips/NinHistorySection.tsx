"use client";

import { useState } from "react";
import { 
  ClockCounterClockwise, FilePdf, DownloadSimple, SpinnerGap, CheckCircle, 
  Eye, User, Phone, MapPin, Calendar, IdentificationBadge, X, Trash
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

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
}

export default function NinHistorySection({ history }: NinHistorySectionProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<SlipHistoryItem | null>(null);

  // Silent Blob Downloader
  const handleDirectDownload = async (item: SlipHistoryItem) => {
    try {
      setDownloadingId(item.id);
      const fileName = `NIMC_${item.slipType.replace(/\s+/g, "_")}_${item.ninMasked.replace(/\*/g, "X")}.pdf`;

      let blob: Blob;

      if (item.pdfBase64) {
        const byteCharacters = atob(item.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: "application/pdf" });
      } else if (item.pdfUrl) {
        if (item.pdfUrl.startsWith("data:")) {
          const parts = item.pdfUrl.split(",");
          const byteCharacters = atob(parts[1]);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClockCounterClockwise size={22} className="text-[#ff3f7a]" weight="bold" />
          <h2 className="text-lg font-black text-foreground">24-Hour Print History & Applicant Records</h2>
        </div>
        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          24-Hour Retention Window
        </span>
      </div>

      {history.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm font-bold text-muted-foreground">No slips generated within the last 24 hours.</p>
          <p className="text-xs text-muted-foreground/70">Generated slips and applicant demographic data appear here for 24 hours.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {history.map((item) => {
            const isDownloading = downloadingId === item.id;
            const isSuccess = successId === item.id;

            return (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-2xl bg-[#ff3f7a]/10 text-[#ff3f7a] flex items-center justify-center shrink-0 border border-[#ff3f7a]/20">
                    <FilePdf size={24} weight="fill" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm text-foreground">
                        {item.fullName || item.slipType}
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
      {selectedDetails && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 space-y-5 text-left relative max-h-[90vh] overflow-y-auto">
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

            {/* Applicant Name */}
            <div className="bg-secondary/40 p-4 rounded-2xl border border-border space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</span>
              <p className="text-base font-black text-foreground">{selectedDetails.fullName || "Name Not Available"}</p>
            </div>

            {/* Grid Information */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/30 p-3 rounded-xl border border-border">
                <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <User size={12} className="text-[#ff3f7a]" /> National ID (NIN)
                </span>
                <p className="text-xs font-mono font-bold text-foreground mt-0.5">
                  {selectedDetails.userData?.nin || selectedDetails.ninMasked}
                </p>
              </div>

              {selectedDetails.dob && (
                <div className="bg-secondary/30 p-3 rounded-xl border border-border">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Calendar size={12} className="text-[#ff3f7a]" /> Date of Birth
                  </span>
                  <p className="text-xs font-bold text-foreground mt-0.5">{selectedDetails.dob}</p>
                </div>
              )}

              {selectedDetails.gender && (
                <div className="bg-secondary/30 p-3 rounded-xl border border-border">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Gender</span>
                  <p className="text-xs font-bold text-foreground mt-0.5 uppercase">{selectedDetails.gender}</p>
                </div>
              )}

              {selectedDetails.phone && (
                <div className="bg-secondary/30 p-3 rounded-xl border border-border">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <Phone size={12} className="text-[#ff3f7a]" /> Phone Number
                  </span>
                  <p className="text-xs font-mono font-bold text-foreground mt-0.5">{selectedDetails.phone}</p>
                </div>
              )}
            </div>

            {selectedDetails.address && (
              <div className="bg-secondary/30 p-3 rounded-xl border border-border">
                <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <MapPin size={12} className="text-[#ff3f7a]" /> Residential Address
                </span>
                <p className="text-xs font-medium text-foreground mt-0.5">{selectedDetails.address}</p>
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
      )}
    </div>
  );
}
