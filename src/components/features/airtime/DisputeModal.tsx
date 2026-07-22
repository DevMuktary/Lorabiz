"use client";

import { useState } from "react";
import { X, WarningCircle, EnvelopeSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    reference: string;
    phone: string;
    amount: number;
    network: string;
    date: Date;
  } | null;
}

const ISSUES = [
  "Airtime not received after deduction",
  "Wrong amount was credited",
  "I was charged twice for this",
  "Other issue"
];

export default function DisputeModal({ isOpen, onClose, transaction }: DisputeModalProps) {
  const [selectedIssue, setSelectedIssue] = useState<string>(ISSUES[0]);
  const [customNote, setCustomNote] = useState("");

  if (!isOpen || !transaction) return null;

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Dispute Transaction: ${transaction.reference}`);
    const body = encodeURIComponent(
      `Hello LoraBiz Support,\n\nI am reporting an issue with a recent airtime transaction.\n\n` +
      `--- Transaction Details ---\n` +
      `Reference: ${transaction.reference}\n` +
      `Network: ${transaction.network}\n` +
      `Phone Number: ${transaction.phone}\n` +
      `Amount: ₦${transaction.amount}\n` +
      `Date: ${transaction.date.toLocaleString()}\n\n` +
      `--- Issue Reported ---\n` +
      `${selectedIssue}\n` +
      (customNote ? `Additional Note: ${customNote}\n\n` : `\n`) +
      `Please look into this and get back to me.\n\nThank you.`
    );

    window.location.href = `mailto:bill-support@lorabiz.com?subject=${subject}&body=${body}`;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-card border border-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 p-6 relative">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors cursor-pointer">
          <X weight="bold" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
            <WarningCircle size={24} weight="fill" />
          </div>
          <div>
            <h3 className="text-xl font-black text-foreground">Report an Issue</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ref: {transaction.reference}</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What went wrong?</label>
          <div className="space-y-2">
            {ISSUES.map((issue) => (
              <label 
                key={issue} 
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedIssue === issue ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <input 
                  type="radio" 
                  name="issue" 
                  value={issue}
                  checked={selectedIssue === issue}
                  onChange={(e) => setSelectedIssue(e.target.value)}
                  className="w-4 h-4 text-primary accent-primary"
                />
                <span className={`text-sm font-bold ${selectedIssue === issue ? "text-foreground" : "text-muted-foreground"}`}>
                  {issue}
                </span>
              </label>
            ))}
          </div>

          <textarea 
            placeholder="Add any extra details... (Optional)"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="w-full bg-secondary/30 border-2 border-border rounded-xl p-3 text-sm font-medium focus-visible:ring-primary focus-visible:outline-none min-h-[80px]"
          />
        </div>

        <Button 
          onClick={handleSendEmail} 
          className="w-full h-14 bg-foreground hover:bg-foreground/90 text-background font-black rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <EnvelopeSimple size={20} weight="bold" />
          Open Email Client
        </Button>
      </div>
    </div>
  );
}
