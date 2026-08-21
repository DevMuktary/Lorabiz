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

  // ✅ native mobile share functionality
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LoraBiz Airtime Receipt',
          text: `Airtime Purchase Successful ✅\nNetwork: ${transaction.network}\nPhone: ${transaction.phone}\nAmount: ₦${transaction.amount.toLocaleString()}\nRef: ${transaction.reference}\nDate: ${transaction.date.toLocaleString()}`,
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      alert("Sharing is not supported on this device/browser.");
    }
  };

  // ✅ Triggers native Save as PDF / Print dialog
  const handleSave = () => {
    window.print();
  };

  return (
    <>
      {/* Print Styles injected locally so it only prints the receipt nicely */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-receipt, #printable-receipt * { visibility: visible; }
          #printable-receipt { position: fixed; left: 0; top: 0; width: 100%; border: none; box-shadow: none; z-index: 999999; }
          .no-print { display: none !important; }
        }
      `}} />

      <div 
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/98 dark:bg-background/98 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200"
        onClick={onNewTransaction}
      >
        <div 
          id="printable-receipt" 
          className="bg-card text-card-foreground border border-border p-1 rounded-3xl shadow-2xl max-w-sm w-full mx-auto animate-in zoom-in-95 duration-300 my-auto text-left relative"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-secondary/20 p-6 rounded-[22px] border border-dashed border-border flex flex-col items-center">
            
            <div className="h-16 w-16 bg-emerald-500/15 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={44} weight="fill" className="drop-shadow-md" />
            </div>
            
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">
              Transaction Successful
            </span>
            <h3 className="font-black text-2xl text-foreground mb-1 text-center">Airtime Delivered</h3>
            <p className="text-muted-foreground text-xs font-medium mb-5 text-center">Your line has been credited successfully.</p>

            <div className="w-full bg-background rounded-2xl p-5 shadow-sm space-y-3.5 relative border border-border">
              {/* Decorative receipt cuts */}
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-secondary/20 rounded-full border-r border-border" />
              <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-secondary/20 rounded-full border-l border-border" />

              <div className="flex justify-between items-center pb-3.5 border-b border-dashed border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase">Amount Paid</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">₦{transaction.amount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">Network</span>
                <div className="flex items-center gap-1.5">
                  <Image src={logoMap[transaction.network] || "/mtn.png"} alt={transaction.network} width={22} height={22} className="object-contain" />
                  <span className="text-xs font-black text-foreground">{transaction.network}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">Recipient Phone</span>
                <span className="text-sm font-mono font-bold text-foreground">{transaction.phone}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">Date &amp; Time</span>
                <span className="text-xs font-bold text-foreground">
                  {transaction.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-border/60">
                <span className="text-xs font-bold text-muted-foreground uppercase">Reference</span>
                <span className="text-[10px] font-mono font-bold text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded">{transaction.reference}</span>
              </div>
            </div>

            {/* Action Buttons (Hidden during print) */}
            <div className="grid grid-cols-2 gap-3 w-full mt-5 no-print">
              <Button onClick={handleSave} variant="outline" className="w-full font-bold border-border shadow-sm flex gap-2 cursor-pointer h-10 text-xs">
                <DownloadSimple weight="bold" size={16} /> Save / Print
              </Button>
              <Button onClick={handleShare} variant="outline" className="w-full font-bold border-border shadow-sm flex gap-2 cursor-pointer h-10 text-xs">
                <ShareNetwork weight="bold" size={16} /> Share
              </Button>
            </div>

            <Button onClick={onNewTransaction} className="w-full mt-3 font-black h-11 rounded-xl flex gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer no-print text-xs shadow-md shadow-emerald-600/20">
              <Plus weight="bold" size={16} /> Buy Airtime Again
            </Button>

          </div>
        </div>
      </div>
    </>
  );
}
