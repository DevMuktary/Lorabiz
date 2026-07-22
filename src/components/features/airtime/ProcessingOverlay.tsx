"use client";

import { Broadcast, CellSignalFull, Planet } from "@phosphor-icons/react";

export default function ProcessingOverlay({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md text-white animate-in fade-in duration-300 select-none p-6 text-center">
      
      {/* Animated Signal Graphic */}
      <div className="relative flex items-center justify-center mb-12 w-48 h-48">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75 duration-1000" />
        <div className="absolute inset-4 rounded-full border-4 border-dashed border-primary/50 animate-[spin_6s_linear_infinite]" />
        
        <div className="absolute top-0 right-4 text-emerald-400 animate-pulse">
          <Planet size={32} weight="fill" />
        </div>
        
        <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-2xl shadow-primary/40 border border-white/20 animate-bounce">
          <Broadcast size={48} weight="duotone" className="animate-pulse" />
        </div>
        
        <div className="absolute -bottom-4 flex gap-1">
          <CellSignalFull size={24} weight="fill" className="text-emerald-400 animate-pulse delay-75" />
          <CellSignalFull size={24} weight="fill" className="text-emerald-400 animate-pulse delay-150" />
        </div>
      </div>

      <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
        Connecting to Network...
      </h3>
      <p className="text-sm text-slate-300 font-medium tracking-wide max-w-sm leading-relaxed animate-pulse">
        We are  transmitting your airtime request to the provider. Please do not close this window.
      </p>

      <div className="w-64 h-2 bg-slate-800 rounded-full mt-10 overflow-hidden shadow-inner relative">
        <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-emerald-400 to-primary w-[200%] animate-[slide_2s_linear_infinite]" />
      </div>
    </div>
  );
}
