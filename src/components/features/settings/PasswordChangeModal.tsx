"use client";

import { useState } from "react";
import { X, LockKey, Spinner } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PasswordChangeModal({ isOpen, onClose, onSuccess }: PasswordChangeModalProps) {
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"INPUT" | "VERIFY">("INPUT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestOtp = async () => {
    if (!current || !newPwd || !confirm) return setError("Fill all password fields.");
    if (newPwd !== confirm) return setError("New passwords do not match.");
    if (newPwd.length < 8) return setError("Password must be at least 8 characters.");

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/security/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND_OTP", currentPassword: current })
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
    if (otpCode.length < 6) return setError("Enter the 6-digit verification code.");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/security/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VERIFY_OTP", newPassword: newPwd, otpCode })
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
            <LockKey className="h-5 w-5 text-red-500" weight="fill" />
            <h3 className="font-black text-base text-foreground">Change Password</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} weight="bold" /></button>
        </div>

        {error && <p className="text-xs font-bold text-red-500 bg-red-500/10 p-3 rounded-xl">{error}</p>}

        {step === "INPUT" ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-muted-foreground">Current Password</label>
              <Input type="password" value={current} onChange={e => setCurrent(e.target.value)} className="h-11 bg-secondary/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-muted-foreground">New Password</label>
              <Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="h-11 bg-secondary/50" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-muted-foreground">Confirm New Password</label>
              <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="h-11 bg-secondary/50" />
            </div>
            <button onClick={handleRequestOtp} disabled={loading} className="w-full h-11 bg-red-600 text-white font-bold rounded-xl text-sm flex items-center justify-center disabled:opacity-50 mt-2">
              {loading ? <Spinner className="animate-spin h-5 w-5" /> : "Continue"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-bold text-center text-muted-foreground">Enter the verification code sent to your email</p>
            <Input maxLength={6} placeholder="000000" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ""))} className="h-12 text-center text-xl tracking-[8px] font-black" />
            <div className="flex gap-2">
              <button onClick={() => setStep("INPUT")} className="flex-1 h-11 bg-secondary font-bold rounded-xl text-sm">Back</button>
              <button onClick={handleVerifyOtp} disabled={loading || otpCode.length < 6} className="flex-1 h-11 bg-red-600 text-white font-bold rounded-xl text-sm flex items-center justify-center disabled:opacity-50">
                {loading ? <Spinner className="animate-spin h-5 w-5" /> : "Update Password"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
