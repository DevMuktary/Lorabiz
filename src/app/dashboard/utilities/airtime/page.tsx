"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AirtimeForm from "@/components/features/airtime/AirtimeForm";
import DuplicateWarningModal from "@/components/features/airtime/DuplicateWarningModal";
import ProcessingOverlay from "@/components/features/airtime/ProcessingOverlay";
import ReceiptCard from "@/components/features/airtime/ReceiptCard";
import AirtimeHistory from "@/components/features/airtime/AirtimeHistory";
import DisputeModal from "@/components/features/airtime/DisputeModal";
import { Wallet, ArrowLeft } from "@phosphor-icons/react";

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
  
  // Duplicate Guard States
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState<{ network: string; phone: string; amount: number } | null>(null);
  
  // Dispute States
  const [disputeTransaction, setDisputeTransaction] = useState<Transaction | null>(null);

  // Live fetchers for real data
  const fetchData = async () => {
    try {
      // 1. Fetch Real Wallet Balance
      const walletRes = await fetch("/api/user/wallet");
      const walletData = await walletRes.json();
      if (walletData.success) {
        setWalletBalance(walletData.wallet.balance);
      }

      // 2. Fetch Real Transaction History
      const txRes = await fetch("/api/user/transactions?status=SUCCESS");
      const txData = await txRes.json();
      if (txData.success) {
        // Filter specifically for airtime/utility transactions
        const airtimeTxs = txData.transactions.filter(
          (tx: any) => tx.serviceCategory === "UTILITIES" || (tx.description && tx.description.includes("Airtime Recharge"))
        );
        
        // Format the database rows to match the UI component's expected structure
        const formattedHistory = airtimeTxs.map((tx: any) => {
          const match = tx.description.match(/Airtime Recharge - (\d+) \((.+)\)/);
          return {
            reference: tx.reference,
            phone: match ? match[1] : "Unknown",
            amount: Number(tx.amount),
            network: match ? match[2].trim() : "Unknown",
            date: new Date(tx.createdAt)
          };
        });
        
        setHistory(formattedHistory);
      }
    } catch (error) {
      console.error("Failed to load airtime data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const initiatePurchase = (data: { network: string; phone: string; amount: number }) => {
    // 1. Check for Duplicate within 10 minutes
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    const isDuplicate = history.some(tx => 
      tx.phone === data.phone && 
      tx.amount === data.amount && 
      tx.date.getTime() > tenMinutesAgo
    );

    if (isDuplicate) {
      setPendingPurchase(data);
      setShowDuplicateModal(true);
      return;
    }

    // 2. Proceed to buy if no duplicate found
    executePurchase(data);
  };

  const executePurchase = async (data: { network: string; phone: string; amount: number }) => {
    setShowDuplicateModal(false);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/utilities/airtime', { 
        method: "POST", 
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data) 
      });
      
      const result = await res.json();

      if (result.success) {
        const newTransaction = {
          reference: result.reference || `ref_${Date.now()}`,
          phone: data.phone,
          amount: data.amount,
          network: data.network,
          date: new Date()
        };

        setWalletBalance(result.newBalance);
        setHistory(prev => [newTransaction, ...prev]);
        setCurrentReceipt(newTransaction);
      } else {
        alert(`Transaction Failed: ${result.message}`);
      }

    } catch (error) {
      alert("Transaction Failed. Please check your network connection and try again.");
    } finally {
      setIsProcessing(false);
      setPendingPurchase(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-16 pt-4 font-sans relative space-y-6">
      
      {/* Back Button */}
      <Link 
        href="/dashboard/utilities" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to Utilities
      </Link>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-foreground">Airtime Top-Up</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Instant, automated airtime vending across all Nigerian networks.
          </p>
        </div>

        {/* Live Wallet Balance Pill */}
        <div className="flex items-center gap-3 bg-secondary/60 border border-border px-4 py-2.5 rounded-2xl w-fit">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Wallet size={20} weight="bold" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground block">
              Available Balance
            </span>
            <span className="text-sm font-black text-foreground">
              ₦{Number(walletBalance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </span>
          </div>
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

      {/* MODAL 1: Processing Overlay */}
      <ProcessingOverlay isVisible={isProcessing} />

      {/* MODAL 2: Receipt Card Modal */}
      {currentReceipt && (
        <ReceiptCard 
          transaction={currentReceipt} 
          onNewTransaction={() => setCurrentReceipt(null)} 
        />
      )}

      {/* MODAL 3: Duplicate Purchase Protection Guard */}
      {showDuplicateModal && pendingPurchase && (
        <DuplicateWarningModal 
          isOpen={showDuplicateModal}
          phone={pendingPurchase.phone}
          amount={pendingPurchase.amount}
          onCancel={() => {
            setShowDuplicateModal(false);
            setPendingPurchase(null);
          }}
          onConfirm={() => executePurchase(pendingPurchase)}
        />
      )}

      {/* MODAL 4: Dispute Report Modal */}
      <DisputeModal 
        isOpen={Boolean(disputeTransaction)}
        transaction={disputeTransaction}
        onClose={() => setDisputeTransaction(null)}
      />

    </div>
  );
}
