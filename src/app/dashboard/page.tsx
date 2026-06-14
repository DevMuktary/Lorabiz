"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, Spinner, WarningCircle, Trash, X, CircleNotch 
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import RegistrationsTable from "@/components/dashboard/RegistrationsTable";
import FundWalletModal from "@/components/dashboard/FundWalletModal";
import ReceiptModal from "@/components/dashboard/ReceiptModal";
import QueryReasonModal from "@/components/dashboard/QueryReasonModal";

export default function DashboardOverview() {
  const router = useRouter();
  
  // --- CORE DATA STATE ---
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // --- FILTERS & PAGINATION ---
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // --- MODAL STATES ---
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{show: boolean, reference: string, businessName: string, serviceName: string, date: string, amount: number} | null>(null);
  const [queryModalData, setQueryModalData] = useState<{show: boolean, businessName: string, reason: string, status: "RESOLVED"|"UNRESOLVED", date: string} | null>(null);
  const [deleteData, setDeleteData] = useState<{ isOpen: boolean; targetId: string | null; isDeleting: boolean }>({ isOpen: false, targetId: null, isDeleting: false });

  // --- PROFESSIONAL TOAST SYSTEM ---
  const [toast, setToast] = useState<{show: boolean, msg: string, type: "error" | "success"}>({ show: false, msg: "", type: "success" });
  const showToast = useCallback((msg: string, type: "error" | "success" = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 4000);
  }, []);

  // --- DATA FETCHING ---
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: page.toString(), search, status: statusFilter, type: typeFilter });
      const res = await fetch(`/api/dashboard?${query.toString()}`);
      if (res.ok) setData(await res.json());
    } catch (err) {
      showToast("Failed to sync dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter, showToast]);

  useEffect(() => {
    const timeout = setTimeout(fetchDashboardData, 300);
    return () => clearTimeout(timeout);
  }, [fetchDashboardData]);

  // --- ROUTING & ACTIONS ---
  const handleActionMenuExecute = (actionType: string, id: string, rowData?: any) => {
    const list = Array.isArray(data) ? data : (data?.data || data?.registrations || data?.items || []);
    const targetReg = rowData || list.find((r: any) => r.id === id) || {};

    switch (actionType) {
      case "CONTINUE": 
        router.push(`/dashboard/register/details/${id}`); 
        break;
      
      case "VIEW": 
        router.push(`/dashboard/application/${id}`); 
        break;
      
      case "VIEW_REASON":
        setQueryModalData({
          show: true,
          businessName: targetReg?.proposedName || targetReg?.entityName || "Business Application",
          reason: targetReg?.queryReason || "No specific query reason was recorded in the database.",
          status: targetReg?.queryStatus || "UNRESOLVED",
          date: targetReg?.queryDate 
            ? new Date(targetReg.queryDate).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }) 
            : new Date().toLocaleDateString('en-NG'),
        });
        break;

      case "DOWNLOAD_RECEIPT":
        const entity = targetReg?.entityType || "Business Name";
        const realAmount = Number(
          targetReg?.amount || 
          targetReg?.price || 
          targetReg?.amountPaid || 
          targetReg?.totalFee || 
          data?.pricingMap?.[entity] 
        ) || 0;

        setReceiptData({
          show: true,
          reference: targetReg?.reference || targetReg?.transactionRef || `SRV_${id.substring(0, 8).toUpperCase()}`,
          businessName: targetReg?.proposedName || targetReg?.entityName || "Business Entity",
          serviceName: entity,
          date: targetReg?.updatedAt 
            ? new Date(targetReg.updatedAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' }) 
            : new Date().toLocaleDateString('en-NG'),
          amount: realAmount 
        });
        break;

      case "FIX_QUERIES": 
        router.push(`/dashboard/businesses/${id}/queries`); 
        break;
      
      case "DOWNLOAD_CERT": 
        showToast("Fetching Official Certificate...", "success"); 
        break;
      
      case "VIEW_TIN": 
        showToast("Fetching JTB TIN Details...", "success"); 
        break;
      
      case "DELETE":
        setDeleteData({ isOpen: true, targetId: id, isDeleting: false });
        break;
    }
  };

  // --- SECURE DELETION HANDLER ---
  const executeDelete = async () => {
    if (!deleteData.targetId) return;
    setDeleteData(prev => ({ ...prev, isDeleting: true }));
    
    try {
      const res = await fetch(`/api/register/details/${deleteData.targetId}`, { method: "DELETE" });
      const json = await res.json();
      
      if (json.success) {
        showToast("Application permanently deleted.", "success");
        fetchDashboardData(); 
        setDeleteData({ isOpen: false, targetId: null, isDeleting: false });
      } else {
        showToast(json.message || "Failed to delete application.", "error");
        setDeleteData(prev => ({ ...prev, isDeleting: false }));
      }
    } catch (error) {
      showToast("Network error. Could not reach server.", "error");
      setDeleteData(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleWalletSuccess = (amount: number) => {
    setData((prev: any) => ({ ...prev, walletBalance: (prev?.walletBalance || 0) + amount }));
    showToast(`Successfully funded ₦${amount.toLocaleString()}`, "success");
  };

  if (loading && !data) {
    return <div className="h-[60vh] flex items-center justify-center"><Spinner className="animate-spin h-8 w-8 text-[#ff3f7a]" /></div>;
  }

  return (
    <div className="pb-8 max-w-full overflow-x-hidden relative space-y-6">
      
      {/* PROFESSIONAL TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`fixed bottom-8 right-6 z-[99999] animate-in slide-in-from-right flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-white font-bold text-sm tracking-wide ${toast.type === "error" ? "bg-red-600" : "bg-slate-900"}`}>
          {toast.type === "error" ? <WarningCircle weight="bold" size={18} /> : <CircleNotch weight="bold" size={18} className="text-[#ff3f7a]" />}
          {toast.msg}
        </div>
      )}

      {/* COMPACT TOP ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
        <div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
            {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}, Chief 👋
          </h1>
        </div>
        <Link href="/dashboard/new" className="shrink-0">
          <Button className="h-12 bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-[0_4px_14px_rgba(255,63,122,0.3)] font-bold px-6 flex items-center gap-2 rounded-xl active:scale-95 transition-all">
            <Plus className="h-5 w-5" weight="bold" /> New Application
          </Button>
        </Link>
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

      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden">
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
      </div>

      {/* --- MODALS --- */}

      <FundWalletModal 
        isOpen={isFundModalOpen} 
        onClose={() => setIsFundModalOpen(false)} 
        onSuccessOptimistic={handleWalletSuccess} 
      />

      {receiptData?.show && (
        <ReceiptModal 
          businessName={receiptData.businessName}
          serviceName={receiptData.serviceName}
          reference={receiptData.reference}
          date={receiptData.date}
          amount={receiptData.amount}
          onClose={() => setReceiptData(null)}
        />
      )}

      {queryModalData?.show && (
        <QueryReasonModal 
          businessName={queryModalData.businessName}
          reason={queryModalData.reason}
          status={queryModalData.status}
          date={queryModalData.date}
          onClose={() => setQueryModalData(null)}
        />
      )}

      {deleteData.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_20px_60px_rgb(0,0,0,0.1)] animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-8 text-center relative">
              <button 
                onClick={() => !deleteData.isDeleting && setDeleteData({ isOpen: false, targetId: null, isDeleting: false })}
                disabled={deleteData.isDeleting}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X weight="bold" size={16} />
              </button>
              
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 mb-6 border border-red-100">
                <Trash className="h-7 w-7 text-red-500" weight="fill" />
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Delete Draft?</h3>
              <p className="text-sm font-medium text-slate-500 mb-8 px-2 leading-relaxed">
                This action cannot be undone. All saved data, including uploaded documents, will be permanently erased.
              </p>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteData({ isOpen: false, targetId: null, isDeleting: false })}
                  disabled={deleteData.isDeleting}
                  className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={executeDelete}
                  disabled={deleteData.isDeleting}
                  className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-[0_4px_14px_rgba(220,38,38,0.3)] flex items-center justify-center"
                >
                  {deleteData.isDeleting ? <CircleNotch className="animate-spin h-5 w-5" weight="bold" /> : "Yes, Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
