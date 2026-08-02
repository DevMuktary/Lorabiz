"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { differenceInHours, formatDistanceToNow, format } from 'date-fns';
import { 
  ArrowLeft, Search, RefreshCw, Eye, ShieldCheck, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Building2, Briefcase, Landmark
} from 'lucide-react';
import ScumlApplicationDrawer from '@/components/mds/scuml/ScumlApplicationDrawer';

export default function ScumlPipelinePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [pipeline, setPipeline] = useState<any[]>([]);
  
  // Filters, Sorting & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); 
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST"); 
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const fetchPipeline = async () => {
    setIsLoading(true);
    try {
      // We will build this API route next
      const res = await fetch('/api/mds/pipeline/scuml'); 
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
  }, [searchTerm, activeTab, serviceFilter, sortOrder]);

  const filteredPipeline = useMemo(() => {
    let result = pipeline.filter((ticket) => {
      const matchesSearch = 
        ticket.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.transactionRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === "PENDING") matchesTab = ticket.status === "PENDING"; 
      if (activeTab === "PROCESSING") matchesTab = ticket.status === "PROCESSING";
      if (activeTab === "COMPLETED") matchesTab = ticket.status === "COMPLETED";

      const matchesService = serviceFilter === "ALL" || ticket.type === serviceFilter;

      return matchesSearch && matchesTab && matchesService;
    });

    result = result.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      if (sortOrder === "NEWEST") return dateB - dateA;
      if (sortOrder === "OLDEST") return dateA - dateB;
      if (sortOrder === "NAME_ASC") return a.companyName.localeCompare(b.companyName);
      if (sortOrder === "NAME_DESC") return b.companyName.localeCompare(a.companyName);
      return 0;
    });

    return result;
  }, [pipeline, searchTerm, activeTab, serviceFilter, sortOrder]);

  const paginatedPipeline = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPipeline.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPipeline, currentPage]);

  const totalPages = Math.ceil(filteredPipeline.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <div>
        <Link href="/quadrox-lorabiz-team/mds/dashboard/orders" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors">
          <ArrowLeft size={16} className="mr-1.5" /> Back to Global Pipeline
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">SCUML Registration Directory</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage Special Control Unit Against Money Laundering applications.</p>
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

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 scrollbar-hide">
          <TabButton label="All Applications" count={pipeline.filter(t => serviceFilter === "ALL" || t.type === serviceFilter).length} isActive={activeTab === "ALL"} onClick={() => setActiveTab("ALL")} />
          <TabButton label="Pending" count={pipeline.filter(t => t.status === "PENDING" && (serviceFilter === "ALL" || t.type === serviceFilter)).length} isActive={activeTab === "PENDING"} onClick={() => setActiveTab("PENDING")} />
          <TabButton label="Processing" count={pipeline.filter(t => t.status === "PROCESSING" && (serviceFilter === "ALL" || t.type === serviceFilter)).length} isActive={activeTab === "PROCESSING"} onClick={() => setActiveTab("PROCESSING")} />
          <TabButton label="Completed" count={pipeline.filter(t => t.status === "COMPLETED" && (serviceFilter === "ALL" || t.type === serviceFilter)).length} isActive={activeTab === "COMPLETED"} onClick={() => setActiveTab("COMPLETED")} />
        </div>

        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by company name, transaction ref..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-zinc-500 hidden sm:block" />
              <select 
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full sm:w-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Entity Types</option>
                <option value="BUSINESS_NAME">Business Name</option>
                <option value="LLC">LLC</option>
                <option value="NGO">NGO</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-zinc-500 hidden sm:block" />
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full sm:w-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="NAME_ASC">Name (A - Z)</option>
                <option value="NAME_DESC">Name (Z - A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* DESKTOP VIEW */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Application Info</th>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium">Entity Type</th>
                <th className="px-6 py-4 font-medium">SLA / Queue Time</th>
                <th className="px-6 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5"><div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mb-2"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div></td>
                    <td className="px-6 py-5"><div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full w-24"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div></td>
                    <td className="px-6 py-5 text-center"><div className="h-8 w-8 mx-auto bg-zinc-200 dark:bg-zinc-800 rounded-md"></div></td>
                  </tr>
                ))
              ) : paginatedPipeline.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-500">
                      <ShieldCheck size={40} className="text-zinc-300 dark:text-zinc-700 mb-3" />
                      <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">No SCUML applications found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPipeline.map((ticket: any) => (
                  <tr key={ticket.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[250px]">{ticket.companyName}</p>
                      <span className="inline-block mt-1.5 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400 text-xs">
                        {ticket.transactionRef}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{ticket.clientName}</p>
                      <p className="text-xs text-zinc-500">{ticket.clientEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      <EntityTypeBadge type={ticket.type} />
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

        {/* MOBILE CARDS */}
        <div className="md:hidden divide-y divide-zinc-200 dark:divide-zinc-800 w-full">
          {isLoading ? (
            <div className="p-8 text-center text-zinc-500 animate-pulse">Loading...</div>
          ) : paginatedPipeline.map((ticket: any) => (
            <div key={ticket.id} className="p-4 space-y-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{ticket.companyName}</p>
                  <div className="flex items-center mt-2 gap-2 flex-wrap">
                    <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400 text-xs border border-zinc-200 dark:border-zinc-700">
                      {ticket.transactionRef}
                    </span>
                    <EntityTypeBadge type={ticket.type} />
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
                <div className="flex justify-between">
                  <span className="text-zinc-500">Time:</span>
                  <SlaIndicator timestamp={ticket.updatedAt} status={ticket.status} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PAGINATION */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between bg-zinc-50 dark:bg-zinc-950/50 gap-4">
            <p className="text-xs text-zinc-500">
              Showing <span className="font-medium text-zinc-900 dark:text-white">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="font-medium text-zinc-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredPipeline.length)}</span>
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 disabled:opacity-50 hover:bg-zinc-100 bg-white dark:bg-zinc-900"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 min-w-[70px] text-center">
                Pg {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 disabled:opacity-50 hover:bg-zinc-100 bg-white dark:bg-zinc-900"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ScumlApplicationDrawer 
        ticket={selectedTicket} 
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

function TabButton({ label, count, isActive, onClick }: { label: string, count: number, isActive: boolean, onClick: () => void }) {
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
      }`}>
        {count}
      </span>
    </button>
  );
}

function EntityTypeBadge({ type }: { type: string }) {
  if (type === "LLC") {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"><Building2 size={10} className="mr-1" /> LLC</span>;
  }
  if (type === "BUSINESS_NAME") {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"><Briefcase size={10} className="mr-1" /> BN</span>;
  }
  if (type === "NGO") {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"><Landmark size={10} className="mr-1" /> NGO</span>;
  }
  return null;
}

function SlaIndicator({ timestamp, status }: { timestamp: string, status: string }) {
  if (status === "COMPLETED") {
    return <span className="text-xs font-medium text-zinc-500">Completed • {format(new Date(timestamp), 'MMM d')}</span>;
  }
  const hoursInQueue = differenceInHours(new Date(), new Date(timestamp));
  const timeString = formatDistanceToNow(new Date(timestamp));
  let color = "bg-emerald-500"; 
  let textColor = "text-emerald-700 dark:text-emerald-400";
  
  if (hoursInQueue >= 72) {
    color = "bg-red-500 animate-pulse"; 
    textColor = "text-red-700 dark:text-red-400";
  } else if (hoursInQueue >= 48) {
    color = "bg-amber-500"; 
    textColor = "text-amber-700 dark:text-amber-400";
  }

  return (
    <div className="flex items-center">
      <span className={`w-2 h-2 rounded-full mr-2 ${color}`}></span>
      <span className={`text-xs font-semibold tabular-nums ${textColor}`}>{timeString} ago</span>
    </div>
  );
}
