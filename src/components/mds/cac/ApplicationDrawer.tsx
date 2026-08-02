"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  X, CheckCircle, FileText, UserPlus, File, Briefcase, Building2
} from 'lucide-react';
import { TabButton } from './CacShared';

// Imported modular tabs
import CacInfoTab from './CacInfoTab';
import CacPeopleTab from './CacPeopleTab';
import CacDocsTab from './CacDocsTab';
import CacActionTab from './CacActionTab';

export default function ApplicationDrawer({ 
  ticket, 
  staffList, 
  onClose, 
  onUpdateSuccess 
}: { 
  ticket: any | null, 
  staffList: any[],
  onClose: () => void,
  onUpdateSuccess: () => void
}) {
  const [activeTab, setActiveTab] = useState("INFO"); // INFO, PEOPLE, DOCS, ACTION

  if (!ticket) return null;

  const isLlc = ticket.type === "LLC";
  const statusColor = 
    ticket.status === "APPROVED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
    ticket.status === "QUERIED" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" :
    ticket.status === "FAILED" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" :
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans">
      <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl h-full bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header Ribbon */}
        <div className="px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-white dark:bg-zinc-900 shrink-0 shadow-sm z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-1 text-xs font-black uppercase tracking-widest rounded-md ${statusColor}`}>
                {ticket.status}
              </span>
              <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700">
                Ref: {ticket.trackingId}
              </span>
              {isLlc ? (
                <span className="flex items-center text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 px-2 py-1 rounded">
                  <Building2 size={12} className="mr-1.5" /> LLC Formation
                </span>
              ) : (
                <span className="flex items-center text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 px-2 py-1 rounded">
                  <Briefcase size={12} className="mr-1.5" /> Business Name
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{ticket.proposedName}</h2>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">Submitted: {format(new Date(ticket.createdAt), "PPP 'at' p")}</p>
          </div>
          
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-8 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 overflow-x-auto scrollbar-hide z-10 shadow-sm">
          <TabButton active={activeTab === "INFO"} onClick={() => setActiveTab("INFO")} label="Application Info" icon={<FileText size={16} />} />
          <TabButton active={activeTab === "PEOPLE"} onClick={() => setActiveTab("PEOPLE")} label="Personnel & Roles" icon={<UserPlus size={16} />} />
          <TabButton active={activeTab === "DOCS"} onClick={() => setActiveTab("DOCS")} label="Client Documents" icon={<File size={16} />} />
          <TabButton active={activeTab === "ACTION"} onClick={() => setActiveTab("ACTION")} label="Admin Action Hub" icon={<CheckCircle size={16} />} alert={ticket.status === "PENDING"} />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {activeTab === "INFO" && (
             <CacInfoTab ticket={ticket} isLlc={isLlc} />
          )}

          {activeTab === "PEOPLE" && (
             <CacPeopleTab ticket={ticket} isLlc={isLlc} />
          )}

          {activeTab === "DOCS" && (
             <CacDocsTab ticket={ticket} isLlc={isLlc} />
          )}

          {activeTab === "ACTION" && (
             <CacActionTab ticket={ticket} staffList={staffList} onUpdateSuccess={onUpdateSuccess} />
          )}

        </div>
      </div>
    </div>
  );
}