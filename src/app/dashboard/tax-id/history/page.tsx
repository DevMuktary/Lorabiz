// src/app/dashboard/tax-id/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Clock, CheckCircle, SpinnerGap, FileText, Copy } from "@phosphor-icons/react";

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

  const pendingCount = history.filter(h => h.status === "PENDING" || h.status === "PROCESSING").length;
  const completedCount = history.filter(h => h.status === "COMPLETED").length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tax-id" className="h-10 w-10 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft weight="bold" className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black">Tax ID (TIN) History</h1>
          <p className="text-muted-foreground text-sm">Track your TIN generation requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
            <SpinnerGap className="h-6 w-6 text-blue-500 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground">Processing</p>
            <p className="text-2xl font-black">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle weight="fill" className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground">Completed</p>
            <p className="text-2xl font-black">{completedCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center text-muted-foreground">
            <SpinnerGap className="h-8 w-8 animate-spin mb-4" />
            <p>Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-muted-foreground text-center">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-bold">No requests found</p>
            <p className="text-sm mt-1">Submit a new Tax ID request to see it here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-bold text-muted-foreground">Date</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">Details</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">Status</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">Generated TIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(item.createdAt), "MMM dd, yyyy h:mm a")}
                    </td>
                    <td className="px-6 py-4">
                      {item.type === "INDIVIDUAL" ? (
                        <>
                          <p className="font-bold text-foreground">{item.firstName} {item.lastName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Individual</p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-foreground">{item.cacNumber}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Corporate</p>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1.5 text-yellow-600 bg-yellow-500/10 px-2.5 py-1 rounded-full text-xs font-bold border border-yellow-500/20">
                          <Clock weight="fill" className="h-3 w-3" /> Pending
                        </span>
                      )}
                      {item.status === "PROCESSING" && (
                        <span className="inline-flex items-center gap-1.5 text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-full text-xs font-bold border border-blue-500/20">
                          <SpinnerGap className="h-3 w-3 animate-spin" /> Processing
                        </span>
                      )}
                      {item.status === "COMPLETED" && (
                        <span className="inline-flex items-center gap-1.5 text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full text-xs font-bold border border-green-500/20">
                          <CheckCircle weight="fill" className="h-3 w-3" /> Completed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {item.status === "COMPLETED" && item.taxIdNumber ? (
                        <div className="flex items-center gap-2">
                          <span className="font-black text-green-600 dark:text-green-400 tracking-widest text-lg bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">
                            {item.taxIdNumber}
                          </span>
                          <button 
                            onClick={() => navigator.clipboard.writeText(item.taxIdNumber!)}
                            className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy TIN"
                          >
                            <Copy weight="bold" className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Awaiting Generation</span>
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
