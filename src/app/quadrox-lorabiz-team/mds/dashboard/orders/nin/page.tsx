"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  ArrowLeft, Search, RefreshCw, Eye, CheckCircle2, XCircle, Zap, X, CornerUpLeft, AlertCircle
} from 'lucide-react';

export default function NinPipelinePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [pipeline, setPipeline] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, SUCCESS, FAILED
  
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchPipeline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mds/pipeline/nin');
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();
      setPipeline(result.pipeline);
    } catch (error) {
      console.error("Pipeline error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const filteredPipeline = useMemo(() => {
    return pipeline.filter((log) => {
      const matchesSearch = 
        log.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ninMasked.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTab = activeTab === "ALL" || log.status === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [pipeline, searchTerm, activeTab]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Back Button */}
      <div>
        <Link href="/quadrox-lorabiz-team/mds/dashboard/orders" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors">
          <ArrowLeft size={16} className="mr-1.5" /> Back to Global Pipeline
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center">
              Identity Services Directory
              <span className="ml-3 text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 rounded-full uppercase tracking-wider flex items-center">
                <Zap size={10} className="mr-1" /> Automated
              </span>
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Live monitoring ledger for instant NIN slip generation.</p>
          </div>
          <button 
            onClick={fetchPipeline}
            className="flex items-center justify-center px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Feed
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 scrollbar-hide">
          <TabButton label="All Requests" count={pipeline.length} isActive={activeTab === "ALL"} onClick={() => setActiveTab("ALL")} />
          <TabButton label="Successful" count={pipeline.filter(t => t.status === "SUCCESS").length} isActive={activeTab === "SUCCESS"} onClick={() => setActiveTab("SUCCESS")} />
          <TabButton label="Failed (Requires Attention)" count={pipeline.filter(t => t.status === "FAILED").length} isActive={activeTab === "FAILED"} onClick={() => setActiveTab("FAILED")} alert />
        </div>

        {/* Search */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by client, reference, or masked NIN..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Log Details</th>
                <th className="px-6 py-4 font-medium">Client Info</th>
                <th className="px-6 py-4 font-medium text-right">Amount Charged</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <RefreshCw className="animate-spin mx-auto mb-3 text-indigo-500" size={24} />
                    Loading feed...
                  </td>
                </tr>
              ) : filteredPipeline.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No requests found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredPipeline.map((log: any) => (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{log.slipType.replace('_', ' ').toUpperCase()}</span>
                        <div className="flex items-center text-xs text-zinc-500 mt-1">
                          <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400 mr-2">{log.ninMasked}</span>
                          {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{log.clientName}</p>
                      <p className="text-xs text-zinc-500">{log.clientEmail}</p>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{formatCurrency(log.amountCharged)}</span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={log.status} />
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        title="Inspect Log"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <NinInspectionDrawer 
        log={selectedLog} 
        onClose={() => setSelectedLog(null)} 
        formatCurrency={formatCurrency}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

function TabButton({ label, count, isActive, onClick, alert = false }: { label: string, count: number, isActive: boolean, onClick: () => void, alert?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center whitespace-nowrap px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
        isActive 
          ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5" 
          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      }`}
    >
      {label}
      <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] tabular-nums ${
        isActive ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
      } ${alert && count > 0 && !isActive ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20" : ""}`}>
        {count}
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'SUCCESS') return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 size={12} className="mr-1" /> Success</span>;
  if (status === 'FAILED') return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"><XCircle size={12} className="mr-1" /> Failed</span>;
  return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-zinc-100 text-zinc-700">{status}</span>;
}

// ----------------------------------------------------------------------
// NIN INSPECTION & REFUND DRAWER
// ----------------------------------------------------------------------

function NinInspectionDrawer({ log, onClose, formatCurrency }: { log: any, onClose: () => void, formatCurrency: (v: number) => string }) {
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  if (!log) return null;

  const handleIssueRefund = async () => {
    if (!refundReason.trim() || refundReason.length < 5) {
      setError("Please provide a valid reason for the refund.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // Re-uses the existing financial refund API we built earlier
      const res = await fetch("/api/mds/financials/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          transactionId: log.reference, // The NinRequestLog 'reference' maps directly to the Wallet Transaction ID
          refundAmount: log.amountCharged, 
          reason: `NIN Generation Dispute/Failure: ${refundReason}` 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process refund");
      
      // Close drawer after success
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-zinc-900/60 transition-opacity animate-in fade-in duration-200" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center text-zinc-900 dark:text-zinc-100">
              <Zap size={20} className="mr-2 text-indigo-500" /> Automated Log Details
            </h3>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 bg-white dark:bg-zinc-800 rounded-full shadow-sm"><X size={18} /></button>
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{log.slipType.replace('_', ' ')}</span>
              <h4 className="text-xl font-mono font-bold text-zinc-900 dark:text-white leading-tight mt-1">{log.ninMasked}</h4>
            </div>
            <StatusBadge status={log.status} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="space-y-6">
            
            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-3 text-sm">
              <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span className="text-zinc-500 font-medium">Timestamp</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{format(new Date(log.createdAt), 'MMM do, yyyy • h:mm a')}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span className="text-zinc-500 font-medium">Client Name</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{log.clientName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span className="text-zinc-500 font-medium">Client Email</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{log.clientEmail}</span>
              </div>
              <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span className="text-zinc-500 font-medium">Wallet Transaction Ref</span>
                <span className="font-mono text-xs bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded">{log.reference}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-zinc-500 font-medium">Amount Charged</span>
                <span className="font-bold text-lg tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(log.amountCharged)}</span>
              </div>
            </div>

            {/* Refund Action */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              {!showRefundForm ? (
                <button 
                  onClick={() => setShowRefundForm(true)} 
                  className="w-full flex items-center justify-center py-2.5 border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 font-bold rounded-lg text-sm transition-colors"
                >
                  <CornerUpLeft size={16} className="mr-2" /> Dispute & Issue Refund
                </button>
              ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl space-y-4 animate-in slide-in-from-top-2">
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400 flex items-center">
                    <AlertCircle size={16} className="mr-1.5" /> Revert Charge to Wallet
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-500">This will explicitly refund {formatCurrency(log.amountCharged)} to {log.clientName}'s wallet and log the action.</p>
                  
                  <div>
                    <input 
                      type="text" 
                      placeholder="Reason for refund (Required)" 
                      value={refundReason} 
                      onChange={(e) => setRefundReason(e.target.value)} 
                      className="w-full bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-500/30 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" 
                    />
                  </div>
                  
                  {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
                  
                  <div className="flex gap-2">
                    <button onClick={() => setShowRefundForm(false)} className="flex-1 py-2 border border-amber-200 dark:border-amber-500/30 rounded-md text-sm text-amber-800 dark:text-amber-400 font-medium hover:bg-amber-100 dark:hover:bg-amber-500/20">Cancel</button>
                    <button onClick={handleIssueRefund} disabled={isProcessing} className="flex-1 py-2 bg-amber-600 text-white rounded-md flex justify-center items-center text-sm font-medium hover:bg-amber-700 disabled:opacity-50">
                      {isProcessing ? <RefreshCw size={16} className="animate-spin" /> : "Confirm Refund"}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
