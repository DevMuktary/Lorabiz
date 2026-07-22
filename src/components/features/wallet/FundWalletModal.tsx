"use client";

import { useState } from "react";
import { X, Wallet, Spinner, Lock, ShieldCheck, Sparkle, MusicNotes } from "@phosphor-icons/react";
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
  
  // NEW: Controls our full-screen Dancing Doll / Security Gateway overlay
  const [gatewayLoading, setGatewayLoading] = useState(false);
  
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
    
    // 1. Immediately show our Dancing Doll / Security Overlay on the screen
    setIsProcessing(true);
    setGatewayLoading(true);
    
    // 2. Give the browser 600ms to render our beautiful animation smoothly BEFORE 
    // calling Paystack, preventing the iframe creation from freezing the DOM thread!
    setTimeout(() => {
      initializePayment({
        onSuccess: () => {
          setIsProcessing(false);
          setGatewayLoading(false);
          onSuccess(Number(amount));
          onClose();
        },
        onClose: () => {
          setIsProcessing(false);
          setGatewayLoading(false);
          onFailure("The payment process was cancelled or failed.");
          onClose();
        }
      });

      // 3. Auto-hide our overlay after 2.5 seconds. By this time, Paystack's iframe 
      // is completely loaded and ready over the page, zero white flash!
      setTimeout(() => {
        setGatewayLoading(false);
      }, 2500);

    }, 600); 
  };

  return (
    <>
      {/* =========================================================================
          LAYER 3: THE DANCING SECURITY DOLL / GATEWAY OVERLAY
          Masks the Paystack white flash with a playful, high-tech CSS animation
      ========================================================================= */}
      {gatewayLoading && (
        <div className="fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md text-white animate-in fade-in duration-300 select-none p-6 text-center">
          
          {/* ANIMATED DANCING DOLL / ROBOT RADAR CONTAINER */}
          <div className="relative flex items-center justify-center mb-8 w-40 h-40">
            
            {/* Outer pulsing radar ring */}
            <div className="absolute inset-0 rounded-full bg-[#ff3f7a]/15 animate-ping opacity-75" />
            
            {/* Middle spinning dashed security border */}
            <div className="absolute inset-2 rounded-full border-2 border-dashed border-[#ff3f7a]/60 animate-[spin_6s_linear_infinite]" />
            
            {/* Inner reverse-spinning accent ring */}
            <div className="absolute inset-6 rounded-full border border-dotted border-amber-400/50 animate-[spin_4s_linear_infinite_reverse]" />
            
            {/* Floating Music Notes & Sparkles around the dancing doll */}
            <div className="absolute -top-2 -right-2 text-amber-400 animate-bounce delay-100">
              <MusicNotes size={24} weight="fill" />
            </div>
            <div className="absolute -bottom-1 -left-2 text-[#ff3f7a] animate-bounce delay-300">
              <Sparkle size={22} weight="fill" />
            </div>
            <div className="absolute top-2 -left-3 text-emerald-400 animate-pulse">
              <ShieldCheck size={20} weight="fill" />
            </div>

            {/* THE DANCING DOLL / BOT FIGURE (Pure CSS bounce & wiggle animation) */}
            <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-tr from-[#ff3f7a] via-[#e02b62] to-amber-500 flex items-center justify-center shadow-2xl shadow-[#ff3f7a]/40 border border-white/20 animate-bounce animate-[wiggle_1s_ease-in-out_infinite]">
              {/* Using a cute robot/doll emoji figure that dances */}
              <span className="text-4xl drop-shadow-md select-none transform hover:scale-110 transition-transform">
                🤖
              </span>
              {/* Mini security lock badge on the doll */}
              <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-white/20 rounded-full p-1 text-emerald-400 shadow-sm">
                <Lock size={12} weight="bold" />
              </div>
            </div>

          </div>

          {/* BRANDED TEXT DISPLAY */}
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2 flex items-center justify-center gap-2">
            <span>Connecting to Payment Gateway...</span>
            <span className="animate-pulse">🔒</span>
          </h3>
          
          <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide max-w-xs leading-relaxed animate-pulse">
            Please wait while our security bot establishes an encrypted 256-bit session with Paystack.
          </p>

          {/* FUTURISTIC PROGRESS BAR */}
          <div className="w-56 h-1.5 bg-slate-800 rounded-full mt-8 overflow-hidden p-0.5 border border-white/10 shadow-inner">
            <div className="h-full bg-gradient-to-r from-[#ff3f7a] via-amber-400 to-emerald-400 rounded-full w-2/3 animate-[pulse_1s_ease-in-out_infinite]" />
          </div>

          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">
            LoraBiz Security Guard • Zero-Latency Routing
          </span>

        </div>
      )}

      {/* =========================================================================
          MAIN MODAL CONTENT
      ========================================================================= */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 relative border border-slate-100">
          <button 
            onClick={() => {
              if (!isProcessing) onClose();
            }} 
            className="absolute top-5 right-5 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" weight="bold" />
          </button>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-16 w-16 bg-[#ff3f7a]/10 text-[#ff3f7a] rounded-2xl flex items-center justify-center mb-4 border border-[#ff3f7a]/20 shadow-sm">
              <Wallet className="h-8 w-8" weight="fill" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Fund Wallet</h3>
            <p className="text-slate-500 text-sm font-medium mt-1">Add funds instantly via card, bank transfer, or USSD.</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt.toString())}
                  disabled={isProcessing}
                  className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer disabled:opacity-50 ${
                    amount === amt.toString() 
                      ? "border-[#ff3f7a] bg-[#ff3f7a]/5 text-[#ff3f7a] shadow-sm" 
                      : "border-slate-100 text-slate-600 hover:border-slate-300 bg-slate-50/50"
                  }`}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Custom Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-slate-400 font-bold text-lg">₦</span>
                <Input 
                  type="number"
                  value={amount}
                  disabled={isProcessing}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount (e.g. 5000)"
                  className="pl-9 h-14 text-lg font-bold border-2 border-slate-200 focus-visible:ring-[#ff3f7a] focus-visible:border-[#ff3f7a] rounded-xl text-slate-900 disabled:opacity-50"
                />
              </div>
            </div>

            <Button 
              type="button"
              onClick={handlePay}
              disabled={isProcessing || !amount || Number(amount) < 100}
              className="w-full h-14 bg-[#ff3f7a] hover:bg-[#e02b62] text-white font-black text-base rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-[#ff3f7a]/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Spinner className="animate-spin h-5 w-5" weight="bold" />
                  <span>Securing Session...</span>
                </>
              ) : (
                <>
                  <Lock size={18} weight="bold" />
                  <span>Proceed to Pay ₦{amount ? Number(amount).toLocaleString() : "0"}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
