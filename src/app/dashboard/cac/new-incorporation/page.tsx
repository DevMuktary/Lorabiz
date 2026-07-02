"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Plus, 
  Spinner, 
  FileText, 
  Hourglass, 
  WarningCircle, 
  CheckCircle,
  ArrowLeft,
  Trash,
  X
} from "@phosphor-icons/react";

import RegistrationsTable from "@/components/features/cac/new-incorporation/RegistrationsTable";
import ReceiptModal from "@/components/features/cac/new-incorporation/ReceiptModal";

export default function RegistrationsHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [receiptData, setReceiptData] = useState<any>(null);

  // Custom Delete Modals State
  const [deleteContext, setDeleteContext] = useState<{ isOpen: boolean, id: string | null, isLoading: boolean, error: string | null }>({
    isOpen: false, id: null, isLoading: false, error: null
  });
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  
  // Custom Payment Success Alert
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  // Detect ?success=true from URL
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowPaymentSuccess(true);
      
      // Clean up the URL so it doesn't stay there on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Auto-hide the alert after 10 seconds
      const timer = setTimeout(() => {
        setShowPaymentSuccess(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

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

  // CUSTOM DELETE EXECUTION
  const executeDelete = async () => {
    if (!deleteContext.id) return;
    
    setDeleteContext(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const res = await fetch(`/api/cac/delete?id=${deleteContext.id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (data.success) {
        setDeleteContext({ isOpen: false, id: null, isLoading: false, error: null });
        setSuccessModalOpen(true);
        fetchDashboardData(); // Refresh table
      } else {
        setDeleteContext(prev => ({ ...prev, isLoading: false, error: data.message || "Failed to delete the registration." }));
      }
    } catch (error) {
      setDeleteContext(prev => ({ ...prev, isLoading: false, error: "A network error occurred. Please check your connection." }));
    }
  };

  // ==========================================
  // SMART ACTION HANDLER (WITH DYNAMIC ROUTING)
  // ==========================================
  const handleExecuteAction = (action: string, id: string) => {
    const normalizedAction = action.toLowerCase();
    
    // Find the exact registration record to check its type
    const reg = dashboardData?.tableData?.find((r: any) => r.id === id);

    if (normalizedAction.includes("delete")) {
      setDeleteContext({ isOpen: true, id: id, isLoading: false, error: null });
    } 
    else if (normalizedAction.includes("receipt")) {
      if (reg) {
        setReceiptData(reg); 
      }
    } 
    else if (normalizedAction.includes("view")) {
      router.push(`/dashboard/cac/register/view/${id}`);
    } 
    else {
      // DYNAMIC ROUTING: Check entity type and route to the correct details page!
      if (reg?._appType === "LLC") {
        router.push(`/dashboard/cac/register/llc/details/${id}`);
      } else {
        router.push(`/dashboard/cac/register/business-name/details/${id}`);
      }
    }
  };

  const stats = dashboardData?.stats || { unsubmitted: 0, pending: 0, queried: 0, approved: 0 };

  return (
    <div className="space-y-10 relative">
      
      {/* ========================================== */}
      {/* 1. PAYMENT SUCCESS ALERT NOTIFICATION        */}
      {/* ========================================== */}
      {showPaymentSuccess && (
        <div className="fixed top-24 right-4 sm:right-10 z-[999] animate-in slide-in-from-top-10 fade-in duration-500">
          <div className="bg-card border-2 border-emerald-500 shadow-[0_10px_40px_rgba(16,185,129,0.2)] rounded-2xl p-4 sm:p-5 flex items-start gap-4 max-w-sm relative overflow-hidden">
            {/* Progress bar animation */}
            <div className="absolute bottom-0 left-0 h-1.5 bg-emerald-500 animate-[shrink_10s_linear_forwards]" style={{ width: '100%' }} />
            
            <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle className="h-6 w-6" weight="fill" />
            </div>
            <div className="pr-6">
              <h4 className="text-base font-black text-foreground mb-1">🎉 Payment Successful!</h4>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                Your application has been submitted and is now <span className="font-bold text-blue-500">Pending</span> review.
              </p>
            </div>
            <button 
              onClick={() => setShowPaymentSuccess(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <X weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteContext.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="h-20 w-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-red-500/5">
              <Trash weight="fill" className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">Delete Application?</h3>
            <p className="text-sm text-muted-foreground font-medium mb-6">
              Are you sure you want to permanently delete this registration? This action cannot be undone.
            </p>

            {deleteContext.error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-3 rounded-lg mb-6">
                {deleteContext.error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={executeDelete}
                disabled={deleteContext.isLoading}
                className="w-full h-14 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 cursor-pointer shadow-lg shadow-red-500/20"
              >
                {deleteContext.isLoading ? <Spinner className="animate-spin h-5 w-5" /> : "Yes, Delete It"}
              </button>
              <button
                onClick={() => setDeleteContext({ isOpen: false, id: null, isLoading: false, error: null })}
                disabled={deleteContext.isLoading}
                className="w-full h-14 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM SUCCESS MODAL */}
      {successModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-500/5">
              <CheckCircle weight="fill" className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">Deleted Successfully</h3>
            <p className="text-sm text-muted-foreground font-medium mb-8">
              The application has been permanently removed from your records.
            </p>
            <button
              onClick={() => setSuccessModalOpen(false)}
              className="w-full h-14 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-colors cursor-pointer shadow-lg"
            >
              Continue
            </button>
          </div>
        </div>
      )}


      {/* MAIN DASHBOARD CONTENT */}
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
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:opacity-90 transition-all active:scale-95 shrink-0 shadow-lg shadow-primary/20"
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
