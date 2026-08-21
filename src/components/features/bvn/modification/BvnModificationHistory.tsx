"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  History, CheckCircle2, Clock, AlertTriangle, FileText, 
  ArrowRight, RefreshCw, Eye, Download, Search, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BvnModificationDetailsModal from "./BvnModificationDetailsModal";

export default function BvnModificationHistory() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bvn/modification/history", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRequests(data.requests || []);
        }
      }
    } catch (err) {
      console.error("Failed to load BVN modification history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredRequests = requests.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.trackingId?.toLowerCase().includes(q) ||
      r.bvn?.toLowerCase().includes(q) ||
      r.currentFullName?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} /> Completed
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Clock size={12} /> In Review
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertTriangle size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header / Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Tracking ID, BVN, or Name..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={fetchHistory}
            className="h-11 px-4 text-xs font-bold gap-2 cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </Button>

          <Link
            href="/dashboard/bvn/modification"
            className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Plus size={16} />
            <span>New Modification</span>
          </Link>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground font-medium">Loading BVN modification history...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center space-y-4 max-w-sm mx-auto px-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto text-muted-foreground">
              <History size={28} />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground">No Modification Requests Found</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {searchQuery ? "No requests match your search criteria." : "You haven't submitted any BVN modification requests yet."}
              </p>
            </div>
            {!searchQuery && (
              <Link
                href="/dashboard/bvn/modification"
                className="inline-flex items-center justify-center gap-2 h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
              >
                <span>Submit BVN Modification</span>
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-b border-border text-[11px] font-mono uppercase text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Tracking ID</th>
                  <th className="py-3.5 px-4 font-bold">BVN &amp; Name</th>
                  <th className="py-3.5 px-4 font-bold">Modified Fields</th>
                  <th className="py-3.5 px-4 font-bold">Fee Paid</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold">Date</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {filteredRequests.map((r) => {
                  const fields = [
                    r.modifyName ? "Name" : null,
                    r.modifyPhone ? "Phone" : null,
                    r.modifyDob ? "DOB" : null,
                  ].filter(Boolean);

                  return (
                    <tr key={r.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-foreground">
                        {r.trackingId}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-foreground">{r.bvn}</div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">{r.currentFullName}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {fields.map((f, i) => (
                            <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary text-foreground">
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-bold text-foreground">
                        ₦{Number(r.amountPaid).toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(r.status)}
                      </td>
                      <td className="py-4 px-4 text-muted-foreground whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRequest(r)}
                          className="h-8 px-2.5 text-xs font-bold gap-1 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Details</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <BvnModificationDetailsModal
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
      />
    </div>
  );
}
