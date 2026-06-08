"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Spinner } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import RegistrationsTable from "@/components/dashboard/RegistrationsTable";
import FundWalletModal from "@/components/dashboard/FundWalletModal";

export default function DashboardOverview() {
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  
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

  const handleActionMenuExecute = (actionType: string, id: string) => {
    switch (actionType) {
      case "CONTINUE": router.push(`/dashboard/register/details/${id}`); break;
      case "VIEW": router.push(`/dashboard/businesses/${id}`); break;
      case "FIX_QUERIES": router.push(`/dashboard/businesses/${id}/queries`); break;
      case "DOWNLOAD_CERT": alert("Trigger Cloudinary secure URL fetch"); break;
      case "VIEW_TIN": alert("Open TIN Viewer Modal"); break;
      case "DELETE":
        if (confirm("Permanently delete this draft?")) fetchDashboardData();
        break;
    }
  };

  const handleWalletSuccess = (amount: number) => {
    setData((prev: any) => ({ ...prev, walletBalance: prev.walletBalance + amount }));
  };

  if (loading && !data) {
    return <div className="h-64 flex items-center justify-center"><Spinner className="animate-spin h-8 w-8 text-[#ff3f7a]" /></div>;
  }

  return (
    // FIX: Removed the buggy 'overflow-x-hidden' that was trapping clicks
    <div className="pb-12 w-full">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 mt-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}, Chief 👋
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        
        {/* FIX: Use asChild so the button properly inherits the <a> tag properties without eating clicks */}
        <Button asChild className="h-12 bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-lg shadow-[#ff3f7a]/20 font-bold px-6 flex items-center gap-2 rounded-xl active:scale-95 transition-transform shrink-0 cursor-pointer">
          <Link href="/dashboard/new">
            <Plus className="h-5 w-5" weight="bold" /> New Application
          </Link>
        </Button>
      </div>

      <DashboardMetrics 
        walletBalance={data?.walletBalance || 0} 
        stats={data?.stats} 
        currentStatus={statusFilter}
        onFundClick={() => setIsFundModalOpen(true)}
        onFilterChange={(key, val) => {
          if (key === 'status') setStatusFilter(val);
          setPage(1);
        }}
      />

      <RegistrationsTable 
        data={data}
        loading={loading}
        page={page}
        setPage={setPage}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        onExecuteAction={handleActionMenuExecute}
      />

      <FundWalletModal 
        isOpen={isFundModalOpen} 
        onClose={() => setIsFundModalOpen(false)} 
        onSuccessOptimistic={handleWalletSuccess} 
      />
    </div>
  );
}
