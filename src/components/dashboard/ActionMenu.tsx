"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Play, Trash, Eye, FileText, WarningCircle, 
  PencilSimpleLine, Archive, DownloadSimple, IdentificationCard, DotsThreeVertical
} from "@phosphor-icons/react";

interface ActionMenuProps {
  reg: {
    id: string;
    status: string;
    entityType: string;
  };
  onExecute: (action: string, id: string) => void;
}

export default function ActionMenu({ reg, onExecute }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (action: string) => {
    setIsOpen(false);
    onExecute(action, reg.id);
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors focus:outline-none"
      >
        <DotsThreeVertical className="h-6 w-6" weight="bold" />
      </button>

      {isOpen && (
        <div className="absolute right-8 top-0 w-56 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 z-50 py-2 animate-in fade-in zoom-in-95 origin-top-right">
          
          {/* DRAFT STATE */}
          {reg.status === 'UNSUBMITTED' && (
            <>
              <button onClick={() => handleAction("CONTINUE")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                <Play className="h-4 w-4 text-[#ff3f7a]" weight="fill" /> Continue Draft
              </button>
              <button onClick={() => handleAction("DELETE")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3">
                <Trash className="h-4 w-4" weight="fill" /> Delete Draft
              </button>
            </>
          )}

          {/* PENDING STATE */}
          {reg.status === 'PENDING' && (
            <>
              <button onClick={() => handleAction("VIEW")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                <Eye className="h-4 w-4 text-blue-500" weight="fill" /> View Application
              </button>
              <button onClick={() => handleAction("DOWNLOAD_RECEIPT")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                <FileText className="h-4 w-4 text-slate-400" weight="fill" /> Download Receipt
              </button>
            </>
          )}

          {/* QUERIED STATE */}
          {reg.status === 'QUERIED' && (
            <>
              <button onClick={() => handleAction("FIX_QUERIES")} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50/50 hover:bg-red-50 flex items-center gap-3 border-l-2 border-red-500">
                <WarningCircle className="h-4 w-4" weight="fill" /> Resolve Query
              </button>
              <button onClick={() => handleAction("VIEW_REASON")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                <FileText className="h-4 w-4 text-amber-500" weight="fill" /> View Query Reason
              </button>
              <button onClick={() => handleAction("VIEW")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                <Eye className="h-4 w-4 text-blue-500" weight="fill" /> View Application
              </button>
            </>
          )}

          {/* APPROVED STATE (THE DOCUMENT VAULT) */}
          {reg.status === 'APPROVED' && (
            <>
              <div className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 mb-1">Official Documents</div>
              
              <button onClick={() => handleAction("DOWNLOAD_CERT")} className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                <Archive className="h-4 w-4 text-emerald-500" weight="fill" /> CAC Certificate
              </button>
              <button onClick={() => handleAction("DOWNLOAD_STATUS")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                <FileText className="h-4 w-4 text-slate-400" weight="fill" /> Status Report
              </button>

              {/* Conditional Legal Documents based on Entity Type */}
              {(reg.entityType.includes('LLC') || reg.entityType.includes('Limited')) && (
                <button onClick={() => handleAction("DOWNLOAD_MEMART")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                  <FileText className="h-4 w-4 text-slate-400" weight="fill" /> Download MEMART
                </button>
              )}
              {reg.entityType.includes('NGO') && (
                <button onClick={() => handleAction("DOWNLOAD_CONSTITUTION")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-3">
                  <FileText className="h-4 w-4 text-slate-400" weight="fill" /> Download Constitution
                </button>
              )}

              <div className="border-t border-slate-100 my-1"></div>
              <button onClick={() => handleAction("VIEW_TIN")} className="w-full text-left px-4 py-2.5 text-sm font-bold text-[#ff3f7a] hover:bg-[#ff3f7a]/5 flex items-center gap-3">
                <IdentificationCard className="h-4 w-4" weight="fill" /> View JTB TIN
              </button>
            </>
          )}

        </div>
      )}
    </div>
  );
}
