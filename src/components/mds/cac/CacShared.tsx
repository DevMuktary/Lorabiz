"use client";

import { File, FileText, Download, RefreshCw } from "lucide-react";

export function TabButton({ label, icon, active, onClick, alert }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-5 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${
        active 
          ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900" 
          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      }`}
    >
      {icon} {label}
      {alert && !active && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
    </button>
  );
}

export function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-2">{title}</h3>
      {children}
    </div>
  );
}

export function DataBlock({ label, value, highlight }: { label: string, value: React.ReactNode, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-500/5 dark:border-indigo-500/30 shadow-sm' : 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1.5">{label}</p>
      <div className={`text-sm font-semibold whitespace-pre-wrap break-words ${highlight ? 'text-indigo-900 dark:text-indigo-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
        {value || "—"}
      </div>
    </div>
  );
}

// NEW: Explicit Address Breakdown to prevent Admin guessing
export function AddressBreakdown({ addressObj, title, icon }: { addressObj: any, title: string, icon?: React.ReactNode }) {
  if (!addressObj) return <DataBlock label={title} value="Not provided" />;
  
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{title}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <p className="text-[9px] font-bold uppercase text-zinc-400 mb-1">Street / House No.</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{addressObj.street || addressObj.address || addressObj.streetNo || "—"}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase text-zinc-400 mb-1">City / Town</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{addressObj.city || addressObj.town || "—"}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase text-zinc-400 mb-1">LGA</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{addressObj.lga || "—"}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase text-zinc-400 mb-1">State</p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{addressObj.state || addressObj.companyState || "—"}</p>
        </div>
      </div>
    </div>
  );
}

export function DocumentPreview({ 
  label, 
  url, 
  downloadName, 
  isDownloading, 
  onDownload 
}: { 
  label: string, 
  url: string | undefined, 
  downloadName: string, 
  isDownloading: boolean, 
  onDownload: (url: string, filename: string) => void 
}) {
  if (!url) {
    return (
      <div className="flex items-center justify-between p-5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950">
        <span className="text-sm font-semibold text-zinc-500">{label}</span>
        <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-200 dark:bg-zinc-800 text-zinc-500 px-2 py-1 rounded">Missing</span>
      </div>
    );
  }

  const extension = url.split('.').pop() || 'pdf';
  const finalDownloadName = `${downloadName}.${extension}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl shrink-0">
          <File size={24} />
        </div>
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate" title={label}>{label}</span>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-center"
        >
          View
        </a>
        <button 
          onClick={() => onDownload(url, finalDownloadName)}
          disabled={isDownloading}
          className="flex items-center text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity text-center cursor-pointer disabled:opacity-50"
        >
          {isDownloading ? <RefreshCw size={14} className="mr-1.5 animate-spin" /> : <Download size={14} className="mr-1.5" />}
          {isDownloading ? "Saving..." : "Save File"}
        </button>
      </div>
    </div>
  );
}

// SAFE DATA PARSERS 
export const parseJsonSafe = (data: any, fallback: any = {}) => {
  if (!data) return fallback;
  if (typeof data === 'string') {
    try { 
      const parsed = JSON.parse(data); 
      if (typeof parsed === 'string') return JSON.parse(parsed); // Handle double stringify
      return parsed;
    } catch { return fallback; }
  }
  return data;
};

export const handleForceDownload = async (url: string, filename: string, setDownloading: (url: string | null) => void) => {
  try {
    setDownloading(url);
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Download failed, falling back to new tab", err);
    window.open(url, '_blank');
  } finally {
    setDownloading(null);
  }
};