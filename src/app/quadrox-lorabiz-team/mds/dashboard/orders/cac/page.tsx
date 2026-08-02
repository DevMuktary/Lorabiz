"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { differenceInHours, formatDistanceToNow, format } from 'date-fns';
import { 
  ArrowLeft, Search, RefreshCw, Eye, UserPlus, Briefcase, Building2, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';
import ApplicationDrawer from '@/components/mds/cac/ApplicationDrawer';

export default function CacPipelinePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]); 
  
  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); 
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Drawer State
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const fetchPipeline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mds/pipeline/cac');
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();
      setPipeline(result.pipeline);
      setStaffList(result.staff || []);
    } catch (error) {
      console.error("Pipeline error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, serviceFilter]);

  const filteredPipeline = useMemo(() => {
    return pipeline.filter((ticket) => {
      // 1. Search
      const matchesSearch = 
        ticket.proposedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Status Tabs - REORGANIZED & FIXED
      let matchesTab = true;
      if (activeTab === "PENDING") matchesTab = ticket.status === "PENDING"; // Captures ALL pending
      if (activeTab === "QUERIED") matchesTab = ticket.status === "QUERIED";
      if (activeTab === "COMPLETED") matchesTab = ticket.status === "APPROVED" || ticket.status === "FAILED";
      if (activeTab === "UNASSIGNED") matchesTab = !ticket.assignedStaff && ticket.status === "PENDING"; // Pushed to the end

      // 3. Service Type Filter
      const matchesService = serviceFilter === "ALL" || ticket.type === serviceFilter;

      return matchesSearch && matchesTab && matchesService;
    });
  }, [pipeline, searchTerm, activeTab, serviceFilter]);

  // Apply Pagination
  const paginatedPipeline = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPipeline.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPipeline, currentPage]);

  const totalPages = Math.ceil(filteredPipeline.length / ITEMS_PER_PAGE);

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

      {/* Main Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* Navigation Tabs - REORDERED */}
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 scrollbar-hide">
          <TabButton label="All Tickets" count={pipeline.filter(t => serviceFilter === "ALL" || t.type === serviceFilter).length} isActive={activeTab === "ALL"} onClick={() => setActiveTab("ALL")} />
          <TabButton label="Pending" count={pipeline.filter(t => t.status === "PENDING" && (serviceFilter === "ALL" || t.type === serviceFilter)).length} isActive={activeTab === "PENDING"} onClick={() => setActiveTab("PENDING")} />
          <TabButton label="Queried" count={pipeline.filter(t => t.status === "QUERIED" && (serviceFilter === "ALL" || t.type === serviceFilter)).length} isActive={activeTab === "QUERIED"} onClick={() => setActiveTab("QUERIED")} />
          <TabButton label="Completed" count={pipeline.filter(t => (t.status === "APPROVED" || t.status === "FAILED") && (serviceFilter === "ALL" || t.type === serviceFilter)).length} isActive={activeTab === "COMPLETED"} onClick={() => setActiveTab("COMPLETED")} />
          <TabButton label="Unassigned Pool" count={pipeline.filter(t => !t.assignedStaff && t.status === "PENDING" && (serviceFilter === "ALL" || t.type === serviceFilter)).length} isActive={activeTab === "UNASSIGNED"} onClick={() => setActiveTab("UNASSIGNED")} alert />
        </div>

        {/* Search & Service Filter Bar */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by proposed name, tracking ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-zinc-500 hidden sm:block" />
            <select 
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full sm:w-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Services</option>
              <option value="BUSINESS_NAME">Business Names</option>
              <option value="LLC">LLC Formations</option>
            </select>
          </div>
        </div>

        {/* ==================================================== */}
        {/* DESKTOP TABLE VIEW (Hidden on Mobile) */}
        {/* ==================================================== */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Application Info</th>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Staff Assigned</th>
                <th className="px-6 py-4 font-medium">SLA / Queue Time</th>
                <th className="px-6 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Loading pipeline...</td></tr>
              ) : paginatedPipeline.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No applications found.</td></tr>
              ) : (
                paginatedPipeline.map((ticket: any) => (
                  <tr key={ticket.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[250px]">{ticket.proposedName}</p>
                      <div className="flex items-center mt-1.5 gap-2">
                        <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400 text-xs">
                          {ticket.trackingId}
                        </span>
                        {ticket.type === "LLC" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                            <Building2 size={10} className="mr-1" /> LLC Formation
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                            <Briefcase size={10} className="mr-1" /> Business Name
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{ticket.clientName}</p>
                      <p className="text-xs text-zinc-500">{ticket.clientEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      {ticket.assignedStaff ? (
                        <span className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full">
                          <UserPlus size={14} className="mr-1.5" /> {ticket.assignedStaff}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-sm font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {/* Pass updatedAt so we track from submission moment, not draft creation */}
                      <SlaIndicator timestamp={ticket.updatedAt} status={ticket.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedTicket(ticket)}
                        className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 rounded-md transition-colors"
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

        {/* ==================================================== */}
        {/* MOBILE CARD VIEW (Hidden on Desktop) */}
        {/* ==================================================== */}
        <div className="md:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500">Loading pipeline...</div>
          ) : paginatedPipeline.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No applications found.</div>
          ) : (
            paginatedPipeline.map((ticket: any) => (
              <div key={ticket.id} className="p-4 space-y-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                      {ticket.proposedName}
                    </p>
                    <div className="flex items-center mt-2 gap-2 flex-wrap">
                      <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400 text-xs">
                        {ticket.trackingId}
                      </span>
                      {ticket.type === "LLC" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                          <Building2 size={10} className="mr-1" /> LLC
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                          <Briefcase size={10} className="mr-1" /> BN
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedTicket(ticket)}
                    className="flex-shrink-0 flex items-center gap-1 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-1.5 rounded-lg text-xs font-bold"
                  >
                    <Eye size={14} /> View
                  </button>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg text-xs flex flex-col gap-2 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Client:</span>
                    <span className="font-medium text-zinc-900 dark:text-white truncate max-w-[200px]">{ticket.clientName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Staff:</span>
                    {ticket.assignedStaff ? (
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">{ticket.assignedStaff}</span>
                    ) : (
                      <span className="text-zinc-400 italic">Unassigned</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Time:</span>
                    <SlaIndicator timestamp={ticket.updatedAt} status={ticket.status} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Footer */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
            <p className="text-xs text-zinc-500">
              Showing <span className="font-medium text-zinc-900 dark:text-white">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="font-medium text-zinc-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredPipeline.length)}</span> of <span className="font-medium text-zinc-900 dark:text-white">{filteredPipeline.length}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 disabled:opacity-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 disabled:opacity-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ApplicationDrawer 
        ticket={selectedTicket} 
        staffList={staffList} 
        onClose={() => setSelectedTicket(null)} 
        onUpdateSuccess={() => {
          setSelectedTicket(null);
          fetchPipeline(); 
        }} 
      />
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

function SlaIndicator({ timestamp, status }: { timestamp: string, status: string }) {
  // Using 'Completed' instead of 'Resolved'
  if (status === "APPROVED" || status === "FAILED") {
    return <span className="text-xs font-medium text-zinc-500">Completed • {format(new Date(timestamp), 'MMM d')}</span>;
  }

  // Calculating time against the submission/update timestamp
  const hoursInQueue = differenceInHours(new Date(), new Date(timestamp));
  const timeString = formatDistanceToNow(new Date(timestamp));

  let color = "bg-emerald-500"; 
  let textColor = "text-emerald-700 dark:text-emerald-400";
  
  if (hoursInQueue >= 48) {
    color = "bg-red-500 animate-pulse"; 
    textColor = "text-red-700 dark:text-red-400";
  } else if (hoursInQueue >= 24) {
    color = "bg-amber-500"; 
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
