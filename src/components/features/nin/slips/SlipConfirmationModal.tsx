// src/components/features/nin/slips/SlipConfirmationModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { 
  X, Wallet, Sparkle, ArrowRight, Spinner, 
  DeviceMobile, IdentificationCard, Gift 
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface SlipConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  identifier: string;
  searchType: "NIN" | "PHONE";
  slipLabel: string;
  slipImage: string;
  price: number;
  walletBalance: number;
  availablePasses?: number;
  useRewardCredit?: boolean;
  onToggleRewardCredit?: (useCredit: boolean) => void;
}

export default function SlipConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  identifier,
  searchType,
  slipLabel,
  slipImage,
  price,
  walletBalance,
  availablePasses = 0,
  useRewardCredit = false,
  onToggleRewardCredit,
}: SlipConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen && mounted) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, mounted]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const effectivePrice = useRewardCredit ? 0 : price;
  const isInsufficient = !useRewardCredit && walletBalance < price;
  const remainingBalance = useRewardCredit ? walletBalance : Math.max(0, walletBalance - price);
  const shortfall = Math.max(0, effectivePrice - walletBalance);

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] w-full h-[100dvh] bg-background/80 dark:bg-background/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={!isLoading ? onClose : undefined}
    >
      <div 
        className="relative w-full max-w-sm sm:max-w-md bg-card text-card-foreground rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 text-left p-4 sm:p-5 space-y-3 my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {searchType === "PHONE" ? (
                <DeviceMobile size={16} weight="bold" />
              ) : (
                <IdentificationCard size={16} weight="bold" />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-foreground leading-tight">
                {isInsufficient ? "Insufficient Balance" : "Confirm Slip Generation"}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {searchType === "PHONE" ? "Query by Phone Number" : "Query by 11-digit NIN"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-6 h-6 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={12} weight="bold" />
          </button>
        </div>

        {/* IF INSUFFICIENT WALLET BALANCE */}
        {isInsufficient ? (
          <div className="space-y-3 py-1">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl select-none">😭</span>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-foreground">You don&apos;t have enough balance</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Please top up your wallet to generate this slip.
                  </p>
                </div>
              </div>

              <div className="bg-background/80 dark:bg-background/50 rounded-lg p-2.5 border border-border space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slip Format:</span>
                  <span className="font-bold text-foreground">{slipLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Required Fee:</span>
                  <span className="font-bold text-destructive">₦{price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Balance:</span>
                  <span className="font-bold text-foreground">₦{walletBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1 font-bold">
                  <span className="text-amber-600 dark:text-amber-400">Shortfall:</span>
                  <span className="text-amber-600 dark:text-amber-400">₦{shortfall.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-10 rounded-xl font-bold border-border text-xs"
              >
                Cancel
              </Button>
              <Link
                href="/dashboard/wallet"
                className="h-10 rounded-xl font-black bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-1.5 text-xs shadow-md transition-all cursor-pointer"
              >
                <Wallet size={14} weight="bold" />
                <span>Fund Wallet</span>
                <ArrowRight size={12} weight="bold" />
              </Link>
            </div>
          </div>
        ) : (
          /* SUFFICIENT BALANCE OR FREE REWARD APPLIED */
          <div className="space-y-3 py-1">
            
            {/* Specimen Slip Preview Container (Compact) */}
            <div className="relative w-full h-20 sm:h-24 bg-secondary/30 rounded-xl border border-border overflow-hidden p-1.5 flex items-center justify-center">
              <div className="relative w-full h-full">
                <Image 
                  src={slipImage} 
                  alt={slipLabel} 
                  fill 
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Transaction Breakdown */}
            <div className="bg-secondary/40 p-3 rounded-xl border border-border space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{searchType === "PHONE" ? "Phone Number:" : "NIN:"}</span>
                <span className="font-mono font-bold text-foreground bg-background px-2 py-0.5 rounded border border-border text-[11px]">
                  {identifier}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-bold text-foreground">{slipLabel}</span>
              </div>

              <div className="flex justify-between items-center border-t border-border pt-1.5">
                <span className="text-muted-foreground">Generation Fee:</span>
                {useRewardCredit ? (
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
                    <span className="line-through text-muted-foreground text-[10px]">₦{price.toLocaleString()}</span>
                    <span>₦0.00 (FREE)</span>
                  </span>
                ) : (
                  <span className="font-black text-foreground text-xs">₦{price.toLocaleString()}</span>
                )}
              </div>

              {/* Free Slip Checkbox (Inline & Compact) */}
              {availablePasses > 0 && (
                <div className="border-t border-dashed border-emerald-500/30 pt-1.5 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                    <input
                      type="checkbox"
                      checked={useRewardCredit}
                      onChange={(e) => onToggleRewardCredit?.(e.target.checked)}
                      className="h-3.5 w-3.5 accent-emerald-500 rounded cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      Apply Free Slip Reward ({availablePasses} left)
                    </span>
                  </label>
                </div>
              )}

              <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-0.5">
                <span>Wallet Balance After:</span>
                <span className="font-mono font-bold text-foreground">₦{remainingBalance.toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="h-10 rounded-xl font-bold border-border text-xs"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`h-10 rounded-xl font-black text-xs shadow-md transition-all cursor-pointer ${
                  useRewardCredit
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-1.5">
                    <Spinner size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : useRewardCredit ? (
                  <div className="flex items-center gap-1">
                    <Sparkle size={14} weight="fill" />
                    <span>Generate (₦0)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span>Pay ₦{price.toLocaleString()}</span>
                    <ArrowRight size={12} weight="bold" />
                  </div>
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
