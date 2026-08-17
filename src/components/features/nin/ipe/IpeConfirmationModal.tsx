"use client";

import React from "react";
import { AlertCircle, Clock, ShieldCheck, Wallet } from "lucide-react";

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
  if (!isOpen) return null;

  const remainingBalance = walletBalance - price;
  const isInsufficient = walletBalance < price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-6">
        
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Confirm IPE Clearance Request
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Verify your Tracking ID and debit details before processing.
            </p>
          </div>
        </div>

        {/* Request Details Breakdown */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">Service:</span>
            <span className="font-semibold text-slate-900 dark:text-white">NIMC IPE Clearance</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">Tracking ID:</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/40">
              {trackingId}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Time:
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-300">~24 Hours</span>
          </div>

          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 dark:text-slate-400">Service Fee:</span>
              <span className="font-bold text-slate-900 dark:text-white">₦{price.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Current Balance:</span>
              <span className="text-slate-600 dark:text-slate-300">₦{walletBalance.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Balance After Debit:</span>
              <span className={isInsufficient ? "text-rose-600 font-bold" : "text-emerald-600 font-medium"}>
                ₦{remainingBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Warning Notice */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3.5 flex gap-3 text-xs text-amber-900 dark:text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            This service will be processed within ~24 hours. Please ensure the Tracking ID you are submitting actually has an IPE issue.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || isInsufficient}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : isInsufficient ? (
              <span>Insufficient Funds</span>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                <span>Debit & Submit</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
