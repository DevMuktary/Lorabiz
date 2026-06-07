"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Files, HourglassHigh, Wallet, Plus, MagnifyingGlass,
  WarningCircle, PencilSimpleLine, Archive, Funnel, CaretLeft, CaretRight,
  DotsThreeVertical, Trash, Play, Eye, FileText, Warning, Spinner
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// --- TYPES ---
interface DashboardData {
  walletBalance: number;
  stats: {
    total: number; pending: number; approved: number; 
    queried: number; unsubmitted: number; postInc: number;
  };
  tableData: any[];
  totalPages: number;
  currentPage: number;
}

export default function DashboardOverview() {
  const router = useRouter();
  
  // --- STATE ---
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // UI States
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ type: string; regId: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // Modal Loading State

  // --- DATA FETCHING ---
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        search,
        status: statusFilter,
        type: typeFilter
      });
      
      const res = await fetch(`/api/dashboard?${query.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchDashboardData();
    }, 300);
    return () => clearTimeout(timeout);
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // --- HANDLERS ---
  const handleActionClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const executeAction = (actionType: string, id: string) => {
    setActiveMenuId(null);
    if (actionType === "DELETE" || actionType === "SUBMIT") {
      setModal({ type: actionType, regId: id });
    } else {
      // FIX: Route specifically to the massive interactive wizard we built
      if (actionType === "CONTINUE") router.push(`/dashboard/register/details/${id}`);
      if (actionType === "VIEW") router.push(`/dashboard/businesses/${id}`);
      if (actionType === "FIX_QUERIES") router.push(`/dashboard/businesses/${id}/queries`);
    }
  };

  // REAL API EXECUTION
  const confirmRiskAction = async () => {
    if (!modal) return;
    setIsProcessing(true);

    try {
      if (modal.type === 'DELETE') {
        const res = await fetch(`/api/register/details/${modal.regId}`, {
          method: "DELETE",
        });

        if (res.ok) {
          // Refresh the table to show the deletion immediately
          await fetchDashboardData();
        } else {
          alert("Failed to delete the draft. Please try again.");
        }
      }
    } catch (error) {
      alert("A network error occurred.");
    } finally {
      setIsProcessing(false);
      setModal(null);
    }
  };

  if (loading && !data) {
    return <div className="animate-pulse space-y-8"><div className="grid grid-cols-2 lg:grid-cols-3 gap-6"><div className="h-32 bg-gray-200 rounded-2xl"></div><div className="h-32 bg-gray-200 rounded-2xl"></div><div className="h-32 bg-gray-200 rounded-2xl"></div></div></div>;
  }

  return (
    <div className="space-y-8 pb-12 max-w-full overflow-x-hidden">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your business registrations and wallet balance.</p>
        </div>
        
        <Link href="/dashboard/register/business-name">
          <Button className="h-11 bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-lg shadow-[#ff3f7a]/20 font-medium px-6 flex items-center gap-2">
            <Plus className="h-5 w-5" weight="bold" />
            New Registration
          </Button>
        </Link>
      </div>

      {/* CLICKABLE METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Wallet Balance */}
        <button onClick={() => router.push("/dashboard/wallet")} className="bg-white p-6 rounded-2xl border border-gray-200 text-left hover:border-gray-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#ff3f7a] group flex flex-col justify-between">
          <div className="flex justify-between items-start w-full">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Wallet Balance</p>
            <div className="p-2 bg-[#ff3f7a]/10 text-[#ff3f7a] rounded-xl"><Wallet className="h-6 w-6" weight="fill" /></div>
          </div>
          <div className="mt-4 flex items-end justify-between w-full">
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">₦{data?.walletBalance.toLocaleString() || "0"}</h3>
            <span className="text-sm font-semibold text-[#ff3f7a] group-hover:underline">Fund</span>
          </div>
        </button>

        {/* Total Applications */}
        <button onClick={() => setStatusFilter("ALL")} className="bg-white p-6 rounded-2xl border border-gray-200 text-left hover:border-gray-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#ff3f7a] flex flex-col justify-between">
          <div className="flex justify-between items-start w-full">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Applications</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Files className="h-6 w-6" weight="fill" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{data?.stats.total || 0}</h3>
          </div>
        </button>

        {/* Not Submitted */}
        <button onClick={() => setStatusFilter("UNSUBMITTED")} className="bg-white p-6 rounded-2xl border border-gray-200 text-left hover:border-gray-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#ff3f7a] flex flex-col justify-between">
          <div className="flex justify-between items-start w-full">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Not Submitted</p>
            <div className="p-2 bg-gray-100 text-gray-600 rounded-xl"><PencilSimpleLine className="h-6 w-6" weight="fill" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{data?.stats.unsubmitted || 0}</h3>
          </div>
        </button>

        {/* Pending */}
        <button onClick={() => setStatusFilter("PENDING")} className="bg-white p-6 rounded-2xl border border-gray-200 text-left hover:border-gray-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#ff3f7a] flex flex-col justify-between">
          <div className="flex justify-between items-start w-full">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pending</p>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><HourglassHigh className="h-6 w-6" weight="fill" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{data?.stats.pending || 0}</h3>
          </div>
        </button>

        {/* Queried */}
        <button onClick={() => setStatusFilter("QUERIED")} className="bg-white p-6 rounded-2xl border border-gray-200 text-left hover:border-gray-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#ff3f7a] flex flex-col justify-between">
          <div className="flex justify-between items-start w-full">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Queried</p>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl"><WarningCircle className="h-6 w-6" weight="fill" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{data?.stats.queried || 0}</h3>
          </div>
        </button>

        {/* Post-Inc */}
        <button onClick={() => setTypeFilter("POST_INC")} className="bg-white p-6 rounded-2xl border border-gray-200 text-left hover:border-gray-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#ff3f7a] flex flex-col justify-between">
          <div className="flex justify-between items-start w-full">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Post-Incorporation</p>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Archive className="h-6 w-6" weight="fill" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{data?.stats.postInc || 0}</h3>
          </div>
        </button>
      </div>

      {/* THE DATA TABLE WITH FILTERS & PAGINATION */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-visible">
        
        {/* Table Filters */}
        <div className="p-5 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-50/30 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search business names..." 
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff3f7a] w-full sm:w-72 bg-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
              <Funnel className="h-4 w-4 text-gray-400" />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="bg-transparent focus:outline-none font-medium cursor-pointer">
                <option value="ALL">All Statuses</option>
                <option value="UNSUBMITTED">Not Submitted</option>
                <option value="PENDING">Pending</option>
                <option value="QUERIED">Queried</option>
                <option value="APPROVED">Approved</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
              <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="bg-transparent focus:outline-none font-medium cursor-pointer">
                <option value="ALL">All Services</option>
                <option value="Business Name">Business Name</option>
                <option value="Limited Liability Company">LLC</option>
                <option value="POST_INC">Post-Incorporation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="w-full overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">Business / Proposed Name</th>
                <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">Service Type</th>
                <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">Last Updated</th>
                <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase">Status</th>
                <th className="px-6 py-3.5 font-semibold text-xs tracking-wider uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 relative">
              {data?.tableData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                    <Archive className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p className="font-medium">No registrations found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                data?.tableData.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{reg.proposedName || "Untitled Application"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{reg.id}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-600">{reg.businessType || reg.entityType || "N/A"}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(reg.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`
                        inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase
                        ${reg.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : ''}
                        ${reg.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : ''}
                        ${reg.status === 'QUERIED' ? 'bg-red-100 text-red-700 animate-pulse' : ''}
                        ${reg.status === 'UNSUBMITTED' ? 'bg-gray-100 text-gray-600' : ''}
                      `}>
                        {reg.status === 'UNSUBMITTED' ? 'NOT SUBMITTED' : reg.status}
                      </span>
                    </td>
                    
                    {/* THE SMART ACTION MENU */}
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={(e) => handleActionClick(e, reg.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
                      >
                        <DotsThreeVertical className="h-6 w-6" weight="bold" />
                      </button>

                      {/* Dropdown Logic */}
                      {activeMenuId === reg.id && (
                        <div className="absolute right-8 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 animate-in fade-in zoom-in-95 origin-top-right">
                          
                          {reg.status === 'UNSUBMITTED' && (
                            <>
                              <button onClick={() => executeAction("CONTINUE", reg.id)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Play className="h-4 w-4 text-[#ff3f7a]" weight="fill" /> Continue Draft
                              </button>
                              <button onClick={() => executeAction("DELETE", reg.id)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                                <Trash className="h-4 w-4" weight="fill" /> Delete Draft
                              </button>
                            </>
                          )}

                          {reg.status === 'PENDING' && (
                            <button onClick={() => executeAction("VIEW", reg.id)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <Eye className="h-4 w-4 text-blue-500" weight="fill" /> View Application
                            </button>
                          )}

                          {reg.status === 'QUERIED' && (
                            <>
                              <button onClick={() => executeAction("FIX_QUERIES", reg.id)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2">
                                <WarningCircle className="h-4 w-4" weight="fill" /> Read Queries
                              </button>
                              <button onClick={() => executeAction("CONTINUE", reg.id)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <PencilSimpleLine className="h-4 w-4 text-amber-500" weight="fill" /> Fix & Resubmit
                              </button>
                              <button onClick={() => executeAction("VIEW", reg.id)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-500" weight="fill" /> Substitute Name
                              </button>
                            </>
                          )}

                          {reg.status === 'APPROVED' && (
                            <button onClick={() => executeAction("VIEW", reg.id)} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                              <Archive className="h-4 w-4 text-emerald-500" weight="fill" /> View Documents
                            </button>
                          )}

                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <span className="text-sm text-gray-500 font-medium">
              Page <span className="text-gray-900 font-bold">{page}</span> of {data.totalPages}
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <CaretLeft className="h-4 w-4" weight="bold" />
              </button>
              
              {[...Array(data.totalPages)].map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`h-9 w-9 rounded-lg text-sm font-bold transition-colors ${page === i + 1 ? 'bg-[#ff3f7a] text-white shadow-md shadow-[#ff3f7a]/20' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <CaretRight className="h-4 w-4" weight="bold" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- RISK CONFIRMATION MODAL --- */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
              {modal.type === 'DELETE' ? (
                <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <Warning className="h-8 w-8" weight="fill" />
                </div>
              ) : (
                <div className="h-16 w-16 bg-[#ff3f7a]/10 text-[#ff3f7a] rounded-full flex items-center justify-center mb-4">
                  <Play className="h-8 w-8" weight="fill" />
                </div>
              )}
              
              <h3 className="text-xl font-bold text-gray-900">
                {modal.type === 'DELETE' ? 'Delete Application?' : 'Submit Application?'}
              </h3>
              <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                {modal.type === 'DELETE' 
                  ? 'Are you sure you want to delete this application? All saved progress will be permanently lost and cannot be recovered.' 
                  : 'Are you ready to submit this application for processing? Ensure all details are correct.'}
              </p>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setModal(null)}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRiskAction}
                disabled={isProcessing}
                className={`flex-1 py-3 px-4 font-semibold rounded-xl text-white shadow-lg transition-colors flex items-center justify-center
                  ${modal.type === 'DELETE' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-[#ff3f7a] hover:bg-[#e02b62] shadow-[#ff3f7a]/20'}
                  disabled:opacity-70 disabled:cursor-not-allowed
                `}
              >
                {isProcessing ? (
                   <Spinner className="animate-spin h-5 w-5" weight="bold" />
                ) : (
                   modal.type === 'DELETE' ? 'Yes, Delete' : 'Yes, Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
