"use client";

import { useState, useEffect } from "react";
import { X, Wallet, Spinner, Sparkle, MusicNotes, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
  onFailure: (message: string) => void;
}

const QUICK_AMOUNTS = [1000, 5000, 10000];

export default function FundWalletModal({ isOpen, onClose, onSuccess, onFailure }: FundWalletModalProps) {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [gatewayLoading, setGatewayLoading] = useState(false);

  // Prevent bfcache "stuck animation" freeze if user cancels or presses Back
  useEffect(() => {
    const handlePageRestore = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setIsProcessing(false);
        setGatewayLoading(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && gatewayLoading) {
        setIsProcessing(false);
        setGatewayLoading(false);
      }
    };

    window.addEventListener("pageshow", handlePageRestore);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageRestore);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [gatewayLoading]);

  if (!isOpen) return null;

  const handlePay = async () => {
    if (!amount || Number(amount) < 100) return alert("Minimum amount is ₦100");
    
    setIsProcessing(true);
    setGatewayLoading(true);
    
    try {
      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: "wallet_funding",
          amount: Number(amount),
          paymentMethod: "ONLINE"
        })
      });

      const data = await res.json();

      if (!data.success || !data.authorizationUrl) {
        setIsProcessing(false);
        setGatewayLoading(false);
        onFailure(data.message || "Could not initialize payment. Please try again.");
        return;
      }

      // Native browser redirect
      window.location.href = data.authorizationUrl;

    } catch (error) {
      setIsProcessing(false);
      setGatewayLoading(false);
      onFailure("Network connection error. Please verify your internet and try again.");
    }
  };

  return (
    <>
      {/* Friendly Dancing Baby Doll Overlay (Fully Theme Adaptive: Light & Dark Mode) */}
      {gatewayLoading && (
        <div className="fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-background/95 dark:bg-background/95 backdrop-blur-md text-foreground animate-in fade-in duration-300 select-none p-6 text-center">
          <div className="relative flex items-center justify-center mb-8 w-40 h-40">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75" />
            <div className="absolute inset-2 rounded-full border-2 border-dashed border-primary/50 animate-[spin_8s_linear_infinite]" />
            <div className="absolute inset-6 rounded-full border border-dotted border-amber-400/60 animate-[spin_5s_linear_infinite_reverse]" />
            
            <div className="absolute -top-1 -right-2 text-amber-400 animate-bounce delay-100">
              <MusicNotes size={26} weight="fill" />
            </div>
            <div className="absolute -bottom-1 -left-2 text-primary animate-bounce delay-300">
              <Sparkle size={24} weight="fill" />
            </div>

            <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-tr from-primary via-primary/90 to-amber-400 flex items-center justify-center shadow-2xl shadow-primary/30 border border-border/40 animate-bounce">
              <span className="text-4xl drop-shadow-md select-none transform hover:scale-110 transition-transform animate-[pulse_1s_ease-in-out_infinite]">
                🧸
              </span>
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground mb-2">
            Connecting to KoraPay...
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium tracking-wide max-w-xs leading-relaxed animate-pulse">
            Please wait a moment while we prepare your checkout page.
          </p>

          <div className="w-56 h-1.5 bg-secondary rounded-full mt-8 overflow-hidden p-0.5 border border-border shadow-inner">
            <div className="h-full bg-gradient-to-r from-primary via-amber-400 to-primary rounded-full w-2/3 animate-[pulse_1s_ease-in-out_infinite]" />
          </div>

          {/* Escape Hatch for users if their network stalls */}
          <button
            type="button"
            onClick={() => {
              setGatewayLoading(false);
              setIsProcessing(false);
            }}
            className="mt-8 text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors cursor-pointer"
          >
            Cancel / Go Back
          </button>
        </div>
      )}

      {/* Main Modal Content (Fully Theme Adaptive: Light & Dark Mode) */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-card text-foreground rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 relative border border-border">
          <button 
            onClick={() => {
              if (!isProcessing) onClose();
            }} 
            className="absolute top-5 right-5 p-2 bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" weight="bold" />
          </button>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 border border-primary/20 shadow-sm">
              <Wallet className="h-8 w-8" weight="fill" />
            </div>
            <h3 className="text-2xl font-black text-foreground tracking-tight">Fund Wallet</h3>
            <p className="text-muted-foreground text-sm font-medium mt-1">Add funds instantly via card, bank transfer, or USSD.</p>
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
                      ? "border-primary bg-primary/10 text-primary shadow-sm" 
                      : "border-border text-foreground hover:border-primary/50 bg-secondary/40"
                  }`}
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Custom Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-muted-foreground font-bold text-lg">₦</span>
                <Input 
                  type="number"
                  value={amount}
                  disabled={isProcessing}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount (e.g. 5000)"
                  className="pl-9 h-14 text-lg font-bold border-2 border-border bg-secondary/30 focus-visible:ring-primary focus-visible:border-primary rounded-xl text-foreground disabled:opacity-50"
                />
              </div>
            </div>

            <Button 
              type="button"
              onClick={handlePay}
              disabled={isProcessing || !amount || Number(amount) < 100}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Spinner className="animate-spin h-5 w-5" weight="bold" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Pay ₦{amount ? Number(amount).toLocaleString() : "0"}</span>
                  <ArrowRight size={18} weight="bold" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
