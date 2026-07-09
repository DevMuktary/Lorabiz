"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, Suspense } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  EnvelopeSimple, LockKey, SignIn, Spinner, 
  RocketLaunch, CheckCircle, ShieldCheck, Eye, EyeSlash, Info, X
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  
  const isRegistered = searchParams.get("registered") === "true";
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // Login Form States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  // OTP Modal & Timer States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Re-trigger modal if user refreshed the page but hasn't entered the OTP yet
  useEffect(() => {
    if (session?.user) {
      const user = session.user as any;
      if (!user.mfaVerified) {
        setFormData(prev => ({ ...prev, email: user.email }));
        setShowOtpModal(true);
      } else {
        router.push(callbackUrl);
      }
    }
  }, [session, router, callbackUrl]);

  // Standard React interval tick for the UI countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        portal: "user", 
      });

      if (res?.error) {
        setError(res.error === "CredentialsSignin" ? "Invalid email or password. Please try again." : res.error);
        setLoading(false);
      } else {
        setShowOtpModal(true);
        setResendTimer(30); 
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;

    setVerifying(true);
    setOtpError("");

    try {
      const res = await fetch("/api/auth/verify-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otpCode }),
      });

      if (res.ok) {
        await update({ mfaVerified: true });
        router.push(callbackUrl);
        router.refresh();
      } else {
        const data = await res.json();
        setOtpError(data.message || "Invalid code provided.");
        setVerifying(false);
      }
    } catch (err) {
      setOtpError("Network error. Please try again.");
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (isLocked || resendTimer > 0) return;
    setIsResending(true);
    setOtpError("");

    try {
      const res = await fetch("/api/auth/resend-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await res.json();

      if (res.ok) {
        setResendTimer(data.remainingSeconds);
      } else if (res.status === 429) {
        if (data.isLocked) {
          setIsLocked(true);
        } else if (data.remainingSeconds) {
          setResendTimer(data.remainingSeconds);
        }
        setOtpError(data.message);
      } else {
        setOtpError(data.message || "Failed to resend. Please try again.");
      }
    } catch (e) {
      setOtpError("Network error.");
    } finally {
      setIsResending(false);
    }
  };

  const handleCloseModal = async () => {
    // Destroy the pending session cookie so they can log into another account
    if (session?.user) {
      await signOut({ redirect: false });
    }
    setShowOtpModal(false);
    setOtpCode("");
    setOtpError("");
    setFormData(prev => ({ ...prev, password: "" }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m > 0 ? `${m}m ` : ''}${s}s`;
  };

  return (
    <div className="fixed inset-0 w-full flex bg-background font-sans selection:bg-[#ff3f7a] selection:text-white overflow-hidden transition-colors duration-300">
      
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[45%] shrink-0 h-full bg-[#ff3f7a] p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-white/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-black/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 text-white space-y-6 max-w-lg mx-auto">
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight">
            Welcome back to LoraBiz.
          </h1>
          <p className="text-lg text-white/90 leading-relaxed">
            Log in to manage your registrations, track CAC approval status, and access your verified business documents.
          </p>
          <div className="pt-8 space-y-4">
            <div className="flex items-center gap-3 text-white font-medium">
              <ShieldCheck weight="fill" className="h-6 w-6 text-white/80" />
              <span>Secure Session & Brute-Force Protection</span>
            </div>
            <div className="flex items-center gap-3 text-white font-medium">
              <RocketLaunch weight="fill" className="h-6 w-6 text-white/80" />
              <span>Instant Dashboard Access</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-12 z-10">
          <p className="text-sm font-semibold tracking-widest text-white/70 uppercase">
            Powered by Quadrox Technologies Limited
          </p>
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="flex-1 h-full overflow-y-auto overflow-x-hidden relative block bg-background">
        <div className="w-full max-w-md mx-auto p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-4 sm:mt-10">
          
          <div className="mb-8 flex justify-center lg:justify-start">
            <Image src="/logo.png" alt="LoraBiz Logo" width={340} height={120} className="object-contain h-20 lg:h-24 w-auto dark:brightness-110" priority />
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Log in</h2>
            <p className="text-muted-foreground mt-2 text-[16px]">Enter your credentials to access your portal.</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-6">
            {isRegistered && !error && (
              <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-lg border border-emerald-500/20 flex items-start gap-3 animate-in fade-in">
                <CheckCircle weight="fill" className="h-5 w-5 shrink-0 mt-0.5" />
                <p>Account created successfully! Please log in below to continue.</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive text-sm font-medium rounded-lg border border-destructive/20 flex items-center gap-2 animate-in shake">
                <Info weight="bold" className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required placeholder="you@example.com" 
                    className="pl-11 h-12 text-[16px] bg-secondary/40 border-border text-foreground focus-visible:ring-[#ff3f7a]" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                  <Link href="/auth/forgot-password" className="text-sm font-semibold text-[#ff3f7a] hover:underline transition-all">Forgot password?</Link>
                </div>
                <div className="relative">
                  <LockKey className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required placeholder="••••••••" 
                    className="pl-11 pr-10 h-12 text-[16px] bg-secondary/40 border-border text-foreground focus-visible:ring-[#ff3f7a]" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeSlash className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-semibold bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-xl shadow-[#ff3f7a]/25">
                {loading ? <Spinner className="animate-spin h-6 w-6" weight="bold" /> : <>Log In <SignIn className="h-5 w-5 ml-2" weight="bold" /></>}
              </Button>
            </div>

            <div className="text-center text-muted-foreground mt-6">
              Don&apos;t have an account? <Link href="/auth/register" className="font-semibold text-[#ff3f7a] hover:underline">Register here</Link>
            </div>
          </form>
        </div>
      </div>

      {/* OTP OVERLAY MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-secondary/50 p-6 sm:p-8 rounded-2xl border border-border shadow-2xl relative animate-in zoom-in-95">
            
            {/* CLOSE BUTTON */}
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors focus:outline-none"
              aria-label="Close"
            >
              <X className="h-5 w-5" weight="bold" />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-[#ff3f7a]/10 text-[#ff3f7a] rounded-full flex items-center justify-center mb-4 mt-2">
                <ShieldCheck weight="fill" className="h-6 w-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">2-Step Verification</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                We've sent a secure 6-digit authorization code to <br/>
                <span className="font-medium text-foreground">{formData.email}</span>.
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {otpError && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm font-medium rounded-lg text-center animate-in shake">
                  {otpError}
                </div>
              )}

              {isLocked && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium rounded-lg text-center">
                  Too many resend attempts. For your security, this action has been temporarily blocked. Please contact customer support or try again later.
                </div>
              )}

              <div className="space-y-2">
                <Input 
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, ""));
                    setOtpError("");
                  }}
                  maxLength={6}
                  placeholder="000000"
                  className="h-14 sm:h-16 text-center text-2xl sm:text-3xl tracking-[0.5em] sm:tracking-[1em] font-bold bg-background border-border text-foreground focus-visible:ring-[#ff3f7a]"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button 
                  type="submit" 
                  disabled={verifying || otpCode.length < 6} 
                  className="w-full h-14 text-lg font-semibold bg-[#ff3f7a] hover:bg-[#e02b62] text-white"
                >
                  {verifying ? <Spinner className="animate-spin h-6 w-6" weight="bold" /> : "Verify & Access"}
                </Button>

                {!isLocked && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendOtp}
                    disabled={isResending || resendTimer > 0}
                    className="w-full h-12 font-medium bg-transparent border-border text-foreground hover:bg-secondary/50 disabled:opacity-50"
                  >
                    {isResending ? <Spinner className="animate-spin h-5 w-5" /> : 
                     resendTimer > 0 ? `Resend code in ${formatTime(resendTimer)}` : "Resend Code"}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center bg-background"><Spinner className="animate-spin h-8 w-8 text-[#ff3f7a]" weight="bold" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
