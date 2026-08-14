"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  Users,
  Search,
  AlertTriangle,
  FileEdit,
  ExternalLink,
} from "lucide-react";
import { sanitizeEmailHtml } from "@/lib/sanitize-email";

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const campaignId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [campaign, setCampaign] = useState<any | null>(null);
  const [logFilter, setLogFilter] = useState<"ALL" | "SENT" | "FAILED" | "PENDING">("ALL");
  const [searchLogQuery, setSearchLogQuery] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fetchCampaignDetails = async () => {
    try {
      const res = await fetch(`/api/mds/campaigns/${campaignId}`);
      if (!res.ok) throw new Error("Failed to fetch campaign details");
      const data = await res.json();
      setCampaign(data.campaign);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignDetails();

    // Auto-poll if campaign is currently SENDING
    const interval = setInterval(() => {
      if (campaign?.status === "SENDING") {
        fetchCampaignDetails();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [campaignId, campaign?.status]);

  const handleLaunchBroadcast = async () => {
    if (!confirm(`Are you ready to dispatch this broadcast to ${campaign?.totalRecipients || "all eligible"} users?`)) {
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`/api/mds/campaigns/${campaignId}/send`, {
        method: "POST",
      });
      if (res.ok) {
        fetchCampaignDetails();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to dispatch campaign.");
      }
    } catch (err) {
      alert("Error triggering broadcast dispatch.");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="animate-spin text-indigo-500" size={32} />
        <p className="text-sm text-zinc-400">Loading campaign report...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertTriangle size={36} className="text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-100">Campaign Not Found</h2>
        <Link
          href="/quadrox-lorabiz-team/mds/dashboard/campaigns"
          className="text-xs text-indigo-400 hover:underline"
        >
          Return to Campaigns
        </Link>
      </div>
    );
  }

  const logs: any[] = campaign.logs || [];
  const filteredLogs = logs.filter((log) => {
    const matchesTab = logFilter === "ALL" ? true : log.status === logFilter;
    const matchesSearch =
      log.email.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
      (log.recipientName && log.recipientName.toLowerCase().includes(searchLogQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const progressPct =
    campaign.totalRecipients > 0
      ? Math.min(100, Math.round(((campaign.sentCount + campaign.failedCount) / campaign.totalRecipients) * 100))
      : 0;

  const successRate =
    campaign.sentCount + campaign.failedCount > 0
      ? Math.round((campaign.sentCount / (campaign.sentCount + campaign.failedCount)) * 100)
      : 100;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/campaigns"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{campaign.title}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  campaign.status === "COMPLETED"
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    : campaign.status === "SENDING"
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse"
                    : campaign.status === "FAILED"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                }`}
              >
                {campaign.status}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">Subject: {campaign.subject}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
          >
            <Eye size={14} /> View Email Content
          </button>
          
          <button
            onClick={fetchCampaignDetails}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Refresh Report"
          >
            <RefreshCw size={15} />
          </button>

          {(campaign.status === "DRAFT" || campaign.status === "FAILED") && (
            <button
              onClick={handleLaunchBroadcast}
              disabled={isSending}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Send size={14} /> {isSending ? "Dispatching..." : "Dispatch Broadcast"}
            </button>
          )}
        </div>
      </div>

      {/* Progress & Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Target Recipients */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Target Audience</span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {campaign.totalRecipients?.toLocaleString() ?? 0}
          </p>
          <p className="text-xs text-zinc-400 mt-1 capitalize">
            {campaign.targetAudience?.segment ? campaign.targetAudience.segment.replace(/_/g, " ").toLowerCase() : "All Users"}
          </p>
        </div>

        {/* Successfully Sent */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Successfully Sent</span>
          <p className="text-2xl font-bold text-emerald-500 mt-2">
            {campaign.sentCount?.toLocaleString() ?? 0}
          </p>
          <p className="text-xs text-emerald-600/80 mt-1">{successRate}% Delivery Success Rate</p>
        </div>

        {/* Failed Delivery */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Failed Delivery</span>
          <p className="text-2xl font-bold text-rose-500 mt-2">
            {campaign.failedCount?.toLocaleString() ?? 0}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Provider bounce / rate error</p>
        </div>

        {/* Dispatch Date */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Created / Author</span>
          <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-2">
            {format(new Date(campaign.createdAt), "MMM d, yyyy • h:mm a")}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            by {campaign.createdBy?.firstName || "Admin"} ({campaign.createdBy?.email})
          </p>
        </div>
      </div>

      {/* Real-time Progress Bar */}
      {campaign.status !== "DRAFT" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-zinc-700 dark:text-zinc-300">
              Broadcast Dispatch Progress: {campaign.sentCount + campaign.failedCount} / {campaign.totalRecipients} processed
            </span>
            <span className="text-indigo-500 font-mono">{progressPct}%</span>
          </div>
          <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{
                width: `${campaign.totalRecipients > 0 ? (campaign.sentCount / campaign.totalRecipients) * 100 : 0}%`,
              }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-300"
              style={{
                width: `${campaign.totalRecipients > 0 ? (campaign.failedCount / campaign.totalRecipients) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Recipient Delivery Audit Ledger */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Users size={18} className="text-indigo-500" /> Recipient Delivery Ledger ({logs.length})
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Filter tabs */}
            <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl">
              {(["ALL", "SENT", "FAILED", "PENDING"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setLogFilter(tab)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    logFilter === tab
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search recipient..."
                value={searchLogQuery}
                onChange={(e) => setSearchLogQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 font-bold uppercase text-zinc-500">
                  <th className="px-5 py-3">Recipient</th>
                  <th className="px-5 py-3">Email Address</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Delivered At / Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-zinc-400">
                      No delivery logs match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3 font-medium text-zinc-800 dark:text-zinc-200">
                        {log.recipientName || "Valued Client"}
                      </td>
                      <td className="px-5 py-3 font-mono text-zinc-600 dark:text-zinc-400">
                        {log.email}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            log.status === "SENT"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : log.status === "FAILED"
                              ? "bg-rose-500/10 text-rose-500"
                              : "bg-zinc-500/10 text-zinc-400"
                          }`}
                        >
                          {log.status === "SENT" && <CheckCircle2 size={12} />}
                          {log.status === "FAILED" && <XCircle size={12} />}
                          {log.status === "PENDING" && <Clock size={12} />}
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {log.status === "SENT" && log.sentAt ? (
                          <span className="text-zinc-500">
                            {format(new Date(log.sentAt), "MMM d, yyyy • h:mm:ss a")}
                          </span>
                        ) : log.status === "FAILED" ? (
                          <span className="text-rose-500 font-mono text-[11px]">
                            {log.errorMessage || "Unknown dispatch error"}
                          </span>
                        ) : (
                          <span className="text-zinc-400 italic">Queued in BullMQ worker</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Email Body Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Broadcast Content</h3>
                <p className="text-xs text-zinc-400">Subject: {campaign.subject}</p>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-zinc-100 dark:bg-zinc-950">
              <div className="max-w-lg mx-auto bg-white rounded-xl shadow-xs border border-zinc-200 overflow-hidden text-zinc-800 text-sm">
                <div className="bg-slate-900 p-4 text-center">
                  <img src="https://lorabiz.com/logo.png" alt="LoraBiz" className="h-6 mx-auto" />
                </div>
                <div
                  className="p-6 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(campaign.content) }}
                />
                <div className="p-4 text-center bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
                  <p className="m-0">You are receiving this email as a registered user of LoraBiz.</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-xl text-zinc-200 transition-colors"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
