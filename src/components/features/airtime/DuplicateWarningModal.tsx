"use client";

import { useEffect, useState } from "react";
import { Warning, ClockCounterClockwise, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface DuplicateWarningModalProps {
  isOpen: boolean;
  phone: string;
  amount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DuplicateWarningModal({ isOpen, phone, amount, onConfirm, onCancel }: DuplicateWarningModalProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (isOpen) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-card border-2 border-amber-500/50 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 p-6 relative">
        <button onClick={onCancel} className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-secondary rounded-full">
          <X weight="bold" />
        </button>

        <div className="flex flex-col items-center text-center mt-4 mb-6">
          <div className="h-20 w-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <Warning size={40} weight="fill" />
          </div>
          <h3 className="text-2xl font-black text-foreground">Duplicate Alert</h3>
          <p className="text-muted-foreground mt-2 font-medium">
            You recently bought <strong className="text-foreground">₦{amount}</strong> for <strong className="text-foreground">{phone}</strong> less than 10 minutes ago.
          </p>
        </div>

        <div className="bg-secondary/50 p-4 rounded-xl flex items-center gap-3 mb-6">
          <ClockCounterClockwise size={24} className="text-primary shrink-0" weight="bold" />
          <p className="text-xs font-bold text-muted-foreground">Are you sure you want to repeat this exact transaction? This might result in a double charge.</p>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            onClick={onConfirm} 
            disabled={countdown > 0}
            className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {countdown > 0 ? `Please wait... (${countdown}s)` : "Yes, I am sure (Buy Again)"}
          </Button>
          <Button 
            onClick={onCancel} 
            variant="outline"
            className="w-full h-14 font-bold rounded-xl border-border hover:bg-secondary cursor-pointer"
          >
            No, cancel this
          </Button>
        </div>
      </div>
    </div>
  );
}
