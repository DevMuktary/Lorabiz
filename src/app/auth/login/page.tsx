"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, Suspense } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  LockKey, SignIn, Spinner, CheckCircle, 
  ShieldCheck, Eye, EyeSlash, Info, X,
  FacebookLogo, GoogleLogo, Star, Envelope, ChatCircleDots,
  Key, DeviceMobile
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  
  const isRegistered = searchParams.get("registered") === "true";
  
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl = (rawCallbackUrl && rawCallbackUrl.startsWith("/")) 
    ? rawCallbackUrl 
    : "/dashboard";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  
  const [activeTooltip, setActiveTooltip] = useState<"google" | "facebook" | null>(null);

  // 2FA State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<"EMAIL" | "AUTHENTICATOR" | null>("EMAIL");
  const [otpCode, setOtpCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  
  const [resendTimer, setResendTimer] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSyncingTimer, setIsSyncingTimer] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);

  const testimonials = [
    { text: "Got my SCUML certificate in just a few hours. Absolutely lifesaving speed!", name: "Adeola M.", rating: 5 },
    { text: "Registered my CAC Business Name in minutes. The dashboard is incredibly smooth.", name: "Chinedu O.", rating: 5 },
    { text: "Best platform for instant NIN slips. It's cheap, fast, and the airtime top-up is a nice bonus.", name: "Fatima S.", rating: 5 }
  ];

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(slideInterval);
  }, [testimonials.length]);

  // Resend Timer Countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Sync active cooldown from server when OTP modal opens for email method
  useEffect(() => {
    if (!showOtpModal || !formData.email || twoFactorMethod !== "EMAIL") return;
    let isMounted = true;
    setIsSyncingTimer(true);

    fetch("/api/auth/otp-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.isLocked) {
          setIsLocked(true);
        } else if (data.remainingSeconds > 0) {
          setResendTimer(data.remainingSeconds);
        } else {
          setResendTimer(30);
        }
      })
      .catch(() => {
        if (isMounted) setResendTimer(30);
      })
      .finally(() => {
        if (isMounted) setIsSyncingTimer(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showOtpModal, formData.email, twoFactorMethod]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        portal: "user",
      });

      if (res?.error) {
        setError(res.error === "CredentialsSignin" ? "Invalid email or password." : res.error);
        setLoading(false);
        return;
      }

      // Fetch fresh session to inspect 2FA requirement
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();

      if (sessionData?.user?.twoFactorEnabled && !sessionData?.user?.mfaVerified) {
        setTwoFactorMethod(sessionData.user.twoFactorMethod || "EMAIL");
        setShowOtpModal(true);
        setLoading(false);
      } else {
        // Instant Login (2FA Disabled)
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const showTooltip = (type: "google" | "facebook") => {
    setActiveTooltip(type);
    setTimeout(() => setActiveTooltip(null), 2500);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setVerifying(true);
    setOtpError("");

    try {
      const res = await fetch("/api/auth/verify-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: formData.email, 
          otpCode: otpCode.trim(),
          isBackupCode: useBackupCode
        }),
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
        if (data.isLocked) setIsLocked(true);
        else if (data.remainingSeconds) setResendTimer(data.remainingSeconds);
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
    if (session?.user) await signOut({ redirect: false });
    setShowOtpModal(false);
    setOtpCode("");
    setOtpError("");
    setUseBackupCode(false);
    setFormData(prev => ({ ...prev, password: "" }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m > 0 ? `${m}m ` : ''}${s}s`;
  };

  return (
    <main className="min-h-screen w-full flex bg-background font-sans selection:bg-[#ff3f7a] selection:text-white">

      <a href="mailto:help@support.lorabiz.com" aria-label="Contact Support" className="fixed bottom-6 right-6 z-40 bg-[#ff3f7a] text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform hover:shadow-[#ff3f7a]/40" title="Need Help?">
        <ChatCircleDots className="h-6 w-6" weight="fill" />
      </a>

      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-[45%] shrink-0 min-h-screen bg-slate-950 relative overflow-hidden flex-col justify-between">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#ff3f7a]/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 p-12">
          <Image src="/logo.png" alt="LoraBiz Official Logo" width={160} height={50} className="brightness-0 invert object-contain" priority />
        </div>

        <div className="relative z-10 p-12 space-y-8 max-w-xl">
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight text-white">
            Nigeria&apos;s #1 Platform for CAC, NIN, SCUML & Airtime.
          </h2>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl min-h-[140px] flex flex-col justify-center transition-all duration-500 ease-in-out shadow-2xl">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} weight="fill" className="text-amber-400 h-5 w-5" />
              ))}
            </div>
            <p className="text-white/90 text-lg font-medium leading-relaxed italic">
              &quot;{testimonials[currentSlide].text}&quot;
            </p>
            <p className="text-white/60 mt-4 font-semibold">
              — {testimonials[currentSlide].name}
            </p>
          </div>
        </div>

        <div className="relative z-10 p-12 flex flex-wrap gap-x-6 gap-y-2 opacity-50">
           <span className="text-white font-bold tracking-widest uppercase text-sm">CAC</span>
           <span className="text-white font-bold tracking-widest uppercase text-sm">•</span>
           <span className="text-white font-bold tracking-widest uppercase text-sm">NIMC</span>
           <span className="text-white font-bold tracking-widest uppercase text-sm">•</span>
           <span className="text-white font-bold tracking-widest uppercase text-sm">SCUML</span>
           <span className="text-white font-bold tracking-widest uppercase text-sm">•</span>
           <span className="text-white font-bold tracking-widest uppercase text-sm">And More</span>
        </div>
      </aside>

      <section className="flex-1 w-full lg:ml-[45%] min-h-screen relative flex flex-col justify-center bg-background py-10">
        <article className="w-full max-w-lg xl:max-w-xl mx-auto px-6 sm:px-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="mb-8 flex justify-center lg:hidden">
            <Image src="/logo.png" alt="LoraBiz Logo" width={200} height={70} className="object-contain h-14 w-auto dark:brightness-110" priority />
          </div>

          <header className="mb-8 text-center lg:text-left">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-2 text-[16px]">Log in to access your LoraBiz dashboard.</p>
          </header>

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
                  <Envelope className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required placeholder="you@example.com" aria-label="Email Address"
                    className="pl-11 h-12 text-[16px] bg-secondary/40 border-border text-foreground focus-visible:ring-[#ff3f7a]" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                  <Link href="/auth/forgot-password" aria-label="Forgot password link" className="text-sm font-semibold text-[#ff3f7a] hover:underline transition-all">Forgot password?</Link>
                </div>
                <div className="relative">
                  <LockKey className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" weight="bold" />
                  <Input 
                    id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required placeholder="••••••••" aria-label="Password"
                    className="pl-11 pr-10 h-12 text-[16px] bg-secondary/40 border-border text-foreground focus-visible:ring-[#ff3f7a]" 
                  />
                  <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeSlash className="h-5 w-5" weight="fill" /> : <Eye className="h-5 w-5" weight="fill" />}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" aria-label="Log In" disabled={loading} className="w-full h-14 text-lg font-semibold bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-xl shadow-[#ff3f7a]/25 cursor-pointer flex items-center justify-center gap-2">
              {loading ? (
                <Spinner className="animate-spin h-6 w-6" weight="bold" />
              ) : (
                <>Log In <SignIn className="h-5 w-5 ml-2" weight="bold" /></>
              )}
            </Button>

            <div className="pt-4 pb-2">
              <div className="relative flex items-center py-2 mb-6">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm font-medium">Or continue with</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              <div className="w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  aria-label="Continue with Google" 
                  className="w-full h-12 border-border font-semibold flex items-center justify-center gap-3 bg-secondary/20 hover:bg-secondary/40 text-foreground transition-all cursor-pointer" 
                  onClick={() => signIn("google", { callbackUrl })}
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </Button>
              </div>
            </div>

            <div className="text-center text-muted-foreground mt-4">
              Don&apos;t have an account? <Link href="/auth/register" className="font-semibold text-[#ff3f7a] hover:underline">Register here</Link>
            </div>
          </form>
        </article>
      </section>

      {/* 2FA VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-secondary p-6 sm:p-8 rounded-3xl border border-border shadow-2xl relative animate-in zoom-in-95">
            <button onClick={handleCloseModal} aria-label="Close OTP Modal" className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-full transition-colors"><X className="h-5 w-5" weight="bold" /></button>
            
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-[#ff3f7a]/10 text-[#ff3f7a] rounded-full flex items-center justify-center mb-3 mt-1">
                {useBackupCode ? <Key weight="fill" className="h-6 w-6" /> : twoFactorMethod === "AUTHENTICATOR" ? <DeviceMobile weight="fill" className="h-6 w-6" /> : <ShieldCheck weight="fill" className="h-6 w-6" />}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                {useBackupCode ? "Recovery Code" : twoFactorMethod === "AUTHENTICATOR" ? "Authenticator App" : "2-Step Verification"}
              </h2>
              <p className="text-muted-foreground mt-2 text-xs sm:text-sm leading-relaxed">
                {useBackupCode ? (
                  "Enter one of your 8-character single-use backup recovery codes."
                ) : twoFactorMethod === "AUTHENTICATOR" ? (
                  "Enter the 6-digit code from Google Authenticator or Authy."
                ) : (
                  <>We&apos;ve sent a 6-digit authorization code to <br/><span className="font-semibold text-foreground">{formData.email}</span>.</>
                )}
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {otpError && <div className="p-3 bg-destructive/10 text-destructive text-xs sm:text-sm font-bold rounded-xl text-center animate-in shake">{otpError}</div>}
              {isLocked && twoFactorMethod === "EMAIL" && <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl text-center">Too many resend attempts. This action has been temporarily blocked for 1 hour.</div>}
              
              <div className="space-y-2">
                {useBackupCode ? (
                  <Input 
                    value={otpCode} 
                    aria-label="Enter backup code" 
                    onChange={(e) => { setOtpCode(e.target.value.toUpperCase()); setOtpError(""); }} 
                    placeholder="e.g. 7K9A-4B2D" 
                    maxLength={10}
                    className="h-14 text-center text-xl font-mono uppercase tracking-widest font-black bg-background border-border text-foreground focus-visible:ring-[#ff3f7a]" 
                  />
                ) : (
                  <Input 
                    value={otpCode} 
                    aria-label="Enter 6 digit code" 
                    onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(""); }} 
                    maxLength={6} 
                    placeholder="000000" 
                    disabled={isSyncingTimer && twoFactorMethod === "EMAIL"} 
                    className="h-14 sm:h-16 text-center text-2xl sm:text-3xl tracking-[0.5em] sm:tracking-[1em] font-bold bg-background border-border text-foreground focus-visible:ring-[#ff3f7a]" 
                  />
                )}
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                <Button type="submit" aria-label="Verify & Sign In" disabled={verifying || !otpCode.trim()} className="w-full h-12 text-base font-bold bg-[#ff3f7a] hover:bg-[#e02b62] text-white rounded-xl shadow-lg cursor-pointer">
                  {verifying ? <Spinner className="animate-spin h-5 w-5" weight="bold" /> : "Verify & Access"}
                </Button>

                {twoFactorMethod === "EMAIL" && !useBackupCode && !isLocked && (
                  <Button type="button" variant="outline" onClick={handleResendOtp} disabled={isResending || resendTimer > 0 || isSyncingTimer} className="w-full h-11 text-xs font-bold bg-transparent border-border text-foreground hover:bg-background disabled:opacity-50 rounded-xl">
                    {isSyncingTimer ? <Spinner className="animate-spin h-4 w-4" /> : isResending ? <Spinner className="animate-spin h-4 w-4" /> : resendTimer > 0 ? `Resend code in ${formatTime(resendTimer)}` : "Resend Email Code"}
                  </Button>
                )}

                <div className="pt-2 border-t border-border text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode(!useBackupCode);
                      setOtpCode("");
                      setOtpError("");
                    }}
                    className="text-xs font-bold text-[#ff3f7a] hover:underline"
                  >
                    {useBackupCode ? "← Back to standard code" : "Lost access? Use a Backup Recovery Code"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center bg-background"><Spinner className="animate-spin h-8 w-8 text-[#ff3f7a]" weight="bold" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
