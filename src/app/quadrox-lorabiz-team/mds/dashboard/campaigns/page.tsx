"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Mail,
  Plus,
  RefreshCw,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileEdit,
  Trash2,
  ArrowUpRight,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";

interface CampaignItem {
  id: string;
  title: string;
  subject: string;
  previewText?: string | null;
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  targetAudience?: { segment?: string } | null;
  createdAt: string;
  sentAt?: string | null;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function EmailCampaignsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [metrics, setMetrics] = useState({
    totalCampaigns: 0,
    completedCampaigns: 0,
    sendingCampaigns: 0,
    draftCampaigns: 0,
    totalSentEmails: 0,
    totalFailedEmails: 0,
  });

  const [activeTab, setActiveTab] = useState<"ALL" | "COMPLETED" | "SENDING" | "DRAFT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [campaignToDelete, setCampaignToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mds/campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
      setMetrics(
        data.metrics || {
          totalCampaigns: 0,
          completedCampaigns: 0,
          sendingCampaigns: 0,
          draftCampaigns: 0,
          totalSentEmails: 0,
          totalFailedEmails: 0,
        }
      );
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const confirmDelete = async () => {
    if (!campaignToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/mds/campaigns/${campaignToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCampaignToDelete(null);
        fetchCampaigns();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to delete campaign");
      }
    } catch (err) {
      alert("An error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesTab =
      activeTab === "ALL"
        ? true
        : activeTab === "COMPLETED"
        ? c.status === "COMPLETED"
        : activeTab === "SENDING"
        ? c.status === "SENDING"
        : c.status === "DRAFT";

    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status: CampaignItem["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle size={13} /> Completed
          </span>
        );
      case "SENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
            <RefreshCw size={13} className="animate-spin" /> Sending
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <FileEdit size={13} /> Draft
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle size={13} /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock size={13} /> {status}
          </span>
        );
    }
  };

  const getAudienceLabel = (segment?: string) => {
    switch (segment) {
      case "REGISTERED_ANY":
        return "All Registered Clients";
      case "REGISTERED_BIZ":
        return "Business Name Clients";
      case "REGISTERED_LLC":
        return "LLC / Company Clients";
      case "FUNDED_WALLET":
        return "Funded Wallets (> ₦0)";
      case "NO_ORDERS":
        return "Inactive Users (0 Orders)";
      case "NEW_SIGNUPS_7D":
        return "Signups (Last 7 Days)";
      case "NEW_SIGNUPS_30D":
        return "Signups (Last 30 Days)";
      case "ALL":
      default:
        return "All Active Users";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Mail className="text-indigo-500" size={26} /> Email Campaigns & Broadcasts
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Compose rich marketing broadcasts, filter target audiences, and monitor delivery analytics.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchCampaigns}
            className="flex items-center px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/campaigns/new"
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} className="mr-2" /> New Campaign
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Campaigns</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Mail size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">{metrics.totalCampaigns}</p>
          <p className="text-xs text-zinc-400 mt-1">{metrics.draftCampaigns} currently in draft</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Emails Delivered</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {metrics.totalSentEmails.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-500 mt-1">Dispatched via ZeptoMail</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Active / Sending</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Send size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">{metrics.sendingCampaigns}</p>
          <p className="text-xs text-zinc-400 mt-1">Background BullMQ jobs</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Completed Broadcasts</span>
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Users size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">{metrics.completedCampaigns}</p>
          <p className="text-xs text-zinc-400 mt-1">Across all user segments</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "ALL"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            All Broadcasts ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "COMPLETED"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Completed ({metrics.completedCampaigns})
          </button>
          <button
            onClick={() => setActiveTab("SENDING")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "SENDING"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Sending ({metrics.sendingCampaigns})
          </button>
          <button
            onClick={() => setActiveTab("DRAFT")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "DRAFT"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Drafts ({metrics.draftCampaigns})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by title or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-xs uppercase font-bold text-zinc-500">
                <th className="px-6 py-4">Campaign & Subject</th>
                <th className="px-6 py-4">Audience</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Delivery Progress</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading campaigns...
                  </td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                    <Mail size={32} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">No campaigns found</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {searchQuery
                        ? "Try searching with a different term."
                        : "Create your first email broadcast to engage with your users."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((c) => {
                  const progressPct =
                    c.totalRecipients > 0
                      ? Math.min(100, Math.round(((c.sentCount + c.failedCount) / c.totalRecipients) * 100))
                      : 0;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {c.title}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-xs sm:max-w-sm mt-0.5">
                          {c.subject}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          <Users size={12} className="text-zinc-400" />
                          {getAudienceLabel(c.targetAudience?.segment)}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(c.status)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap min-w-[160px]">
                        {c.status === "DRAFT" ? (
                          <span className="text-xs text-zinc-400 italic">Not dispatched yet</span>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-zinc-600 dark:text-zinc-300">
                                {c.sentCount} / {c.totalRecipients}
                              </span>
                              <span className="text-zinc-400">{progressPct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 rounded-full ${
                                  c.status === "COMPLETED"
                                    ? "bg-emerald-500"
                                    : c.status === "FAILED"
                                    ? "bg-rose-500"
                                    : "bg-indigo-600"
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            {c.failedCount > 0 && (
                              <p className="text-[10px] text-rose-500 font-medium">
                                {c.failedCount} failed delivery
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-xs text-zinc-500">
                        {format(new Date(c.createdAt), "MMM d, yyyy")}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/quadrox-lorabiz-team/mds/dashboard/campaigns/${c.id}`}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            title="View Campaign & Delivery Report"
                          >
                            <Eye size={16} />
                          </Link>

                          {c.status === "DRAFT" && (
                            <button
                              onClick={() => setCampaignToDelete({ id: c.id, title: c.title })}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                              title="Delete Draft"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Delete Campaign Draft?</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Are you sure you want to permanently delete <strong>{campaignToDelete.title}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setCampaignToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? <RefreshCw size={16} className="animate-spin" /> : "Delete Draft"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
