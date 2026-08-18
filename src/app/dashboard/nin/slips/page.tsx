"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, IdentificationCard, DeviceMobile } from "@phosphor-icons/react";

export default function NinSlipsHubPage() {
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 font-sans select-none relative animate-in fade-in duration-300 min-h-[70vh] flex flex-col justify-center">
      
      {/* Back Link */}
      <div className="mb-6">
        <Link 
          href="/dashboard/nin" 
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft weight="bold" className="h-3.5 w-3.5" />
          Back to NIN Services
        </Link>
      </div>

      {/* Centered Selection Banner */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-lg text-center space-y-8 relative overflow-hidden">
        
        {/* Header */}
        <div className="space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-secondary mx-auto flex items-center justify-center p-2.5 border border-border shadow-sm">
            <Image src="/nimc.png" width={40} height={40} alt="NIMC" className="object-contain" priority />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Select Verification Method
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Choose how you would like to query the NIMC database:
            </p>
          </div>
        </div>

        {/* 2 Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          
          {/* Query by Phone Number */}
          <Link
            href="/dashboard/nin/slips/phone"
            className="group p-5 sm:p-6 rounded-2xl bg-secondary/30 hover:bg-sky-500/10 border-2 border-border hover:border-sky-500/60 transition-all duration-200 flex flex-col justify-between space-y-4 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center border border-sky-500/20 group-hover:scale-105 transition-transform">
                <DeviceMobile size={28} weight="duotone" />
              </div>
              <ArrowRight size={18} className="text-muted-foreground group-hover:text-sky-500 group-hover:translate-x-1 transition-all" weight="bold" />
            </div>

            <div>
              <h3 className="text-base font-black text-foreground group-hover:text-sky-500 transition-colors">
                Query by Phone Number
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Generate official verification slips using your SIM-linked phone number.
              </p>
            </div>
          </Link>

          {/* Query by NIN */}
          <Link
            href="/dashboard/nin/slips/nin"
            className="group p-5 sm:p-6 rounded-2xl bg-secondary/30 hover:bg-[#ff3f7a]/10 border-2 border-border hover:border-[#ff3f7a]/60 transition-all duration-200 flex flex-col justify-between space-y-4 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-[#ff3f7a]/10 text-[#ff3f7a] flex items-center justify-center border border-[#ff3f7a]/20 group-hover:scale-105 transition-transform">
                <IdentificationCard size={28} weight="duotone" />
              </div>
              <ArrowRight size={18} className="text-muted-foreground group-hover:text-[#ff3f7a] group-hover:translate-x-1 transition-all" weight="bold" />
            </div>

            <div>
              <h3 className="text-base font-black text-foreground group-hover:text-[#ff3f7a] transition-colors">
                Query by NIN
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Generate official verification slips using your 11-digit National Identity Number.
              </p>
            </div>
          </Link>

        </div>

      </div>

    </div>
  );
}
