"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  ArrowLeft, Search, RefreshCw, Filter, ChevronLeft, ChevronRight, PhoneCall, CheckCircle, XCircle, ArrowCounterClockwise
} from 'lucide-react';

export default function AirtimePipelinePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null); // Tracks which row is currently refunding
  const [pipeline, setPipeline] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); 
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchPipeline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mds/pipeline/airtime'); 
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();
      setPipeline(result.pipeline || []);
    } catch (error) {
      console.error("Pipeline error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  const handleRefund = async (transactionId: string) => {
    if (!confirm("Are you sure you want to refund this transaction? The funds will be returned to the client's wallet immediately.")) return;
    
    setIsProcessing(transactionId);
    try {
      const response = await fetch("/api/mds/pipeline/airtime/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId })
      });
      const result = await response.json();
      
      if (!response.ok || !result.success) throw new Error(result.error || "Refund failed");
      
      alert("Refund processed successfully.");
      fetchPipeline(); // Refresh the table
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredPipeline = useMemo(() => {
    let result = pipeline.filter((ticket) => {
      const matchesSearch = 
        ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === "SUCCESS") matchesTab = ticket.status === "SUCCESS";
      if (activeTab === "FAILED") matchesTab = ticket.status === "FAILED";
      if (activeTab === "REVERSED") matchesTab = ticket.status === "REVERSED";

      return matchesSearch && matchesTab;
    });

    return result;
  }, [pipeline, searchTerm, activeTab]);

  const paginatedPipeline = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPipeline.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPipeline, currentPage]);

  const totalPages = Math.ceil(filteredPipeline.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <div>
        <Link href="/quadrox-lorabiz-team/mds/dashboard/orders" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors">
          <ArrowLeft size={16} className="mr-1.5" /> Back to Global Pipeline
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Airtime & VTU Directory</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Review Airtime purchases, resolve disputes, and issue refunds.</p>
          </div>
          <button 
            onClick={fetchPipeline}
            className="flex items-center justify-center px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Log
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 scrollbar-hide">
          <TabButton label="All Transactions" count={pipeline.length} isActive={activeTab === "ALL"} onClick={() => setActiveTab("ALL")} />
          <TabButton label="Successful" count={pipeline.filter(t => t.status === "SUCCESS").length} isActive={activeTab === "SUCCESS"} onClick={() => setActiveTab("SUCCESS")} />
          <TabButton label="Failed System" count={pipeline.filter(t => t.status === "FAILED").length} isActive={activeTab === "FAILED"} onClick={() => setActiveTab("FAILED")} />
          <TabButton label="Refunded / Reversed" count={pipeline.filter(t => t.status === "REVERSED").length} isActive={activeTab === "REVERSED"} onClick={() => setActiveTab("REVERSED")} />
        </div>

        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search phone number, reference, or name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Transaction Date</th>
                <th className="px-6 py-4 font-medium">Details (Network & Phone)</th>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Amount & Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Loading ledger...</td></tr>
              ) : paginatedPipeline.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-500">
                      <PhoneCall size={40} className="text-zinc-300 dark:text-zinc-700 mb-3" />
                      <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">No airtime transactions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPipeline.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {format(new Date(tx.createdAt), "MMM dd, yyyy • p")}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{tx.description}</p>
                      <span className="inline-block mt-1 font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">
                        {tx.reference}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{tx.clientName}</p>
                      <p className="text-xs text-zinc-500">{tx.clientEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-zinc-900 dark:text-zinc-100">₦{Number(tx.amount).toLocaleString()}</p>
                      <div className="mt-1">
                        <StatusBadge status={tx.status} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(tx.status === "SUCCESS" || tx.status === "FAILED") ? (
                        <button 
                          onClick={() => handleRefund(tx.id)}
                          disabled={isProcessing === tx.id}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-colors px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/20 disabled:opacity-50"
                        >
                          {isProcessing === tx.id ? <RefreshCw size={14} className="animate-spin" /> : <ArrowCounterClockwise size={14} />}
                          Refund
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-zinc-400 italic">Refunded</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW */}
        <div className="md:hidden divide-y divide-zinc-200 dark:divide-zinc-800 w-full">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500">Loading ledger...</div>
          ) : paginatedPipeline.map((tx: any) => (
            <div key={tx.id} className="p-4 space-y-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{tx.description}</p>
                  <p className="text-xs text-zinc-500 mt-1">{format(new Date(tx.createdAt), "MMM dd, yyyy • p")}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-zinc-900 dark:text-zinc-100">₦{Number(tx.amount).toLocaleString()}</p>
                  <div className="mt-1"><StatusBadge status={tx.status} /></div>
                </div>
              </div>
              <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div>
                  <p className="text-xs text-zinc-500">Client:</p>
                  <p className="font-medium text-xs text-zinc-900 dark:text-zinc-100">{tx.clientName}</p>
                </div>
                {(tx.status === "SUCCESS" || tx.status === "FAILED") && (
                  <button 
                    onClick={() => handleRefund(tx.id)}
                    disabled={isProcessing === tx.id}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/20"
                  >
                    {isProcessing === tx.id ? <RefreshCw size={12} className="animate-spin" /> : <ArrowCounterClockwise size={12} />}
                    Refund
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between bg-zinc-50 dark:bg-zinc-950/50 gap-4">
            <p className="text-xs text-zinc-500">
              Showing <span className="font-medium text-zinc-900 dark:text-white">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="font-medium text-zinc-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredPipeline.length)}</span>
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 disabled:opacity-50 hover:bg-zinc-100 bg-white dark:bg-zinc-900"><ChevronLeft size={16} /> Prev</button>
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 min-w-[70px] text-center">Pg {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 disabled:opacity-50 hover:bg-zinc-100 bg-white dark:bg-zinc-900">Next <ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ label, count, isActive, onClick }: { label: string, count: number, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center whitespace-nowrap px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
        isActive ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10" : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      }`}
    >
      {label}
      <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] tabular-nums ${isActive ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"}`}>
        {count}
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "SUCCESS") return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded"><CheckCircle size={10} /> Success</span>;
  if (status === "FAILED") return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 px-2 py-0.5 rounded"><XCircle size={10} /> Failed</span>;
  if (status === "REVERSED") return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-0.5 rounded"><ArrowCounterClockwise size={10} /> Refunded</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{status}</span>;
}
