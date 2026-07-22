"use client";

import Image from "next/image";
import { useState } from "react";
import { Phone, CurrencyNgn, Lightning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NETWORKS = [
  { id: "MTN", logo: "/mtn.png", color: "border-yellow-400 bg-yellow-400/10" },
  { id: "AIRTEL", logo: "/airtel.png", color: "border-red-500 bg-red-500/10" },
  { id: "GLO", logo: "/glo.png", color: "border-green-500 bg-green-500/10" },
  { id: "9MOBILE", logo: "/9mobile.png", color: "border-emerald-700 bg-emerald-700/10" },
];

interface AirtimeFormProps {
  onSubmit: (data: { network: string; phone: string; amount: number }) => void;
  disabled: boolean;
}

export default function AirtimeForm({ onSubmit, disabled }: AirtimeFormProps) {
  const [network, setNetwork] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!network) return setError("Please select a network provider.");
    if (phone.length < 10) return setError("Please enter a valid phone number.");
    if (!amount || Number(amount) < 50) return setError("Minimum airtime amount is ₦50.");

    onSubmit({ network, phone, amount: Number(amount) });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-6">
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 block">Select Network</label>
        <div className="grid grid-cols-4 gap-3">
          {NETWORKS.map((net) => (
            <button
              key={net.id}
              type="button"
              onClick={() => setNetwork(net.id)}
              className={`relative h-16 rounded-xl border-2 transition-all flex items-center justify-center overflow-hidden cursor-pointer ${
                network === net.id ? net.color : "border-border hover:border-primary/50 bg-secondary/50 grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
              }`}
            >
              <Image src={net.logo} alt={net.id} width={40} height={40} className="object-contain" />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} weight="fill" />
            <Input 
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="08012345678"
              maxLength={11}
              className="pl-11 h-14 bg-secondary/30 rounded-xl font-bold text-lg border-2 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Amount</label>
          <div className="relative">
            <CurrencyNgn className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} weight="bold" />
            <Input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="pl-11 h-14 bg-secondary/30 rounded-xl font-bold text-lg border-2 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm font-bold text-destructive bg-destructive/10 p-3 rounded-xl">{error}</p>}

      <Button 
        type="submit" 
        disabled={disabled}
        className="w-full h-14 rounded-xl font-black text-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
      >
        <Lightning size={24} weight="fill" />
        Buy Airtime
      </Button>
    </form>
  );
}
