"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, History, Sparkle, Lock } from "lucide-react";
import BvnModificationForm from "@/components/features/bvn/modification/BvnModificationForm";

export default function BvnModificationPage() {
  const [pricing, setPricing] = useState({
    BVN_MOD_NAME: 3000,
    BVN_MOD_PHONE: 2500,
    BVN_MOD_DOB: 15000,
    BVN_MOD_DOB_SURCHARGE: 5000,
  });
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bvn/modification", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.pricing) setPricing(data.pricing);
          if (data.walletBalance !== undefined) setWalletBalance(data.walletBalance);
        }
      }
    } catch (err) {
      console.error("Failed to load BVN modification initial data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-4 font-sans relative space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/bvn" 
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to BVN Hub
        </Link>

        <Link
          href="/dashboard/bvn/modification/history"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
        >
          <History size={14} />
          <span>My Modification Requests</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="flex items-center gap-4 border-b border-border pb-5">
        <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center p-2.5 border border-border shrink-0 shadow-sm">
          <Image 
            src="/nibss.png" 
            alt="NIBSS BVN Logo" 
            width={44} 
            height={44} 
            className="object-contain" 
            priority 
          />
        </div>
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1">
            <Lock size={11} />
            Official NIBSS Gateway
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">BVN Record Modification</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-medium">
            Update or correct legal name, phone number, and date of birth on your Bank Verification Number.
          </p>
        </div>
      </div>

      {/* Main Modification Form */}
      <BvnModificationForm 
        pricing={pricing} 
        walletBalance={walletBalance} 
        onSuccess={() => fetchInitialData()} 
      />
    </div>
  );
}
