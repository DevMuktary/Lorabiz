"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, TextAa, WarningCircle, CheckCircle, Spinner, Wallet, CreditCard, CircleDashed, Sparkle, MusicNotes } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SubstituteNameModal({ reg, onClose }: { reg: any, onClose: () => void }) {
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2 | 3>(1); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [substitutionFee, setSubstitutionFee] = useState(5000); 
  const [processingState, setProcessingState] = useState<"idle" | "initializing" | "verifying" | "success">("idle");
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [gatewayLoading, setGatewayLoading] = useState(false);

  const [formData, setFormData] = useState({
    proposedName: reg.proposedName || "",
    altName1: reg.altName1 || "",
    altName2: reg.altName2 || ""
  });

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch("/api/user/wallet");
        const data = await res.json();
        if (data.success && data.wallet) {
          setWalletBalance(Number(data.wallet.balance));
        }
      } catch (err) {}
    };
    fetchWallet();

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  // =====================================================================
  // ROBUST REDIRECT VERIFICATION 
  // =====================================================================
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isVerifying = params.get("verifying") === "true";
      const reference = params.get("reference");
      
      if (isVerifying && processingState === "idle") {
        // Instantly clean the URL so refreshing the page doesn't re-trigger it
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        setStep(3); // Move directly to the verifying view

        if (reference) {
          verifyOnlinePayment(reference);
        } else {
          // User closed the gateway and no reference was appended
          setError("Payment was cancelled or interrupted. No funds were debited.");
          setProcessingState("idle");
          setStep(2); 
        }
      }
    }
  }, [reg.id, processingState]);

  const verifyOnlinePayment = async (reference: string) => {
    setProcessingState("verifying");
    setError(null);

    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference })
      });
      const data = await res.json();

      if (data.success) {
        setProcessingState("success");
        router.refresh(); 
      } else {
        setError("Transaction cancelled or failed. Please try again.");
        setProcessingState("idle");
        setStep(2);
      }
    } catch (err) {
      startWebhookPolling();
    }
  };

  const validateNames = () => {
    if (reg._appType === "BUSINESS_NAME") {
      const restricted = /limited|ltd|plc|inc|incorporated|llc/i;
      if (restricted.test(formData.proposedName) || restricted.test(formData.altName1) || restricted.test(formData.altName2)) {
        return "Business Names cannot contain Limited, Ltd, Plc, Inc, or LLC. If you need a company, please register an LLC.";
      }
    }
    if (!formData.proposedName) return "Proposed name is required.";
    return null;
  };

  const handleProceedToPayment = () => {
    const validationError = validateNames();
    if (validationError) return setError(validationError);
    setError(null);
    setStep(2);
  };

  const startWebhookPolling = () => {
    setProcessingState("verifying");
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const endpoint = reg._appType === "LLC" 
            ? `/api/cac/register/llc/details/${reg.id}`
            : `/api/cac/register/business-name/details/${reg.id}`;
            
        const res = await fetch(endpoint);
        const json = await res.json();
        
        if (json.success && json.data.proposedName === formData.proposedName) {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          setProcessingState("success");
          router.refresh();
        }
      } catch (e) {}
    }, 2000);

    setTimeout(() => {
      if (pollingIntervalRef.current && processingState !== "success") {
        clearInterval(pollingIntervalRef.current);
        setError("Payment confirmation delayed. If you paid, it will reflect shortly.");
        setProcessingState("idle");
        setStep(2); 
      }
    }, 15000);
  };

  const handlePayment = async (method: "WALLET" | "ONLINE") => {
    setLoading(true);
    setError(null);
    
    if (method === "ONLINE") {
      setGatewayLoading(true);
    }

    try {
      const res = await fetch("/api/cac/substitute-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reg.id, type: reg._appType, paymentMethod: method, ...formData,
          callbackUrl: window.location.pathname // Sending exact path to backend
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to initialize payment.");
        setProcessingState("idle");
        setGatewayLoading(false);
        return;
      }

      if (method === "WALLET") {
        setProcessingState("success");
        setStep(3);
        router.refresh();
      } else if (method === "ONLINE") {
        if (!data.authorizationUrl) {
          setError("Server error: Could not obtain checkout link.");
          setProcessingState("idle"); 
          setGatewayLoading(false);
          return;
        }
        
        // Native Redirect - 100% reliable
        window.location.href = data.authorizationUrl;
      }
    } catch (e) {
      setError("A network error occurred.");
      setProcessingState("idle");
      setGatewayLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveQuery = async () => {
    setLoading(true);
    try {
      await fetch("/api/cac/submit-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reg.id, type: reg._appType })
      });
      // Force hard reload so the queries page reflects the absolute latest state
      window.location.reload(); 
    } catch (e) {
      setError("Failed to submit query.");
      setLoading(false);
    }
  };

  const handleContinueEditing = () => {
    // CRITICAL UX FIX: Force a hard reload so the new names render instantly on the screen
    window.location.reload(); 
  };

  const isWalletInsufficient = walletBalance !== null && walletBalance < substitutionFee;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      
      {/* Friendly Dancing Baby Doll Overlay */}
      {gatewayLoading && (
        <div className="fixed inset-0 z-[9999999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md text-white animate-in fade-in duration-300 select-none p-6 text-center">
          <div className="relative flex items-center justify-center mb-8 w-40 h-40">
            <div className="absolute inset-0 rounded-full bg-[#ff3f7a]/20 animate-ping opacity-75" />
            <div className="absolute inset-2 rounded-full border-2 border-dashed border-[#ff3f7a]/50 animate-[spin_8s_linear_infinite]" />
            <div className="absolute inset-6 rounded-full border border-dotted border-amber-400/60 animate-[spin_5s_linear_infinite_reverse]" />
            
            <div className="absolute -top-1 -right-2 text-amber-400 animate-bounce delay-100">
              <MusicNotes size={26} weight="fill" />
            </div>
            <div className="absolute -bottom-1 -left-2 text-[#ff3f7a] animate-bounce delay-300">
              <Sparkle size={24} weight="fill" />
            </div>

            <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-tr from-[#ff3f7a] via-[#e02b62] to-amber-400 flex items-center justify-center shadow-2xl shadow-[#ff3f7a]/40 border border-white/20 animate-bounce">
              <span className="text-4xl drop-shadow-md select-none transform hover:scale-110 transition-transform animate-[pulse_1s_ease-in-out_infinite]">
                🧸
              </span>
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">
            Connecting to Secure Checkout...
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide max-w-xs leading-relaxed animate-pulse">
            Please wait a moment while we prepare your checkout page.
          </p>

          <div className="w-56 h-1.5 bg-slate-800 rounded-full mt-8 overflow-hidden p-0.5 border border-white/10 shadow-inner">
            <div className="h-full bg-gradient-to-r from-[#ff3f7a] via-amber-400 to-[#ff3f7a] rounded-full w-2/3 animate-[pulse_1s_ease-in-out_infinite]" />
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
        
        <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-secondary/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <TextAa weight="fill" className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-foreground">Substitute Name</h3>
            </div>
          </div>
          {(step === 1 || step === 2) && (
            <button onClick={onClose} disabled={loading} className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
              <X weight="bold" />
            </button>
          )}
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-3 rounded-lg mb-6 flex items-start gap-2">
              <WarningCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <p className="text-sm font-medium text-muted-foreground">Substitution Fee: <span className="font-bold text-foreground">₦{substitutionFee.toLocaleString()}</span></p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>New Proposed Name *</Label>
                  <Input value={formData.proposedName} onChange={e => {setFormData({...formData, proposedName: e.target.value}); setError(null);}} placeholder="Enter exact new name" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Alternative Name 1</Label>
                  <Input value={formData.altName1} onChange={e => {setFormData({...formData, altName1: e.target.value}); setError(null);}} placeholder="Optional" className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Alternative Name 2</Label>
                  <Input value={formData.altName2} onChange={e => {setFormData({...formData, altName2: e.target.value}); setError(null);}} placeholder="Optional" className="h-12" />
                </div>
              </div>

              <button onClick={handleProceedToPayment} className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity">
                Proceed to Payment
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
               <div className="text-center mb-6">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Fee</p>
                  <h2 className="text-4xl font-black text-foreground">₦{substitutionFee.toLocaleString()}</h2>
               </div>

              <div className="space-y-4">
                <button 
                  onClick={() => handlePayment("WALLET")}
                  disabled={loading || isWalletInsufficient}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Wallet size={24} weight="fill" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-foreground">Pay from Wallet</h4>
                      <p className="text-sm font-bold text-muted-foreground">Balance: <span className={isWalletInsufficient ? "text-red-500" : "text-emerald-500"}>₦{walletBalance?.toLocaleString() || "0"}</span></p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => handlePayment("ONLINE")}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <CreditCard size={24} weight="fill" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-foreground">Pay Online</h4>
                      <p className="text-sm font-medium text-muted-foreground">Card, Transfer, OPay, USSD</p>
                    </div>
                  </div>
                </button>
              </div>
              <button onClick={() => setStep(1)} className="w-full text-center text-sm font-bold text-muted-foreground hover:text-foreground mt-4">
                &larr; Back to Name Input
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-4">
               {processingState === "success" ? (
                 <div className="animate-in zoom-in duration-500">
                    <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-500/5">
                      <CheckCircle weight="fill" className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-black text-foreground mb-2">Names Substituted!</h3>
                    <p className="text-sm text-muted-foreground font-medium mb-8">
                      Your new names have been saved. Is your query fully resolved, or do you still need to edit other details?
                    </p>
                    
                    <div className="flex flex-col gap-3">
                      <button onClick={handleResolveQuery} disabled={loading} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        {loading ? <Spinner className="animate-spin h-5 w-5" /> : "Yes, Submit Query Now"}
                      </button>
                      
                      {/* THIS IS THE CRITICAL UX FIX. IT FORCES A HARD RELOAD TO SHOW THE NEW NAMES EVERYWHERE. */}
                      <button onClick={handleContinueEditing} disabled={loading} className="w-full h-14 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/80 transition-colors">
                        No, Continue Editing
                      </button>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-48">
                    <CircleDashed className="animate-spin h-16 w-16 text-primary mb-4" weight="bold" />
                    <h3 className="font-black text-lg text-foreground mb-2">
                      {processingState === "initializing" ? "Initializing Payment..." : "Verifying with Bank..."}
                    </h3>
                    <p className="text-muted-foreground font-medium text-sm">Please do not close this window.</p>
                 </div>
               )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
