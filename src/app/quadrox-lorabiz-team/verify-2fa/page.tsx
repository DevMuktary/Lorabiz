"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ShieldCheck, LockKeyOpen, Spinner, WarningCircle, 
  ArrowClockwise, Shield
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Verify2FAContent() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const userRole = (session?.user as any)?.role || "STAFF";
  const callbackUrl = searchParams.get("callbackUrl") || 
    (userRole === "ADMIN" ? "/quadrox-lorabiz-team/mds/dashboard" : "/quadrox-lorabiz-team/staff/dashboard");

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const triggerEmailDispatch = async () => {
      if ((session?.user as any)?.twoFactorEnabled && !message) {
        try {
          await fetch("/api/auth/2fa/send-otp", { method: "POST" });
        } catch (err) {
          console.error("OTP dispatch error", err);
        }
      }
    };
    if (session?.user) triggerEmailDispatch();
  }, [session]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error("Verification failed.");
      await update({ mfaVerified: true });
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError("Invalid code. Please check your app or email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/auth/2fa/send-otp", { method: "POST" });
      if (!res.ok) throw new Error("Failed to send code.");
      setMessage("A fresh code has been sent to your email.");
    } catch (err: any) {
      setError("Could not resend code. Try again later.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 p-6 font-sans selection:bg-teal-500 selection:text-black">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[80px] pointer-events-none bg-teal-500/10" />

        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <Image src="/logo.png" alt="Logo" width={160} height={50} className="object-contain h-10 w-auto brightness-200 mb-6" />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-900/30 border border-teal-800/50 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Shield weight="bold" className="h-3.5 w-3.5" /> Identity Verification
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Enter Security Code</h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">Please enter the 6-digit verification code from your security app or email.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-400 text-xs font-medium animate-in shake">
            <WarningCircle weight="fill" className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-emerald-400 text-xs font-medium animate-in fade-in">
            <ShieldCheck weight="fill" className="h-4.5 w-4.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <Input type="text" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" autoFocus className="h-14 text-center tracking-[0.55em] font-mono text-2xl bg-slate-950 border-slate-800 text-white focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:border-teal-500 max-w-[240px] mx-auto block shadow-inner" />
          </div>

          <Button type="submit" disabled={loading || code.length !== 6} className="w-full h-12 font-semibold bg-teal-500 hover:bg-teal-400 text-black shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2">
            {loading ? <Spinner className="animate-spin h-5 w-5 text-black" /> : <>Confirm Identity <LockKeyOpen weight="bold" className="h-4.5 w-4.5" /></>}
          </Button>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Didn't receive a code?</span>
            <button type="button" onClick={handleResendOtp} disabled={resendLoading} className="font-medium flex items-center gap-1.5 hover:underline focus:outline-none cursor-pointer text-teal-400">
              {resendLoading ? <Spinner className="animate-spin h-3.5 w-3.5" /> : <ArrowClockwise className="h-3.5 w-3.5" />}
              <span>Resend</span>
            </button>
          </div>
        </form>

        <div className="mt-8 text-center relative z-10">
          <p className="text-[10px] tracking-widest text-slate-600 uppercase font-semibold">Security checkpoint</p>
        </div>
      </div>
    </div>
  );
}

export default function Verify2FAPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center bg-slate-950"><Spinner className="animate-spin h-8 w-8 text-teal-500" weight="bold" /></div>}>
      <Verify2FAContent />
    </Suspense>
  );
}
