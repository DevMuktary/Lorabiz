"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ShieldCheck } from "@phosphor-icons/react";

interface BvnRetrievalIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BvnRetrievalIntroModal({
  isOpen,
  onClose,
}: BvnRetrievalIntroModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div 
      className="fixed inset-0 h-full w-full min-h-[100dvh] z-[99999] flex items-center justify-center p-4 bg-background/98 dark:bg-background/98 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-card text-card-foreground border border-border rounded-3xl shadow-2xl p-6 md:p-8 animate-in slide-in-from-bottom-6 fade-in duration-300 text-left my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X weight="bold" className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-white border border-border flex items-center justify-center p-2 shrink-0 shadow-sm">
            <Image src="/nibss.png" alt="NIBSS Logo" width={40} height={40} className="object-contain" priority />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Statutory Notice
            </span>
            <h2 className="text-xl font-black text-foreground">Compliance Verification</h2>
          </div>
        </div>
        
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            This service is designed for users who need to recover their forgotten 11-digit Bank Verification Number (BVN) from NIBSS records.
          </p>
          <p>
            Please do not attempt to search or retrieve BVN records of other individuals without their express permission or legal authorization. Unauthorized record queries violate identity privacy regulations.
          </p>
          <p className="text-xs bg-secondary/50 p-3 rounded-xl border border-border">
            <strong>Turnaround Time:</strong> Standard fulfillment is between <strong>1 to 24 working hours</strong>. You will receive an automated email notification once completed.
          </p>
        </div>

        <button 
          type="button"
          onClick={onClose}
          className="mt-6 w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
        >
          <ShieldCheck weight="bold" className="h-5 w-5" />
          <span>I Understand &amp; Agree</span>
        </button>
      </div>
    </div>,
    document.body
  );
}
