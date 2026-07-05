"use client";

import { ClockCounterClockwise, FilePdf, DownloadSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export interface SlipHistoryItem {
  id: string;
  ninMasked: string;
  slipType: string;
  createdAt: string;
  pdfBase64?: string;
}

interface NinHistorySectionProps {
  history: SlipHistoryItem[];
}

export default function NinHistorySection({ history }: NinHistorySectionProps) {
  const triggerPdfDownload = (base64Data: string, ninMasked: string) => {
    const linkSource = `data:application/pdf;base64,${base64Data}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = `nin_slip_${ninMasked.replace(/\*/g, "X")}.pdf`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="pt-8 border-t border-border space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClockCounterClockwise size={22} className="text-[#ff3f7a]" weight="bold" />
          <h2 className="text-lg font-black text-foreground">24-Hour Retrieval History</h2>
        </div>
        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Automated Purge Policy: Files deleted after 24 hours
        </span>
      </div>

      {history.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm font-bold text-muted-foreground">No slips generated within the last 24 hours.</p>
          <p className="text-xs text-muted-foreground/70">Retrieved slips will appear here temporarily for quick re-downloading.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {history.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-secondary/20 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-[#ff3f7a]/10 text-[#ff3f7a] flex items-center justify-center shrink-0">
                  <FilePdf size={22} weight="fill" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-foreground">{item.slipType} ({item.ninMasked})</h4>
                  <span className="text-xs font-medium text-muted-foreground">{item.createdAt}</span>
                </div>
              </div>
              {item.pdfBase64 && (
                <Button
                  variant="outline"
                  onClick={() => triggerPdfDownload(item.pdfBase64!, item.ninMasked)}
                  className="h-9 px-3.5 text-xs font-bold border-border bg-secondary/50 hover:bg-secondary cursor-pointer"
                >
                  <DownloadSimple size={14} className="mr-1.5" weight="bold" /> Re-Download
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
