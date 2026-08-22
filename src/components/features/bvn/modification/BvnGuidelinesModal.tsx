"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { CheckCircle, Lock, X } from "@phosphor-icons/react";

interface BvnGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BvnGuidelinesModal({ isOpen, onClose }: BvnGuidelinesModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 min-h-screen w-screen z-[99999] flex items-center justify-center p-4 bg-background/80 dark:bg-background/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-foreground animate-in zoom-in-95 duration-200 flex flex-col my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-card flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center p-2 border border-emerald-500/20 shrink-0">
              <Image 
                src="/nibss.png" 
                alt="NIBSS Logo" 
                width={28} 
                height={28} 
                className="object-contain" 
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mb-0.5">
                <Lock weight="bold" className="h-3 w-3" />
                Guidelines
              </div>
              <h2 className="text-base font-black text-foreground tracking-tight">
                BVN Modification Rules
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

        {/* Short & Concise Body */}
        <div className="p-4 sm:p-5 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">•</span>
            <p><strong>Supported Banks:</strong> Must be an Agency BVN or one of our 6 listed supported banks.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">•</span>
            <p><strong>VNIN Slip Reflection:</strong> If you did a NIN change first, ensure it is fully active on your VNIN slip.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">•</span>
            <p><strong>Ownership &amp; One-Time Rule:</strong> You must be the owner or authorized. Modification is processed once per record.</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] font-semibold">
            Strictly no refunds for unlisted banks, unreflected NIN details, or duplicate submissions.
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
            <span>I Understand &amp; Proceed</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
