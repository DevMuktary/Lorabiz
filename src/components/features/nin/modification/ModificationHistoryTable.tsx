"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  MagnifyingGlass, 
  Copy, 
  Check, 
  Eye, 
  DownloadSimple, 
  Clock, 
  ArrowsClockwise, 
  CheckCircle, 
  XCircle, 
  User, 
  Phone, 
  MapPin, 
  Funnel,
  ArrowSquareOut
} from "@phosphor-icons/react";
import { NinModificationRecord, ModificationDetailsModal } from "./ModificationDetailsModal";
import { ModificationStatusFilter } from "./ModificationHistoryStats";

interface ModificationHistoryTableProps {
  requests: NinModificationRecord[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  activeStatus?: ModificationStatusFilter;
  onStatusChange?: (status: ModificationStatusFilter) => void;
}

const TYPE_CONFIG = {
  CHANGE_OF_NAME: {
    label: "Change of Name",
    icon: User,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
  },
  CHANGE_OF_PHONE: {
    label: "Change of Phone",
    icon: Phone,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
  },
  CHANGE_OF_ADDRESS: {
    label: "Change of Address",
    icon: MapPin,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
  },
};

export function ModificationHistoryTable({
  requests,
  isLoading,
  onRefresh,
  activeStatus: parentActiveStatus,
  onStatusChange,
}: ModificationHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [internalStatus, setInternalStatus] = useState<ModificationStatusFilter>("ALL");
  const [selectedRecord, setSelectedRecord] = useState<NinModificationRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const statusFilter = parentActiveStatus !== undefined ? parentActiveStatus : internalStatus;
  const setStatusFilter = (status: ModificationStatusFilter) => {
    if (onStatusChange) {
      onStatusChange(status);
    } else {
      setInternalStatus(status);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const s = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !s ||
        req.trackingId.toLowerCase().includes(s) ||
        req.transactionRef.toLowerCase().includes(s) ||
        (req.nin && req.nin.toLowerCase().includes(s)) ||
        (req.ninMasked && req.ninMasked.toLowerCase().includes(s)) ||
        (req.newFirstName && req.newFirstName.toLowerCase().includes(s)) ||
        (req.newLastName && req.newLastName.toLowerCase().includes(s)) ||
        (req.currentFullName && req.currentFullName.toLowerCase().includes(s)) ||
        (req.newPhoneNumber && req.newPhoneNumber.toLowerCase().includes(s)) ||
        (req.currentPhone && req.currentPhone.toLowerCase().includes(s));

      const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;
      const matchesType = typeFilter === "ALL" || req.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [requests, searchTerm, statusFilter, typeFilter]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openDetails = (record: NinModificationRecord) => {
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

  const getStatusBadge = (status: NinModificationRecord["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock weight="bold" className="h-3 w-3" />
            Pending Review
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <ArrowsClockwise weight="bold" className="h-3 w-3 animate-spin" />
            In Processing
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle weight="bold" className="h-3 w-3" />
            Completed
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle weight="bold" className="h-3 w-3" />
            Rejected
          </span>
        );
    }
  };

  const formattedDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formattedTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Details Inspection Modal */}
      <ModificationDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        request={selectedRecord}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border border-border">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <MagnifyingGlass weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Tracking ID, NIN, Name, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {/* Service Type Filter Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all"
            >
              <option value="ALL">All Modification Types</option>
              <option value="CHANGE_OF_NAME">Change of Name</option>
              <option value="CHANGE_OF_PHONE">Change of Phone Number</option>
              <option value="CHANGE_OF_ADDRESS">Change of Address</option>
            </select>
          </div>
        </div>

      </div>

      {/* Active Filter Pills Indicator */}
      {(statusFilter !== "ALL" || typeFilter !== "ALL" || searchTerm) && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-muted-foreground font-medium flex items-center gap-1">
            <Funnel weight="bold" className="h-3.5 w-3.5" />
            Active filters:
          </span>
          {statusFilter !== "ALL" && (
            <button
              onClick={() => setStatusFilter("ALL")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold"
            >
              Status: {statusFilter}
              <span className="text-[10px]">&times;</span>
            </button>
          )}
          {typeFilter !== "ALL" && (
            <button
              onClick={() => setTypeFilter("ALL")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold"
            >
              Type: {typeFilter.replace("CHANGE_OF_", "")}
              <span className="text-[10px]">&times;</span>
            </button>
          )}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-foreground border border-border font-medium"
            >
              Search: "{searchTerm}"
              <span className="text-[10px]">&times;</span>
            </button>
          )}
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setTypeFilter("ALL");
              setSearchTerm("");
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline font-medium ml-1"
          >
            Reset all
          </button>
        </div>
      )}

      {/* Content Container */}
      <div className="bg-card rounded-2xl sm:rounded-3xl border border-border overflow-hidden shadow-sm">
        
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <ArrowsClockwise weight="bold" className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-bold text-foreground">Loading modification records...</p>
            <p className="text-xs text-muted-foreground">Retrieving history from server.</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
              <Funnel weight="duotone" className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-foreground">No Modification Requests Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              {requests.length === 0
                ? "You haven't submitted any NIN modification requests yet."
                : "No records matched your search filters. Try adjusting your query."}
            </p>
            {requests.length === 0 && (
              <Link
                href="/dashboard/nin/modification"
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:opacity-90 transition-all"
              >
                Submit Modification Request
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="py-3.5 px-4 sm:px-6">Tracking ID</th>
                    <th className="py-3.5 px-4">Service Type</th>
                    <th className="py-3.5 px-4">NIN</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Fee</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRequests.map((req) => {
                    const typeConf = TYPE_CONFIG[req.type] || TYPE_CONFIG.CHANGE_OF_NAME;
                    const TypeIconComp = typeConf.icon;

                    return (
                      <tr key={req.id} className="hover:bg-secondary/20 transition-colors">
                        
                        {/* Tracking ID */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-foreground text-xs">
                              {req.trackingId}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(req.id, req.trackingId)}
                              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                              title="Copy Tracking ID"
                            >
                              {copiedId === req.id ? (
                                <Check weight="bold" className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy weight="bold" className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-muted-foreground block mt-0.5 truncate max-w-[120px]">
                            {req.transactionRef}
                          </span>
                        </td>

                        {/* Service Type */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg border ${typeConf.bgColor} ${typeConf.color}`}>
                              <TypeIconComp weight="duotone" className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-medium text-foreground text-xs">
                              {typeConf.label}
                            </span>
                          </div>
                        </td>

                        {/* Masked NIN */}
                        <td className="py-4 px-4 font-mono text-xs font-semibold text-foreground">
                          {req.ninMasked}
                        </td>

                        {/* Date & Time */}
                        <td className="py-4 px-4 text-xs">
                          <div className="font-medium text-foreground">{formattedDate(req.createdAt)}</div>
                          <div className="text-[10px] text-muted-foreground">{formattedTime(req.createdAt)}</div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {getStatusBadge(req.status)}
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 text-right font-bold text-foreground text-xs">
                          ₦{req.amountPaid.toLocaleString()}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 sm:px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openDetails(req)}
                              className="p-2 rounded-xl bg-secondary/60 hover:bg-secondary text-foreground text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="View Details"
                            >
                              <Eye weight="bold" className="h-3.5 w-3.5" />
                              <span>View</span>
                            </button>

                            {req.status === "COMPLETED" && req.slipUrl && (
                              <a
                                href={req.slipUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all flex items-center gap-1"
                                title="Download Modification Slip"
                              >
                                <DownloadSimple weight="bold" className="h-3.5 w-3.5" />
                                <span>Slip</span>
                              </a>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-border">
              {filteredRequests.map((req) => {
                const typeConf = TYPE_CONFIG[req.type] || TYPE_CONFIG.CHANGE_OF_NAME;
                const TypeIconComp = typeConf.icon;

                return (
                  <div key={req.id} className="p-4 space-y-3">
                    
                    {/* Top Row: Type & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg border ${typeConf.bgColor} ${typeConf.color}`}>
                          <TypeIconComp weight="duotone" className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-bold text-foreground text-xs">
                          {typeConf.label}
                        </span>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>

                    {/* Middle Row: Tracking ID & NIN */}
                    <div className="bg-secondary/30 p-3 rounded-xl border border-border space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Tracking ID:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-foreground">{req.trackingId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(req.id, req.trackingId)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {copiedId === req.id ? (
                              <Check weight="bold" className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy weight="bold" className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">NIN:</span>
                        <span className="font-mono font-semibold text-foreground">{req.ninMasked}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="text-muted-foreground">{formattedDate(req.createdAt)}</span>
                      </div>
                    </div>

                    {/* Bottom Row: Fee & Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-black text-foreground text-sm">
                        ₦{req.amountPaid.toLocaleString()}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDetails(req)}
                          className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs transition-all flex items-center gap-1"
                        >
                          <Eye weight="bold" className="h-3.5 w-3.5" />
                          <span>Details</span>
                        </button>

                        {req.status === "COMPLETED" && req.slipUrl && (
                          <a
                            href={req.slipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1"
                          >
                            <DownloadSimple weight="bold" className="h-3.5 w-3.5" />
                            <span>Slip</span>
                          </a>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

    </div>
  );
}
