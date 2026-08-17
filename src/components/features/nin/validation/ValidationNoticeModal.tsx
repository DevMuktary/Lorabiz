// src/components/features/nin/validation/ValidationNoticeModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Info, ShieldAlert, Clock, CheckCircle2, ArrowRight } from "lucide-react";

interface ValidationNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ValidationNoticeModal({ isOpen, onClose }: ValidationNoticeModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 min-h-screen w-screen z-[99999] flex items-center justify-center p-4 bg-background/80 dark:bg-background/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 animate-in slide-in-from-bottom-6 fade-in duration-300 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-amber-500/20">
            <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight">Important Service Notice</h2>
            <p className="text-xs text-muted-foreground">Please read before submitting your NIN validation request.</p>
          </div>
        </div>

        {/* Advisory List */}
        <div className="space-y-3.5 text-xs sm:text-sm text-muted-foreground">
          
          <div className="flex items-start gap-3 p-3.5 bg-secondary/50 rounded-2xl border border-border">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground block font-bold mb-0.5">Verify Validation Need:</strong>
              Please ensure the NIN you are submitting genuinely has an issue that requires validation (e.g. record sync issues, unlinked VNIN, or recent biometric/record update).
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-700 dark:text-rose-400">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">Strictly Non-Refundable:</strong>
              Once submitted and queued with the identity portal, this validation service is non-refundable and cannot be canceled.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-700 dark:text-blue-400">
            <Clock className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">Processing & Portal Reflection Window:</strong>
              Validation is typically processed within <span className="font-bold text-foreground">24 to 48 hours</span>. However, official portal database reflection across national platforms may take <span className="font-bold text-foreground">72 hours or more</span>.
            </div>
          </div>

        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-md flex items-center justify-center gap-2 text-sm"
        >
          <span>I Understand & Continue</span>
          <ArrowRight className="h-4 w-4" />
        </button>

      </div>
    </div>,
    document.body
  );
}
