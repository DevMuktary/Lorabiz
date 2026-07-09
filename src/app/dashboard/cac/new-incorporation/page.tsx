"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Plus, Spinner, FileText, Hourglass, WarningCircle, CheckCircle,
  ArrowLeft, Trash, X
} from "@phosphor-icons/react";

import RegistrationsTable from "@/components/features/cac/new-incorporation/RegistrationsTable";
import ReceiptModal from "@/components/features/cac/new-incorporation/ReceiptModal";
import QueryReasonModal from "@/components/features/cac/new-incorporation/QueryReasonModal";

// NEW MODALS IMPORTS
import ApprovedDetailsModal from "@/components/features/cac/new-incorporation/ApprovedDetailsModal";
import SubstituteNameModal from "@/components/features/cac/new-incorporation/SubstituteNameModal";
import BizPaymentModal from "@/components/features/cac/register/biz-name/PaymentModal";
import LlcPaymentModal from "@/components/features/cac/register/llc/PaymentModal";

function RegistrationsHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // General Action States
  const [receiptData, setReceiptData] = useState<any>(null);
  const [queryReasonData, setQueryReasonData] = useState<any>(null);
  const [approvedData, setApprovedData] = useState<any>(null);
  const [substituteData, setSubstituteData] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  // Checks & Alerts
  const [completenessError, setCompletenessError] = useState<{ isOpen: boolean, fields: string[] }>({ isOpen: false, fields: [] });
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [deleteContext, setDeleteContext] = useState<{ isOpen: boolean, id: string | null, isLoading: boolean, error: string | null }>({
    isOpen: false, id: null, isLoading: false, error: null
  });
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setShowPaymentSuccess(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      const timer = setTimeout(() => setShowPaymentSuccess(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(), search, status: statusFilter, type: typeFilter
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
    const timeoutId = setTimeout(() => fetchDashboardData(), 300);
    return () => clearTimeout(timeoutId);
  }, [page, search, statusFilter, typeFilter]);

  const executeDelete = async () => {
    if (!deleteContext.id) return;
    setDeleteContext(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch(`/api/cac/delete?id=${deleteContext.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDeleteContext({ isOpen: false, id: null, isLoading: false, error: null });
        setSuccessModalOpen(true);
        fetchDashboardData(); 
      } else {
        setDeleteContext(prev => ({ ...prev, isLoading: false, error: data.message || "Failed to delete the registration." }));
      }
    } catch (error) {
      setDeleteContext(prev => ({ ...prev, isLoading: false, error: "A network error occurred." }));
    }
  };

  // ==========================================
  // SMART ACTION HANDLER
  // ==========================================
  const handleExecuteAction = async (action: string, id: string, rowData?: any) => {
    const reg = rowData || dashboardData?.tableData?.find((r: any) => r.id === id);
    if (!reg) return;

    if (action === "DELETE") {
      setDeleteContext({ isOpen: true, id: id, isLoading: false, error: null });
    } 
    else if (action === "PAY_DRAFT") {
      // 1. Check Completeness via API
      try {
        const check = await fetch("/api/cac/check-completeness", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, type: reg._appType })
        });
        const result = await check.json();
        
        if (!result.isComplete) {
          setCompletenessError({ isOpen: true, fields: result.missingFields });
        } else {
          setPaymentData(reg); // Opens appropriate Payment Modal
        }
      } catch (err) {
        console.error("Completeness check failed");
      }
    }
    else if (action === "VIEW_APPROVED_DETAILS") {
      setApprovedData(reg);
    }
    else if (action === "SUBSTITUTE_NAME") {
      setSubstituteData(reg);
    }
    else if (action === "DOWNLOAD_RECEIPT") {
      setReceiptData(reg); 
    } 
    else if (action === "VIEW_REASON") {
      setQueryReasonData(reg);
    }
    else if (action === "VIEW") {
      router.push(`/dashboard/cac/register/view/${id}`);
    } 
    else if (action === "RESOLVE") {
      if (reg._appType === "LLC") router.push(`/dashboard/cac/llc/${id}/queries`);
      else router.push(`/dashboard/cac/businesses/${id}/queries`);
    }
    else if (action === "CONTINUE") {
      if (reg._appType === "LLC") router.push(`/dashboard/cac/register/llc/details/${id}`);
      else router.push(`/dashboard/cac/register/business-name/details/${id}`);
    }
  };

  const stats = dashboardData?.stats || { unsubmitted: 0, pending: 0, queried: 0, approved: 0 };

  return (
    <div className="space-y-10 relative overflow-x-hidden">
      
      {/* ALERTS & TOASTS */}
      {showPaymentSuccess && (
        <div className="fixed top-24 right-4 sm:right-10 z-[999] animate-in slide-in-from-top-10 fade-in duration-500">
          <div className="bg-card border-2 border-emerald-500 shadow-[0_10px_40px_rgba(16,185,129,0.2)] rounded-2xl p-4 sm:p-5 flex items-start gap-4 max-w-sm relative overflow-hidden">
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
            <button onClick={() => setShowPaymentSuccess(false)} className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:bg-secondary cursor-pointer">
              <X weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* COMPLETENESS ERROR ALERT */}
      {completenessError.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border-2 border-red-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
                <WarningCircle weight="fill" className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-foreground">Incomplete Application</h3>
            </div>
            <p className="text-sm text-muted-foreground font-medium mb-4">
              You cannot make payment yet. Please click "Continue Draft" to fill in the following missing details:
            </p>
            <ul className="list-disc pl-5 text-sm text-foreground font-medium mb-8 space-y-1">
              {completenessError.fields.map(field => <li key={field}>{field}</li>)}
            </ul>
            <button onClick={() => setCompletenessError({ isOpen: false, fields: [] })} className="w-full h-14 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/80 transition-colors">
              Got it
            </button>
          </div>
        </div>
      )}

      {/* --- NEW ACTION MODALS --- */}
      {approvedData && <ApprovedDetailsModal reg={approvedData} onClose={() => setApprovedData(null)} />}
      
      {substituteData && <SubstituteNameModal reg={substituteData} onClose={() => setSubstituteData(null)} />}

      {/* PAYMENT MODALS FOR UNSUBMITTED PAY_DRAFT */}
      {paymentData?._appType === "BUSINESS_NAME" && (
        <BizPaymentModal 
          onClose={() => setPaymentData(null)} 
          registrationId={paymentData.id} 
          proposedName={paymentData.proposedName} 
        />
      )}

      {paymentData?._appType === "LLC" && (
        <LlcPaymentModal 
          onClose={() => setPaymentData(null)} 
          registrationId={paymentData.id} 
          proposedName={paymentData.proposedName} 
          totalAmount={paymentData.totalAmount ?? 0} 
        />
      )}

      {/* EXISTING MODALS */}
      {queryReasonData && (
        <QueryReasonModal 
          businessName={queryReasonData.proposedName || "Unnamed Registration"}
          reason={queryReasonData.queryReason || "No specific reason provided."}
          status={queryReasonData.status}
          date={queryReasonData.updatedAt || new Date().toISOString()}
          onClose={() => setQueryReasonData(null)}
          onResolve={() => {
            const id = queryReasonData.id;
            const rowData = queryReasonData;
            setQueryReasonData(null);
            handleExecuteAction("resolve", id, rowData);
          }}
        />
      )}

      {deleteContext.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
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
              <button onClick={executeDelete} disabled={deleteContext.isLoading} className="w-full h-14 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl flex items-center justify-center disabled:opacity-50">
                {deleteContext.isLoading ? <Spinner className="animate-spin h-5 w-5" /> : "Yes, Delete It"}
              </button>
              <button onClick={() => setDeleteContext({ isOpen: false, id: null, isLoading: false, error: null })} disabled={deleteContext.isLoading} className="w-full h-14 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/80">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {successModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-500/5">
              <CheckCircle weight="fill" className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">Deleted Successfully</h3>
            <p className="text-sm text-muted-foreground font-medium mb-8">
              The application has been permanently removed from your records.
            </p>
            <button onClick={() => setSuccessModalOpen(false)} className="w-full h-14 bg-foreground text-background font-bold rounded-xl hover:opacity-90">
              Continue
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD HEADER & STATS */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-5">
          <Link href="/dashboard/cac" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-lg">
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

        <Link href="/dashboard/cac/new-incorporation/new" className="flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:opacity-90 transition-all active:scale-95 shrink-0 shadow-lg shadow-primary/20">
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

export default function RegistrationsHubPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Spinner className="animate-spin h-8 w-8 text-primary" weight="bold" />
        <p className="text-sm font-bold text-muted-foreground">Loading dashboard...</p>
      </div>
    }>
      <RegistrationsHubContent />
    </Suspense>
  );
}
