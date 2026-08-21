"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { 
  X, Wallet, Sparkle, Spinner, 
  ShieldCheck, IdentificationBadge, Phone, User, Check
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface BvnRetrievalConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  fullName: string;
  phone: string;
  price: number;
  walletBalance: number;
}

export default function BvnRetrievalConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  fullName,
  phone,
  price,
  walletBalance,
}: BvnRetrievalConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const isInsufficient = walletBalance < price;
  const remainingBalance = Math.max(0, walletBalance - price);
  const shortfall = Math.max(0, price - walletBalance);

  return createPortal(
    <div 
      className="fixed inset-0 h-full w-full min-h-[100dvh] z-[99999] flex items-center justify-center p-4 bg-background/98 dark:bg-background/98 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-card text-card-foreground rounded-3xl border border-border shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 fade-in duration-300 text-left my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <IdentificationBadge size={20} weight="bold" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">
                {isInsufficient ? "Insufficient Balance" : "Confirm BVN Retrieval"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                NIBSS Bank Verification Number Portal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {/* IF INSUFFICIENT WALLET BALANCE */}
        {isInsufficient ? (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl select-none">😭</span>
                <div>
                  <h4 className="font-black text-sm text-foreground">You don&apos;t have enough balance</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please top up your wallet to retrieve this BVN.
                  </p>
                </div>
              </div>

              <div className="bg-background/80 dark:bg-background/50 rounded-xl p-3 border border-border space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-bold text-foreground">BVN Number Retrieval</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Required Fee:</span>
                  <span className="font-bold text-destructive">₦{price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Balance:</span>
                  <span className="font-bold text-foreground">₦{walletBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-1.5">
                  <span className="text-muted-foreground font-semibold">Shortfall Amount:</span>
                  <span className="font-black text-destructive">₦{shortfall.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Link 
                href="/dashboard/wallet"
                className="w-full h-11 bg-primary text-primary-foreground font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:opacity-90 transition-opacity"
              >
                <Wallet size={16} weight="bold" />
                <span>Fund Wallet</span>
              </Link>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full h-10 text-xs font-bold text-muted-foreground cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* IF SUFFICIENT WALLET BALANCE */
          <div className="space-y-4">
            
            <div className="bg-secondary/40 border border-border rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Full Legal Name:</span>
                <span className="font-bold text-foreground text-right">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Linked Phone:</span>
                <span className="font-mono font-bold text-foreground">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processing Fee:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">₦{price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="font-bold text-foreground">₦{walletBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-2">
                <span className="text-muted-foreground">Remaining Balance:</span>
                <span className="font-bold text-foreground">₦{remainingBalance.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Upon confirmation, <strong>₦{price.toLocaleString()}</strong> will be debited from your wallet and your retrieval will be processed within 1 to 24 hours.
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 h-11 text-xs font-bold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Spinner size={14} className="animate-spin" weight="bold" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} weight="bold" />
                    <span>Yes, Submit Request</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
