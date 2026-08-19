"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { 
  X, Wallet, Sparkle, ArrowRight, Spinner, 
  ShieldCheck, DeviceMobile, IdentificationCard 
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
}: SlipConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const isInsufficient = walletBalance < price;
  const remainingBalance = Math.max(0, walletBalance - price);
  const shortfall = Math.max(0, price - walletBalance);

  return createPortal(
    <div className="fixed inset-0 min-h-screen w-screen bg-background/95 dark:bg-background/95 backdrop-blur-2xl z-[99999] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="fixed inset-0 min-h-screen w-screen" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-md bg-card text-card-foreground rounded-3xl border border-border shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 text-left p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        
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

        {/* IF INSUFFICIENT WALLET BALANCE */}
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
                href="/dashboard/wallet"
                className="h-11 rounded-xl font-black bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2 text-sm shadow-md transition-all cursor-pointer"
              >
                <Wallet size={16} weight="bold" />
                <span>Fund Wallet</span>
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          </div>
        ) : (
          /* SUFFICIENT BALANCE - CONFIRMATION WITH SPECIMEN IMAGE */
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
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Wallet Balance:</span>
                <span className="font-semibold text-foreground">₦{walletBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-t border-border/60 pt-2 font-black text-sm">
                <span>Amount to Debit:</span>
                <span className="text-primary text-base">₦{price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-0.5">
                <span>Balance After Debit:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₦{remainingBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Prompt */}
            <p className="text-xs text-muted-foreground text-center px-2">
              Are you sure you want to verify and generate this slip?
            </p>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="h-11 rounded-xl font-bold border-border"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="h-11 rounded-xl font-black bg-primary text-primary-foreground hover:opacity-90 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Spinner size={16} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Sparkle size={16} weight="fill" />
                    <span>Yes, Generate</span>
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
