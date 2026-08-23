"use client";

import Link from "next/link";
import Image from "next/image";
import { preconnect } from "react-dom";
import { useState, useEffect, Suspense, useCallback } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  LockKey, SignIn, Spinner, CheckCircle, 
  ShieldCheck, Eye, EyeSlash, Info, X,
  FacebookLogo, GoogleLogo, Star, Envelope, ChatCircleDots 
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TurnstileWidget } from "@/components/TurnstileWidget";

function LoginContent() {
  preconnect('https://challenges.cloudflare.com');

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
  
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  
  const [activeTooltip, setActiveTooltip] = useState<"google" | "facebook" | null>(null);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
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

  // Wrapped in useCallback so React.memo works in the child component
  const handleTurnstileVerify = useCallback((token: string) => {
    (window as any).__lastTurnstileToken = token;
    setCaptchaToken(token);
    setCaptchaVerified(true);
    setError("");
  }, []);

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

  useEffect(() => {
    let mounted = true;
    async function syncTimerWithServer() {
      if (!showOtpModal || !formData.email) return;
      setIsSyncingTimer(true);
      try {
        const res = await fetch("/api/auth/otp-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email })
        });
        if (res.ok && mounted) {
          const data = await res.json();
          setIsLocked(data.isLocked);
          setResendTimer(data.remainingSeconds);
        }
      } catch (err) {
        console.error("Failed to sync timer with server");
      } finally {
        if (mounted) setIsSyncingTimer(false);
      }
    }
    syncTimerWithServer();
    return () => { mounted = false; };
  }, [showOtpModal, formData.email]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const showTooltip = (type: "google" | "facebook") => {
    setActiveTooltip(type);
    setTimeout(() => setActiveTooltip(null), 2500);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let activeToken = captchaToken || (window as any).__lastTurnstileToken;

    // If user clicked immediately (e.g. autofill in <0.3s), wait up to 2 seconds for invisible token
    if (!activeToken) {
      const startTime = Date.now();
      while (!activeToken && Date.now() - startTime < 2000) {
        await new Promise((r) => setTimeout(r, 100));
        activeToken = captchaToken || (window as any).__lastTurnstileToken;
      }
    }

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        portal: "user",
        captchaToken: activeToken || ""
      });

      if (res?.error) {
        setError(res.error === "CredentialsSignin" ? "Invalid email or password." : res.error);
        setLoading(false);
        // Reset the turnstile globally on failure so they can verify again
        if ((window as any).turnstile) {
          try { (window as any).turnstile.reset(); } catch (e) {}
          setCaptchaVerified(false);
          setCaptchaToken("");
          (window as any).__lastTurnstileToken = "";
        }
      } else {
        setShowOtpModal(true);
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
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
                  <ShieldCheck weight="fill" className="h-4 w-4 shrink-0 mt-0.5" /> 
                  <span>For your security, we will send a one-time OTP upon login.</span>
                </p>
              </div>
            </div>

            {/* Background Security Verification */}
            <TurnstileWidget onVerify={handleTurnstileVerify} />

            <div className="pt-2">
              <Button type="submit" aria-label="Log In" disabled={loading} className="w-full h-14 text-lg font-semibold bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-xl shadow-[#ff3f7a]/25 cursor-pointer">
                {loading ? <Spinner className="animate-spin h-6 w-6" weight="bold" /> : <>Log In <SignIn className="h-5 w-5 ml-2" weight="bold" /></>}
              </Button>
            </div>

            <div className="pt-4 pb-2">
              <div className="relative flex items-center py-2 mb-6">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm font-medium">Or continue with</span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative w-full">
                  {activeTooltip === "google" && (
                    <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-3 py-1.5 rounded shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 z-10">
                      Coming soon!
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground"></div>
                    </div>
                  )}
                  <Button type="button" variant="outline" aria-label="Continue with Google" className="w-full h-12 border-border font-medium" onClick={() => showTooltip("google")}>
                    <GoogleLogo className="h-5 w-5 mr-2 text-rose-500" weight="bold" /> Google
                  </Button>
                </div>

                <div className="relative w-full">
                  {activeTooltip === "facebook" && (
                    <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-3 py-1.5 rounded shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 z-10">
                      Coming soon!
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground"></div>
                    </div>
                  )}
                  <Button type="button" variant="outline" aria-label="Continue with Facebook" className="w-full h-12 border-border font-medium" onClick={() => showTooltip("facebook")}>
                    <FacebookLogo className="h-5 w-5 mr-2 text-blue-600" weight="fill" /> Facebook
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-center text-muted-foreground mt-4">
              Don&apos;t have an account? <Link href="/auth/register" className="font-semibold text-[#ff3f7a] hover:underline">Register here</Link>
            </div>
          </form>
        </article>
      </section>

      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-secondary p-6 sm:p-8 rounded-2xl border border-border shadow-2xl relative animate-in zoom-in-95">
            <button onClick={handleCloseModal} aria-label="Close OTP Modal" className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-full transition-colors"><X className="h-5 w-5" weight="bold" /></button>
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-[#ff3f7a]/10 text-[#ff3f7a] rounded-full flex items-center justify-center mb-4 mt-2"><ShieldCheck weight="fill" className="h-6 w-6" /></div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">2-Step Verification</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">We&apos;ve sent a 6-digit authorization code to <br/><span className="font-medium text-foreground">{formData.email}</span>.</p>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {otpError && <div className="p-3 bg-destructive/10 text-destructive text-sm font-medium rounded-lg text-center animate-in shake">{otpError}</div>}
              {isLocked && <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium rounded-lg text-center">Too many resend attempts. For your security, this action has been temporarily blocked.</div>}
              <div className="space-y-2">
                <Input value={otpCode} aria-label="Enter 6 digit OTP" onChange={(e) => {setOtpCode(e.target.value.replace(/\D/g, "")); setOtpError("");}} maxLength={6} placeholder="000000" disabled={isSyncingTimer} className="h-14 sm:h-16 text-center text-2xl sm:text-3xl tracking-[0.5em] sm:tracking-[1em] font-bold bg-background border-border text-foreground focus-visible:ring-[#ff3f7a]" />
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <Button type="submit" aria-label="Verify OTP" disabled={verifying || otpCode.length < 6 || isSyncingTimer} className="w-full h-14 text-lg font-semibold bg-[#ff3f7a] hover:bg-[#e02b62] text-white">
                  {verifying ? <Spinner className="animate-spin h-6 w-6" weight="bold" /> : "Verify & Access"}
                </Button>
                {!isLocked && (
                  <Button type="button" variant="outline" onClick={handleResendOtp} disabled={isResending || resendTimer > 0 || isSyncingTimer} className="w-full h-12 font-medium bg-transparent border-border text-foreground hover:bg-background disabled:opacity-50">
                    {isSyncingTimer ? <Spinner className="animate-spin h-5 w-5" /> : isResending ? <Spinner className="animate-spin h-5 w-5" /> : resendTimer > 0 ? `Resend code in ${formatTime(resendTimer)}` : "Resend Code"}
                  </Button>
                )}
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
