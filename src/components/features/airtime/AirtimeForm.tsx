// src/components/features/airtime/AirtimeForm.tsx
"use client";

import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import { Phone, CurrencyNgn, Lightning, WarningCircle, Check, Gift, Sparkle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NETWORKS = [
  { id: "MTN", name: "MTN", logo: "/mtn.png", color: "border-yellow-400 bg-yellow-400/10 shadow-amber-500/20" },
  { id: "AIRTEL", name: "Airtel", logo: "/airtel.png", color: "border-red-500 bg-red-500/10 shadow-rose-500/20" },
  { id: "GLO", name: "Glo", logo: "/glo.png", color: "border-green-500 bg-green-500/10 shadow-emerald-500/20" },
  { id: "9MOBILE", name: "9mobile", logo: "/9mobile.png", color: "border-emerald-700 bg-emerald-700/10 shadow-emerald-700/20" },
];

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

interface AirtimeFormProps {
  onSubmit: (data: { network: string; phone: string; amount: number }) => void;
  disabled: boolean;
  availableAirtimeDiscount?: number;
  useRewardDiscount?: boolean;
  onToggleRewardDiscount?: (use: boolean) => void;
}

export default function AirtimeForm({ 
  onSubmit, 
  disabled,
  availableAirtimeDiscount = 0,
  useRewardDiscount = true,
  onToggleRewardDiscount,
}: AirtimeFormProps) {
  const [network, setNetwork] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const cleanPhone = phone.replace(/\s+/g, "").replace(/^\+234/, "0");

  // Auto-detect network provider from prefix
  useEffect(() => {
    if (cleanPhone.length >= 4 && !network) {
      const prefix = cleanPhone.slice(0, 4);
      const mtnPrefixes = ["0803", "0806", "0703", "0706", "0813", "0816", "0810", "0814", "0903", "0906", "0913", "0916"];
      const airtelPrefixes = ["0802", "0808", "0708", "0812", "0701", "0902", "0901", "0904", "0907", "0912", "0911"];
      const gloPrefixes = ["0805", "0807", "0705", "0815", "0811", "0905", "0915"];
      const nineMobilePrefixes = ["0809", "0818", "0817", "0909", "0908"];

      if (mtnPrefixes.includes(prefix)) setNetwork("MTN");
      else if (airtelPrefixes.includes(prefix)) setNetwork("AIRTEL");
      else if (gloPrefixes.includes(prefix)) setNetwork("GLO");
      else if (nineMobilePrefixes.includes(prefix)) setNetwork("9MOBILE");
    }
  }, [cleanPhone, network]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!network) return setError("Please select a network provider.");
    if (cleanPhone.length !== 11) return setError("Please enter a valid 11-digit phone number (e.g. 08012345678).");
    
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 50) return setError("Minimum airtime amount is ₦50.");
    if (numAmount > 10000) return setError("Maximum airtime recharge is ₦10,000 per transaction.");

    onSubmit({ network, phone: cleanPhone, amount: numAmount });
  };

  const numAmount = Number(amount) || 0;
  const isVoucherActive = useRewardDiscount && availableAirtimeDiscount > 0;
  const currentDiscount = isVoucherActive ? Math.min(numAmount, availableAirtimeDiscount) : 0;
  const currentPayable = Math.max(0, numAmount - currentDiscount);

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border p-5 sm:p-7 rounded-3xl shadow-sm space-y-6">
      
      {/* Network Selector */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>1. Select Network Provider <span className="text-destructive">*</span></span>
          {network && (
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              Selected: {network}
            </span>
          )}
        </label>
        
        <div className="grid grid-cols-4 gap-2.5">
          {NETWORKS.map((net) => {
            const isSelected = network === net.id;
            return (
              <button
                key={net.id}
                type="button"
                onClick={() => {
                  setNetwork(net.id);
                  if (error) setError(null);
                }}
                className={`relative h-16 rounded-2xl border-2 transition-all flex flex-col items-center justify-center p-2 overflow-hidden cursor-pointer ${
                  isSelected 
                    ? `${net.color} shadow-md scale-[1.02]` 
                    : "border-border hover:border-primary/40 bg-secondary/30 grayscale opacity-75 hover:grayscale-0 hover:opacity-100"
                }`}
              >
                <Image src={net.logo} alt={net.name} width={34} height={34} className="object-contain" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        
        {/* Phone Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Phone size={15} weight="bold" />
              <span>Recipient Phone Number <span className="text-destructive">*</span></span>
            </span>
            <span className="font-mono text-[11px]">{cleanPhone.length}/11</span>
          </label>
          <Input 
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (error) setError(null);
            }}
            placeholder="08012345678"
            maxLength={14}
            className="h-12 bg-background rounded-xl font-mono text-base sm:text-sm tracking-wide border focus-visible:ring-emerald-500/50"
          />
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CurrencyNgn size={16} weight="bold" />
              <span>Recharge Amount (₦50 – ₦10,000) <span className="text-destructive">*</span></span>
            </span>
          </label>
          
          <Input 
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. 1000"
            min={50}
            max={10000}
            className="h-12 bg-background rounded-xl font-bold text-base sm:text-sm border focus-visible:ring-emerald-500/50"
          />

          {/* Quick Amount Pills with PalmPay/OPay Price Slashes */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
            {QUICK_AMOUNTS.map((val) => {
              const isSelected = amount === val.toString();
              const pillDiscount = isVoucherActive ? Math.min(val, availableAirtimeDiscount) : 0;
              const pillPayable = Math.max(0, val - pillDiscount);

              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setAmount(val.toString());
                    if (error) setError(null);
                  }}
                  className={`py-2 px-2 rounded-xl text-center transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]"
                      : isVoucherActive
                      ? "bg-emerald-500/5 hover:bg-emerald-500/15 border-emerald-500/25 text-foreground"
                      : "bg-secondary hover:bg-secondary/80 border-border text-foreground"
                  }`}
                >
                  {isVoucherActive ? (
                    <>
                      <span className={`text-[10px] line-through ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>
                        ₦{val.toLocaleString()}
                      </span>
                      <span className="font-black text-xs">
                        {pillPayable === 0 ? "₦0 Free" : `₦${pillPayable.toLocaleString()}`}
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-xs">
                      ₦{val.toLocaleString()}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* PalmPay / OPay Style Voucher Selector Row */}
        {availableAirtimeDiscount > 0 && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 sm:p-3.5 transition-all">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0">
                  <Gift size={18} weight="fill" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-foreground">Airtime Voucher</span>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                      -₦{availableAirtimeDiscount.toLocaleString()} OFF
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {useRewardDiscount
                      ? `Applied! Saving ₦${Math.min(numAmount || availableAirtimeDiscount, availableAirtimeDiscount).toLocaleString()}`
                      : "Voucher available. Click toggle to apply to this order."}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => onToggleRewardDiscount?.(!useRewardDiscount)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  useRewardDiscount ? "bg-emerald-600" : "bg-muted-foreground/30"
                }`}
                title={useRewardDiscount ? "Remove Voucher" : "Apply Voucher"}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    useRewardDiscount ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Animated Error Slide-In */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-1">
          <WarningCircle size={17} weight="fill" className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button with Live Price Slashes */}
      <Button 
        type="submit" 
        disabled={disabled || !network || cleanPhone.length !== 11 || !amount}
        className="w-full h-12 rounded-xl font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
      >
        <Lightning size={18} weight="fill" />
        {numAmount > 0 && currentDiscount > 0 ? (
          currentPayable === 0 ? (
            <span>Recharge ₦{numAmount.toLocaleString()} Airtime (₦0.00 Free!)</span>
          ) : (
            <span className="flex items-center gap-2">
              <span>Recharge Airtime (Pay ₦{currentPayable.toLocaleString()})</span>
              <span className="text-xs opacity-75 line-through">₦{numAmount.toLocaleString()}</span>
            </span>
          )
        ) : (
          <span>{amount ? `Recharge ₦${Number(amount).toLocaleString()} Airtime` : "Buy Airtime"}</span>
        )}
      </Button>

    </form>
  );
}
