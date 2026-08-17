"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  History, 
  KeyRound, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  Wallet
} from "lucide-react";
import { IpeSubmissionForm } from "@/components/features/nin/ipe/IpeSubmissionForm";

export default function IpeClearancePage() {
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [servicePrice, setServicePrice] = useState<number>(2500);
  const [isServiceActive, setIsServiceActive] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [submittedResult, setSubmittedResult] = useState<{ reference: string; trackingId: string } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/nin/ipe/history");
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.walletBalance || 0);
        setServicePrice(data.servicePrice || 2500);
        setIsServiceActive(data.isServiceActive ?? true);
      }
    } catch (err) {
      console.error("Failed to load initial IPE data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = (result: { reference: string; trackingId: string }) => {
    setSubmittedResult(result);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20">
      
      {/* Top Header & Breadcrumbs */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/nin"
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Link href="/dashboard" className="hover:text-slate-600 dark:hover:text-slate-300">Dashboard</Link>
                <span>/</span>
                <Link href="/dashboard/nin" className="hover:text-slate-600 dark:hover:text-slate-300">NIMC Services</Link>
                <span>/</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">IPE Clearance</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                IPE Exception Clearance
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/nin/ipe/history"
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>View History & Status</span>
            </Link>

            <Link
              href="/dashboard/wallet"
              className="h-10 px-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Wallet className="w-4 h-4" />
              <span>₦{walletBalance.toLocaleString()}</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Main Page Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {submittedResult ? (
          /* Post-Submission Success State */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Request Submitted Successfully
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your IPE Clearance request for Tracking ID <strong className="font-mono text-slate-800 dark:text-slate-200">{submittedResult.trackingId}</strong> has been submitted to NIMC.
              </p>
            </div>

            {/* Quick Status Notice */}
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Reference:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{submittedResult.reference}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  PROCESSING
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Time:</span>
                <span className="text-slate-700 dark:text-slate-300 font-medium">~24 Hours</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              We will send you an email notification as soon as the exception is cleared. You can track real-time progress on your History page.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard/nin/ipe/history"
                className="w-full sm:w-auto h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all"
              >
                <History className="w-4 h-4" />
                <span>Go to History & Tracking</span>
              </Link>
              
              <button
                type="button"
                onClick={() => setSubmittedResult(null)}
                className="w-full sm:w-auto h-12 px-6 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm transition-colors"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : isLoading ? (
          /* Loading Skeleton */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="text-sm font-medium">Loading IPE clearance service details...</span>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <IpeSubmissionForm
            walletBalance={walletBalance}
            servicePrice={servicePrice}
            isServiceActive={isServiceActive}
            onSuccess={handleSuccess}
          />
        )}

      </div>
    </div>
  );
}
