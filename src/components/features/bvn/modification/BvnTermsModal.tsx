"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ShieldCheck, X, CheckCircle2, Lock, FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BvnTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  bvn: string;
  applicantName: string;
}

export default function BvnTermsModal({
  isOpen,
  onClose,
  onAccept,
  bvn,
  applicantName,
}: BvnTermsModalProps) {
  const [hasAgreed1, setHasAgreed1] = useState(false);
  const [hasAgreed2, setHasAgreed2] = useState(false);
  const [hasAgreed3, setHasAgreed3] = useState(false);

  if (!isOpen) return null;

  const canProceed = hasAgreed1 && hasAgreed2 && hasAgreed3;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/98 dark:bg-background/98 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-card text-card-foreground border border-border rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-300 my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center p-2 shrink-0">
              <Image 
                src="/nibss.png" 
                alt="NIBSS Logo" 
                width={32} 
                height={32} 
                className="object-contain" 
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mb-0.5">
                <Lock size={10} /> Statutory Authorization
              </div>
              <h2 className="text-lg font-black text-foreground">NIBSS BVN Modification Agreement</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="max-h-[300px] overflow-y-auto space-y-3.5 pr-2 text-xs leading-relaxed text-muted-foreground border border-border/80 rounded-2xl p-4 bg-secondary/30">
          <p className="font-semibold text-foreground">
            I, <strong className="text-foreground underline">{applicantName || "the Applicant"}</strong>, holder/representative of Bank Verification Number (BVN) <strong className="font-mono text-foreground">{bvn}</strong>, hereby declare and affirm under penalty of perjury:
          </p>

          <div className="space-y-2">
            <p>
              1. <strong>Lawful Ownership &amp; Authority:</strong> All information, identification details, affidavits, and supporting documents provided for this modification are authentic, true, and lawfully obtained in compliance with Central Bank of Nigeria (CBN) and NIBSS regulatory guidelines.
            </p>
            <p>
              2. <strong>Age Shift &amp; Surcharge Regulation:</strong> I acknowledge that Date of Birth adjustments exceeding 5 years are subject to strict statutory audits, document verification, and statutory surcharge billing.
            </p>
            <p>
              3. <strong>Anti-Impersonation &amp; Fraud Warning:</strong> Attempting to alter BVN records with counterfeit court affidavits, forged birth certificates, or impersonated identity constitutes a criminal offense under the Cybercrimes (Prohibition, Prevention, etc.) Act and CBN Financial Regulations.
            </p>
            <p>
              4. <strong>Processing Turnaround:</strong> Modifications are processed securely through licensed authorized channels and typically conclude within 24 to 48 business hours.
            </p>
          </div>
        </div>

        {/* Required Affirmation Checkboxes */}
        <div className="space-y-3 text-xs">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card/60 hover:bg-secondary/30 cursor-pointer transition-colors">
            <input 
              type="checkbox" 
              checked={hasAgreed1} 
              onChange={(e) => setHasAgreed1(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-foreground">
              I certify that I am the genuine owner of this BVN or duly authorized to request this modification.
            </span>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card/60 hover:bg-secondary/30 cursor-pointer transition-colors">
            <input 
              type="checkbox" 
              checked={hasAgreed2} 
              onChange={(e) => setHasAgreed2(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-foreground">
              I understand that all attached supporting documents (affidavit, birth certificate, IDs) are subject to NIBSS automated verification.
            </span>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card/60 hover:bg-secondary/30 cursor-pointer transition-colors">
            <input 
              type="checkbox" 
              checked={hasAgreed3} 
              onChange={(e) => setHasAgreed3(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-foreground">
              I authorize Lorabiz to debit my wallet balance for the required statutory modification fees and applicable surcharges.
            </span>
          </label>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 text-xs font-bold cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canProceed}
            onClick={onAccept}
            className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 size={16} className="mr-1.5" />
            Accept &amp; Submit Modification
          </Button>
        </div>
      </div>
    </div>
  );
}
