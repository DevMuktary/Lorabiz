"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { 
  X, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  Spinner,
  SmileySad,
  Wallet,
  ArrowRight
} from "@phosphor-icons/react";

interface PersonalizationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  trackingId: string;
  price: number;
  walletBalance: number;
}

export function PersonalizationConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  trackingId,
  price,
  walletBalance,
}: PersonalizationConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const remainingBalance = walletBalance - price;
  const isInsufficient = walletBalance < price;

  return createPortal(
    <div className="fixed inset-0 min-h-screen w-screen z-[99999] flex items-center justify-center p-4 bg-background/80 dark:bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-300">
        
        <div className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck weight="bold" className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">Confirm Personalization</h3>
                <p className="text-xs text-muted-foreground">Verify details before debit.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="p-1 hover:bg-secondary rounded-full transition-colors disabled:opacity-50 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X weight="bold" className="h-5 w-5" />
            </button>
          </div>

          {/* Breakdown Box */}
          <div className="bg-secondary/50 rounded-2xl p-4 space-y-2.5 border border-border text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Service</span>
              <span className="font-bold text-foreground">NIN Personalization</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Tracking ID</span>
              <span className="font-mono font-bold text-foreground tracking-wider bg-background px-2 py-0.5 rounded-lg border border-border">
                {trackingId}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock weight="bold" className="h-3.5 w-3.5 text-primary" /> Turnaround
              </span>
              <span className="font-semibold text-foreground text-right">1 – 24 Hours (weekend delay possible)</span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
              ⚠️ <strong>No Refund Policy:</strong> Non-refundable once submitted (billed 100% upfront).
            </div>

            <div className="flex justify-between items-end border-t border-border pt-3 mt-3">
              <span className="text-muted-foreground text-xs sm:text-sm">Total Cost</span>
              <span className="font-black text-primary text-xl leading-none">
                ₦{price.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Wallet Balance State */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Wallet weight="bold" className="h-3.5 w-3.5 text-foreground" />
                Current Balance
              </span>
              <span className="font-mono font-bold text-foreground">
                ₦{walletBalance.toLocaleString()}
              </span>
            </div>

            {isInsufficient ? (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-destructive">
                <SmileySad weight="bold" className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Insufficient Wallet Balance</p>
                  <p className="opacity-90">
                    You need an additional ₦{(price - walletBalance).toLocaleString()} to complete this request.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Remaining Balance</span>
                <span className="font-mono font-bold text-foreground">
                  ₦{remainingBalance.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {isInsufficient ? (
              <Link
                href="/dashboard/wallet"
                className="flex-1 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm shadow-md"
              >
                <span>Fund Wallet</span>
                <ArrowRight weight="bold" className="h-4 w-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Spinner weight="bold" className="h-4 w-4 animate-spin" />
                    <span>Processing Submission...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle weight="fill" className="h-4 w-4" />
                    <span>Confirm & Submit</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-3.5 rounded-xl border border-border text-foreground font-bold text-sm hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
