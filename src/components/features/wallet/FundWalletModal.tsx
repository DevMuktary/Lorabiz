"use client";

import { useState } from "react";
import { X, Wallet, Spinner } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { usePaystackPayment } from "react-paystack";

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
  onFailure: (message: string) => void;
}

const QUICK_AMOUNTS = [1000, 5000, 10000];

export default function FundWalletModal({ isOpen, onClose, onSuccess, onFailure }: FundWalletModalProps) {
  const { data: session } = useSession();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string;

  const config = {
    reference: `FW_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
    email: session?.user?.email || "customer@lorabiz.com",
    amount: Number(amount) * 100, 
    publicKey: paystackKey,
  };

  const initializePayment = usePaystackPayment(config);

  if (!isOpen) return null;

  const handlePay = () => {
    if (!amount || Number(amount) < 100) return alert("Minimum amount is ₦100");
    
    // 1. Instantly trigger the loading state on the button
    setIsProcessing(true);
    
    // 2. Give React 500ms to actually paint the spinner on the screen 
    // BEFORE Paystack freezes the browser thread to load its white iframe.
    setTimeout(() => {
      initializePayment({
        onSuccess: () => {
          setIsProcessing(false);
          onSuccess(Number(amount));
          onClose();
        },
        onClose: () => {
          setIsProcessing(false);
          onFailure("The payment process was cancelled or failed.");
          onClose();
        }
      });
    }, 500); 
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 relative">
        <button 
          onClick={() => {
            if (!isProcessing) onClose();
          }} 
          className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" weight="bold" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-16 w-16 bg-[#c72d76]/10 text-[#c72d76] rounded-full flex items-center justify-center mb-4">
            <Wallet className="h-8 w-8" weight="fill" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Fund Wallet</h3>
          <p className="text-slate-500 text-sm font-medium mt-1">Add funds instantly via card or bank transfer.</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                disabled={isProcessing}
                className={`py-2 rounded-xl text-sm font-bold border-2 transition-colors cursor-pointer disabled:opacity-50 ${
                  amount === amt.toString() ? "border-[#c72d76] bg-[#c72d76]/5 text-[#c72d76]" : "border-slate-100 text-slate-600 hover:border-slate-300"
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
                disabled={isProcessing}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="pl-9 h-14 text-lg font-bold border-2 border-slate-200 focus-visible:ring-[#c72d76] focus-visible:border-[#c72d76] rounded-xl text-slate-900 disabled:opacity-50"
              />
            </div>
          </div>

          <Button 
            onClick={handlePay}
            disabled={isProcessing || !amount || Number(amount) < 100}
            className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 transition-transform active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Spinner className="animate-spin h-5 w-5" weight="bold" />
                <span>Connecting to gateway...</span>
              </>
            ) : (
              "Proceed to Pay"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
