"use client";

import Image from "next/image";
import { CheckCircle, DownloadSimple, ShareNetwork, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface ReceiptCardProps {
  transaction: {
    network: string;
    phone: string;
    amount: number;
    date: Date;
    reference: string;
  };
  onNewTransaction: () => void;
}

export default function ReceiptCard({ transaction, onNewTransaction }: ReceiptCardProps) {
  const logoMap: Record<string, string> = {
    MTN: "/mtn.png",
    AIRTEL: "/airtel.png",
    GLO: "/glo.png",
    "9MOBILE": "/9mobile.png",
  };

  return (
    <div className="bg-card border border-border p-1 rounded-3xl shadow-xl max-w-sm mx-auto animate-in zoom-in-95 duration-500">
      <div className="bg-secondary/20 p-6 rounded-[22px] border border-dashed border-border flex flex-col items-center">
        
        <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={40} weight="fill" className="text-emerald-500 drop-shadow-md" />
        </div>
        
        <h3 className="font-black text-2xl text-foreground mb-1">Transaction Successful</h3>
        <p className="text-muted-foreground text-sm font-medium mb-6">Your airtime has been delivered.</p>

        <div className="w-full bg-background rounded-2xl p-5 shadow-sm space-y-4 relative border border-border">
          {/* Decorative receipt cuts */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-secondary/20 rounded-full border-r border-border" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-secondary/20 rounded-full border-l border-border" />

          <div className="flex justify-between items-center pb-4 border-b border-dashed border-border">
            <span className="text-xs font-bold text-muted-foreground uppercase">Amount Paid</span>
            <span className="text-xl font-black text-foreground">₦{transaction.amount.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase">Network</span>
            <Image src={logoMap[transaction.network]} alt={transaction.network} width={30} height={30} className="object-contain" />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase">Phone Number</span>
            <span className="text-sm font-bold text-foreground">{transaction.phone}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase">Date</span>
            <span className="text-sm font-bold text-foreground">
              {transaction.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs font-bold text-muted-foreground uppercase">Reference</span>
            <span className="text-[10px] font-black text-muted-foreground bg-secondary px-2 py-1 rounded">{transaction.reference}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full mt-6">
          <Button variant="outline" className="w-full font-bold border-border shadow-sm flex gap-2">
            <DownloadSimple weight="bold" /> Save
          </Button>
          <Button variant="outline" className="w-full font-bold border-border shadow-sm flex gap-2">
            <ShareNetwork weight="bold" /> Share
          </Button>
        </div>

        <Button onClick={onNewTransaction} className="w-full mt-3 font-black h-12 rounded-xl flex gap-2 bg-primary hover:opacity-90 text-primary-foreground">
          <Plus weight="bold" /> Buy Airtime Again
        </Button>

      </div>
    </div>
  );
}
