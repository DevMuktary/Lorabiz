"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Spinner, ShieldCheck, CheckCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function VerifyLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: session?.user?.email, 
          otpCode 
        }),
      });

      if (res.ok) {
        // Force update the JWT token mfaVerified to true
        await update({ mfaVerified: true });
        router.push(callbackUrl);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.message || "Invalid code provided.");
        setLoading(false);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex bg-background font-sans selection:bg-[#ff3f7a] selection:text-white justify-center items-center p-4">
      <div className="w-full max-w-md bg-secondary/20 p-8 rounded-2xl border border-border shadow-xl">
        
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" alt="LoraBiz Logo" width={180} height={60} className="dark:brightness-110" priority />
        </div>

        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-[#ff3f7a]/10 text-[#ff3f7a] rounded-full flex items-center justify-center mb-4">
            <ShieldCheck weight="fill" className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">2-Step Verification</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            We've sent a 6-digit authorization code to your email. Enter it below to access your dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm font-medium rounded-lg text-center animate-in shake">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Input 
              value={otpCode}
              onChange={(e) => {
                setOtpCode(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              maxLength={6}
              placeholder="0 0 0 0 0 0"
              className="h-16 text-center text-3xl tracking-[1em] font-bold bg-background border-border text-foreground focus-visible:ring-[#ff3f7a]"
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading || otpCode.length < 6} 
            className="w-full h-14 text-lg font-semibold bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-xl shadow-[#ff3f7a]/25 transition-all cursor-pointer"
          >
            {loading ? <Spinner className="animate-spin h-6 w-6" weight="bold" /> : <>Verify & Continue <CheckCircle className="ml-2 h-5 w-5" /></>}
          </Button>
        </form>

      </div>
    </div>
  );
}

export default function VerifyLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center bg-background"><Spinner className="animate-spin h-8 w-8 text-[#ff3f7a]" weight="bold" /></div>}>
      <VerifyLoginContent />
    </Suspense>
  );
}
