"use client";

import Image from "next/image";
import Script from "next/script";
import { preconnect } from "react-dom";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  EnvelopeSimple, LockKey, SignIn, Spinner, 
  ShieldCheck, Eye, EyeSlash, Info, CrownSimple
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function AdminLoginContent() {
  preconnect('https://challenges.cloudflare.com');

  const router = useRouter();
  const searchParams = useSearchParams();
  
  // SECURITY FIX: Ensure callbackUrl is an internal path
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl = (rawCallbackUrl && rawCallbackUrl.startsWith("/")) 
    ? rawCallbackUrl 
    : "/quadrox-lorabiz-team/mds/dashboard";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  useEffect(() => {
    (window as any).onTurnstileSuccess = (token: string) => {
      (window as any).__lastMdsTurnstileToken = token;
      setCaptchaToken(token);
      setCaptchaVerified(true);
      setError("");
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    let activeToken = captchaToken || (window as any).__lastMdsTurnstileToken;
    if (!activeToken) {
      const startTime = Date.now();
      while (!activeToken && Date.now() - startTime < 2000) {
        await new Promise((r) => setTimeout(r, 100));
        activeToken = captchaToken || (window as any).__lastMdsTurnstileToken;
      }
    }

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        portal: "mds",
        captchaToken: activeToken || ""
      });

      if (res?.error) {
        setError(res.error === "CredentialsSignin" ? "Invalid administrative credentials." : res.error);
        setLoading(false);
        if ((window as any).turnstile) {
          (window as any).turnstile.reset();
          setCaptchaVerified(false);
          setCaptchaToken("");
        }
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();

        const isTwoFactorEnabled = sessionData?.user?.twoFactorEnabled;
        const isMfaVerified = sessionData?.user?.mfaVerified;

        if (isTwoFactorEnabled === false || isTwoFactorEnabled === undefined) {
          router.push(`/quadrox-lorabiz-team/setup-2fa?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        } else if (isTwoFactorEnabled && !isMfaVerified) {
          router.push(`/quadrox-lorabiz-team/verify-2fa?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        } else {
          router.push(callbackUrl);
        }
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected security exception occurred. Please retry.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex bg-background font-sans selection:bg-teal-500 selection:text-white">
      
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js" 
        strategy="afterInteractive" 
      />

      {/* LEFT PANEL - Elegant & Clean */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-[45%] shrink-0 min-h-screen bg-slate-950 relative overflow-hidden flex-col justify-between border-r border-border">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 p-12">
          <Image src="/logo.png" alt="LoraBiz Official Logo" width={160} height={50} className="brightness-0 invert object-contain" priority />
        </div>

        <div className="relative z-10 p-12 space-y-8 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <CrownSimple weight="bold" className="h-4 w-4" /> Quadrox Technologies
          </div>
          
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight text-white">
            Managing Director Portal.
          </h2>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
            <div className="flex items-start gap-4">
              <ShieldCheck className="h-8 w-8 text-teal-400 shrink-0 mt-1" weight="fill" />
              <div>
                <h3 className="text-white font-semibold mb-1">Executive Control Plane</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  This interface is restricted to authorized administrative personnel. All activities are monitored and cryptographically logged for security.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-12 text-slate-500 text-xs font-bold tracking-widest uppercase">
          Internal Systems &bull; Confidential
        </div>
      </aside>

      {/* RIGHT PANEL - The Form */}
      <section className="flex-1 w-full lg:ml-[45%] min-h-screen relative flex flex-col justify-center bg-background py-10">
        <article className="w-full max-w-md xl:max-w-lg mx-auto px-6 sm:px-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          <div className="mb-8 flex justify-center lg:hidden">
            <Image src="/logo.png" alt="LoraBiz Logo" width={200} height={70} className="object-contain h-14 w-auto dark:brightness-110" priority />
          </div>

          <header className="mb-8 text-center lg:text-left">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Executive Sign In</h1>
            <p className="text-muted-foreground mt-2 text-[16px]">Enter your administrative credentials to continue.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-destructive/10 text-destructive text-sm font-medium rounded-lg border border-destructive/20 flex items-center gap-2 animate-in shake">
                <Info weight="bold" className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Administrative Email</Label>
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                    placeholder="md@quadrox.io" 
                    className="pl-11 h-12 text-[16px] bg-secondary/40 border-border text-foreground focus-visible:ring-teal-500 transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-medium">Passkey / Password</Label>
                </div>
                <div className="relative">
                  <LockKey className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password}
                    onChange={handleChange}
                    required 
                    placeholder="••••••••••••" 
                    className="pl-11 pr-10 h-12 text-[16px] bg-secondary/40 border-border text-foreground focus-visible:ring-teal-500 transition-all" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeSlash className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, overflow: "hidden", pointerEvents: "none", clip: "rect(0, 0, 0, 0)", zIndex: -1 }}>
               <div 
                 className="cf-turnstile" 
                 data-sitekey="0x4AAAAAAEA2i2RM9PiSsRCH" 
                 data-callback="onTurnstileSuccess"
                 data-action="turnstile-spin-mds"
                 data-theme="auto"
                 data-retry="auto"
                 data-retry-interval="1500"
               ></div>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-14 text-lg font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <Spinner className="animate-spin h-6 w-6" weight="bold" />
                ) : (
                  <>Authorize Access <SignIn className="h-5 w-5" weight="bold" /></>
                )}
              </Button>
            </div>

          </form>
        </article>
      </section>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Spinner className="animate-spin h-8 w-8 text-teal-500" weight="bold" />
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}
