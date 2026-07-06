"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ShieldCheck, EnvelopeSimple, DeviceMobileCamera, Spinner, 
  CheckCircle, WarningCircle
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Setup2FAContent() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || 
    ((session?.user as any)?.role === "ADMIN" ? "/quadrox-lorabiz-team/mds" : "/quadrox-lorabiz-team/staff");

  const [method, setMethod] = useState<"EMAIL" | "AUTHENTICATOR">("EMAIL");
  const [step, setStep] = useState<"SELECT" | "VERIFY">("SELECT");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secretKey, setSecretKey] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInitiateSetup = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize security method.");

      if (method === "AUTHENTICATOR") {
        setQrCodeUrl(data.qrCode);
        setSecretKey(data.secret);
      }
      setStep("VERIFY");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during security initialization.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setError("Please input a valid 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/2fa/confirm-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode, method }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid confirmation code provided.");

      await update({ mfaVerified: true, twoFactorEnabled: true });
      router.push(callbackUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Verification failed. Please check your code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-slate-100 p-6 font-sans selection:bg-amber-500 selection:text-black">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <Image 
            src="/logo.png" 
            alt="LoraBiz Logo" 
            width={180} 
            height={60} 
            className="object-contain h-12 w-auto brightness-200 mb-6"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/50 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck weight="bold" className="h-4 w-4" /> Mandatory Security Enrollment
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Configure Multi-Factor Authentication
          </h1>
          <p className="text-sm text-slate-400 mt-2 max-w-md leading-relaxed">
            To protect executive and operational dashboards, authorized personnel must enroll in two-step cryptographic verification.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 text-sm animate-in fade-in">
            <WarningCircle weight="fill" className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* PHASE 1: CHOOSE MFA METHOD */}
        {step === "SELECT" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMethod("EMAIL")}
                className={`p-5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  method === "EMAIL"
                    ? "bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/20"
                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <EnvelopeSimple weight="bold" className="h-6 w-6" />
                  </div>
                  {method === "EMAIL" && <CheckCircle weight="fill" className="h-5 w-5 text-amber-400" />}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">Email Dispatch (OTP)</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">
                    Receive a short-lived 6-digit verification code via your assigned corporate email address.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod("AUTHENTICATOR")}
                className={`p-5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  method === "AUTHENTICATOR"
                    ? "bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/20"
                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <DeviceMobileCamera weight="bold" className="h-6 w-6" />
                  </div>
                  {method === "AUTHENTICATOR" && <CheckCircle weight="fill" className="h-5 w-5 text-amber-400" />}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">Authenticator App</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">
                    Link Google Authenticator, Authy, or 1Password for offline time-based one-time passwords.
                  </p>
                </div>
              </button>
            </div>

            <Button
              onClick={handleInitiateSetup}
              disabled={loading}
              className="w-full h-12 text-base font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/10 cursor-pointer transition-all"
            >
              {loading ? <Spinner className="animate-spin h-6 w-6 text-black" weight="bold" /> : "Proceed to Configuration"}
            </Button>
          </div>
        )}

        {/* PHASE 2: VERIFY CODE / SCAN QR */}
        {step === "VERIFY" && (
          <form onSubmit={handleConfirmSetup} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {method === "AUTHENTICATOR" ? (
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <p className="text-xs text-slate-300 font-medium">
                  Scan this QR code using Google Authenticator or your preferred security app:
                </p>
                {qrCodeUrl ? (
                  <div className="p-3 bg-white rounded-xl shadow-md">
                    <img src={qrCodeUrl} alt="2FA Secret QR Code" className="w-44 h-44 object-contain" />
                  </div>
                ) : (
                  <Spinner className="animate-spin h-8 w-8 text-amber-400 my-8" />
                )}
                <div className="text-xs text-slate-500 break-all max-w-xs">
                  Manual Entry Key: <span className="font-mono text-slate-300 select-all">{secretKey}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1">
                <p className="text-sm font-medium text-slate-200">Verification Code Dispatched</p>
                <p className="text-xs text-slate-400">
                  Check your inbox at <span className="text-amber-400 font-medium">{session?.user?.email}</span> and input the code below.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold tracking-wider text-slate-300 uppercase block text-center">
                Enter 6-Digit Verification Code
              </label>
              <Input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="h-14 text-center tracking-[0.5em] font-mono text-2xl bg-slate-950 border-slate-800 text-white focus-visible:ring-amber-500 max-w-xs mx-auto block"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("SELECT")}
                className="flex-1 h-12 border-slate-800 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="flex-2 h-12 font-semibold bg-amber-500 hover:bg-amber-400 text-black cursor-pointer transition-all"
              >
                {loading ? <Spinner className="animate-spin h-5 w-5 text-black" /> : "Authorize & Lock Configuration"}
              </Button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

export default function Setup2FAPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
        <Spinner className="animate-spin h-8 w-8 text-amber-500" weight="bold" />
      </div>
    }>
      <Setup2FAContent />
    </Suspense>
  );
}
