"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { X, Wallet, CreditCard, CircleDashed, CheckCircle } from "@phosphor-icons/react";

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

  // Used to stop polling when component unmounts
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch wallet AND live pricing simultaneously from the database
        const [walletRes, pricingRes] = await Promise.all([
          fetch("/api/user/wallet"),
          fetch("/api/pricing")
        ]);
        
        const walletData = await walletRes.json();
        const pricingData = await pricingRes.json();

        if (walletData.success && walletData.wallet) {
          setWalletBalance(Number(walletData.wallet.balance));
          // Dynamically set the price using the database value instead of hardcoding
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

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  // =================================================================
  // FRONTEND IS NOW A DUMB WATCHER: We rely entirely on the Webhook.
  // We just poll our own database every 2 seconds to see if the status changed.
  // =================================================================
  const startWebhookPolling = () => {
    setProcessingState("verifying");
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/register/details/${registrationId}`);
        const json = await res.json();
        
        // If the Webhook successfully processed the payment, the status will no longer be UNSUBMITTED
        if (json.success && json.data.status !== "UNSUBMITTED") {
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          setProcessingState("success");
          setTimeout(() => router.push("/dashboard?success=true"), 2500);
        }
      } catch (e) {
        // Silent catch: ignore network errors while polling
      }
    }, 2000);

    // Escape hatch: If webhook takes longer than 30 seconds, tell user to check dashboard later
    setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        if (processingState !== "success") {
          setErrorMsg("Payment received, but confirmation is taking longer than usual. Please check your dashboard in a few minutes.");
          setProcessingState("idle");
        }
      }
    }, 30000);
  };

  const handlePayment = async (method: "WALLET" | "ONLINE") => {
    setProcessingState("initializing");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, paymentMethod: method })
      });
      const data = await res.json();

      if (!data.success) {
        setErrorMsg(data.message || "Payment initialization failed.");
        setProcessingState("idle");
        return;
      }

      if (method === "WALLET") {
        setProcessingState("success");
        setTimeout(() => router.push("/dashboard?success=true"), 2500);
      } else if (method === "ONLINE") {
        if (!data.paystackData.publicKey) {
          setErrorMsg("Server error: Paystack Public Key is missing. Trigger a rebuild on Railway.");
          setProcessingState("idle");
          return;
        }

        try {
          const handler = (window as any).PaystackPop.setup({
            key: data.paystackData.publicKey,
            email: data.paystackData.email,
            amount: data.paystackData.amount,
            ref: data.paystackData.reference,
            callback: function () {
              // Paystack closed with success. Start polling for Webhook confirmation.
              startWebhookPolling();
            },
            onClose: function () {
              setProcessingState("idle");
            },
          });
          handler.openIframe();
        } catch (err) {
          setErrorMsg("Payment gateway is still loading. Please wait a second and click again.");
          setProcessingState("idle");
        }
      }
    } catch (error) {
      setErrorMsg("Network error. Please try again.");
      setProcessingState("idle");
    }
  };

  const isWalletInsufficient = walletBalance !== null && servicePrice !== null && walletBalance < servicePrice;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />

      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-black text-xl text-slate-900">Complete Application</h3>
          {processingState === "idle" && (
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
              <X weight="bold" />
            </button>
          )}
        </div>

        {/* PROCESSING STATES (UPDATED TO DASHBOARD ZIGZAG LOADER) */}
        {processingState !== "idle" ? (
          <div className="p-10 flex flex-col items-center justify-center text-center h-[350px]">
            {processingState === "success" ? (
              <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                <CheckCircle className="h-28 w-28 text-emerald-500 mb-6 drop-shadow-lg" weight="fill" />
                <h3 className="font-black text-2xl text-slate-900 mb-2">Application Submitted!</h3>
                <p className="text-slate-500 font-medium">Payment secured. Redirecting to your dashboard...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* BIG ZIGZAG LOADER */}
                <CircleDashed className="animate-spin h-28 w-28 text-indigo-500 mb-8" weight="bold" />
                <h3 className="font-black text-xl text-slate-900 mb-2">
                  {processingState === "initializing" ? "Initializing Gateway..." : "Verifying with Bank..."}
                </h3>
                <p className="text-slate-500 font-medium mb-6 text-sm">Please do not close this window.</p>
                
                {processingState === "initializing" && (
                  <button 
                    onClick={() => setProcessingState("idle")}
                    className="text-sm font-bold text-slate-400 hover:text-red-500 underline underline-offset-4 transition-colors"
                  >
                    Cancel / Go Back
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          
          /* PAYMENT OPTIONS UI */
          <div className="p-6">
            <div className="text-center mb-8">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Fee</p>
              <h2 className="text-4xl font-black text-slate-900">₦{servicePrice?.toLocaleString() || "..."}</h2>
              <p className="text-slate-500 text-sm font-medium mt-2">Registration for: <span className="font-bold text-slate-800">{proposedName}</span></p>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center mb-6">
                <span className="mr-2">⚠️</span> {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <button 
                onClick={() => handlePayment("WALLET")}
                disabled={loading || isWalletInsufficient}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <Wallet size={24} weight="fill" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-slate-900">Pay from Wallet</h4>
                    <p className="text-sm font-bold text-slate-500">Balance: <span className={isWalletInsufficient ? "text-red-500" : "text-emerald-600"}>₦{walletBalance?.toLocaleString() || "0"}</span></p>
                  </div>
                </div>
              </button>
              
              {isWalletInsufficient && (
                <p className="text-xs text-red-500 font-bold text-center px-4">Insufficient balance. Please fund your wallet or pay online.</p>
              )}

              <button 
                onClick={() => handlePayment("ONLINE")}
                disabled={loading}
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <CreditCard size={24} weight="fill" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-slate-900">Pay Online</h4>
                    <p className="text-sm font-medium text-slate-500">Card, Transfer, OPay, USSD</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
