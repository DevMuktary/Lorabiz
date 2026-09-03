// src/components/features/airtime/AirtimeConfirmationModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { 
  X, Wallet, Check, Spinner, 
  DeviceMobile, Phone, ShieldCheck, Gift, Sparkle 
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface AirtimeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  network: string;
  phone: string;
  amount: number;
  walletBalance: number;
  availableAirtimeDiscount?: number;
  useRewardDiscount?: boolean;
  onToggleRewardDiscount?: (useDiscount: boolean) => void;
}

export default function AirtimeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  network,
  phone,
  amount,
  walletBalance,
  availableAirtimeDiscount = 0,
  useRewardDiscount = false,
  onToggleRewardDiscount,
}: AirtimeConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const discount = useRewardDiscount ? Math.min(amount, availableAirtimeDiscount) : 0;
  const payableAmount = Math.max(0, amount - discount);
  const isInsufficient = walletBalance < payableAmount;
  const remainingBalance = Math.max(0, walletBalance - payableAmount);
  const shortfall = Math.max(0, payableAmount - walletBalance);

  const logoMap: Record<string, string> = {
    MTN: "/mtn.png",
    AIRTEL: "/airtel.png",
    GLO: "/glo.png",
    "9MOBILE": "/9mobile.png",
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-background/80 dark:bg-background/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={!isLoading ? onClose : undefined}
    >
      <div 
        className="relative w-full max-w-sm sm:max-w-md bg-card text-card-foreground rounded-2xl sm:rounded-3xl border border-border shadow-2xl p-4 sm:p-5 space-y-3.5 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200 text-left my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <DeviceMobile size={18} weight="bold" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-foreground">
                {isInsufficient ? "Insufficient Balance" : "Confirm Airtime Top-Up"}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                VTU Telecom Airtime Vending
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

        {/* INSUFFICIENT BALANCE STATE */}
        {isInsufficient ? (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl select-none">😭</span>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-foreground">You don&apos;t have enough balance</h4>
                  <p className="text-[11px] text-muted-foreground">
                    Top up your wallet to complete this recharge.
                  </p>
                </div>
              </div>

              <div className="bg-background/80 dark:bg-background/50 rounded-lg p-2.5 border border-border space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recharge Amount:</span>
                  <span className="font-bold text-foreground">₦{amount.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Reward Discount:</span>
                    <span>-₦{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Required to Pay:</span>
                  <span className="font-bold text-destructive">₦{payableAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Balance:</span>
                  <span className="font-bold text-foreground">₦{walletBalance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-1 font-bold">
                  <span className="text-amber-600 dark:text-amber-400">Shortfall:</span>
                  <span className="text-amber-600 dark:text-amber-400">₦{shortfall.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                onClick={onClose}
                className="h-10 text-xs font-bold text-muted-foreground rounded-xl"
              >
                Cancel
              </Button>
              <Link 
                href="/dashboard/wallet"
                className="h-10 bg-primary text-primary-foreground font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
              >
                <Wallet size={14} weight="bold" />
                <span>Fund Wallet</span>
              </Link>
            </div>
          </div>
        ) : (
          /* SUFFICIENT BALANCE STATE */
          <div className="space-y-3">
            <div className="bg-secondary/40 border border-border rounded-xl p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Network Provider:</span>
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  {logoMap[network.toUpperCase()] && (
                    <Image 
                      src={logoMap[network.toUpperCase()]} 
                      alt={network} 
                      width={16} 
                      height={16} 
                      className="object-contain" 
                    />
                  )}
                  <span>{network.toUpperCase()}</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient Phone:</span>
                <span className="font-mono font-bold text-foreground">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recharge Amount:</span>
                <span className="font-black text-foreground">₦{amount.toLocaleString()}</span>
              </div>

              {/* REWARD DISCOUNT SELECTOR (If User has won Airtime Discount) */}
              {availableAirtimeDiscount > 0 && (
                <div className="border-t border-dashed border-emerald-500/30 pt-1.5 mt-1">
                  <label className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 cursor-pointer select-none">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={useRewardDiscount}
                        onChange={(e) => onToggleRewardDiscount?.(e.target.checked)}
                        className="h-3.5 w-3.5 accent-emerald-500 rounded cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        Apply Airtime Reward (-₦{availableAirtimeDiscount.toLocaleString()})
                      </span>
                    </div>
                    <span className="text-[9px] font-black uppercase bg-emerald-500 text-white px-1.5 py-0.2 rounded">
                      SAVE ₦{discount}
                    </span>
                  </label>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Discount Deducted:</span>
                  <span>-₦{discount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-border pt-1.5 font-bold">
                <span className="text-foreground">Total to Debit:</span>
                {payableAmount === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">₦0.00 (100% Free!)</span>
                ) : (
                  <span className="text-foreground font-mono font-black">₦{payableAmount.toLocaleString()}</span>
                )}
              </div>

              <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                <span>Wallet Balance After:</span>
                <span className="font-mono font-bold text-foreground">₦{remainingBalance.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {payableAmount === 0
                ? `100% covered by your Airtime Reward! ₦${amount.toLocaleString()} will be sent instantly to ${phone}.`
                : `₦${payableAmount.toLocaleString()} will be debited from wallet and full ₦${amount.toLocaleString()} airtime sent to ${phone}.`}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="h-10 text-xs font-bold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Spinner size={14} className="animate-spin" weight="bold" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} weight="bold" />
                    <span>Pay ₦{payableAmount.toLocaleString()}</span>
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
