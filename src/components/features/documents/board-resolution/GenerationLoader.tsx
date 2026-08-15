"use client";

import React, { useState, useEffect } from "react";
import { 
  Sparkle, 
  CheckCircle, 
  Spinner, 
  ShieldCheck, 
  Buildings, 
  Bank, 
  FilePdf, 
  Stamp,
  Lock
} from "@phosphor-icons/react";
import { GENERATION_STAGES } from "./schema";

interface GenerationLoaderProps {
  companyName: string;
  targetInstitution?: string;
}

export default function GenerationLoader({
  companyName,
  targetInstitution
}: GenerationLoaderProps) {
  const [activeStageIdx, setActiveStageIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStageIdx((prev) => {
        if (prev < GENERATION_STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  const progressPercent = Math.min(100, Math.round(((activeStageIdx + 1) / GENERATION_STAGES.length) * 100));

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-6 sm:p-12 text-center bg-card/60 backdrop-blur-md rounded-3xl border border-border/80 shadow-2xl relative overflow-hidden animate-in fade-in duration-500">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Center Shield Emblem with Animated Orbit Ring */}
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary shadow-xl relative z-10 animate-pulse">
          <ShieldCheck className="h-10 w-10" weight="fill" />
        </div>
        <div className="absolute inset-0 -m-3 rounded-3xl border border-dashed border-primary/40 animate-spin" style={{ animationDuration: "12s" }} />
      </div>

      {/* Title & Metadata */}
      <div className="space-y-1.5 max-w-lg mb-6 z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
          <Sparkle className="h-3.5 w-3.5" weight="fill" />
          <span>AI Legal Document Architect</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
          Generating Certified Resolution
        </h2>
        <p className="text-xs text-muted-foreground">
          Synthesizing CAMA 2020 compliant clauses for <span className="font-bold text-foreground">{companyName || "your entity"}</span>
          {targetInstitution ? ` & ${targetInstitution}` : ""}.
        </p>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full max-w-md space-y-2 mb-8 z-10">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-primary font-mono">{GENERATION_STAGES[activeStageIdx].badge}</span>
          <span className="text-foreground font-mono">{progressPercent}%</span>
        </div>
        <div className="h-2.5 w-full bg-secondary/80 rounded-full overflow-hidden p-0.5 border border-border/80">
          <div 
            className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Progressive Stage Stepper Cards */}
      <div className="w-full max-w-md space-y-2.5 z-10 text-left">
        {GENERATION_STAGES.map((stage, idx) => {
          const isDone = idx < activeStageIdx;
          const isCurrent = idx === activeStageIdx;
          const isUpcoming = idx > activeStageIdx;

          return (
            <div
              key={stage.step}
              className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-center gap-3.5 ${
                isCurrent
                  ? "bg-primary/10 border-primary shadow-sm scale-[1.02]"
                  : isDone
                  ? "bg-secondary/40 border-border/70 opacity-90"
                  : "bg-secondary/20 border-border/40 opacity-40"
              }`}
            >
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500" weight="fill" />
                ) : isCurrent ? (
                  <Spinner className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-muted-foreground/40 flex items-center justify-center text-[10px] font-bold text-muted-foreground font-mono">
                    {stage.step}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold truncate ${
                  isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {stage.title}
                </p>
                <p className="text-[10.5px] text-muted-foreground truncate">
                  {stage.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Notice Footer */}
      <div className="mt-8 flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium z-10">
        <Lock className="h-3.5 w-3.5 text-emerald-500" weight="bold" />
        <span>End-to-End Encrypted &bull; CAMA 2020 Statutory Authority</span>
      </div>
    </div>
  );
}
