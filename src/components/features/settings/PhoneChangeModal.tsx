"use client";

import { useState } from "react";
import { X, ShieldCheck, Spinner } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";

interface PhoneChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhone: string;
  onSuccess: () => void;
}

export default function PhoneChangeModal({ isOpen, onClose, currentPhone, onSuccess }: PhoneChangeModalProps) {
  const [newPhone, setNewPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"INPUT" | "VERIFY">("INPUT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestOtp = async () => {
    if (!newPhone || newPhone === currentPhone) return setError("Enter a new valid number.");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/security/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND_OTP", newPhone })
      });
      const data = await res.json();
      if (data.success) setStep("VERIFY");
      else setError(data.message);
    } catch (err) {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 6) return setError("Enter the full 6-digit code.");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/security/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VERIFY_OTP", newPhone, otpCode })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else setError(data.message);
    } catch (err) {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" weight="fill" />
            <h3 className="font-black text-base text-foreground">Change Phone Number</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} weight="bold" /></button>
        </div>

        {error && <p className="text-xs font-bold text-red-500 bg-red-500/10 p-3 rounded-xl">{error}</p>}

        {step === "INPUT" ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-muted-foreground">New Phone Number</label>
              <Input placeholder="e.g. 08012345678" value={newPhone} onChange={e => setNewPhone(e.target.value.replace(/\D/g, ""))} className="h-11 bg-secondary/50 font-bold" />
            </div>
            <button onClick={handleRequestOtp} disabled={loading || !newPhone} className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl text-sm flex items-center justify-center disabled:opacity-50">
              {loading ? <Spinner className="animate-spin h-5 w-5" /> : "Send Verification Code"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-bold text-center text-muted-foreground">Enter the 6-digit code sent to your email</p>
            <Input maxLength={6} placeholder="000000" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))} className="h-12 text-center text-xl tracking-[8px] font-black" />
            <div className="flex gap-2">
              <button onClick={() => setStep("INPUT")} className="flex-1 h-11 bg-secondary font-bold rounded-xl text-sm">Back</button>
              <button onClick={handleVerifyOtp} disabled={loading || otpCode.length < 6} className="flex-1 h-11 bg-primary text-primary-foreground font-bold rounded-xl text-sm flex items-center justify-center disabled:opacity-50">
                {loading ? <Spinner className="animate-spin h-5 w-5" /> : "Confirm"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
