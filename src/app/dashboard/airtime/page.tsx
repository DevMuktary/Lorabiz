"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, DeviceMobile, WarningCircle, 
  CheckCircle, Spinner, Wallet
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NETWORKS = [
  { id: "MTN", name: "MTN", color: "bg-yellow-400 text-black", border: "border-yellow-400", shadow: "shadow-yellow-400/20" },
  { id: "AIRTEL", name: "Airtel", color: "bg-red-500 text-white", border: "border-red-500", shadow: "shadow-red-500/20" },
  { id: "GLO", name: "Glo", color: "bg-green-500 text-white", border: "border-green-500", shadow: "shadow-green-500/20" },
  { id: "9MOBILE", name: "9Mobile", color: "bg-emerald-800 text-white", border: "border-emerald-800", shadow: "shadow-emerald-800/20" },
];

export default function AirtimePage() {
  const [network, setNetwork] = useState<string>("MTN");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

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

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (phone.length !== 11) {
      setError("Please enter a valid 11-digit phone number.");
      return;
    }
    if (Number(amount) < 50) {
      setError("Minimum airtime purchase is ₦50.");
      return;
    }
    if (Number(amount) > Number(balance)) {
      setError("Insufficient wallet balance. Please fund your wallet first.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/services/airtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network, phone, amount })
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg(data.message);
        setPhone("");
        setAmount("");
        fetchBalance(); // Refresh balance after successful debit
      } else {
        setError(data.message || "Failed to process airtime recharge.");
      }
    } catch (err) {
      setError("Network error. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto p-4 sm:p-6 font-sans select-none relative pb-24">
      
      {/* NAVIGATION */}
      <div className="flex items-center justify-between gap-4">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary px-3.5 py-2 rounded-xl cursor-pointer"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* WALLET BALANCE BADGE */}
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
      <form onSubmit={handleRecharge} className="space-y-6">
        
        {/* MESSAGES */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-destructive text-sm font-bold flex items-center gap-2.5 animate-in shake">
            <WarningCircle weight="fill" size={20} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle weight="fill" size={20} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

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
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 08012345678"
                className="pl-10 h-12 text-base font-black bg-secondary/30 border-border text-foreground focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-2 shadow-sm">
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
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || phone.length !== 11 || !amount}
          className="w-full h-14 font-black bg-foreground text-background hover:opacity-90 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <Spinner className="animate-spin h-5 w-5" weight="bold" />
          ) : (
            <>Pay ₦{amount ? Number(amount).toLocaleString() : "0.00"}</>
          )}
        </Button>

      </form>
    </div>
  );
}
