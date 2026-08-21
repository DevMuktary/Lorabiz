// src/components/features/nin/validation/ValidationNoticeModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "@phosphor-icons/react";

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
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 animate-in slide-in-from-bottom-6 fade-in duration-300">
        
        {/* Header matching IPE intro modal */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
            <Info weight="fill" className="h-6 w-6 text-blue-500" />
          </div>
          <h2 className="text-xl font-black text-foreground">Processing Timeline</h2>
        </div>

        {/* Clean, concise advisory */}
        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <p>
            This service will be processed within <strong className="text-foreground">24 to 48 hours</strong> (official portal reflection across nationwide verification systems may take up to <strong className="text-foreground">72 hours</strong>).
          </p>
          <p>
            Please ensure the NIN you are submitting genuinely has an issue that requires validation, as this service is strictly <strong className="text-foreground">non-refundable</strong> once queued.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-md text-sm"
        >
          I Understand
        </button>

      </div>
    </div>,
    document.body
  );
}
