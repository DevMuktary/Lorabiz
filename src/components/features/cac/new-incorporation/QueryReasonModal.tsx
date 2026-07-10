"use client";

import { X, WarningCircle, CheckCircle, ChatCircleText, Clock, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface QueryReasonModalProps {
  businessName: string;
  reason: string;
  status: "RESOLVED" | "QUERIED" | "UNRESOLVED" | string;
  date: string;
  onClose: () => void;
  onResolve: () => void;
}

export default function QueryReasonModal({ businessName, reason, status, date, onClose, onResolve }: QueryReasonModalProps) {
  const isResolved = status === "RESOLVED";

  return (
    <div className="fixed inset-0 z-[300] flex justify-end">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-card h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-secondary/50 shrink-0">
          <h3 className="font-black text-lg text-foreground flex items-center gap-2">
            {isResolved ? (
              <CheckCircle className="h-6 w-6 text-emerald-500" weight="fill" />
            ) : (
              <WarningCircle className="h-6 w-6 text-amber-500" weight="fill" />
            )}
            Query Feedback
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X weight="bold" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-background space-y-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Business Name</p>
            <p className="text-base font-black text-foreground">{businessName || "Unnamed Registration"}</p>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-sm relative">
            <ChatCircleText className="absolute top-5 right-5 h-6 w-6 text-amber-500/20" weight="fill" />
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3 border-b border-amber-500/20 pb-2">
              CAC Examiner Notes
            </p>
            <p className="text-sm font-bold text-amber-950 dark:text-amber-100 leading-relaxed whitespace-pre-wrap">
              {reason || "No specific reason provided by the examiner. Please review your application thoroughly."}
            </p>
          </div>

          {!isResolved && (
            <div className="bg-secondary/50 border border-border p-4 rounded-xl">
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                To resolve this, click the button below to enter the resolution wizard. You will not be charged again.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground border-t border-border pt-4">
            <Clock className="h-4 w-4" weight="bold" /> Last Updated: {new Date(date).toLocaleDateString()}
          </div>
        </div>

        {!isResolved && (
          <div className="p-6 border-t border-border bg-secondary/30 shrink-0">
            <Button 
              onClick={onResolve}
              className="w-full h-14 bg-primary text-primary-foreground hover:opacity-90 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              Go to Resolve <ArrowRight weight="bold" className="h-5 w-5" />
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
