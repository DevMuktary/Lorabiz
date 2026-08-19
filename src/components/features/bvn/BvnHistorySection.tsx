"use client";

import { useState } from "react";
import { 
  ClockCounterClockwise, FilePdf, DownloadSimple, SpinnerGap, CheckCircle, 
  Eye, User, Phone, MapPin, Calendar, IdentificationBadge, X, Trash
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export interface BvnHistoryItem {
  id: string;
  bvnMasked: string;
  rawSlipType?: string;
  slipType: string;
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

interface BvnHistorySectionProps {
  history: BvnHistoryItem[];
  title?: string;
}

export default function BvnHistorySection({ history, title = "24-Hour BVN Print History" }: BvnHistorySectionProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<BvnHistoryItem | null>(null);

  // Silent Blob Downloader
  const handleDirectDownload = async (item: BvnHistoryItem) => {
    try {
      setDownloadingId(item.id);
      const fileName = `NIBSS_${item.slipType.replace(/\s+/g, "_")}_${item.bvnMasked.replace(/\*/g, "X")}.pdf`;

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

  if (!history || history.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20">
            <ClockCounterClockwise size={20} weight="bold" />
          </div>
          <div>
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              {title}
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                {history.length} {history.length === 1 ? "Slip" : "Slips"}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Slips generated in the last 24 hours are retained here for instant re-download.
            </p>
          </div>
        </div>
      </div>

      {/* History Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 border border-border/60 transition-all space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FilePdf size={20} weight="bold" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground">
                    {item.fullName || item.slipType}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-[11px] font-mono font-bold text-foreground bg-background px-1.5 py-0.5 rounded border border-border">
                      {item.bvnMasked}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.slipType}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap bg-background px-2 py-0.5 rounded-full border border-border/60">
                {item.createdAt}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDetails(item)}
                className="flex-1 h-9 font-bold bg-background text-xs text-foreground border-border hover:bg-secondary rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Eye size={14} weight="bold" />
                <span>View Details</span>
              </Button>

              <Button
                size="sm"
                onClick={() => handleDirectDownload(item)}
                disabled={downloadingId === item.id}
                className="flex-1 h-9 font-black bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                {downloadingId === item.id ? (
                  <>
                    <SpinnerGap size={14} className="animate-spin" weight="bold" />
                    <span>Preparing...</span>
                  </>
                ) : successId === item.id ? (
                  <>
                    <CheckCircle size={14} weight="bold" />
                    <span>Downloaded!</span>
                  </>
                ) : (
                  <>
                    <DownloadSimple size={14} weight="bold" />
                    <span>Download PDF</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* DETAILS MODAL */}
      {selectedDetails && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <IdentificationBadge size={18} weight="bold" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground">Verified BVN Record</h4>
                  <p className="text-[10px] text-muted-foreground">Authenticated NIBSS Identity Data</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetails(null)}
                className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <div className="space-y-3 bg-secondary/40 p-4 rounded-2xl border border-border text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Full Name</span>
                <p className="font-black text-foreground text-sm">{selectedDetails.fullName || "—"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/40">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <User size={11} /> BVN
                  </span>
                  <p className="font-mono font-bold text-foreground mt-0.5">{selectedDetails.bvnMasked}</p>
                </div>

                {selectedDetails.dob && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <Calendar size={11} /> Date of Birth
                    </span>
                    <p className="font-bold text-foreground mt-0.5">{selectedDetails.dob}</p>
                  </div>
                )}

                {selectedDetails.gender && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Gender</span>
                    <p className="font-bold text-foreground mt-0.5 uppercase">{selectedDetails.gender}</p>
                  </div>
                )}

                {selectedDetails.phone && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                      <Phone size={11} /> Phone
                    </span>
                    <p className="font-mono font-bold text-foreground mt-0.5">{selectedDetails.phone}</p>
                  </div>
                )}
              </div>

              {selectedDetails.address && (
                <div className="pt-2 border-t border-border/40">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <MapPin size={11} /> Address
                  </span>
                  <p className="text-foreground mt-0.5 leading-relaxed">{selectedDetails.address}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  handleDirectDownload(selectedDetails);
                  setSelectedDetails(null);
                }}
                className="flex-1 h-11 font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs cursor-pointer shadow-md"
              >
                <DownloadSimple size={16} className="mr-1.5" weight="bold" /> Download PDF Slip
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedDetails(null)}
                className="h-11 px-4 font-bold border-border rounded-xl text-xs cursor-pointer"
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
