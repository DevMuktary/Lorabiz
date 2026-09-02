// src/components/features/nin/slips/SlipConfirmationModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { 
  X, Wallet, Sparkle, ArrowRight, Spinner, 
  ShieldCheck, DeviceMobile, IdentificationCard, Gift 
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
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const effectivePrice = useRewardCredit ? 0 : price;
  const isInsufficient = !useRewardCredit && walletBalance < price;
  const remainingBalance = useRewardCredit ? walletBalance : Math.max(0, walletBalance - price);
  const shortfall = Math.max(0, effectivePrice - walletBalance);

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] w-full h-[100dvh] bg-background/95 dark:bg-background/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-card text-card-foreground rounded-3xl border border-border shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 text-left p-6 space-y-5 my-auto max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              {searchType === "PHONE" ? (
                <DeviceMobile size={18} weight="bold" />
              ) : (
                <IdentificationCard size={18} weight="bold" />
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">
                {isInsufficient ? "Insufficient Balance" : "Confirm Slip Generation"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {searchType === "PHONE" ? "Query by Phone Number" : "Query by 11-digit NIN"}
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

        {/* REWARD PASS SELECTOR (If User has Free Passes) */}
        {availablePasses > 0 && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2 text-xs animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Gift weight="fill" className="h-4 w-4" />
                <span>Free Service Pass Available</span>
              </span>
              <span className="bg-emerald-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                {availablePasses} Pass{availablePasses > 1 ? "es" : ""} Left
              </span>
            </div>
            
            <label className="flex items-center gap-2.5 p-2 bg-background/80 dark:bg-background/40 rounded-xl border border-emerald-500/30 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useRewardCredit}
                onChange={(e) => onToggleRewardCredit?.(e.target.checked)}
                className="h-4 w-4 accent-emerald-500 rounded cursor-pointer"
              />
              <span className="font-bold text-foreground">
                Apply Free Pass (₦0.00 Fee • 100% Free)
              </span>
            </label>
          </div>
        )}

        {/* IF INSUFFICIENT WALLET BALANCE & NO PASS APPLIED */}
        {isInsufficient ? (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl select-none">😭</span>
                <div>
                  <h4 className="font-black text-sm text-foreground">You don&apos;t have enough balance</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please top up your wallet to generate this slip.
                  </p>
                </div>
              </div>

              <div className="bg-background/80 dark:bg-background/50 rounded-xl p-3 border border-border space-y-1.5 text-xs">
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
                <div className="flex justify-between border-t border-border pt-1.5 font-bold">
                  <span className="text-amber-600 dark:text-amber-400">Shortfall:</span>
                  <span className="text-amber-600 dark:text-amber-400">₦{shortfall.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11 rounded-xl font-bold border-border"
              >
                Cancel
              </Button>
              <Link
                href="/dashboard"
                className="h-11 rounded-xl font-black bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2 text-sm shadow-md transition-all cursor-pointer"
              >
                <Wallet size={16} weight="bold" />
                <span>Fund Wallet</span>
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </div>
        ) : (
          /* SUFFICIENT BALANCE OR FREE PASS APPLIED */
          <div className="space-y-4">
            
            {/* Specimen Slip Preview Container */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground px-1">
                <span>Slip Format Specimen</span>
                <span className="text-primary font-semibold">{slipLabel}</span>
              </div>
              <div className="relative w-full h-36 bg-secondary/30 rounded-2xl border border-border overflow-hidden p-2 flex items-center justify-center">
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
            </div>

            {/* Transaction Breakdown */}
            <div className="bg-secondary/40 p-4 rounded-2xl border border-border space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{searchType === "PHONE" ? "Phone Number:" : "NIN:"}</span>
                <span className="font-mono font-bold text-foreground bg-background px-2 py-0.5 rounded-md border border-border">
                  {identifier}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Slip Type:</span>
                <span className="font-bold text-foreground">{slipLabel}</span>
              </div>

              <div className="flex justify-between items-center border-t border-border pt-2">
                <span className="text-muted-foreground">Generation Fee:</span>
                {useRewardCredit ? (
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1">
                    <span className="line-through text-muted-foreground text-xs">₦{price.toLocaleString()}</span>
                    <span>FREE (1 Pass)</span>
                  </span>
                ) : (
                  <span className="font-black text-foreground text-sm">₦{price.toLocaleString()}</span>
                )}
              </div>

              <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                <span>Wallet Balance After:</span>
                <span className="font-mono font-bold text-foreground">₦{remainingBalance.toLocaleString()}</span>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
              By confirming, you authorize retrieval of the official verified NIMC record. This request will be processed immediately.
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="h-12 rounded-2xl font-bold border-border"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`h-12 rounded-2xl font-black text-sm shadow-md transition-all cursor-pointer ${
                  useRewardCredit
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Spinner size={16} className="animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : useRewardCredit ? (
                  <div className="flex items-center gap-1.5">
                    <Sparkle size={16} weight="fill" />
                    <span>Generate Free Slip</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span>Pay ₦{price.toLocaleString()}</span>
                    <ArrowRight size={14} weight="bold" />
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
