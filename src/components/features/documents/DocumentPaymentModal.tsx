"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Wallet, CreditCard, CircleDashed, CheckCircle, Sparkle, MusicNotes, Tag, Spinner } from "@phosphor-icons/react";
import { BoardResolutionFormData } from "@/lib/board-resolution-generator";

interface DocumentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: BoardResolutionFormData;
  documentType?: string;
  draftId?: string;
  onSuccess?: (document: any) => void;
}

export default function DocumentPaymentModal({ 
  isOpen, 
  onClose, 
  formData, 
  documentType = "BOARD_RESOLUTION", 
  draftId,
  onSuccess 
}: DocumentPaymentModalProps) {
  const router = useRouter();
  
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [servicePrice, setServicePrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [processingState, setProcessingState] = useState<"idle" | "initializing" | "verifying" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Promo Code States
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string, discountAmount: number, finalAmount: number } | null>(null);

  // 1. Fetch Wallet & Live Pricing
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
          setServicePrice(pricingData.data?.DOC_BOARD_RESOLUTION || 3500); 
        } else {
          setErrorMsg("Failed to load wallet details.");
        }
      } catch {
        setErrorMsg("Network error loading wallet and pricing.");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
      setProcessingState("idle");
      setErrorMsg(null);
    }

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [isOpen]);

  // 2. Handle Online Payment Verification (if redirected back with reference)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get("reference");
    const isVerifying = urlParams.get("verifying");

    if (isVerifying === "true" && reference && reference.startsWith("ONL_DOC_")) {
      setProcessingState("verifying");

      const verifyPayment = async () => {
        try {
          const res = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference })
          });
          const data = await res.json();

          if (data.success) {
            setProcessingState("success");
            if (onSuccess) onSuccess(data.document || data);
            
            // Clean URL query
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);

            setTimeout(() => {
              router.push("/dashboard/documents/board-resolution/history?success=true");
            }, 2500);
          } else {
            setErrorMsg(data.message || "Payment verification failed or transaction was cancelled.");
            setProcessingState("idle");
          }
        } catch {
          setErrorMsg("Network error during payment verification. Please check your history or retry.");
          setProcessingState("idle");
        }
      };

      verifyPayment();
    }
  }, [router, onSuccess]);

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    if (!servicePrice) return;
    
    setPromoLoading(true);
    setPromoError(null);
    
    try {
      const res = await fetch("/api/payment/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: promoCodeInput, 
          service: "DOC_BOARD_RESOLUTION", 
          originalAmount: servicePrice 
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setAppliedPromo({
          code: data.data.code,
          discountAmount: data.data.discountAmount,
          finalAmount: data.data.finalAmount
        });
        setPromoCodeInput("");
      } else {
        setPromoError(data.message);
      }
    } catch {
      setPromoError("Network error validating promo code.");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError(null);
  };

  const handlePayment = async (method: "WALLET" | "ONLINE") => {
    setProcessingState("initializing");
    setErrorMsg(null);

    if (method === "ONLINE") {
      setGatewayLoading(true);
    }

    try {
      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          service: "doc_board_resolution",
          paymentMethod: method,
          formData,
          documentType,
          documentDraftId: draftId,
          draftId: draftId,
          promoCode: appliedPromo?.code
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
        if (onSuccess) onSuccess(data.document || data);
        setTimeout(() => {
          router.refresh(); 
          router.push("/dashboard/documents/board-resolution/history?success=true");
        }, 2000);
      } else if (method === "ONLINE") {
        if (!data.authorizationUrl) {
          setErrorMsg("Server error: Could not obtain checkout link. Please try again.");
          setProcessingState("idle");
          setGatewayLoading(false);
          return;
        }
        window.location.href = data.authorizationUrl;
      }
    } catch {
      setErrorMsg("Network connectivity error. Please verify your connection and try again.");
      setProcessingState("idle");
      setGatewayLoading(false);
    }
  };

  if (!isOpen && processingState !== "verifying" && processingState !== "success") return null;

  const displayPrice = appliedPromo ? appliedPromo.finalAmount : servicePrice;
  const isWalletInsufficient = walletBalance !== null && displayPrice !== null && walletBalance < displayPrice;

  return (
    <>
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
                💳
              </span>
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">
            Connecting to KoraPay...
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide max-w-xs leading-relaxed animate-pulse">
            Please wait a moment while we prepare your secure checkout.
          </p>

          <div className="w-56 h-1.5 bg-slate-800 rounded-full mt-8 overflow-hidden p-0.5 border border-white/10 shadow-inner">
            <div className="h-full bg-gradient-to-r from-[#ff3f7a] via-amber-400 to-[#ff3f7a] rounded-full w-2/3 animate-[pulse_1s_ease-in-out_infinite]" />
          </div>

          <button
            type="button"
            onClick={() => {
              setGatewayLoading(false);
              setProcessingState("idle");
            }}
            className="mt-6 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Cancel / Choose Another Method
          </button>
        </div>
      )}

      {/* Main Modal Content */}
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="bg-card border border-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          
          <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-secondary/50">
            <h3 className="font-black text-xl text-foreground">Board Resolution Payment</h3>
            {processingState === "idle" && !gatewayLoading && (
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X weight="bold" />
              </button>
            )}
          </div>

          {processingState !== "idle" && !gatewayLoading ? (
            <div className="p-10 flex flex-col items-center justify-center text-center h-[350px]">
              {processingState === "success" ? (
                <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                  <CheckCircle className="h-28 w-28 text-emerald-500 mb-6 drop-shadow-lg" weight="fill" />
                  <h3 className="font-black text-2xl text-foreground mb-2">Payment Successful!</h3>
                  <p className="text-muted-foreground font-medium text-sm">Your certified board resolution is ready and emailed to you. Redirecting...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <CircleDashed className="animate-spin h-28 w-28 text-primary mb-8" weight="bold" />
                  <h3 className="font-black text-xl text-foreground mb-2">
                    {processingState === "initializing" ? "Initializing Gateway..." : "Verifying with Bank..."}
                  </h3>
                  <p className="text-muted-foreground font-medium mb-6 text-sm">Please do not close this window.</p>
                </div>
              )}
            </div>
          ) : (
            
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Official Resolution Fee</p>
                {appliedPromo ? (
                  <div className="flex flex-col items-center animate-in zoom-in duration-200">
                    <h2 className="text-4xl font-black text-emerald-500">₦{displayPrice?.toLocaleString()}</h2>
                    <p className="text-sm text-muted-foreground font-bold line-through mt-1">₦{servicePrice?.toLocaleString()}</p>
                  </div>
                ) : (
                  <h2 className="text-4xl font-black text-foreground">₦{displayPrice?.toLocaleString() || "..."}</h2>
                )}
                <p className="text-muted-foreground text-sm font-medium mt-2">Document for: <span className="font-bold text-foreground">{formData.companyName || "Your Company"}</span></p>
              </div>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-bold flex items-center mb-6 animate-in fade-in">
                  <span className="mr-2">⚠️</span> {errorMsg}
                </div>
              )}

              {/* Promo Code UI */}
              {!appliedPromo ? (
                <div className="mb-6 bg-secondary/30 p-3 rounded-2xl border border-border">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3.5 top-3 text-muted-foreground" size={18} weight="bold" />
                      <input
                        type="text"
                        placeholder="Have a promo code?"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        disabled={loading || promoLoading}
                        className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-background text-sm font-bold focus:ring-2 focus:ring-primary outline-none uppercase placeholder:normal-case placeholder:font-medium disabled:opacity-50 transition-all text-foreground"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoCodeInput.trim() || loading}
                      className="h-11 px-5 bg-foreground text-background font-bold text-sm rounded-xl disabled:opacity-50 transition-all hover:opacity-90 cursor-pointer flex items-center justify-center"
                    >
                      {promoLoading ? <Spinner className="animate-spin h-5 w-5" weight="bold" /> : "Apply"}
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-xs font-bold text-red-500 mt-2.5 ml-1 animate-in slide-in-from-top-1">{promoError}</p>
                  )}
                </div>
              ) : (
                <div className="mb-6 bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/20 flex items-center justify-between animate-in zoom-in-95 duration-200">
                  <div className="flex flex-col">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkle weight="fill" /> Promo Applied
                    </p>
                    <p className="text-sm font-black text-emerald-700 mt-0.5">
                      {appliedPromo.code} <span className="text-emerald-600/80 font-bold text-xs ml-1">(-₦{appliedPromo.discountAmount.toLocaleString()})</span>
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleRemovePromo} 
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl text-emerald-600 transition-colors cursor-pointer"
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>
              )}

              {/* Payment Buttons */}
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
