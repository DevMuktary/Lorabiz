"use client";

import { CircleNotch, Check, Trash, DownloadSimple, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface NinResultModalProps {
  isOpen: boolean;
  status: "loading" | "success" | "error";
  nin?: string;
  slipLabel?: string;
  pdfBase64?: string;
  errorMsg?: string;
  onClose: () => void;
}

export default function NinResultModal({
  isOpen,
  status,
  nin,
  slipLabel,
  pdfBase64,
  errorMsg,
  onClose,
}: NinResultModalProps) {
  if (!isOpen) return null;

  const triggerPdfDownload = (base64Data: string, ninNum: string) => {
    const linkSource = `data:application/pdf;base64,${base64Data}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = `nin_slip_${ninNum}.pdf`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center relative space-y-6">
        
        {status === "loading" && (
          <div className="py-6 space-y-4">
            <CircleNotch size={56} className="animate-spin text-[#ff3f7a] mx-auto" weight="bold" />
            <div className="space-y-1">
              <h3 className="text-xl font-black text-foreground">Connecting to NIMC Database</h3>
              <p className="text-xs font-medium text-muted-foreground">
                Processing parameters for NIN: <span className="font-bold text-foreground">{nin}</span>
              </p>
            </div>
            <div className="bg-secondary/50 p-3 rounded-xl border border-border text-[11px] text-muted-foreground font-semibold">
              Please do not close or refresh this tab while formatting...
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
              <Check size={32} weight="bold" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-foreground">Slip Ready & Downloaded!</h3>
              <p className="text-xs text-muted-foreground">
                Your <span className="font-bold text-foreground">{slipLabel}</span> has been saved to your device.
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-left flex items-start gap-2.5">
              <Trash size={18} className="text-amber-500 shrink-0 mt-0.5" weight="fill" />
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 leading-relaxed">
                Data Retention Policy: To protect identity privacy, this file will be automatically purged from our servers after 24 hours.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Button
                onClick={() => pdfBase64 && nin && triggerPdfDownload(pdfBase64, nin)}
                className="w-full h-12 font-black bg-[#ff3f7a] text-white hover:bg-[#e02b62] rounded-xl cursor-pointer"
              >
                <DownloadSimple size={18} className="mr-2" weight="bold" /> Download Again
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full h-12 font-bold bg-secondary/40 border-border text-foreground hover:bg-secondary rounded-xl cursor-pointer"
              >
                Close Window
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto border border-destructive/20">
              <WarningCircle size={32} weight="bold" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-foreground">Generation Unsuccessful</h3>
              <p className="text-xs text-muted-foreground leading-relaxed px-2">{errorMsg}</p>
            </div>

            <Button
              onClick={onClose}
              className="w-full h-12 font-black bg-secondary text-foreground hover:bg-secondary/80 rounded-xl cursor-pointer border border-border"
            >
              Dismiss & Retry
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
