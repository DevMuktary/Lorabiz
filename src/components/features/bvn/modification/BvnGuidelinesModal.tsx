"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ShieldCheck, WarningCircle, CheckCircle, Lock, X } from "@phosphor-icons/react";

interface BvnGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BvnGuidelinesModal({ isOpen, onClose }: BvnGuidelinesModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
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
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-foreground animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border bg-card flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center p-2 border border-emerald-500/20 shrink-0 shadow-sm">
              <Image 
                src="/nibss.png" 
                alt="NIBSS Logo" 
                width={32} 
                height={32} 
                className="object-contain" 
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mb-0.5">
                <Lock weight="bold" className="h-3 w-3" />
                Statutory Guidelines
              </div>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                BVN Modification Guidelines &amp; Rules
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0"
            title="Close"
          >
            <X weight="bold" className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs sm:text-sm leading-relaxed">
          
          {/* Rule 1: Valid Banks */}
          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center font-black shrink-0">1</span>
              <span>Valid Banks Only</span>
            </div>
            <p className="text-muted-foreground pl-7 text-xs">
              Make sure your BVN is an <strong>Agency Enrollment</strong> or one of our 6 listed banks (<strong>Agency BVN, Enterprise Bank, Agricultural Bank, NIBSS IMPORT, Heritage Bank, Microfinance Bank</strong>).
            </p>
          </div>

          {/* Rule 2: Reflect on VNIN */}
          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center font-black shrink-0">2</span>
              <span>Reflect on VNIN First</span>
            </div>
            <p className="text-muted-foreground pl-7 text-xs">
              If you did a NIN modification first, ensure it is <strong>fully reflecting on your VNIN Slip</strong>. NIBSS does not process double modifications.
            </p>
          </div>

          {/* Rule 3: One-Time Rule */}
          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center font-black shrink-0">3</span>
              <span>One-Time Rule &amp; Mandatory Authorization</span>
            </div>
            <p className="text-muted-foreground pl-7 text-xs">
              You can only change your details once. You must be the legitimate owner of the BVN or duly authorized with explicit consent.
            </p>
          </div>

          {/* Strict No-Refund & Rejection Box */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <WarningCircle weight="fill" className="h-4 w-4 shrink-0 text-rose-500" />
              <span>STRICT NO REFUND IF:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs opacity-90 pl-1">
              <li>It is a Bank Enrollment not on our listed banks.</li>
              <li>You submit your Old NIN details.</li>
              <li>You have previously done similar modifications.</li>
              <li>It is a Complete Change of Name.</li>
            </ul>

            <div className="pt-2 border-t border-rose-500/20 text-xs">
              <strong className="text-rose-600 dark:text-rose-400">INSTANT REJECTION IF:</strong> You submit invalid details or submit duplicate requests as one.
            </div>
          </div>

        </div>

        {/* Footer Action */}
        <div className="p-4 sm:p-5 border-t border-border bg-card shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:opacity-90 transition-all cursor-pointer shadow-md text-center flex items-center justify-center gap-2"
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
