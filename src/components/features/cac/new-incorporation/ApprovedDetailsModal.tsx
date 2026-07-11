"use client";

import { X, Copy, CheckCircle, DownloadSimple, IdentificationCard, Building } from "@phosphor-icons/react";
import { useState } from "react";

export default function ApprovedDetailsModal({ reg, onClose }: { reg: any, onClose: () => void }) {
  const [copied, setCopied] = useState("");

  const handleCopy = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(""), 2000);
  };

  // =========================================================================
  // THE FIX: Helper to inject Cloudinary's "fl_attachment" flag.
  // This forces the browser to download the file directly to the user's device.
  // =========================================================================
  const getDownloadUrl = (url?: string) => {
    if (!url) return "#";
    if (url.includes("/upload/")) {
      return url.replace("/upload/", "/upload/fl_attachment/");
    }
    return url;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-secondary text-muted-foreground rounded-full hover:text-foreground transition-colors cursor-pointer">
          <X weight="bold" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle weight="fill" className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground">Official Details</h3>
            <p className="text-sm font-medium text-muted-foreground">Application Approved</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-secondary/50 border border-border rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                {reg._appType === "BUSINESS_NAME" ? "BN Number" : "RC Number"}
              </p>
              <p className="text-lg font-black text-foreground flex items-center gap-2">
                <Building weight="duotone" className="text-primary h-5 w-5" />
                {reg.registrationNumber || "Pending Issuance"}
              </p>
            </div>
            {reg.registrationNumber && (
              <button onClick={() => handleCopy(reg.registrationNumber, "RC")} className="p-2 hover:bg-secondary rounded-lg text-primary transition-colors cursor-pointer">
                {copied === "RC" ? <CheckCircle weight="fill" className="text-emerald-500" /> : <Copy weight="bold" />}
              </button>
            )}
          </div>

          <div className="bg-secondary/50 border border-border rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Tax ID (TIN)</p>
              <p className="text-lg font-black text-foreground flex items-center gap-2">
                <IdentificationCard weight="duotone" className="text-primary h-5 w-5" />
                {reg.taxId || "Pending Issuance"}
              </p>
            </div>
            {reg.taxId && (
              <button onClick={() => handleCopy(reg.taxId, "TIN")} className="p-2 hover:bg-secondary rounded-lg text-primary transition-colors cursor-pointer">
                {copied === "TIN" ? <CheckCircle weight="fill" className="text-emerald-500" /> : <Copy weight="bold" />}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Documents</p>
          
          {reg.certificateUrl && (
            <a 
              href={getDownloadUrl(reg.certificateUrl)} 
              download
              className="flex items-center justify-between p-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl transition-colors cursor-pointer"
            >
              <span>CAC Certificate</span>
              <DownloadSimple weight="bold" className="h-5 w-5" />
            </a>
          )}
          
          {reg.statusReportUrl && (
            <a 
              href={getDownloadUrl(reg.statusReportUrl)} 
              download
              className="flex items-center justify-between p-4 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl transition-colors cursor-pointer"
            >
              <span>Status Report</span>
              <DownloadSimple weight="bold" className="h-5 w-5" />
            </a>
          )}

          {reg.memorandumUrl && (
            <a 
              href={getDownloadUrl(reg.memorandumUrl)} 
              download
              className="flex items-center justify-between p-4 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl transition-colors cursor-pointer"
            >
              <span>Memorandum (MEMART)</span>
              <DownloadSimple weight="bold" className="h-5 w-5" />
            </a>
          )}
        </div>

      </div>
    </div>
  );
}
