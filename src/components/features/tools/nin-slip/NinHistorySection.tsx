"use client";

import { useState } from "react";
import { ClockCounterClockwise, FilePdf, DownloadSimple, SpinnerGap, CheckCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export interface SlipHistoryItem {
  id: string;
  ninMasked: string;
  slipType: string;
  createdAt: string;
  pdfBase64?: string;
  pdfUrl?: string; // Support for Cloudinary URL from database
}

interface NinHistorySectionProps {
  history: SlipHistoryItem[];
}

export default function NinHistorySection({ history }: NinHistorySectionProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  // SILENT BLOB DOWNLOADER (Prevents browser from opening a new tab!)
  const handleDirectDownload = async (item: SlipHistoryItem) => {
    try {
      setDownloadingId(item.id);
      const fileName = `nin_slip_${item.ninMasked.replace(/\*/g, "X")}.pdf`;

      let blob: Blob;

      if (item.pdfBase64) {
        // If we have direct base64 in memory (just generated)
        const byteCharacters = atob(item.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: "application/pdf" });
      } else if (item.pdfUrl) {
        // If downloading from Cloudinary: Fetch as Blob so it doesn't open a new tab!
        const response = await fetch(item.pdfUrl);
        if (!response.ok) throw new Error("Network response was not ok");
        blob = await response.blob();
      } else {
        throw new Error("No file source available");
      }

      // Create local object URL and trigger silent download
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.style.display = "none";
      downloadLink.href = blobUrl;
      downloadLink.download = fileName;
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Cleanup memory
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(downloadLink);

      // Show temporary success feedback
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
          <h2 className="text-lg font-black text-foreground">24-Hour Print History</h2>
        </div>
        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Automated Purge Policy: Files deleted after 24 hours
        </span>
      </div>

      {history.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm font-bold text-muted-foreground">No slips generated within the last 24 hours.</p>
          <p className="text-xs text-muted-foreground/70">Generated slips will appear here temporarily for quick re-downloading.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {history.map((item) => {
            const isDownloading = downloadingId === item.id;
            const isSuccess = successId === item.id;

            return (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-[#ff3f7a]/10 text-[#ff3f7a] flex items-center justify-center shrink-0">
                    <FilePdf size={22} weight="fill" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-foreground">{item.slipType} ({item.ninMasked})</h4>
                    <span className="text-xs font-medium text-muted-foreground">Generated {item.createdAt}</span>
                  </div>
                </div>

                {(item.pdfBase64 || item.pdfUrl) && (
                  <Button
                    variant={isSuccess ? "default" : "outline"}
                    disabled={isDownloading}
                    onClick={() => handleDirectDownload(item)}
                    className={`h-9 px-3.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                      isSuccess 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-sm" 
                        : "border-border bg-secondary/50 hover:bg-secondary text-foreground"
                    }`}
                  >
                    {isDownloading ? (
                      <>
                        <SpinnerGap size={14} className="mr-1.5 animate-spin text-[#ff3f7a]" weight="bold" />
                        Downloading...
                      </>
                    ) : isSuccess ? (
                      <>
                        <CheckCircle size={14} className="mr-1.5" weight="fill" />
                        Saved to Device!
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
            );
          })}
        </div>
      )}
    </div>
  );
}
