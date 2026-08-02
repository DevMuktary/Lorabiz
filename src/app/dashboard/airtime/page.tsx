// src/app/dashboard/airtime/page.tsx
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

// Shared Type
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
          // Extract network and phone from our structured description: "Airtime Recharge - 08012345678 (MTN)"
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
    // 1. Check for Duplicate within 10 minutes (Anti-mistake guard)
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
      // Actually hit the live API route
      const res = await fetch('/api/services/airtime', { 
        method: "POST", 
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data) 
      });
      
      const result = await res.json();

      if (result.success) {
        const newTransaction = {
          // Fallback to local generated ref if the provider doesn't hand one back
          reference: result.data?.reference || `ART-${Date.now()}`,
          phone: data.phone,
          amount: data.amount,
          network: data.network,
          date: new Date()
        };

        // Update State using exact balance returned from server
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
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black text-foreground">Airtime Recharge</h1>
          <p className="text-muted-foreground mt-2 font-medium">Instantly top-up your mobile line from your wallet.</p>
        </div>
        
        <div className="bg-card border border-border px-5 py-3 rounded-2xl flex items-center gap-4 shadow-sm shrink-0">
          <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
            <Wallet size={20} weight="fill" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Available Balance</p>
            <p className="text-xl font-black text-foreground">₦{walletBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form OR Receipt */}
        <div className="lg:col-span-5 relative">
          {currentReceipt ? (
            <ReceiptCard 
              transaction={currentReceipt} 
              onNewTransaction={() => setCurrentReceipt(null)} 
            />
          ) : (
            <AirtimeForm 
              onSubmit={initiatePurchase} 
              disabled={isProcessing} 
            />
          )}
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-7">
          <AirtimeHistory 
            history={history} 
            onDispute={(tx) => setDisputeTransaction(tx)} 
          />
        </div>

      </div>

      {/* Global Modals & Overlays */}
      <ProcessingOverlay isVisible={isProcessing} />
      
      <DuplicateWarningModal 
        isOpen={showDuplicateModal}
        phone={pendingPurchase?.phone || ""}
        amount={pendingPurchase?.amount || 0}
        onConfirm={() => pendingPurchase && executePurchase(pendingPurchase)}
        onCancel={() => {
          setShowDuplicateModal(false);
          setPendingPurchase(null);
        }}
      />

      <DisputeModal 
        isOpen={!!disputeTransaction} 
        onClose={() => setDisputeTransaction(null)} 
        transaction={disputeTransaction} 
      />

    </div>
  );
}
