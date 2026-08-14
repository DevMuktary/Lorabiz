"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  ClockCounterClockwise,
  MagnifyingGlass,
  ArrowLeft,
  CheckCircle,
  Clock,
  WarningCircle,
  Buildings,
  Wallet,
  ShieldCheck,
  Key,
  DeviceMobile,
  Cards,
  Funnel,
  CaretLeft,
  CaretRight,
  Receipt,
  Spinner,
} from "@phosphor-icons/react";

interface ActivityItem {
  id: string;
  action: string;
  category: "AUTH" | "CAC" | "WALLET" | "SERVICES" | "SECURITY";
  description: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  referenceId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

const CATEGORIES = [
  { id: "ALL", label: "All Activity" },
  { id: "CAC", label: "CAC Filings" },
  { id: "WALLET", label: "Wallet & Payments" },
  { id: "SERVICES", label: "Services" },
  { id: "AUTH", label: "Account & Auth" },
  { id: "SECURITY", label: "Security" },
];

export default function UserActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "15",
      });

      if (selectedCategory !== "ALL") {
        params.append("category", selectedCategory);
      }

      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      const res = await fetch(`/api/user/activity?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setActivities(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to load user activity:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [currentPage, selectedCategory, debouncedSearch]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "CAC":
        return <Buildings weight="duotone" className="h-5 w-5 text-indigo-500" />;
      case "WALLET":
        return <Wallet weight="duotone" className="h-5 w-5 text-emerald-500" />;
      case "SERVICES":
        return <Cards weight="duotone" className="h-5 w-5 text-blue-500" />;
      case "SECURITY":
        return <Key weight="duotone" className="h-5 w-5 text-amber-500" />;
      case "AUTH":
      default:
        return <ShieldCheck weight="duotone" className="h-5 w-5 text-purple-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle weight="fill" className="h-3 w-3" />
            Success
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock weight="fill" className="h-3 w-3" />
            Pending
          </span>
        );
      case "FAILED":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <WarningCircle weight="fill" className="h-3 w-3" />
            Failed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft weight="bold" className="h-3.5 w-3.5" /> Back to Service Hub
          </Link>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <ClockCounterClockwise weight="duotone" className="h-7 w-7 text-primary" />
            Activity History
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            A chronological timeline of actions and transactions on your account.
          </p>
        </div>

        <div className="text-xs text-muted-foreground bg-secondary/60 px-3 py-1.5 rounded-xl border border-border/50 self-start sm:self-auto">
          Total Events: <strong className="text-foreground">{totalCount}</strong>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-4">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlass weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by action, description, or reference ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/70"
          />
        </div>

        {/* Category Pills (Horizontal Scrollable on Mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/40"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Spinner weight="bold" className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs">Loading your activity history...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary/80 flex items-center justify-center mx-auto text-muted-foreground">
              <ClockCounterClockwise weight="duotone" className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">No Activity Records Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {debouncedSearch || selectedCategory !== "ALL"
                ? "No activity matched your search or category filter. Try clearing the filter."
                : "Your account activities, registrations, and wallet transactions will appear here."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activities.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 hover:bg-secondary/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Left: Icon & Description */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-secondary/70 border border-border/60 flex items-center justify-center shrink-0 mt-0.5">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-foreground">
                        {item.description}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span>{item.action.replace(/_/g, " ")}</span>
                      {item.referenceId && (
                        <>
                          <span>&bull;</span>
                          <span className="font-mono bg-secondary/80 px-1.5 py-0.5 rounded border border-border/50 text-[10px]">
                            Ref: {item.referenceId}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Timestamp */}
                <div className="text-left sm:text-right shrink-0 pl-13 sm:pl-0">
                  <p className="text-xs font-medium text-foreground">
                    {format(new Date(item.createdAt), "MMM d, yyyy • h:mm a")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border bg-secondary/20 flex items-center justify-between gap-4 text-xs">
            <span className="text-muted-foreground">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary transition-colors flex items-center gap-1 font-semibold"
              >
                <CaretLeft weight="bold" className="h-3.5 w-3.5" /> Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary transition-colors flex items-center gap-1 font-semibold"
              >
                Next <CaretRight weight="bold" className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
