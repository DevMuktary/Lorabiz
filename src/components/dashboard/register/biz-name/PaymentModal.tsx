"use client";

import { useState, useEffect, useRef } from "react";
import { usePaystackPayment } from "react-paystack";
import { useRouter } from "next/navigation";
import { X, Wallet, CreditCard, CircleNotch, CheckCircle } from "@phosphor-icons/react";

// ==========================================
// 1. SAFE PAYSTACK WRAPPER
// Added `useRef` to prevent Next.js Strict Mode from double-firing 
// and crashing the Paystack iframe in the background.
// ==========================================
const PaystackTrigger = ({ config, onSuccess, onClose }: any) => {
  const initializePayment = usePaystackPayment(config);
  const hasFired = useRef(false);

  useEffect(() => {
    // Only allow Paystack to initialize strictly ONE time
    if (hasFired.current) return;
    hasFired.current = true;

    // Small timeout ensures the script is fully attached to the DOM before firing
    const timer = setTimeout(() => {
      // @ts-ignore
      initializePayment(onSuccess, onClose);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null; 
};

// ==========================================
// 2. MAIN MODAL COMPONENT
// ==========================================
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
  const [paystackConfig, setPaystackConfig] = useState<any>(null);

  // Fetch Wallet Balance
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/user/wallet");
        const data = await res.json();
        if (data.success && data.wallet) {
          setWalletBalance(Number(data.wallet.balance));
          setServicePrice(20000); // Or fetch from ServicePricing table
        } else {
          setErrorMsg("Failed to load wallet details.");
        }
      } catch (err) {
        setErrorMsg("Network error loading wallet.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle Wallet or Online Intent Creation
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
          setErrorMsg("Server error: Paystack Public Key is missing. Check .env file.");
          setProcessingState("idle");
          return;
        }
        setPaystackConfig(data.paystackData);
      }
    } catch (error) {
      setErrorMsg("Network error. Please try again.");
      setProcessingState("idle");
    }
  };

  // Called when Paystack returns success
  const handlePaystackSuccess = async (referenceObj: any) => {
    setProcessingState("verifying");
    try {
      const verifyRes = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: referenceObj.reference })
      });
      const verifyData = await verifyRes.json();
      
      if (verifyData.success) {
        setProcessingState("success");
        setTimeout(() => router.push("/dashboard?success=true"), 2500);
      } else {
        setErrorMsg(verifyData.message || "Verification failed. Contact support.");
        setProcessingState("idle");
      }
    } catch (e) {
      setErrorMsg("Network error during verification.");
      setProcessingState("idle");
    }
  };

  // Called when user clicks "Cancel" inside the Paystack modal
  const handlePaystackClose = () => {
    setProcessingState("idle");
    setPaystackConfig(null);
  };

  // Escape Hatch: Let the user cancel if it hangs
  const handleForceCancel = () => {
    setProcessingState("idle");
    setPaystackConfig(null);
  };

  const isWalletInsufficient = walletBalance !== null && servicePrice !== null && walletBalance < servicePrice;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      
      {paystackConfig && processingState === "initializing" && (
        <PaystackTrigger 
          config={paystackConfig} 
          onSuccess={handlePaystackSuccess} 
          onClose={handlePaystackClose} 
        />
      )}

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

        {/* PROCESSING STATES */}
        {processingState !== "idle" ? (
          <div className="p-10 flex flex-col items-center justify-center text-center h-[350px]">
            {processingState === "success" ? (
              <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                <CheckCircle className="h-24 w-24 text-emerald-500 mb-6 drop-shadow-lg" weight="fill" />
                <h3 className="font-black text-2xl text-slate-900 mb-2">Application Submitted!</h3>
                <p className="text-slate-500 font-medium">Payment secured. Redirecting to your dashboard...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <CircleNotch className="animate-spin h-20 w-20 text-[#ff3f7a] mb-6" weight="bold" />
                <h3 className="font-black text-xl text-slate-900 mb-2">
                  {processingState === "initializing" ? "Initializing Gateway..." : "Securing Payment..."}
                </h3>
                <p className="text-slate-500 font-medium mb-6">Please do not close this window.</p>
                
                {/* ESCAPE HATCH ADDED HERE */}
                {processingState === "initializing" && (
                  <button 
                    onClick={handleForceCancel}
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
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-200 hover:border-[#ff3f7a] hover:bg-[#ff3f7a]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-[#ff3f7a] group-hover:text-white transition-colors">
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
                className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-200 hover:border-[#ff3f7a] hover:bg-[#ff3f7a]/5 transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-[#ff3f7a] group-hover:text-white transition-colors">
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
