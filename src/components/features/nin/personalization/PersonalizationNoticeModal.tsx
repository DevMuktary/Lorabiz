// src/components/features/nin/personalization/PersonalizationNoticeModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "@phosphor-icons/react";

interface PersonalizationNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PersonalizationNoticeModal({ isOpen, onClose }: PersonalizationNoticeModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 min-h-screen w-screen z-[99999] flex items-center justify-center p-4 bg-background/80 dark:bg-background/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 animate-in slide-in-from-bottom-6 fade-in duration-300">
        
        {/* Header matching IPE / Validation intro modal */}
        <div className="flex items-center gap-4 mb-4">
          <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
            <Info weight="fill" className="h-6 w-6 text-blue-500" />
          </div>
          <h2 className="text-xl font-black text-foreground">Processing Timeline</h2>
        </div>

        {/* Clean, concise advisory */}
        <div className="space-y-3.5 text-sm text-muted-foreground leading-relaxed">
          <p>
            This service will be processed within <strong className="text-foreground">1 to 24 hours</strong> (there might be a slight delay on weekends).
          </p>
          <p>
            Submit your enrollment tracking ID for personalization.
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 leading-relaxed">
            <strong className="font-bold">No Refund Policy:</strong> This service is non-refundable once submitted, as provider fulfillment costs are billed 100% upfront.
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
