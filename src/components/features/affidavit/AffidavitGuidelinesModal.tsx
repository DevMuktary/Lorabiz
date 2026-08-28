// src/components/features/affidavit/AffidavitGuidelinesModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { CheckCircle, ShieldCheck, X } from "@phosphor-icons/react";

interface AffidavitGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AffidavitGuidelinesModal({ isOpen, onClose }: AffidavitGuidelinesModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 min-h-screen w-screen z-[99999] flex items-center justify-center p-4 bg-background/80 dark:bg-background/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-foreground animate-in zoom-in-95 duration-200 flex flex-col my-auto text-left">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-card flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center p-1.5 border border-primary/20 shrink-0">
              <Image 
                src="/court.png" 
                alt="High Court Seal" 
                width={32} 
                height={32} 
                className="object-contain" 
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 mb-0.5">
                <ShieldCheck weight="bold" className="h-3 w-3" />
                Judiciary Standards
              </div>
              <h2 className="text-base font-black text-foreground tracking-tight">
                High Court Affidavit Rules
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0"
            title="Close"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>

        {/* Concise Guidelines */}
        <div className="p-4 sm:p-5 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="font-bold text-primary">•</span>
            <p><strong>Official Court Stamping:</strong> Legally sworn, stamped, and sealed by the Commissioner for Oaths under the Oaths Act.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-primary">•</span>
            <p><strong>Turnaround Time:</strong> Processed and sealed within <strong>2 to 5 Working Hours (Mon–Fri, Excludes Weekends &amp; Public Holidays)</strong>.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-primary">•</span>
            <p><strong>Accuracy of Facts:</strong> Ensure all names, dates, and particulars are truthful. False declarations carry statutory penalties.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-primary">•</span>
            <p><strong>Universal Acceptance:</strong> Valid for Commercial Banks, CAC, NIMC/NIN, Fintechs, Embassies, Employers, NYSC, Universities, and Legal Proceedings nationwide &amp; abroad.</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold">
            Officially recognized nationwide for all corporate, financial, and personal legal filings.
          </div>
        </div>

        {/* Action */}
        <div className="p-4 border-t border-border bg-card shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-all cursor-pointer shadow-md text-center flex items-center justify-center gap-1.5"
          >
            <CheckCircle weight="bold" className="h-4 w-4" />
            <span>I Understand &amp; Agree</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
