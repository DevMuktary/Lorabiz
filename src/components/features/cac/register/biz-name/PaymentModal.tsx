"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Wallet, CreditCard, CircleDashed, CheckCircle, Sparkle, MusicNotes } from "@phosphor-icons/react";

interface PaymentModalProps {
  registrationId: string;
  proposedName: string;
  onClose: () => void;
}

export default function PaymentModal({ registrationId, proposedName, onClose }: PaymentModalProps) {
  const router = useRouter();
  
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [servicePrice, setServicePrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [processingState, setProcessingState] = useState<"idle" | "initializing" | "verifying" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // NEW: Controls our friendly Dancing Baby Doll overlay during native online redirect
  const [gatewayLoading, setGatewayLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletRes, pricingRes] = await Promise.all([
          fetch("/api/user/wallet"),
          fetch("/api/pricing")
        ]);
        
        const walletData = await walletRes.json();
        const pricingData = await pricingRes.json();

        if (walletData.success && walletData.wallet) {
          setWalletBalance(Number(walletData.wallet.balance));
          setServicePrice(pricingData.data?.BUSINESS_NAME || 20000); 
        } else {
          setErrorMsg("Failed to load wallet details.");
        }
      } catch (err) {
        setErrorMsg("Network error loading wallet and pricing.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Prevent bfcache freeze if user presses browser Back from Paystack checkout page
  useEffect(() => {
    const handlePageRestore = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setProcessingState("idle");
        setGatewayLoading(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && gatewayLoading) {
        setProcessingState("idle");
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

  const handlePayment = async (method: "WALLET" | "ONLINE") => {
    setProcessingState("initializing");
    setErrorMsg(null);

    // If online, trigger our friendly dancing baby doll overlay immediately!
    if (method === "ONLINE") {
      setGatewayLoading(true);
    }

    try {
      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          registrationId, 
          paymentMethod: method,
          service: "business" 
        })
      });
      const data = await res.json();

      if (!data.success) {
        setErrorMsg(data.message || "Payment initialization failed.");
        setProcessingState("idle");
        setGatewayLoading(false);
        return;
      }

      if (method === "WALLET") {
        setProcessingState("success");
        setTimeout(() => router.push("/dashboard/cac/new-incorporation?success=true"), 2000);
      } else if (method === "ONLINE") {
        if (!data.authorizationUrl) {
          setErrorMsg("Server error: Could not obtain checkout link. Please try again.");
          setProcessingState("idle");
          setGatewayLoading(false);
          return;
        }

        // Native Browser Redirect: Zero iframes, zero white flash!
        window.location.href = data.authorizationUrl;
      }
    } catch (error) {
      setErrorMsg("Network connectivity error. Please verify your connection and try again.");
      setProcessingState("idle");
      setGatewayLoading(false);
    }
  };

  const isWalletInsufficient = walletBalance !== null && servicePrice !== null && walletBalance < servicePrice;

  return (
    <>
      {/* =========================================================================
          FRIENDLY DANCING BABY DOLL OVERLAY
          Delightful animation while the browser navigates natively to Paystack!
      ========================================================================= */}
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
            Connecting to Paystack...
          </h3>
          
          <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide max-w-xs leading-relaxed animate-pulse">
            Please wait a moment while we prepare your checkout page.
          </p>

          <div className="w-56 h-1.5 bg-slate-800 rounded-full mt-8 overflow-hidden p-0.5 border border-white/10 shadow-inner">
            <div className="h-full bg-gradient-to-r from-[#ff3f7a] via-amber-400 to-[#ff3f7a] rounded-full w-2/3 animate-[pulse_1s_ease-in-out_infinite]" />
          </div>

          {/* Escape hatch for slow internet connections */}
          <button
            type="button"
            onClick={() => {
              setGatewayLoading(false);
              setProcessingState("idle");
            }}
            className="mt-8 text-xs text-slate-400 hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
          >
            Cancel / Go Back
          </button>

        </div>
      )}

      {/* =========================================================================
          MAIN MODAL CONTENT
      ========================================================================= */}
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="bg-card border border-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          
          {/* HEADER */}
          <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-secondary/50">
            <h3 className="font-black text-xl text-foreground">Complete Application</h3>
            {processingState === "idle" && !gatewayLoading && (
              <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <X weight="bold" />
              </button>
            )}
          </div>

          {/* PROCESSING STATES (WALLET PAYMENT OR LOADING) */}
          {processingState !== "idle" && !gatewayLoading ? (
            <div className="p-10 flex flex-col items-center justify-center text-center h-[350px]">
              {processingState === "success" ? (
                <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                  <CheckCircle className="h-28 w-28 text-emerald-500 mb-6 drop-shadow-lg" weight="fill" />
                  <h3 className="font-black text-2xl text-foreground mb-2">Application Submitted!</h3>
                  <p className="text-muted-foreground font-medium">Payment secured from wallet. Redirecting...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <CircleDashed className="animate-spin h-28 w-28 text-primary mb-8" weight="bold" />
                  <h3 className="font-black text-xl text-foreground mb-2">Processing Wallet Payment...</h3>
                  <p className="text-muted-foreground font-medium mb-6 text-sm">Please do not close this window.</p>
                </div>
              )}
            </div>
          ) : (
            
            /* PAYMENT OPTIONS UI */
            <div className="p-6">
              <div className="text-center mb-8">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Fee</p>
                <h2 className="text-4xl font-black text-foreground">₦{servicePrice?.toLocaleString() || "..."}</h2>
                <p className="text-muted-foreground text-sm font-medium mt-2">Registration for: <span className="font-bold text-foreground">{proposedName}</span></p>
              </div>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-bold flex items-center mb-6">
                  <span className="mr-2">⚠️</span> {errorMsg}
                </div>
              )}

              <div className="space-y-4">
                <button 
                  type="button"
                  onClick={() => handlePayment("WALLET")}
                  disabled={loading || isWalletInsufficient || gatewayLoading}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left cursor-pointer"
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
                
                {isWalletInsufficient && (
                  <p className="text-xs text-red-500 font-bold text-center px-4">Insufficient balance. Please fund your wallet or pay online.</p>
                )}

                <button 
                  type="button"
                  onClick={() => handlePayment("ONLINE")}
                  disabled={loading || gatewayLoading}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group text-left cursor-pointer disabled:opacity-50"
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
            </div>
          )}
        </div>
      </div>
    </>
  );
}
