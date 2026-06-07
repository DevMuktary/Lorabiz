"use client";

import { useState } from "react";
import { X, Wallet, Spinner } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessOptimistic: (amount: number) => void;
}

const QUICK_AMOUNTS = [15000, 30000, 50000];

export default function FundWalletModal({ isOpen, onClose, onSuccessOptimistic }: FundWalletModalProps) {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePay = async () => {
    if (!amount || Number(amount) < 1000) return alert("Minimum amount is ₦1,000");
    
    setIsProcessing(true);
    
    // TODO: Initialize Paystack/Flutterwave inline JS here.
    // For now, we simulate a successful payment delay.
    setTimeout(() => {
      setIsProcessing(false);
      onSuccessOptimistic(Number(amount)); // Optimistically update UI
      onClose(); // Close modal
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 relative">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors">
          <X className="h-4 w-4" weight="bold" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-16 w-16 bg-[#ff3f7a]/10 text-[#ff3f7a] rounded-full flex items-center justify-center mb-4">
            <Wallet className="h-8 w-8" weight="fill" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Fund Wallet</h3>
          <p className="text-slate-500 text-sm font-medium mt-1">Add funds instantly via secure card or transfer.</p>
        </div>

        <div className="space-y-6">
          {/* Quick Select Chips */}
          <div className="grid grid-cols-3 gap-3">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className={`py-2 rounded-xl text-sm font-bold border-2 transition-colors ${
                  amount === amt.toString() ? "border-[#ff3f7a] bg-[#ff3f7a]/5 text-[#ff3f7a]" : "border-slate-100 text-slate-600 hover:border-slate-300"
                }`}
              >
                ₦{amt.toLocaleString()}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Custom Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400 font-bold">₦</span>
              <Input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="pl-9 h-14 text-lg font-bold border-2 border-slate-200 focus-visible:ring-[#ff3f7a] focus-visible:border-[#ff3f7a] rounded-xl"
              />
            </div>
          </div>

          <Button 
            onClick={handlePay}
            disabled={isProcessing || !amount}
            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {isProcessing ? <Spinner className="animate-spin h-5 w-5" weight="bold" /> : "Proceed to Pay"}
          </Button>
        </div>
      </div>
    </div>
  );
}
