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
  const [disputeTransaction, setDisputeTransaction] = useState<Transaction | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Live fetchers for real data
  const fetchData = async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        fetch("/api/user/wallet", { cache: "no-store" }),
        fetch("/api/user/transactions?status=SUCCESS", { cache: "no-store" }),
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
          const airtimeTxs = txData.transactions
            .filter((tx: any) => tx.serviceCategory === "UTILITIES" || (tx.description && tx.description.includes("Airtime Recharge")))
            .map((tx: any) => {
              const match = tx.description.match(/Airtime Recharge - (\d+) \((.+)\)/);
              return {
                reference: tx.reference,
                phone: match ? match[1] : "Unknown",
                amount: Number(tx.amount),
                network: match ? match[2].trim() : "Unknown",
                date: new Date(tx.createdAt),
              };
            });
          
          setHistory(airtimeTxs);
        }
      }
    } catch (error) {
      console.error("Failed to load airtime data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const initiatePurchase = (data: { network: string; phone: string; amount: number }) => {
    setErrorToast(null);

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
    setErrorToast(null);

    try {
      const res = await fetch('/api/utilities/airtime', { 
        method: "POST", 
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(pendingPurchase) 
      });
      
      const result = await res.json();

      if (result.success) {
        const newTransaction = {
          reference: result.reference || `ref_${Date.now()}`,
          phone: pendingPurchase.phone,
          amount: pendingPurchase.amount,
          network: pendingPurchase.network,
          date: new Date()
        };

        setWalletBalance(result.newBalance);
        setHistory(prev => [newTransaction, ...prev]);
        setCurrentReceipt(newTransaction);
      } else {
        setErrorToast(result.message || "Transaction failed.");
      }

    } catch (error) {
      setErrorToast("Transaction Failed. Please check your network connection and try again.");
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

      {/* Slide-In Error Toast */}
      {errorToast && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <WarningCircle size={18} weight="fill" className="shrink-0" />
            <span>{errorToast}</span>
          </div>
          <button 
            type="button"
            onClick={() => setErrorToast(null)}
            className="text-xs text-destructive hover:underline cursor-pointer"
          >
            Dismiss
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

      {/* MODAL 1: Confirmation Modal (Handles Crying Emoji when insufficient balance) */}
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
