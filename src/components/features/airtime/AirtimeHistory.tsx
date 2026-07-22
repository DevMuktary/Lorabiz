"use client";

import Image from "next/image";
import { useState } from "react";
import { CaretLeft, CaretRight, WarningCircle, Receipt } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface Transaction {
  reference: string;
  phone: string;
  amount: number;
  network: string;
  date: Date;
}

interface AirtimeHistoryProps {
  history: Transaction[];
  onDispute: (transaction: Transaction) => void;
}

export default function AirtimeHistory({ history, onDispute }: AirtimeHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(history.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = history.slice(startIndex, startIndex + itemsPerPage);

  const logoMap: Record<string, string> = {
    MTN: "/mtn.png",
    AIRTEL: "/airtel.png",
    GLO: "/glo.png",
    "9MOBILE": "/9mobile.png",
  };

  if (history.length === 0) {
    return (
      <div className="bg-card border border-border p-10 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm">
        <Receipt size={48} className="text-muted-foreground/30 mb-4" weight="duotone" />
        <h4 className="text-lg font-black text-foreground">No Transactions Yet</h4>
        <p className="text-sm text-muted-foreground font-medium mt-1">Your recent airtime purchases will appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-border bg-secondary/20">
        <h3 className="font-black text-lg text-foreground">Recent Transactions</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-secondary/10 border-b border-border text-xs uppercase tracking-widest text-muted-foreground font-bold">
              <th className="p-4 pl-6">Network</th>
              <th className="p-4">Number</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Date & Time</th>
              <th className="p-4 pr-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {currentItems.map((tx) => (
              <tr key={tx.reference} className="hover:bg-secondary/10 transition-colors">
                <td className="p-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-background rounded-full border border-border flex items-center justify-center p-1.5 shrink-0 shadow-sm">
                      <Image src={logoMap[tx.network] || "/mtn.png"} alt={tx.network} width={24} height={24} className="object-contain" />
                    </div>
                    <span className="font-bold text-sm text-foreground">{tx.network}</span>
                  </div>
                </td>
                <td className="p-4 text-sm font-bold text-foreground">{tx.phone}</td>
                <td className="p-4 text-sm font-black text-foreground">₦{tx.amount.toLocaleString()}</td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">{tx.date.toLocaleDateString()}</span>
                    <span className="text-xs text-muted-foreground font-medium">{tx.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </td>
                <td className="p-4 pr-6 text-right">
                  <button 
                    onClick={() => onDispute(tx)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-foreground hover:bg-destructive/10 hover:text-destructive text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <WarningCircle size={14} weight="bold" /> Dispute
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-border flex items-center justify-between bg-secondary/10">
          <p className="text-xs font-bold text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-2 rounded-lg cursor-pointer"
            >
              <CaretLeft weight="bold" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-2 rounded-lg cursor-pointer"
            >
              <CaretRight weight="bold" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
