"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { differenceInHours, formatDistanceToNow, format } from 'date-fns';
import { 
  ArrowLeft, Search, RefreshCw, Eye, UserPlus, Briefcase, Building2, Filter, ChevronLeft, ChevronRight, ArrowUpDown
} from 'lucide-react';
import ApplicationDrawer from '@/components/mds/cac/ApplicationDrawer';

export default function CacPipelinePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]); 
  
  // Filters, Sorting & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); 
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST"); // NEWEST, OLDEST, NAME_ASC, NAME_DESC
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

  // Reset to page 1 whenever filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, serviceFilter, sortOrder]);

  const filteredPipeline = useMemo(() => {
    let result = pipeline.filter((ticket) => {
      // 1. Search
      const matchesSearch = 
        ticket.proposedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Status Tabs
      let matchesTab = true;
      if (activeTab === "PENDING") matchesTab = ticket.status === "PENDING"; 
      if (activeTab === "QUERIED") matchesTab = ticket.status === "QUERIED";
      if (activeTab === "COMPLETED") matchesTab = ticket.status === "APPROVED" || ticket.status === "FAILED";
      if (activeTab === "UNASSIGNED") matchesTab = !ticket.assignedStaff && ticket.status === "PENDING"; 

      // 3. Service Type Filter
      const matchesService = serviceFilter === "ALL" || ticket.type === serviceFilter;

      return matchesSearch && matchesTab && matchesService;
    });

    // 4. Sorting logic
    result = result.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();

      if (sortOrder === "NEWEST") return dateB - dateA;
      if (sortOrder === "OLDEST") return dateA - dateB;
      if (sortOrder === "NAME_ASC") return a.proposedName.localeCompare(b.proposedName);
      if (sortOrder === "NAME_DESC") return b.proposedName.localeCompare(a.proposedName);
      return 0;
    });

    return result;
  }, [pipeline, searchTerm, activeTab, serviceFilter, sortOrder]);

  // Apply Pagination
  const paginatedPipeline = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPipeline.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPipeline, currentPage]);

  const totalPages = Math.ceil(filteredPipeline.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
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
            className="flex items-center justify-center px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Main Container - Removed overflow-hidden to fix desktop scroll squeezing */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 scrollbar-hide">
          <TabButton label="All Applications" count={pipeline.filter(t => serviceFilter === "ALL" || t.type === serviceFilter).length} isActive={activeTab === "ALL"} onClick={() => setActiveTab("ALL")} />
          <TabButton label="Pending" count={pipeline.filter(t => t.status === "PENDING" && (serviceFilter === "ALL" || t.type === serviceFilter)).length} isActive={activeTab === "PENDING"} onClick={() => setActiveTab("PENDING")} />
          <TabButton label="Queried" count={pipeline.filter(t => t.status === "QUERIED" && (serviceFilter === "ALL" || t.type === serviceFilter)).length} isActive={activeTab === "QUERIED"} onClick={() => setActiveTab("QUERIED")} />
          <TabButton label="Completed" count={pipeline.filter(t => (t.status === "APPROVED" || t.status === "FAILED") && (serviceFilter === "ALL" || t.type === serviceFilter)).length} isActive={activeTab === "COMPLETED"} onClick={() => setActiveTab("COMPLETED")} />
          <TabButton label="Unassigned Pool" count={pipeline.filter(t => !t.assignedStaff && t.status === "PENDING" && (serviceFilter === "ALL" || t.type === serviceFilter)).length} isActive={activeTab === "UNASSIGNED"} onClick={() => setActiveTab("UNASSIGNED")} alert />
        </div>

        {/* Search, Filter & Sort Bar */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by proposed name, tracking ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow shadow-sm"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Service Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-zinc-500 hidden sm:block" />
              <select 
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full sm:w-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="ALL">All Services</option>
                <option value="BUSINESS_NAME">Business Names Only</option>
                <option value="LLC">LLC Formations Only</option>
              </select>
            </div>
            
            {/* Sorting */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-zinc-500 hidden sm:block" />
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full sm:w-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="NAME_ASC">Name (A - Z)</option>
                <option value="NAME_DESC">Name (Z - A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* DESKTOP TABLE VIEW */}
        {/* ==================================================== */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
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
                // SKELETON LOADER FOR DESKTOP
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5">
                      <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-2"></div>
                      <div className="flex gap-2"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-20"></div></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-zinc-100 dark:bg-zinc-800/50 rounded w-1/3"></div>
                    </td>
                    <td className="px-6 py-5"><div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full w-24"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div></td>
                    <td className="px-6 py-5 text-center"><div className="h-8 w-8 mx-auto bg-zinc-200 dark:bg-zinc-800 rounded-md"></div></td>
                  </tr>
                ))
              ) : paginatedPipeline.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-500">
                      <Briefcase size={40} className="text-zinc-300 dark:text-zinc-700 mb-3" />
                      <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">No applications found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
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
                        <span className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20">
                          <UserPlus size={14} className="mr-1.5" /> {ticket.assignedStaff}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-sm font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-700">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
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
        {/* MOBILE CARD VIEW */}
        {/* ==================================================== */}
        <div className="md:hidden divide-y divide-zinc-200 dark:divide-zinc-800 w-full">
          {isLoading ? (
             // SKELETON LOADER FOR MOBILE
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-4 animate-pulse">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-full mb-3"></div>
                    <div className="flex gap-2"><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-20"></div></div>
                  </div>
                  <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                </div>
                <div className="h-20 bg-zinc-100 dark:bg-zinc-950 rounded-lg w-full"></div>
              </div>
            ))
          ) : paginatedPipeline.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 flex flex-col items-center">
              <Briefcase size={32} className="text-zinc-300 dark:text-zinc-700 mb-3" />
              <p className="font-medium text-zinc-900 dark:text-zinc-100">No applications found.</p>
            </div>
          ) : (
            paginatedPipeline.map((ticket: any) => (
              <div key={ticket.id} className="p-4 space-y-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                      {ticket.proposedName}
                    </p>
                    <div className="flex items-center mt-2 gap-2 flex-wrap">
                      <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400 text-xs border border-zinc-200 dark:border-zinc-700">
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
                    className="flex-shrink-0 flex items-center gap-1 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
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
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between bg-zinc-50 dark:bg-zinc-950/50 gap-4">
            <p className="text-xs text-zinc-500">
              Showing <span className="font-medium text-zinc-900 dark:text-white">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="font-medium text-zinc-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredPipeline.length)}</span> of <span className="font-medium text-zinc-900 dark:text-white">{filteredPipeline.length}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 disabled:opacity-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-white dark:bg-zinc-900"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 min-w-[70px] text-center">
                Pg {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 disabled:opacity-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors bg-white dark:bg-zinc-900"
              >
                Next <ChevronRight size={16} />
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
        isActive ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
      } ${alert && count > 0 && !isActive ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/20" : ""}`}>
        {count}
      </span>
    </button>
  );
}

function SlaIndicator({ timestamp, status }: { timestamp: string, status: string }) {
  if (status === "APPROVED" || status === "FAILED") {
    return <span className="text-xs font-medium text-zinc-500">Completed • {format(new Date(timestamp), 'MMM d')}</span>;
  }

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
