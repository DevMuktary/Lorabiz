"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Play, Trash, Eye, FileText, WarningCircle, 
  Archive, IdentificationCard, DotsThreeVertical
} from "@phosphor-icons/react";

interface ActionMenuProps {
  reg: any; 
  onExecute: (action: string, id: string, rowData: any) => void; 
}

export default function ActionMenu({ reg, onExecute }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const handleAction = (e: React.MouseEvent, action: string) => {
    e.stopPropagation(); 
    setIsOpen(false);
    onExecute(action, reg.id, reg); 
  };

  const MenuContent = (
    <div 
      ref={menuRef}
      style={{ top: coords.top, right: coords.right }}
      className="fixed w-56 bg-card rounded-xl shadow-[0_12px_40px_rgb(0,0,0,0.12)] border border-border z-[9999] py-2 animate-in fade-in zoom-in-95 transition-colors"
    >
        {reg.status === 'UNSUBMITTED' && (
          <>
            <button onClick={(e) => handleAction(e, "CONTINUE")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary flex items-center gap-3 cursor-pointer">
              <Play className="h-4 w-4 text-primary" weight="fill" /> Continue Draft
            </button>
            <button onClick={(e) => handleAction(e, "DELETE")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-3 cursor-pointer">
              <Trash className="h-4 w-4" weight="fill" /> Delete Draft
            </button>
          </>
        )}

        {reg.status === 'PENDING' && (
          <>
            <button onClick={(e) => handleAction(e, "VIEW")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary flex items-center gap-3 cursor-pointer">
              <Eye className="h-4 w-4 text-blue-500" weight="fill" /> View Application
            </button>
            <button onClick={(e) => handleAction(e, "DOWNLOAD_RECEIPT")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary flex items-center gap-3 cursor-pointer">
              <FileText className="h-4 w-4 text-muted-foreground" weight="fill" /> Download Receipt
            </button>
          </>
        )}

        {reg.status === 'QUERIED' && (
          <>
            <button onClick={(e) => handleAction(e, "RESOLVE")} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 bg-red-500/5 hover:bg-red-500/10 flex items-center gap-3 border-l-2 border-red-500 cursor-pointer">
              <WarningCircle className="h-4 w-4" weight="fill" /> Resolve Query
            </button>
            <button onClick={(e) => handleAction(e, "VIEW_REASON")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary flex items-center gap-3 cursor-pointer">
              <FileText className="h-4 w-4 text-amber-500" weight="fill" /> View Query Reason
            </button>
            <button onClick={(e) => handleAction(e, "VIEW")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary flex items-center gap-3 cursor-pointer">
              <Eye className="h-4 w-4 text-blue-500" weight="fill" /> View Application
            </button>
          </>
        )}

        {reg.status === 'APPROVED' && (
          <>
            <div className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 mb-1">Official Documents</div>
            <button onClick={(e) => handleAction(e, "DOWNLOAD_CERT")} className="w-full text-left px-4 py-2.5 text-sm font-bold text-foreground hover:bg-secondary flex items-center gap-3 cursor-pointer">
              <Archive className="h-4 w-4 text-emerald-500" weight="fill" /> CAC Certificate
            </button>
            <button onClick={(e) => handleAction(e, "DOWNLOAD_STATUS")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary flex items-center gap-3 cursor-pointer">
              <FileText className="h-4 w-4 text-muted-foreground" weight="fill" /> Status Report
            </button>
            {(reg.entityType?.includes('LLC') || reg.entityType?.includes('Limited') || reg._appType === "LLC") && (
              <button onClick={(e) => handleAction(e, "DOWNLOAD_MEMART")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary flex items-center gap-3 cursor-pointer">
                <FileText className="h-4 w-4 text-muted-foreground" weight="fill" /> Download MEMART
              </button>
            )}
            {reg.entityType?.includes('NGO') && (
              <button onClick={(e) => handleAction(e, "DOWNLOAD_CONSTITUTION")} className="w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary flex items-center gap-3 cursor-pointer">
                <FileText className="h-4 w-4 text-muted-foreground" weight="fill" /> Download Constitution
              </button>
            )}
            <div className="border-t border-border my-1"></div>
            <button onClick={(e) => handleAction(e, "VIEW_TIN")} className="w-full text-left px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 flex items-center gap-3 cursor-pointer">
              <IdentificationCard className="h-4 w-4" weight="fill" /> View JTB TIN
            </button>
          </>
        )}
    </div>
  );

  return (
    <>
      <button 
        ref={buttonRef}
        onClick={toggleMenu}
        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors focus:outline-none cursor-pointer"
      >
        <DotsThreeVertical className="h-6 w-6" weight="bold" />
      </button>
      
      {mounted && isOpen && document.body && createPortal(MenuContent, document.body)}
    </>
  );
}
