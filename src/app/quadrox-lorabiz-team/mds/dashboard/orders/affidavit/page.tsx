// src/app/quadrox-lorabiz-team/mds/dashboard/orders/affidavit/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Eye,
  Gavel,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  ExternalLink,
  Download,
} from "lucide-react";
import AffidavitApplicationDrawer from "@/components/mds/affidavit/AffidavitApplicationDrawer";

export default function MdsAffidavitPipelinePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [pipeline, setPipeline] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const fetchPipeline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mds/pipeline/affidavit");
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
  }, [searchTerm, activeTab, categoryFilter, sortOrder]);

  const filteredPipeline = useMemo(() => {
    let result = pipeline.filter((ticket) => {
      const searchTarget = `${ticket.deponentFullName} ${ticket.trackingId} ${ticket.clientName} ${ticket.clientEmail}`;
      const matchesSearch = searchTarget.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesTab = true;
      if (activeTab === "PENDING") matchesTab = ticket.status === "PENDING";
      if (activeTab === "PROCESSING") matchesTab = ticket.status === "PROCESSING";
      if (activeTab === "COMPLETED") matchesTab = ticket.status === "COMPLETED";
      if (activeTab === "REJECTED") matchesTab = ticket.status === "REJECTED" || ticket.status === "QUERIED";

      const matchesCategory = categoryFilter === "ALL" || ticket.category === categoryFilter;

      return matchesSearch && matchesTab && matchesCategory;
    });

    result = result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      if (sortOrder === "NEWEST") return dateB - dateA;
      if (sortOrder === "OLDEST") return dateA - dateB;
      return 0;
    });

    return result;
  }, [pipeline, searchTerm, activeTab, categoryFilter, sortOrder]);

  const paginatedPipeline = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPipeline.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPipeline, currentPage]);

  const totalPages = Math.ceil(filteredPipeline.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-sans text-left">
      <div>
        <Link
          href="/quadrox-lorabiz-team/mds/dashboard/orders"
          className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1.5" /> Back to Global Pipeline
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Gavel size={20} />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Court Affidavit Queue
              </h1>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Process, review sworn particulars, and upload High Court sealed legal affidavits.
            </p>
          </div>
          <button
            onClick={fetchPipeline}
            className="flex items-center justify-center px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw size={16} className={`mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col">
        {/* Filter Tabs */}
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 scrollbar-hide">
          <TabButton
            label="All Requests"
            count={pipeline.length}
            isActive={activeTab === "ALL"}
            onClick={() => setActiveTab("ALL")}
          />
          <TabButton
            label="Pending"
            count={pipeline.filter((t) => t.status === "PENDING").length}
            isActive={activeTab === "PENDING"}
            onClick={() => setActiveTab("PENDING")}
          />
          <TabButton
            label="Processing"
            count={pipeline.filter((t) => t.status === "PROCESSING").length}
            isActive={activeTab === "PROCESSING"}
            onClick={() => setActiveTab("PROCESSING")}
          />
          <TabButton
            label="Completed"
            count={pipeline.filter((t) => t.status === "COMPLETED").length}
            isActive={activeTab === "COMPLETED"}
            onClick={() => setActiveTab("COMPLETED")}
          />
          <TabButton
            label="Failed / Rejected"
            count={pipeline.filter((t) => t.status === "REJECTED" || t.status === "QUERIED").length}
            isActive={activeTab === "REJECTED"}
            onClick={() => setActiveTab("REJECTED")}
          />
        </div>

        {/* Toolbar */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search Deponent, Tracking ID, or Client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Categories</option>
              <option value="CAC_CORPORATE">CAC Corporate</option>
              <option value="CHANGE_OF_NAME">Change of Name</option>
              <option value="AGE_DECLARATION">Age Declaration</option>
              <option value="LOSS_OF_ITEM">Loss of Item / SIM</option>
              <option value="PROOF_OF_OWNERSHIP">Proof of Ownership</option>
              <option value="GENERAL_PURPOSE">General Purpose</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase font-black tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Tracking ID</th>
                <th className="px-6 py-3.5">Deponent Details</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Client &amp; Paid</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                    <RefreshCw className="animate-spin inline-block mr-2" size={16} /> Loading applications...
                  </td>
                </tr>
              ) : paginatedPipeline.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                    No court affidavit requests found in this queue.
                  </td>
                </tr>
              ) : (
                paginatedPipeline.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-primary">
                      {item.trackingId}
                      <span className="block text-[10px] text-zinc-400 font-normal">
                        {format(new Date(item.createdAt), "MMM d, yyyy")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                        {item.deponentFullName}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {item.gender} • {item.age} Yrs • {item.residentialAddress?.split(",")[1] || "Nigeria"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-secondary text-foreground text-[11px] font-bold">
                        {item.category?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                        {item.clientName}
                      </span>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                        ₦{Number(item.amountCharged).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                          item.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : item.status === "PROCESSING"
                            ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                            : item.status === "QUERIED"
                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            : item.status === "REJECTED"
                            ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {selectedTicket && (
        <AffidavitApplicationDrawer
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdateSuccess={() => {
            setSelectedTicket(null);
            fetchPipeline();
          }}
        />
      )}
    </div>
  );
}

function TabButton({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 flex items-center gap-2 transition-colors ${
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      }`}
    >
      <span>{label}</span>
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
          isActive
            ? "bg-primary/10 text-primary"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
