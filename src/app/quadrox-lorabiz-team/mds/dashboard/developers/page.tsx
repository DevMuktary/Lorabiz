"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Code, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  Search, 
  RefreshCw,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

interface DeveloperProfileItem {
  id: string;
  userId: string;
  businessName: string;
  websiteUrl: string | null;
  ownerNin: string;
  useCase: string;
  customUseCase: string | null;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  approvedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    wallet: { balance: number } | null;
    _count: { apiRequestLogs: number };
  };
}

export default function MDSDevelopersPage() {
  const [profiles, setProfiles] = useState<DeveloperProfileItem[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("PENDING_APPROVAL");
  const [searchQuery, setSearchQuery] = useState("");

  const [copiedNinId, setCopiedNinId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Reject dialog state
  const [rejectingProfile, setRejectingProfile] = useState<DeveloperProfileItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/mds/developers", window.location.origin);
      if (statusTab !== "ALL") {
        url.searchParams.set("status", statusTab);
      }
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setProfiles(data.data.profiles || []);
        setStats(data.data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
      }
    } catch (err) {
      console.error("Failed to load developer applications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [statusTab]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleAction = async (id: string, action: "APPROVE" | "REJECT", reason?: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/mds/developers/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        setRejectingProfile(null);
        setRejectionReason("");
        fetchProfiles();
      } else {
        alert(data.error || "Failed to execute action.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyNin = (nin: string, id: string) => {
    navigator.clipboard.writeText(nin);
    setCopiedNinId(id);
    setTimeout(() => setCopiedNinId(null), 2000);
  };

  const filteredProfiles = profiles.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.businessName.toLowerCase().includes(q) ||
      p.user.email.toLowerCase().includes(q) ||
      p.ownerNin.includes(q) ||
      `${p.user.firstName} ${p.user.lastName}`.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Code className="h-6 w-6 text-indigo-600" />
            Developer Access Applications
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Review, verify, and approve applications for Live API access (`lora_live_...`).
          </p>
        </div>

        <button
          onClick={() => fetchProfiles()}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
          <span className="text-xs text-zinc-500 font-medium">Total Applications</span>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Pending Review
          </span>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">{stats.pending}</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" /> Approved Live
          </span>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{stats.approved}</div>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5" /> Rejected
          </span>
          <div className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{stats.rejected}</div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        {/* Filter Tabs & Search */}
        <div className="flex flex-col gap-3 border-b border-zinc-200 dark:border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
            {[
              { label: "Pending Review", value: "PENDING_APPROVAL", count: stats.pending },
              { label: "Approved", value: "APPROVED", count: stats.approved },
              { label: "Rejected", value: "REJECTED", count: stats.rejected },
              { label: "All", value: "ALL", count: stats.total },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusTab(tab.value)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  statusTab === tab.value
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <span>{tab.label}</span>
                <span className="rounded-full bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.2 text-[10px]">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search business, email, NIN..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-zinc-500">Loading developer applications...</div>
          ) : filteredProfiles.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No developer applications found in this status.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Business / App</th>
                  <th className="px-4 py-3 font-semibold">Developer Account</th>
                  <th className="px-4 py-3 font-semibold">Owner NIN (Free Check)</th>
                  <th className="px-4 py-3 font-semibold">Website</th>
                  <th className="px-4 py-3 font-semibold">Use Case</th>
                  <th className="px-4 py-3 font-semibold">Wallet</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredProfiles.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">{p.businessName}</div>
                      <span className="text-[11px] text-zinc-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">
                        {p.user.firstName} {p.user.lastName}
                      </div>
                      <div className="text-[11px] text-zinc-500">{p.user.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {p.ownerNin}
                        </code>
                        <button
                          onClick={() => copyNin(p.ownerNin, p.id)}
                          title="Copy NIN for manual verification"
                          className="rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                        >
                          {copiedNinId === p.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {p.websiteUrl ? (
                        <a
                          href={p.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                        >
                          <span className="truncate max-w-[120px]">{p.websiteUrl}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-zinc-400 italic">None provided</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{p.useCase}</span>
                      {p.customUseCase && (
                        <p className="mt-0.5 text-[11px] text-zinc-500 truncate max-w-[160px]">
                          {p.customUseCase}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-zinc-800 dark:text-zinc-200">
                      ₦{Number(p.user.wallet?.balance || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          p.status === "APPROVED"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : p.status === "PENDING_APPROVAL"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-red-500/15 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {p.status === "PENDING_APPROVAL" ? "PENDING" : p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {p.status === "PENDING_APPROVAL" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAction(p.id, "APPROVE")}
                            disabled={actionLoadingId === p.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectingProfile(p);
                              setRejectionReason("");
                            }}
                            disabled={actionLoadingId === p.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-900 bg-transparent px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : p.status === "REJECTED" ? (
                        <button
                          onClick={() => handleAction(p.id, "APPROVE")}
                          disabled={actionLoadingId === p.id}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          Re-approve
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-400">
                          Approved {p.approvedAt ? new Date(p.approvedAt).toLocaleDateString() : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* REJECT MODAL */}
      {rejectingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Reject Live API Access
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Rejecting application for <strong>{rejectingProfile.businessName}</strong>. Please provide a reason to guide the applicant.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Rejection Reason
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. The provided NIN does not match the account owner name, or please provide a valid operational website."
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent p-3 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingProfile(null)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(rejectingProfile.id, "REJECT", rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
