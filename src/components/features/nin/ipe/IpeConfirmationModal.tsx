// src/components/features/nin/ipe/IpeConfirmationModal.tsx
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

interface IpeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  trackingId: string;
  price: number;
  walletBalance: number;
}

export function IpeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  trackingId,
  price,
  walletBalance,
}: IpeConfirmationModalProps) {
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
                <h3 className="text-lg font-black text-foreground">Confirm Clearance</h3>
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

          {/* Breakdown Box matching Tax ID */}
          <div className="bg-secondary/50 rounded-2xl p-4 space-y-2.5 border border-border text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Service</span>
              <span className="font-bold text-foreground">NIMC IPE Clearance</span>
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
              <span className="font-semibold text-foreground">~24 Hours</span>
            </div>

            <div className="flex justify-between items-end border-t border-border pt-3 mt-3">
              <span className="text-muted-foreground text-xs sm:text-sm">Total Cost</span>
              <span className="font-black text-primary text-xl leading-none">
                ₦{price.toLocaleString()}
              </span>
            </div>
          </div>

          {/* If insufficient balance: display clean alert with link to /dashboard */}
          {isInsufficient ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span className="text-xl">😭</span>
                  <span>Insufficient Wallet Balance</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your balance is <strong className="text-foreground">₦{walletBalance.toLocaleString()}</strong>, but this clearance requires <strong className="text-foreground">₦{price.toLocaleString()}</strong>.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-secondary text-foreground font-bold rounded-xl hover:opacity-90 transition-opacity text-sm cursor-pointer"
                >
                  Cancel
                </button>

                <Link
                  href="/dashboard"
                  className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 text-sm text-center shadow-md cursor-pointer whitespace-nowrap"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight weight="bold" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Balance After Debit:</span>
                <span className="font-bold text-foreground">₦{remainingBalance.toLocaleString()}</span>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-secondary text-foreground font-bold rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
                >
                  {isLoading ? (
                    <>
                      <Spinner weight="bold" className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle weight="bold" className="h-4 w-4" />
                      <span>Pay & Submit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>,
    document.body
  );
}
