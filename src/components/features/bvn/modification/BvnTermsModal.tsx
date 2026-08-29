"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ShieldCheck, X, CheckCircle2, Lock, AlertTriangle, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BvnTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  bvn: string;
  nin: string;
  applicantName: string;
  enrollingBankName: string;
  modificationLabel: string;
  totalFee: number;
}

export default function BvnTermsModal({
  isOpen,
  onClose,
  onAccept,
  bvn,
  nin,
  applicantName,
  enrollingBankName,
  modificationLabel,
  totalFee,
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
        className="relative w-full max-w-2xl bg-card text-card-foreground border border-border rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-300 my-auto text-left"
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
              <h2 className="text-lg font-black text-foreground">BVN Modification Terms &amp; Conditions</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Applicant Summary */}
        <div className="bg-secondary/30 rounded-2xl p-3.5 border border-border text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Enrolling Bank</span>
            <span className="font-bold text-foreground truncate block">{enrollingBankName}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Modification</span>
            <span className="font-bold text-foreground truncate block">{modificationLabel}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">BVN / NIN</span>
            <span className="font-mono font-bold text-foreground truncate block">{bvn} / {nin}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Fee</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 block">₦{totalFee.toLocaleString()}</span>
          </div>
        </div>

        {/* Clear Legal & Policy Guidelines */}
        <div className="max-h-[260px] overflow-y-auto space-y-3 pr-2 text-xs leading-relaxed border border-border/80 rounded-2xl p-4 bg-secondary/20">
          <div className="space-y-2 text-muted-foreground">
            <p>
              1. <strong>Mandatory Ownership &amp; Authorization:</strong> I solemnly affirm under penalty of identity fraud, the <strong>Nigeria Data Protection Act (NDPA) 2023</strong>, and the <strong>Cybercrimes Act 2015</strong> that I am either the <strong>legitimate registered owner</strong> of BVN <strong className="font-mono text-foreground">{bvn}</strong> or have been <strong>duly authorized with documented proxy consent</strong> by the BVN owner to submit this modification.
            </p>
            <p>
              2. <strong>Valid Enrolling Banks Only:</strong> I confirm that this BVN enrollment is registered under <strong>{enrollingBankName}</strong> or an approved Agency Enrollment.
            </p>
            <p>
              3. <strong>VNIN Slip Reflection:</strong> If a prior NIN modification was conducted, I certify that the update is <strong>already active and fully reflecting on my NIMC VNIN Slip</strong>. NIBSS rejects unreflected or double modification attempts.
            </p>
            <p>
              4. <strong>One-Time Rule:</strong> I acknowledge that under NIBSS regulatory framework, BVN record details can only be legally modified once per category.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] space-y-1.5 font-medium">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle size={14} className="shrink-0" />
              <span>Strict No-Refund &amp; Rejection Conditions:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 opacity-90 pl-1">
              <li>No refund if the enrolling bank is not among our listed supported banks.</li>
              <li>No refund if you submit old NIN details before they reflect on your VNIN slip.</li>
              <li>No refund if you have previously completed similar modifications on this BVN.</li>
              <li>No refund if this request constitutes a complete change of name/identity.</li>
              <li>Instant rejection if you submit invalid details or bundle duplicate requests.</li>
            </ul>
          </div>
        </div>

        {/* Affirmation Checkboxes */}
        <div className="space-y-2.5 text-xs">
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-card/60 hover:bg-secondary/30 cursor-pointer transition-colors">
            <input 
              type="checkbox" 
              checked={hasAgreed1} 
              onChange={(e) => setHasAgreed1(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-foreground">
              I certify that I am the <strong>legitimate owner</strong> of BVN <strong>{bvn}</strong> or have been <strong>duly authorized</strong> by the owner, and all supplied details are authentic.
            </span>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-card/60 hover:bg-secondary/30 cursor-pointer transition-colors">
            <input 
              type="checkbox" 
              checked={hasAgreed2} 
              onChange={(e) => setHasAgreed2(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-foreground">
              I have read and accepted the <strong>Strict No-Refund</strong> and <strong>VNIN Reflection</strong> conditions stated above.
            </span>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-card/60 hover:bg-secondary/30 cursor-pointer transition-colors">
            <input 
              type="checkbox" 
              checked={hasAgreed3} 
              onChange={(e) => setHasAgreed3(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-foreground">
              I authorize Lorabiz to debit <strong>₦{totalFee.toLocaleString()}</strong> from my wallet to process this BVN modification.
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
            Accept Terms &amp; Submit (₦{totalFee.toLocaleString()})
          </Button>
        </div>
      </div>
    </div>
  );
}
