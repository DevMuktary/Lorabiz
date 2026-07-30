// src/app/dashboard/tax-id/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, Clock, CheckCircle, SpinnerGap, 
  FileText, Copy, MagnifyingGlass, Funnel 
} from "@phosphor-icons/react";

type TaxRecord = {
  id: string;
  type: string;
  firstName?: string;
  lastName?: string;
  cacNumber?: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED";
  createdAt: string;
  taxIdNumber?: string;
};

export default function TaxIdHistoryPage() {
  const [history, setHistory] = useState<TaxRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "PROCESSING" | "COMPLETED">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/tax-id");
        const data = await res.json();
        if (data.history) setHistory(data.history);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter Logic
  const filteredHistory = history.filter(item => {
    const searchTarget = item.type === "INDIVIDUAL" 
      ? `${item.firstName} ${item.lastName}`.toLowerCase() 
      : (item.cacNumber || "").toLowerCase();
      
    const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const processingCount = history.filter(h => h.status === "PENDING" || h.status === "PROCESSING").length;
  const completedCount = history.filter(h => h.status === "COMPLETED").length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header & Back Button */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/tax-id"
          className="h-10 w-10 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-secondary transition-colors"
        >
          <ArrowLeft weight="bold" className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black">Tax ID (TIN) History</h1>
          <p className="text-muted-foreground text-sm">Track your applications and copy your generated TINs.</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
            <SpinnerGap className="h-6 w-6 text-blue-500 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground">Processing</p>
            <p className="text-2xl font-black">{processingCount}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle weight="fill" className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground">Completed</p>
            <p className="text-2xl font-black">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search by Name or CAC Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Funnel weight="bold" className="h-4 w-4 text-muted-foreground shrink-0" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none font-bold transition-all cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center text-muted-foreground">
            <SpinnerGap className="h-8 w-8 animate-spin mb-4" />
            <p>Loading history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-muted-foreground text-center">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-bold">No requests found</p>
            <p className="text-sm mt-1">Adjust your filters or submit a new Tax ID request.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-bold text-muted-foreground">Date</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">Registration Details</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">Status</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground text-right">Generated TIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(item.createdAt), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      {item.type === "INDIVIDUAL" ? (
                        <>
                          <p className="font-bold text-foreground text-base">{item.firstName} {item.lastName}</p>
                          <p className="text-xs font-bold uppercase tracking-wider text-primary mt-1">Individual TIN</p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-foreground text-base uppercase">{item.cacNumber}</p>
                          <p className="text-xs font-bold uppercase tracking-wider text-blue-500 mt-1">Corporate TIN</p>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1.5 text-yellow-600 bg-yellow-500/10 px-3 py-1.5 rounded-full text-xs font-bold border border-yellow-500/20">
                          <Clock weight="fill" className="h-4 w-4" /> Pending
                        </span>
                      )}
                      {item.status === "PROCESSING" && (
                        <span className="inline-flex items-center gap-1.5 text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-500/20">
                          <SpinnerGap className="h-4 w-4 animate-spin" /> Processing
                        </span>
                      )}
                      {item.status === "COMPLETED" && (
                        <span className="inline-flex items-center gap-1.5 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full text-xs font-bold border border-green-500/20">
                          <CheckCircle weight="fill" className="h-4 w-4" /> Completed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status === "COMPLETED" && item.taxIdNumber ? (
                        <div className="flex items-center justify-end gap-3">
                          {/* Very Large, Prominent TIN Display */}
                          <span className="font-black text-green-600 dark:text-green-400 tracking-[0.15em] text-xl bg-green-500/10 px-4 py-2 rounded-xl border-2 border-green-500/20 shadow-inner">
                            {item.taxIdNumber}
                          </span>
                          
                          <button 
                            onClick={() => handleCopy(item.taxIdNumber!)}
                            className={`p-2.5 rounded-xl text-white font-bold transition-all shadow-md active:scale-95 flex items-center justify-center w-12 h-12 ${
                              copiedId === item.taxIdNumber 
                                ? "bg-green-500 hover:bg-green-600" 
                                : "bg-primary hover:opacity-90"
                            }`}
                            title="Copy TIN"
                          >
                            {copiedId === item.taxIdNumber 
                              ? <CheckCircle weight="bold" className="h-5 w-5" /> 
                              : <Copy weight="bold" className="h-5 w-5" />
                            }
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic font-medium pr-4">Awaiting Generation...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
