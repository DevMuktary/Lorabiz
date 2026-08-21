"use client";

import React from "react";
import Image from "next/image";
import { 
  X, CheckCircle2, Clock, AlertTriangle, User, Phone, Calendar, 
  FileText, Download, ShieldCheck, ArrowRight, CornerDownRight, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BvnModificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any | null;
}

export default function BvnModificationDetailsModal({
  isOpen,
  onClose,
  request,
}: BvnModificationDetailsModalProps) {
  if (!isOpen || !request) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={13} /> Completed
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Clock size={13} /> Processing on NIBSS
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle size={13} /> Rejected &amp; Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock size={13} /> Queued / Pending
          </span>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/98 dark:bg-background/98 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-card text-card-foreground border border-border rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-300 my-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center p-1.5 shrink-0">
              <Image 
                src="/nibss.png" 
                alt="NIBSS Logo" 
                width={28} 
                height={28} 
                className="object-contain" 
              />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">Tracking Reference</span>
              <h3 className="text-base font-black text-foreground font-mono">{request.trackingId}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(request.status)}
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Rejection / Refund Notice */}
        {request.status === "REJECTED" && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <AlertTriangle size={16} className="text-rose-500 shrink-0" />
              <span>Application Declined</span>
            </div>
            <p className="leading-relaxed">
              <strong>Reason:</strong> {request.rejectionReason || "Could not be verified on NIBSS."}
            </p>
            {request.isRefunded && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                <RotateCcw size={12} />
                <span>₦{Number(request.amountPaid).toLocaleString()} has been refunded to your wallet balance.</span>
              </div>
            )}
          </div>
        )}

        {/* Core Request Information */}
        <div className="bg-secondary/30 rounded-2xl p-4 border border-border space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">BVN Number:</span>
            <span className="font-mono font-bold text-foreground">{request.bvn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Registered Legal Name:</span>
            <span className="font-bold text-foreground">{request.currentFullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount Paid:</span>
            <span className="font-bold text-foreground">₦{Number(request.amountPaid).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Submission Date:</span>
            <span className="font-bold text-foreground">
              {new Date(request.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Modified Fields Details */}
        <div className="space-y-3 text-xs">
          <h4 className="font-black uppercase text-[11px] text-muted-foreground tracking-wider">Modification Specifications</h4>

          {/* Change of Name */}
          {request.modifyName && (
            <div className="p-3.5 rounded-xl border border-border bg-background space-y-1.5">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <User size={14} className="text-emerald-500" />
                <span>New Legal Name</span>
              </div>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 pl-5">
                {[request.newFirstName, request.newMiddleName, request.newLastName].filter(Boolean).join(" ")}
              </p>
            </div>
          )}

          {/* Change of Phone */}
          {request.modifyPhone && (
            <div className="p-3.5 rounded-xl border border-border bg-background space-y-1.5">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Phone size={14} className="text-emerald-500" />
                <span>New Phone Number</span>
              </div>
              <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 pl-5">
                {request.newPhone}
              </p>
            </div>
          )}

          {/* Change of DOB */}
          {request.modifyDob && (
            <div className="p-3.5 rounded-xl border border-border bg-background space-y-1.5">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald-500" />
                <span>New Date of Birth</span>
              </div>
              <div className="pl-5 space-y-1">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                  {request.newDob} {request.currentDob && <span className="text-muted-foreground text-[11px] font-normal">(Previous: {request.currentDob})</span>}
                </p>
                {request.surchargeApplied && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    ⚡ 5-Year Threshold Surcharge Applied (+₦{Number(request.surchargeAmount || 5000).toLocaleString()})
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Uploaded Documents */}
        {request.documentUrls && request.documentUrls.length > 0 && (
          <div className="space-y-2 text-xs">
            <h4 className="font-black uppercase text-[11px] text-muted-foreground tracking-wider">Uploaded Proofs</h4>
            <div className="flex flex-wrap gap-2">
              {request.documentUrls.map((url: string, i: number) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 font-mono text-[11px] border border-border"
                >
                  <FileText size={12} />
                  <span>Document #{i + 1}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Completed Resolution Slip Download */}
        {request.status === "COMPLETED" && request.slipUrl && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <CheckCircle2 size={16} />
              <span>Updated NIBSS BVN Slip is ready for download</span>
            </div>
            <a
              href={request.slipUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
            >
              <Download size={15} />
              <span>Download Updated BVN Slip (PDF)</span>
            </a>
          </div>
        )}

        {/* Modal Close Action */}
        <Button
          type="button"
          onClick={onClose}
          className="w-full h-11 bg-secondary text-foreground font-bold text-xs rounded-xl hover:bg-secondary/80 cursor-pointer"
        >
          Close Details
        </Button>
      </div>
    </div>
  );
}
