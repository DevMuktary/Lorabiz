"use client";

import React, { useState, useMemo } from "react";
import { 
  MagnifyingGlass, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Copy, 
  Check, 
  FileText, 
  ArrowsClockwise 
} from "@phosphor-icons/react";
import { PersonalizationRequestRecord, PersonalizationDetailsModal } from "./PersonalizationDetailsModal";

interface PersonalizationHistoryTableProps {
  requests: PersonalizationRequestRecord[];
  onSync: (reference: string) => Promise<void>;
  isLoading: boolean;
}

export function PersonalizationHistoryTable({
  requests,
  onSync,
  isLoading,
}: PersonalizationHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatus, setActiveStatus] = useState<"ALL" | "PROCESSING" | "COMPLETED" | "FAILED">("ALL");
  const [selectedRecord, setSelectedRecord] = useState<PersonalizationRequestRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const matchesSearch =
        item.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.resolvedNin && item.resolvedNin.includes(searchTerm)) ||
        (item.fullName && item.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        activeStatus === "ALL" || item.status === activeStatus;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, activeStatus]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Tracking ID, NIN, Reference, or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border overflow-x-auto shrink-0">
          {(["ALL", "PROCESSING", "COMPLETED", "FAILED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveStatus(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize whitespace-nowrap cursor-pointer ${
                activeStatus === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "ALL" ? "All" : tab === "PROCESSING" ? "Processing" : tab === "COMPLETED" ? "Completed" : "Failed"}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm font-medium">
            <thead className="bg-secondary/40 border-b border-border text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Tracking ID / Ref</th>
                <th className="py-3.5 px-4">Applicant</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Resolved NIN</th>
                <th className="py-3.5 px-4">Fee</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    <ArrowsClockwise className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading your personalization records...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-xs">
                    No personalization records found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((item) => {
                  const statusBadge =
                    item.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : item.status === "FAILED"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedRecord(item)}
                      className="hover:bg-secondary/30 transition-colors cursor-pointer"
                    >
                      {/* Tracking ID & Ref */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                          <span>{item.trackingId}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopy(item.id, item.trackingId, e)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Copy Tracking ID"
                          >
                            {copiedId === item.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">{item.reference}</div>
                      </td>

                      {/* Applicant */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground">{item.fullName || "—"}</div>
                        <div className="text-[10px] text-muted-foreground">{item.phone || item.gender || ""}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge}`}>
                          {item.status === "COMPLETED" ? (
                            <CheckCircle weight="fill" className="h-3 w-3" />
                          ) : item.status === "FAILED" ? (
                            <XCircle weight="fill" className="h-3 w-3" />
                          ) : (
                            <Clock weight="fill" className="h-3 w-3" />
                          )}
                          {item.status === "PROCESSING" ? "Processing" : item.status}
                        </span>
                      </td>

                      {/* Resolved NIN */}
                      <td className="py-3.5 px-4">
                        {item.resolvedNin ? (
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-xs">
                            {item.resolvedNin}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      {/* Fee */}
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        ₦{item.amountCharged.toLocaleString()}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(item);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground text-xs font-bold transition-all shadow-sm"
                        >
                          <Eye weight="bold" className="h-3.5 w-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <PersonalizationDetailsModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        request={selectedRecord}
        onSync={onSync}
      />
    </div>
  );
}
