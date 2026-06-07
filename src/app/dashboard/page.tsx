"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, MagnifyingGlass, Funnel, Archive, Spinner } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// Abstracted Components
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import FundWalletModal from "@/components/dashboard/FundWalletModal";
import ActionMenu from "@/components/dashboard/ActionMenu";

export default function DashboardOverview() {
  const router = useRouter();
  
  // States
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  
  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: page.toString(), search, status: statusFilter, type: typeFilter });
      const res = await fetch(`/api/dashboard?${query.toString()}`);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchDashboardData, 300);
    return () => clearTimeout(timeout);
  }, [page, search, statusFilter, typeFilter]);

  // Handle actions triggered from the smart 3-dots menu
  const handleActionMenuExecute = (actionType: string, id: string) => {
    switch (actionType) {
      case "CONTINUE": router.push(`/dashboard/register/details/${id}`); break;
      case "VIEW": router.push(`/dashboard/businesses/${id}`); break;
      case "FIX_QUERIES": router.push(`/dashboard/businesses/${id}/queries`); break;
      case "DOWNLOAD_CERT": alert("Trigger S3 pre-signed URL fetch for Cert"); break;
      case "VIEW_TIN": alert("Open TIN Viewer Modal"); break;
      case "DELETE":
        if (confirm("Permanently delete this draft?")) {
           // Execute delete via API then refresh
           fetchDashboardData();
        }
        break;
      default: console.log("Action not mapped:", actionType);
    }
  };

  // Optimistic UI Update for Wallet
  const handleWalletSuccess = (amount: number) => {
    setData((prev: any) => ({ ...prev, walletBalance: prev.walletBalance + amount }));
  };

  if (loading && !data) {
    return <div className="h-64 flex items-center justify-center"><Spinner className="animate-spin h-8 w-8 text-[#ff3f7a]" /></div>;
  }

  return (
    <div className="space-y-8 pb-12 max-w-full overflow-x-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage your portfolio and track CAC statuses.</p>
        </div>
        <Link href="/dashboard/new">
          <Button className="h-12 bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-lg shadow-[#ff3f7a]/20 font-bold px-6 flex items-center gap-2 rounded-xl active:scale-95 transition-transform">
            <Plus className="h-5 w-5" weight="bold" /> New Application
          </Button>
        </Link>
      </div>

      {/* Extracted Metrics Component */}
      <DashboardMetrics 
        walletBalance={data?.walletBalance || 0} 
        stats={data?.stats} 
        onFundClick={() => setIsFundModalOpen(true)}
        onFilterChange={(key, val) => { key === 'status' ? setStatusFilter(val) : setTypeFilter(val); setPage(1); }}
      />

      {/* The Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50">
          <div className="relative">
            <MagnifyingGlass className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input 
              type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search proposed names..." 
              className="pl-11 pr-4 h-12 border-2 border-slate-200 rounded-xl text-sm font-medium focus:ring-[#ff3f7a] focus:border-[#ff3f7a] w-full md:w-80 outline-none transition-all bg-white"
            />
          </div>
          <div className="flex gap-3">
             {/* Filter Dropdowns */}
             <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-12 px-4 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-600 outline-none focus:border-[#ff3f7a]">
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
             </select>
          </div>
        </div>

        {/* Table Body with Opacity Fade during background fetches */}
        <div className={`w-full overflow-x-auto transition-opacity duration-200 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 text-slate-400 border-b border-slate-100">
                <th className="px-6 py-4 font-bold text-xs tracking-wider uppercase">Business Name</th>
                <th className="px-6 py-4 font-bold text-xs tracking-wider uppercase">Entity Type</th>
                <th className="px-6 py-4 font-bold text-xs tracking-wider uppercase">Last Updated</th>
                <th className="px-6 py-4 font-bold text-xs tracking-wider uppercase">Status</th>
                <th className="px-6 py-4 font-bold text-xs tracking-wider uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.tableData?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                    <Archive className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                    <p className="font-bold text-lg text-slate-700">No records found</p>
                    <p className="text-sm font-medium">Try adjusting your filters or search term.</p>
                  </td>
                </tr>
              ) : (
                data?.tableData?.map((reg: any) => (
                  <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="font-black text-slate-900">{reg.proposedName}</p>
                      <p className="text-xs font-semibold text-slate-400 mt-1 uppercase">{reg.id}</p>
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-600">{reg.businessType || reg.entityType}</td>
                    <td className="px-6 py-5 font-semibold text-slate-500">{new Date(reg.updatedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-black tracking-widest uppercase
                        ${reg.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : ''}
                        ${reg.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : ''}
                        ${reg.status === 'QUERIED' ? 'bg-red-100 text-red-700' : ''}
                        ${reg.status === 'UNSUBMITTED' ? 'bg-slate-100 text-slate-600' : ''}
                      `}>
                        {reg.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <ActionMenu reg={reg} onExecute={handleActionMenuExecute} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Clean Pagination (Fixed Explosion Bug) */}
        {data?.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-sm font-bold text-slate-500">
              Page <span className="text-slate-900">{page}</span> of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} variant="outline" className="h-9 font-bold rounded-xl border-2 border-slate-200 text-slate-600">Prev</Button>
              <Button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} variant="outline" className="h-9 font-bold rounded-xl border-2 border-slate-200 text-slate-600">Next</Button>
            </div>
          </div>
        )}
      </div>

      <FundWalletModal 
        isOpen={isFundModalOpen} 
        onClose={() => setIsFundModalOpen(false)} 
        onSuccessOptimistic={handleWalletSuccess} 
      />
    </div>
  );
}
