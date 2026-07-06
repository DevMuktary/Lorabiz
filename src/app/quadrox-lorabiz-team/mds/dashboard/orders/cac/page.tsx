"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { differenceInHours, formatDistanceToNow, format } from 'date-fns';
import { 
  ArrowLeft, Search, Filter, RefreshCw, Eye, Clock, CheckCircle2, AlertCircle, XCircle, UserPlus
} from 'lucide-react';

export default function CacPipelinePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, UNASSIGNED, IN_PROGRESS, QUERIED, COMPLETED

  const fetchPipeline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mds/pipeline/cac');
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();
      setPipeline(result.pipeline);
    } catch (error) {
      console.error("Pipeline error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  // Filter Logic
  const filteredPipeline = useMemo(() => {
    return pipeline.filter((ticket) => {
      // Search
      const matchesSearch = 
        ticket.proposedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Tabs
      let matchesTab = true;
      if (activeTab === "UNASSIGNED") matchesTab = !ticket.assignedStaff && ticket.status === "PENDING";
      if (activeTab === "IN_PROGRESS") matchesTab = ticket.assignedStaff && ticket.status === "PENDING";
      if (activeTab === "QUERIED") matchesTab = ticket.status === "QUERIED";
      if (activeTab === "COMPLETED") matchesTab = ticket.status === "APPROVED" || ticket.status === "FAILED";

      return matchesSearch && matchesTab;
    });
  }, [pipeline, searchTerm, activeTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header & Back Button */}
      <div>
        <Link href="/quadrox-lorabiz-team/mds/dashboard/orders" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors">
          <ArrowLeft size={16} className="mr-1.5" /> Back to Global Pipeline
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">CAC Services Directory</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Unified queue for Business Names and LLC formations.</p>
          </div>
          <button 
            onClick={fetchPipeline}
            className="flex items-center justify-center px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 scrollbar-hide">
          <TabButton label="All Tickets" count={pipeline.length} isActive={activeTab === "ALL"} onClick={() => setActiveTab("ALL")} />
          <TabButton label="Unassigned Pool" count={pipeline.filter(t => !t.assignedStaff && t.status === "PENDING").length} isActive={activeTab === "UNASSIGNED"} onClick={() => setActiveTab("UNASSIGNED")} alert />
          <TabButton label="In Progress" count={pipeline.filter(t => t.assignedStaff && t.status === "PENDING").length} isActive={activeTab === "IN_PROGRESS"} onClick={() => setActiveTab("IN_PROGRESS")} />
          <TabButton label="Queried" count={pipeline.filter(t => t.status === "QUERIED").length} isActive={activeTab === "QUERIED"} onClick={() => setActiveTab("QUERIED")} />
          <TabButton label="Completed" count={pipeline.filter(t => t.status === "APPROVED" || t.status === "FAILED").length} isActive={activeTab === "COMPLETED"} onClick={() => setActiveTab("COMPLETED")} />
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by proposed name, tracking ID, or client..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Application Info</th>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Staff Assigned</th>
                <th className="px-6 py-4 font-medium">SLA / Time in Queue</th>
                <th className="px-6 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <RefreshCw className="animate-spin mx-auto mb-3 text-indigo-500" size={24} />
                    Loading pipeline...
                  </td>
                </tr>
              ) : filteredPipeline.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No applications found in this view.
                  </td>
                </tr>
              ) : (
                filteredPipeline.map((ticket: any) => (
                  <tr key={ticket.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    
                    {/* Application Info */}
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[250px]">{ticket.proposedName}</p>
                      <div className="flex items-center text-xs mt-1">
                        <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400 mr-2">{ticket.trackingId}</span>
                        <span className="text-zinc-500 font-medium">{ticket.type}</span>
                      </div>
                    </td>

                    {/* Client Info */}
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{ticket.clientName}</p>
                      <p className="text-xs text-zinc-500">{ticket.clientEmail}</p>
                    </td>

                    {/* Staff Assigned */}
                    <td className="px-6 py-4">
                      {ticket.assignedStaff ? (
                        <span className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full">
                          <UserPlus size={14} className="mr-1.5" /> {ticket.assignedStaff}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-sm font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                          Unassigned Pool
                        </span>
                      )}
                    </td>

                    {/* SLA / Time Indicator */}
                    <td className="px-6 py-4">
                      <SlaIndicator createdAt={ticket.createdAt} status={ticket.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <button 
                        className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        title="Inspect Application"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

function TabButton({ label, count, isActive, onClick, alert = false }: { label: string, count: number, isActive: boolean, onClick: () => void, alert?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center whitespace-nowrap px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
        isActive 
          ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5" 
          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      }`}
    >
      {label}
      <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] tabular-nums ${
        isActive ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
      } ${alert && count > 0 && !isActive ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20" : ""}`}>
        {count}
      </span>
    </button>
  );
}

function SlaIndicator({ createdAt, status }: { createdAt: string, status: string }) {
  // If it's already resolved, don't show traffic lights
  if (status === "APPROVED" || status === "FAILED") {
    return <span className="text-xs font-medium text-zinc-500">Resolved • {format(new Date(createdAt), 'MMM d')}</span>;
  }

  const hoursInQueue = differenceInHours(new Date(), new Date(createdAt));
  const timeString = formatDistanceToNow(new Date(createdAt));

  let color = "bg-emerald-500"; // < 24 hours (Green)
  let textColor = "text-emerald-700 dark:text-emerald-400";
  
  if (hoursInQueue >= 48) {
    color = "bg-red-500 animate-pulse"; // > 48 hours (Red - Urgent)
    textColor = "text-red-700 dark:text-red-400";
  } else if (hoursInQueue >= 24) {
    color = "bg-amber-500"; // 24-48 hours (Amber - Warning)
    textColor = "text-amber-700 dark:text-amber-400";
  }

  return (
    <div className="flex items-center">
      <span className={`w-2 h-2 rounded-full mr-2 ${color}`}></span>
      <span className={`text-xs font-semibold tabular-nums ${textColor}`}>
        {timeString} ago
      </span>
    </div>
  );
}
