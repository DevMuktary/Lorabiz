"use client";

import { useState, useEffect } from "react";
import AirtimeForm from "@/components/features/airtime/AirtimeForm";
import DuplicateWarningModal from "@/components/features/airtime/DuplicateWarningModal";
import ProcessingOverlay from "@/components/features/airtime/ProcessingOverlay";
import ReceiptCard from "@/components/features/airtime/ReceiptCard";
import AirtimeHistory from "@/components/features/airtime/AirtimeHistory";
import DisputeModal from "@/components/features/airtime/DisputeModal";
import { Wallet } from "@phosphor-icons/react";

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

  // Simulated Fetch (Replace with your actual /api/user/wallet and /api/airtime/history fetchers)
  useEffect(() => {
    setWalletBalance(15000); 
    setHistory([
      { reference: "ART-123456789", phone: "08012345678", amount: 1000, network: "MTN", date: new Date(Date.now() - 86400000) },
      { reference: "ART-987654321", phone: "08123456789", amount: 500, network: "AIRTEL", date: new Date(Date.now() - 172800000) }
    ]);
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
      // TODO: Replace with your actual fetch call to /api/airtime/purchase
      // await fetch('/api/airtime/purchase', { method: "POST", body: JSON.stringify(data) });
      
      // Simulating API Latency (To allow the beautiful ProcessingOverlay to shine!)
      await new Promise(resolve => setTimeout(resolve, 4000));

      const newTransaction = {
        reference: `ART-${Date.now()}`,
        phone: data.phone,
        amount: data.amount,
        network: data.network,
        date: new Date()
      };

      // Update State
      setWalletBalance(prev => prev - data.amount);
      setHistory(prev => [newTransaction, ...prev]);
      setCurrentReceipt(newTransaction);

    } catch (error) {
      alert("Transaction Failed. Please check your network and try again.");
    } finally {
      setIsProcessing(false);
      setPendingPurchase(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-16 pt-4 font-sans relative">
      
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-foreground">Airtime Recharge</h1>
          <p className="text-muted-foreground mt-2 font-medium">Instantly top-up your mobile line from your wallet.</p>
        </div>
        
        <div className="bg-card border border-border px-5 py-3 rounded-2xl flex items-center gap-4 shadow-sm">
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
