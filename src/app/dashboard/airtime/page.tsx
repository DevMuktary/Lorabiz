"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, DeviceMobile, WarningCircle, 
  CheckCircle, Spinner, Wallet, X, Info
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NETWORKS = [
  { id: "MTN", name: "MTN", color: "bg-yellow-400 text-black", border: "border-yellow-400", shadow: "shadow-yellow-400/20" },
  { id: "AIRTEL", name: "Airtel", color: "bg-red-500 text-white", border: "border-red-500", shadow: "shadow-red-500/20" },
  { id: "GLO", name: "Glo", color: "bg-green-500 text-white", border: "border-green-500", shadow: "shadow-green-500/20" },
  { id: "9MOBILE", name: "9Mobile", color: "bg-emerald-800 text-white", border: "border-emerald-800", shadow: "shadow-emerald-800/20" },
];

const QUICK_AMOUNTS = [100, 200, 500, 1000, 5000];

export default function AirtimePage() {
  const [network, setNetwork] = useState<string>("MTN");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Alert Banner State
  const [alertInfo, setAlertInfo] = useState<{type: "error" | "success", title: string, message: string} | null>(null);

  // Modal State (Confirmation -> Loading -> Success)
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    view: "confirm" | "loading" | "success";
  }>({ isOpen: false, view: "confirm" });

  // Fetch balance on load
  const fetchBalance = () => {
    fetch('/api/user/wallet')
      .then(res => res.json())
      .then(data => {
        if (data?.wallet?.balance !== undefined) setBalance(data.wallet.balance);
        else if (data?.balance !== undefined) setBalance(data.balance); 
      })
      .catch(console.error)
      .finally(() => setIsLoadingBalance(false));
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  // Auto-dismiss alerts
  useEffect(() => {
    if (alertInfo) {
      const timer = setTimeout(() => setAlertInfo(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alertInfo]);

  // Smart Network Detection
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setPhone(val);
    
    if (val.length >= 4) {
      const prefix4 = val.substring(0, 4);
      const prefix5 = val.substring(0, 5);
      
      if (["0803","0806","0810","0813","0814","0816","0703","0706","0903","0906","0913","0916","0704"].includes(prefix4) || ["07025","07026"].includes(prefix5)) setNetwork("MTN");
      else if (["0805","0807","0811","0815","0705","0905","0915"].includes(prefix4)) setNetwork("GLO");
      else if (["0802","0808","0812","0701","0708","0902","0907","0901","0912","0911"].includes(prefix4)) setNetwork("AIRTEL");
      else if (["0809","0817","0818","0909","0908"].includes(prefix4)) setNetwork("9MOBILE");
    }
  };

  // Step 1: Pre-flight validation & Open Confirmation Modal
  const handleRechargeInit = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertInfo(null);

    if (phone.length !== 11) {
      setAlertInfo({ type: "error", title: "Invalid Phone", message: "Please enter a valid 11-digit phone number." });
      return;
    }
    if (Number(amount) < 50) {
      setAlertInfo({ type: "error", title: "Invalid Amount", message: "Minimum airtime purchase is ₦50." });
      return;
    }
    if (Number(amount) > Number(balance)) {
      setAlertInfo({ type: "error", title: "Insufficient Balance", message: "Your wallet balance is too low. Please fund your wallet first." });
      return;
    }

    setModalState({ isOpen: true, view: "confirm" });
  };

  // Step 2: Execute actual API call
  const processRecharge = async () => {
    setModalState({ isOpen: true, view: "loading" });

    try {
      const res = await fetch("/api/services/airtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network, phone, amount })
      });

      const data = await res.json();

      if (data.success) {
        setModalState({ isOpen: true, view: "success" });
        fetchBalance(); // Refresh balance
      } else {
        setModalState({ isOpen: false, view: "confirm" });
        setAlertInfo({ type: "error", title: "Recharge Failed", message: data.message || "Failed to process airtime recharge." });
      }
    } catch (err) {
      setModalState({ isOpen: false, view: "confirm" });
      setAlertInfo({ type: "error", title: "Network Error", message: "Network error. Please verify your connection." });
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto p-4 sm:p-6 font-sans select-none relative pb-24">
      
      {/* NAVIGATION & WALLET */}
      <div className="flex items-center justify-between gap-4">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary px-3.5 py-2 rounded-xl cursor-pointer"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-2 bg-secondary/50 border border-border px-4 py-2 rounded-xl">
          <Wallet className="h-4 w-4 text-muted-foreground" weight="fill" />
          <span className="text-sm font-bold text-foreground">
            {isLoadingBalance ? <Spinner className="animate-spin h-3.5 w-3.5" /> : `₦${Number(balance).toLocaleString()}`}
          </span>
        </div>
      </div>

      {/* HEADER SECTION */}
      <div className="flex items-center gap-4 border-b border-border pb-5">
        <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center p-2.5 border border-border shrink-0 shadow-sm">
          <DeviceMobile weight="duotone" className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Airtime Recharge</h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Instantly top up airtime for any network directly from your wallet.</p>
        </div>
      </div>

      {/* RECHARGE FORM */}
      <form onSubmit={handleRechargeInit} className="space-y-6">

        {/* NETWORK SELECTION */}
        <div className="space-y-3">
          <label className="text-sm font-black text-foreground uppercase tracking-wider">Select Network</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {NETWORKS.map((net) => (
              <div 
                key={net.id}
                onClick={() => setNetwork(net.id)}
                className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all duration-200 cursor-pointer 
                  ${network === net.id ? `${net.border} bg-card shadow-md ${net.shadow}` : "border-border bg-secondary/30 hover:border-muted-foreground/30"}`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-xs ${net.color}`}>
                  {net.name.substring(0, 3).toUpperCase()}
                </div>
                <span className={`text-xs font-bold ${network === net.id ? "text-foreground" : "text-muted-foreground"}`}>{net.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* INPUT FIELDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-2 shadow-sm">
            <label htmlFor="phone" className="text-sm font-black text-foreground uppercase tracking-wider">Phone Number</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-muted-foreground font-bold text-sm select-none">☎</span>
              <Input
                id="phone"
                type="text"
                maxLength={11}
                value={phone}
                onChange={handlePhoneChange}
                placeholder="e.g. 08012345678"
                className="pl-10 h-12 text-base font-black bg-secondary/30 border-border text-foreground focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-2 shadow-sm flex flex-col">
            <label htmlFor="amount" className="text-sm font-black text-foreground uppercase tracking-wider">Amount (₦)</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-muted-foreground font-bold text-sm select-none">₦</span>
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                placeholder="50 - 50,000"
                className="pl-10 h-12 text-base font-black bg-secondary/30 border-border text-foreground focus-visible:ring-primary"
              />
            </div>
            
            {/* SMART QUICK AMOUNTS */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
              {QUICK_AMOUNTS.map(amt => (
                <button 
                  key={amt} 
                  type="button" 
                  onClick={() => setAmount(amt.toString())}
                  className="px-3 py-1.5 bg-secondary/50 hover:bg-secondary text-xs font-bold text-muted-foreground hover:text-foreground rounded-lg border border-border transition-colors cursor-pointer"
                >
                  ₦{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button
          type="submit"
          disabled={phone.length !== 11 || !amount}
          className="w-full h-14 font-black bg-foreground text-background hover:opacity-90 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Pay ₦{amount ? Number(amount).toLocaleString() : "0.00"}
        </Button>
      </form>

      {/* SMART SLIDE BANNER ALERTS */}
      {alertInfo && (
        <div className={`fixed bottom-6 right-6 px-5 py-4 rounded-2xl shadow-2xl z-[99999] flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm border 
          ${alertInfo.type === 'error' ? 'bg-red-500 text-white border-red-600' : 'bg-emerald-500 text-white border-emerald-600'}`}
        >
          <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            {alertInfo.type === 'error' ? <WarningCircle weight="fill" className="h-5 w-5" /> : <CheckCircle weight="fill" className="h-5 w-5" />}
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight">{alertInfo.title}</h4>
            <p className="text-xs opacity-90 mt-1 leading-snug">{alertInfo.message}</p>
          </div>
          <button 
            onClick={() => setAlertInfo(null)} 
            className="ml-2 p-1.5 hover:bg-black/20 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* CONFIRMATION & SUCCESS MODAL */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {modalState.view === "confirm" && (
              <div className="p-6 text-center space-y-4">
                <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
                  <WarningCircle className="h-8 w-8" weight="fill" />
                </div>
                <h3 className="text-xl font-black text-foreground">Confirm Recharge</h3>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                  You are about to purchase <strong>₦{Number(amount).toLocaleString()}</strong> airtime for <strong className="text-foreground">{phone}</strong> on <strong>{network}</strong>.
                </p>
                
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold bg-secondary" onClick={() => setModalState({ isOpen: false, view: "confirm" })}>Cancel</Button>
                  <Button className="flex-1 rounded-xl h-12 font-bold bg-primary text-primary-foreground hover:bg-primary/90" onClick={processRecharge}>Confirm & Pay</Button>
                </div>
              </div>
            )}

            {modalState.view === "loading" && (
              <div className="p-10 text-center flex flex-col items-center justify-center space-y-4">
                <Spinner className="h-10 w-10 text-primary animate-spin" weight="bold" />
                <p className="text-sm font-bold text-muted-foreground animate-pulse">Processing transaction...</p>
              </div>
            )}

            {modalState.view === "success" && (
              <div className="p-6 text-center space-y-4">
                <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="h-8 w-8" weight="fill" />
                </div>
                <h3 className="text-xl font-black text-foreground">Recharge Successful!</h3>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                  Your line <strong className="text-foreground">{phone}</strong> has been credited with <strong>₦{Number(amount).toLocaleString()}</strong>.
                </p>
                
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Link href="/dashboard" className="flex-1 flex items-center justify-center bg-secondary hover:bg-secondary/80 text-foreground rounded-xl h-12 font-bold text-sm transition-colors border border-border">
                    Back Home
                  </Link>
                  <Button className="flex-1 rounded-xl h-12 font-bold bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
                    setModalState({ isOpen: false, view: "confirm" });
                    setPhone("");
                    setAmount("");
                  }}>
                    Buy More
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
