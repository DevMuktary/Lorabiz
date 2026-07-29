"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, Suspense } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  EnvelopeSimple, LockKey, SignIn, Spinner, 
  CheckCircle, ShieldCheck, Eye, EyeSlash, Info, X,
  FacebookLogo, AppleLogo, Lifebuoy, Star
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
  
  // Captcha & Toast States
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // OTP Modal & Timer States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  
  // UI states synced with the server
  const [resendTimer, setResendTimer] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSyncingTimer, setIsSyncingTimer] = useState(false);

  // Carousel State for Left Panel
  const [currentSlide, setCurrentSlide] = useState(0);
  const testimonials = [
    { text: "LoraBiz registered my company in 3 days. Unbelievable speed!", name: "Adeola M.", rating: 5 },
    { text: "The internal wallet makes funding my CAC applications so seamless.", name: "Chinedu O.", rating: 5 },
    { text: "No more CAC portal headaches. The AI categorization is magic.", name: "Fatima S.", rating: 5 }
  ];

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, [testimonials.length]);

  // Auto-trigger modal if user refreshed the page but hasn't entered the OTP yet
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

  // Sync frontend timer with the Database Backend the moment the modal opens
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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaVerified) {
      setError("Please complete the security check.");
      return;
    }

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
    <div className="fixed inset-0 w-full flex bg-background font-sans selection:bg-[#ff3f7a] selection:text-white overflow-hidden transition-colors duration-300">
      
      {/* Toast Notification for Coming Soon */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-6 py-3 rounded-full shadow-lg font-medium animate-in slide-in-from-top-4 flex items-center gap-2">
          🚀 {toastMsg}
        </div>
      )}

      {/* Support Icon */}
      <a href="mailto:help@support.lorabiz.com" className="fixed bottom-6 right-6 z-40 bg-[#ff3f7a] text-white p-4 rounded-full shadow-2xl hover:scale-105 transition-transform hover:shadow-[#ff3f7a]/40" title="Need Help?">
        <Lifebuoy className="h-6 w-6" weight="fill" />
      </a>

      {/* LEFT PANEL - With Testimonials & Images */}
      <div className="hidden lg:flex lg:w-[45%] shrink-0 h-full bg-slate-900 relative overflow-hidden flex-col justify-between">
        {/* Animated Background Overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32b7?q=80&w=1632&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#ff3f7a]/90 via-slate-900/80 to-slate-900/40"></div>

        <div className="relative z-10 p-12">
          <Image src="/logo.png" alt="LoraBiz Logo" width={160} height={50} className="brightness-0 invert object-contain" />
        </div>

        <div className="relative z-10 p-12 space-y-8 max-w-xl">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight text-white">
            Join 1,000+ businesses registered seamlessly.
          </h1>

          {/* Testimonial Slider */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl min-h-[140px] flex flex-col justify-center transition-all duration-500 ease-in-out">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} weight="fill" className="text-amber-400 h-5 w-5" />
              ))}
            </div>
            <p className="text-white text-lg font-medium leading-relaxed italic">
              "{testimonials[currentSlide].text}"
            </p>
            <p className="text-white/70 mt-4 font-semibold">
              — {testimonials[currentSlide].name}
            </p>
          </div>
        </div>

        <div className="relative z-10 p-12 flex gap-4 opacity-50">
           {/* Placeholder for trusted companies passing by */}
           <div className="text-white font-bold tracking-widest uppercase text-sm">CAC Approved</div>
           <div className="text-white font-bold tracking-widest uppercase text-sm">•</div>
           <div className="text-white font-bold tracking-widest uppercase text-sm">NIMC Partner</div>
        </div>
      </div>

      {/* RIGHT PANEL - Login Form */}
      <div className="flex-1 h-full overflow-y-auto overflow-x-hidden relative block bg-background">
        <div className="w-full max-w-md mx-auto p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-4 sm:mt-10">
          
          <div className="mb-8 flex justify-center lg:hidden">
            <Image src="/logo.png" alt="LoraBiz Logo" width={200} height={70} className="object-contain h-14 w-auto dark:brightness-110" priority />
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-2 text-[16px]">Log in to access your dashboard.</p>
          </div>

          <div className="flex gap-4 mb-6">
            <Button type="button" variant="outline" className="w-full h-12 border-border" onClick={() => showToast("Facebook login is coming soon!")}>
              <FacebookLogo className="h-5 w-5 mr-2 text-blue-600" weight="fill" /> Facebook
            </Button>
            <Button type="button" variant="outline" className="w-full h-12 border-border" onClick={() => showToast("Apple login is coming soon!")}>
              <AppleLogo className="h-5 w-5 mr-2" weight="fill" /> Apple
            </Button>
          </div>

          <div className="relative flex items-center py-2 mb-6">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm font-medium">Or continue with</span>
            <div className="flex-grow border-t border-border"></div>
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

              <div className="space-y-1">
                <div className="flex items-center justify-between mb-2">
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
                {/* OTP Micro-copy */}
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <ShieldCheck weight="fill" className="h-3.5 w-3.5" /> For your security, we will send a one-time OTP upon login.
                </p>
              </div>
            </div>

            {/* Cloudflare Turnstile Placeholder (Simulated for UX) */}
            <div className="pt-2">
              <div 
                onClick={() => setCaptchaVerified(true)}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${captchaVerified ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-secondary/50 border-border hover:bg-secondary'}`}
              >
                <div className={`h-6 w-6 rounded flex items-center justify-center border ${captchaVerified ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/40 bg-background'}`}>
                  {captchaVerified && <CheckCircle weight="bold" className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{captchaVerified ? 'Verification Complete' : 'Verify you are human'}</p>
                </div>
                <Image src="/globe.svg" alt="Security" width={24} height={24} className="opacity-50 dark:invert" />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={loading || !captchaVerified} className="w-full h-14 text-lg font-semibold bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-xl shadow-[#ff3f7a]/25">
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
          {/* Keep your existing Modal UI here... */}
          <div className="w-full max-w-md bg-secondary p-6 sm:p-8 rounded-2xl border border-border shadow-2xl relative animate-in zoom-in-95">
            <button onClick={handleCloseModal} className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-background rounded-full transition-colors"><X className="h-5 w-5" weight="bold" /></button>
            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-[#ff3f7a]/10 text-[#ff3f7a] rounded-full flex items-center justify-center mb-4 mt-2"><ShieldCheck weight="fill" className="h-6 w-6" /></div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">2-Step Verification</h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">We've sent a 6-digit authorization code to <br/><span className="font-medium text-foreground">{formData.email}</span>.</p>
            </div>
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {otpError && <div className="p-3 bg-destructive/10 text-destructive text-sm font-medium rounded-lg text-center animate-in shake">{otpError}</div>}
              {isLocked && <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium rounded-lg text-center">Too many resend attempts. For your security, this action has been temporarily blocked.</div>}
              <div className="space-y-2">
                <Input value={otpCode} onChange={(e) => {setOtpCode(e.target.value.replace(/\D/g, "")); setOtpError("");}} maxLength={6} placeholder="000000" disabled={isSyncingTimer} className="h-14 sm:h-16 text-center text-2xl sm:text-3xl tracking-[0.5em] sm:tracking-[1em] font-bold bg-background border-border text-foreground focus-visible:ring-[#ff3f7a]" />
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <Button type="submit" disabled={verifying || otpCode.length < 6 || isSyncingTimer} className="w-full h-14 text-lg font-semibold bg-[#ff3f7a] hover:bg-[#e02b62] text-white">
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
