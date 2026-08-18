"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, ArrowRight, IdentificationCard, DeviceMobile, 
  Sparkle, ShieldCheck, CheckCircle, Clock, FilePdf, Lightning,
  Info
} from "@phosphor-icons/react";
import NinHistorySection, { SlipHistoryItem } from "@/components/features/nin/slips/NinHistorySection";

export default function NinSlipsHubPage() {
  const [history, setHistory] = useState<SlipHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/nin/slips/history", { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.history) {
          setHistory(data.history);
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 sm:p-6 font-sans select-none relative pb-24 animate-in fade-in duration-300">
      {/* Back Button */}
      <div>
        <Link 
          href="/dashboard/nin" 
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary px-3.5 py-2 rounded-xl cursor-pointer"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" />
          Back to NIN Services Hub
        </Link>
      </div>

      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center p-3 border border-border shrink-0 shadow-sm">
            <Image src="/nimc.png" width={48} height={48} alt="NIMC Logo" className="object-contain" priority />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Official Verification Gateway
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground mt-1">NIMC Slip Verification & Generation</h1>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">
              Select your lookup method below to generate and download official NIMC identity slips.
            </p>
          </div>
        </div>
      </div>

      {/* METHOD SELECTION CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            How would you like to verify identity?
          </h2>
          <span className="text-xs text-muted-foreground font-medium">Dedicated workflows</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* OPTION 1: VERIFY BY NIN NUMBER */}
          <Link
            href="/dashboard/nin/slips/nin"
            className="group relative overflow-hidden bg-card hover:bg-secondary/30 border-2 border-border hover:border-[#ff3f7a]/50 rounded-3xl p-6 sm:p-8 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-[#ff3f7a]/5 rounded-full blur-2xl group-hover:bg-[#ff3f7a]/15 transition-all pointer-events-none" />

            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-[#ff3f7a]/10 text-[#ff3f7a] border border-[#ff3f7a]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <IdentificationCard size={32} weight="duotone" />
                </div>
                <span className="text-[11px] font-bold bg-[#ff3f7a]/10 text-[#ff3f7a] border border-[#ff3f7a]/20 px-3 py-1 rounded-full">
                  All 5 Slips Supported
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-foreground group-hover:text-[#ff3f7a] transition-colors flex items-center gap-2">
                  Verify by NIN Number
                  <ArrowRight size={20} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-[#ff3f7a]" weight="bold" />
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                  Generate official verification slips using your 11-digit National Identity Number. Choose from Basic, VNIN, Regular, Standard Biometric, or Premium Card layouts.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-semibold bg-secondary px-2.5 py-1 rounded-lg text-foreground border border-border">Basic (₦400)</span>
                <span className="text-[10px] font-semibold bg-secondary px-2.5 py-1 rounded-lg text-foreground border border-border">VNIN (₦500)</span>
                <span className="text-[10px] font-semibold bg-secondary px-2.5 py-1 rounded-lg text-foreground border border-border">Regular (₦500)</span>
                <span className="text-[10px] font-semibold bg-secondary px-2.5 py-1 rounded-lg text-foreground border border-border">Standard (₦700)</span>
                <span className="text-[10px] font-semibold bg-[#ff3f7a]/10 text-[#ff3f7a] px-2.5 py-1 rounded-lg border border-[#ff3f7a]/20 font-bold">Premium (₦1,000)</span>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between text-xs font-bold text-[#ff3f7a] group-hover:underline">
              <span>Open NIN Verification Form</span>
              <ArrowRight size={16} weight="bold" />
            </div>
          </Link>

          {/* OPTION 2: VERIFY BY PHONE NUMBER */}
          <Link
            href="/dashboard/nin/slips/phone"
            className="group relative overflow-hidden bg-card hover:bg-secondary/30 border-2 border-border hover:border-sky-500/50 rounded-3xl p-6 sm:p-8 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/15 transition-all pointer-events-none" />

            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-sky-500/10 text-sky-500 border border-sky-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DeviceMobile size={32} weight="duotone" />
                </div>
                <span className="text-[11px] font-bold bg-sky-500/10 text-sky-500 border border-sky-500/20 px-3 py-1 rounded-full">
                  SIM-Linked Lookup
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-foreground group-hover:text-sky-500 transition-colors flex items-center gap-2">
                  Verify by Phone Number
                  <ArrowRight size={20} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-sky-500" weight="bold" />
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                  Don&apos;t have your 11-digit NIN handy? Generate official verification slips instantly using your registered SIM phone number.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-semibold bg-secondary px-2.5 py-1 rounded-lg text-foreground border border-border">Regular Official (₦500)</span>
                <span className="text-[10px] font-semibold bg-secondary px-2.5 py-1 rounded-lg text-foreground border border-border">Standard Biometric (₦700)</span>
                <span className="text-[10px] font-semibold bg-sky-500/10 text-sky-500 px-2.5 py-1 rounded-lg border border-sky-500/20 font-bold">Premium Card (₦1,000)</span>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between text-xs font-bold text-sky-500 group-hover:underline">
              <span>Open Phone Verification Form</span>
              <ArrowRight size={16} weight="bold" />
            </div>
          </Link>

        </div>
      </div>

      {/* TRUST PILLARS & SPECIFICATIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="bg-secondary/30 border border-border p-4 rounded-2xl flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <Lightning size={20} weight="bold" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Instant Fulfillment</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">Automated dual-provider routing ensures slips render in seconds.</p>
          </div>
        </div>

        <div className="bg-secondary/30 border border-border p-4 rounded-2xl flex items-start gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
            <ShieldCheck size={20} weight="bold" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Demographic Records</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">Extracts full names, DOB, gender, and addresses with PDF slips.</p>
          </div>
        </div>

        <div className="bg-secondary/30 border border-border p-4 rounded-2xl flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Clock size={20} weight="bold" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">24-Hour Re-Download</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">Slips remain accessible in your print ledger for 24 hours.</p>
          </div>
        </div>
      </div>

      {/* 24-HOUR PRINT HISTORY SECTION */}
      <NinHistorySection history={history} />
    </div>
  );
}
