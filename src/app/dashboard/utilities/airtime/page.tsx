"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import AirtimeForm from "@/components/features/airtime/AirtimeForm";
import DuplicateWarningModal from "@/components/features/airtime/DuplicateWarningModal";
import ProcessingOverlay from "@/components/features/airtime/ProcessingOverlay";
import ReceiptCard from "@/components/features/airtime/ReceiptCard";
import AirtimeHistory from "@/components/features/airtime/AirtimeHistory";
import DisputeModal from "@/components/features/airtime/DisputeModal";
import AirtimeConfirmationModal from "@/components/features/airtime/AirtimeConfirmationModal";
import { ArrowLeft, ShieldCheck, WarningCircle } from "@phosphor-icons/react";

interface Transaction {
  reference: string;
  phone: string;
  amount: number;
  network: string;
  status?: string;
  date: Date;
}

export default function AirtimeDashboardPage() {
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  
  // App States
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<Transaction | null>(null);
  
  // Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<{ network: string; phone: string; amount: number } | null>(null);
  const [availableAirtimeDiscount, setAvailableAirtimeDiscount] = useState<number>(0);
  const [useRewardDiscount, setUseRewardDiscount] = useState<boolean>(true);
  const [disputeTransaction, setDisputeTransaction] = useState<Transaction | null>(null);
  const [toastNotification, setToastNotification] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Live fetchers for real data
  const fetchData = async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        fetch("/api/user/wallet", { cache: "no-store" }),
        fetch("/api/user/transactions", { cache: "no-store" }),
      ]);

      if (walletRes.ok) {
        const walletData = await walletRes.json();
        if (walletData.success && walletData.wallet) {
          setWalletBalance(Number(walletData.wallet.balance));
        }
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.success && txData.transactions) {
          // Strictly isolate AIRTIME transactions only (exclude any Mobile Data)
          const airtimeTxs = txData.transactions
            .filter((tx: any) => {
              const desc = (tx.description || "").toLowerCase();
              const isData = desc.includes("mobile data") || desc.includes("data bundle") || tx.serviceCategory === "MOBILE_DATA";
              const isAirtime = tx.serviceCategory === "AIRTIME" || desc.includes("airtime");
              return isAirtime && !isData && tx.type === "DEBIT" && tx.status === "SUCCESS";
            })
            .map((tx: any) => {
              const desc = tx.description || "";
              const phoneMatch = desc.match(/(\d{11})/);
              let detectedNet = "MTN";
              const upperDesc = desc.toUpperCase();
              if (upperDesc.includes("AIRTEL")) detectedNet = "AIRTEL";
              else if (upperDesc.includes("GLO")) detectedNet = "GLO";
              else if (upperDesc.includes("9MOBILE") || upperDesc.includes("ETISALAT")) detectedNet = "9MOBILE";
              else if (upperDesc.includes("MTN")) detectedNet = "MTN";

              return {
                reference: tx.reference,
                phone: phoneMatch ? phoneMatch[1] : "Unknown",
                amount: Number(tx.amount),
                network: detectedNet,
                status: tx.type === "REFUND" ? "REFUNDED" : tx.status,
                date: new Date(tx.createdAt),
              };
            });
          
          setHistory(airtimeTxs);
        }
      }

      // Check for user's active Airtime Reward credits
      try {
        const vRes = await fetch("/api/vouchers", { cache: "no-store" });
        if (vRes.ok) {
          const vData = await vRes.json();
          const airtimeCredits = (vData.active || []).filter((c: any) => c.rewardType === "AIRTIME");
          if (airtimeCredits.length > 0) {
            const totalDiscount = airtimeCredits.reduce((sum: number, c: any) => sum + Number(c.value || 0), 0);
            setAvailableAirtimeDiscount(totalDiscount);
            setUseRewardDiscount(true);
          } else {
            setAvailableAirtimeDiscount(0);
          }
        }
      } catch (vErr) {
        console.error("Failed to check airtime reward credits:", vErr);
      }
    } catch (error) {
      console.error("Failed to load airtime data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const initiatePurchase = (data: { network: string; phone: string; amount: number }) => {
    setToastNotification(null);

    // 1. Check for Duplicate within 10 minutes (Anti-mistake guard)
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    const isDuplicate = history.some(tx => 
      tx.phone === data.phone && 
      tx.amount === data.amount && 
      tx.date.getTime() > tenMinutesAgo
    );

    setPendingPurchase(data);

    if (isDuplicate) {
      setShowDuplicateModal(true);
      return;
    }

    // 2. Open confirmation modal
    setShowConfirmModal(true);
  };

  const handleDuplicateConfirmed = () => {
    setShowDuplicateModal(false);
    setShowConfirmModal(true);
  };

  const executePurchase = async () => {
    if (!pendingPurchase) return;

    setShowConfirmModal(false);
    setIsProcessing(true);
    setToastNotification(null);

    try {
      const res = await fetch('/api/utilities/airtime', { 
        method: "POST", 
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...pendingPurchase,
          useRewardCredit: useRewardDiscount && availableAirtimeDiscount > 0
        }) 
      });
      
      const result = await res.json();

      if (result.success) {
        fetchData(); // Refresh wallet and redeemed voucher states
        const newTransaction: Transaction = {
          reference: result.reference || `ref_${Date.now()}`,
          phone: pendingPurchase.phone,
          amount: pendingPurchase.amount,
          network: pendingPurchase.network,
          status: "SUCCESS",
          date: new Date()
        };

        setWalletBalance(result.newBalance);
        setHistory(prev => [newTransaction, ...prev]);
        setCurrentReceipt(newTransaction);
        setToastNotification({
          type: "success",
          title: "Airtime Recharged Successfully!",
          message: `₦${pendingPurchase.amount.toLocaleString()} ${pendingPurchase.network} sent to ${pendingPurchase.phone}.`
        });
      } else {
        if (result.newBalance !== undefined) {
          setWalletBalance(result.newBalance);
        }
        setToastNotification({
          type: "error",
          title: "Airtime Top-Up Failed",
          message: result.message || "Recharge could not be completed. Your wallet has been refunded."
        });
        fetchData();
      }

    } catch (error) {
      setToastNotification({
        type: "error",
        title: "Connection Error",
        message: "Transaction timed out or connection failed. Your wallet was refunded. Please try again."
      });
      fetchData();
    } finally {
      setIsProcessing(false);
      setPendingPurchase(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 pt-4 font-sans relative space-y-6 animate-in fade-in duration-200">
      
      {/* Back Button */}
      <Link 
        href="/dashboard/utilities" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl cursor-pointer"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to Utilities
      </Link>

      {/* Floating Side Slide-In Notification Toast */}
      {toastNotification && (
        <div className={`fixed top-6 right-6 z-[999999] max-w-sm w-full p-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right-6 duration-300 flex items-start gap-3 text-left ${
          toastNotification.type === "error"
            ? "bg-rose-950/90 dark:bg-rose-950/95 border-rose-500/30 text-rose-100 shadow-rose-950/40"
            : "bg-emerald-950/90 dark:bg-emerald-950/95 border-emerald-500/30 text-emerald-100 shadow-emerald-950/40"
        }`}>
          <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
            toastNotification.type === "error" ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
          }`}>
            <WarningCircle size={20} weight="fill" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black uppercase tracking-wider mb-0.5">{toastNotification.title}</h4>
            <p className="text-xs leading-relaxed opacity-90">{toastNotification.message}</p>
          </div>
          <button 
            onClick={() => setToastNotification(null)}
            className="text-xs opacity-60 hover:opacity-100 cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex items-center gap-3.5 border-b border-border pb-5">
        <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center p-2 border border-border shrink-0 shadow-sm">
          <Image 
            src="/airtime.png" 
            alt="Airtime Logo" 
            width={38} 
            height={38} 
            className="object-contain" 
            priority 
          />
        </div>
        <div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-0.5">
            <ShieldCheck weight="bold" className="h-3 w-3" />
            Automated Telecom Airtime Gateway
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Airtime Recharge</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-medium">
            Instant airtime top-up across MTN, Airtel, Glo, and 9mobile.
          </p>
        </div>
      </div>

      {/* Main Grid: Form + History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Airtime Purchase Form */}
        <div className="lg:col-span-6">
          <AirtimeForm 
            onSubmit={initiatePurchase} 
            disabled={isProcessing} 
          />
        </div>

        {/* Dynamic Airtime Purchase History */}
        <div className="lg:col-span-6">
          <AirtimeHistory 
            history={history} 
            onDispute={(tx) => setDisputeTransaction(tx)} 
          />
        </div>

      </div>

      {/* MODAL 1: Confirmation Modal */}
      {pendingPurchase && (
        <AirtimeConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setPendingPurchase(null);
          }}
          onConfirm={executePurchase}
          isLoading={isProcessing}
          network={pendingPurchase.network}
          phone={pendingPurchase.phone}
          amount={pendingPurchase.amount}
          walletBalance={walletBalance}
          availableAirtimeDiscount={availableAirtimeDiscount}
          useRewardDiscount={useRewardDiscount}
          onToggleRewardDiscount={setUseRewardDiscount}
        />
      )}

      {/* MODAL 2: Processing Overlay */}
      <ProcessingOverlay isVisible={isProcessing} />

      {/* MODAL 3: Receipt Card Modal */}
      {currentReceipt && (
        <ReceiptCard 
          transaction={currentReceipt} 
          onNewTransaction={() => setCurrentReceipt(null)} 
        />
      )}

      {/* MODAL 4: Duplicate Purchase Protection Guard */}
      {showDuplicateModal && pendingPurchase && (
        <DuplicateWarningModal 
          isOpen={showDuplicateModal}
          phone={pendingPurchase.phone}
          amount={pendingPurchase.amount}
          onCancel={() => {
            setShowDuplicateModal(false);
            setPendingPurchase(null);
          }}
          onConfirm={handleDuplicateConfirmed}
        />
      )}

      {/* MODAL 5: Dispute Report Modal */}
      <DisputeModal 
        isOpen={Boolean(disputeTransaction)}
        transaction={disputeTransaction}
        onClose={() => setDisputeTransaction(null)}
      />

    </div>
  );
}
