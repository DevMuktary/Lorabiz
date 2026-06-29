"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Spinner, 
  FileText, 
  Hourglass, 
  WarningCircle, 
  CheckCircle,
  ArrowLeft
} from "@phosphor-icons/react";

import RegistrationsTable from "@/components/features/cac/new-incorporation/RegistrationsTable";
import ReceiptModal from "@/components/features/cac/new-incorporation/ReceiptModal";

export default function RegistrationsHubPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [receiptData, setReceiptData] = useState<any>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        search: search,
        status: statusFilter,
        type: typeFilter
      }).toString();

      const res = await fetch(`/api/dashboard?${query}`);
      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDashboardData();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [page, search, statusFilter, typeFilter]);

  // SMART ACTION HANDLER (NOW WITH DELETE LOGIC)
  const handleExecuteAction = async (action: string, id: string) => {
    const normalizedAction = action.toLowerCase();

    if (normalizedAction.includes("delete")) {
      const confirmDelete = window.confirm("Are you sure you want to permanently delete this application? This action cannot be undone.");
      if (!confirmDelete) return;

      setIsLoading(true);
      try {
        const res = await fetch(`/api/cac/delete?id=${id}`, { method: "DELETE" });
        const data = await res.json();
        
        if (data.success) {
          fetchDashboardData(); // Refresh the table automatically
        } else {
          alert(data.message || "Failed to delete the registration.");
          setIsLoading(false);
        }
      } catch (error) {
        alert("A network error occurred while trying to delete.");
        setIsLoading(false);
      }
    } 
    else if (normalizedAction.includes("receipt")) {
      const reg = dashboardData?.tableData?.find((r: any) => r.id === id);
      if (reg) {
        setReceiptData(reg); 
      }
    } 
    else if (normalizedAction.includes("view")) {
      router.push(`/dashboard/cac/register/view/${id}`);
    } 
    else {
      // Edit / Continue goes to the active form page
      // Adjust this logic if LLCs and Business Names route to different paths
      router.push(`/dashboard/cac/register/business-name/details/${id}`);
    }
  };

  const stats = dashboardData?.stats || { unsubmitted: 0, pending: 0, queried: 0, approved: 0 };

  return (
    <div className="space-y-10">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-5">
          <Link 
            href="/dashboard/cac"
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft weight="bold" className="h-4 w-4" />
            Back to CAC Hub
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-black text-foreground">New Registrations</h1>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              Track your ongoing applications, respond to queries, or start a new registration.
            </p>
          </div>
        </div>

        <Link 
          href="/dashboard/cac/new-incorporation/new"
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 shrink-0"
        >
          <Plus weight="bold" className="h-4 w-4" />
          Start New Registration
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Unsubmitted */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Drafts</p>
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <FileText weight="duotone" className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">
            {isLoading && !dashboardData ? <Spinner className="animate-spin h-6 w-6 text-muted-foreground" /> : stats.unsubmitted}
          </p>
        </div>

        {/* Pending */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Pending</p>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Hourglass weight="duotone" className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">
            {isLoading && !dashboardData ? <Spinner className="animate-spin h-6 w-6 text-muted-foreground" /> : stats.pending}
          </p>
        </div>

        {/* Queried */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Queried</p>
            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <WarningCircle weight="duotone" className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">
            {isLoading && !dashboardData ? <Spinner className="animate-spin h-6 w-6 text-muted-foreground" /> : stats.queried}
          </p>
        </div>

        {/* Approved */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Approved</p>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle weight="duotone" className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">
            {isLoading && !dashboardData ? <Spinner className="animate-spin h-6 w-6 text-muted-foreground" /> : stats.approved}
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <RegistrationsTable 
          data={dashboardData || {}} 
          loading={isLoading}
          page={page}
          setPage={setPage}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          onExecuteAction={handleExecuteAction}
        />
      </div>

      {receiptData && (
        <ReceiptModal 
          onClose={() => setReceiptData(null)} 
          reg={receiptData} 
        />
      )}

    </div>
  );
}
