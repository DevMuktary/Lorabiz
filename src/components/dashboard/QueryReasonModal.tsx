"use client";

import { X, WarningCircle, CheckCircle, ChatCircleText, Clock } from "@phosphor-icons/react";

interface QueryReasonModalProps {
  businessName: string;
  reason: string;
  status: "RESOLVED" | "UNRESOLVED";
  date: string;
  onClose: () => void;
}

export default function QueryReasonModal({ businessName, reason, status, date, onClose }: QueryReasonModalProps) {
  const isResolved = status === "RESOLVED";

  return (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col"
        onClick={(e) => e.stopPropagation()} 
      >
        {/* HEADER */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${isResolved ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}>
          <div className="flex items-center gap-2">
            {isResolved ? (
              <CheckCircle className="h-5 w-5 text-emerald-600" weight="fill" />
            ) : (
              <WarningCircle className="h-5 w-5 text-amber-600" weight="fill" />
            )}
            <h3 className={`font-black text-sm uppercase tracking-wider ${isResolved ? 'text-emerald-900' : 'text-amber-900'}`}>
              Query Status: {status}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className={`p-1.5 rounded-full transition-colors ${isResolved ? 'hover:bg-emerald-100 text-emerald-700' : 'hover:bg-amber-100 text-amber-700'}`}
          >
            <X weight="bold" size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 sm:p-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Application Name</p>
          <p className="font-bold text-slate-900 mb-6 leading-tight text-lg">{businessName}</p>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 relative">
            <ChatCircleText className="absolute top-5 right-5 h-6 w-6 text-slate-200" weight="fill" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Official CAC Feedback</p>
            <p className="text-slate-800 font-medium text-sm leading-relaxed">
              {reason || "No specific reason was provided by the official reviewing this application. Please check your uploaded documents and alternative names."}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 border-t border-slate-100 pt-4">
            <Clock className="h-4 w-4" /> Date Queried: {date}
          </div>
        </div>

      </div>
    </div>
  );
}
