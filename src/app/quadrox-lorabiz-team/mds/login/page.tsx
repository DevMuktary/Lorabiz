"use client";

import Image from "next/image";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  EnvelopeSimple, LockKey, SignIn, Spinner, 
  ShieldCheck, Eye, EyeSlash, Info, CrownSimple, Fingerprint
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const callbackUrl = searchParams.get("callbackUrl") || "/quadrox-lorabiz-team/mds/dashboard";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
        portal: "mds", // Explicitly tags this as an MDS portal login attempt
      });

      if (res?.error) {
        setError(res.error === "CredentialsSignin" ? "Invalid administrative credentials." : res.error);
        setLoading(false);
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();

        const isTwoFactorEnabled = sessionData?.user?.twoFactorEnabled;
        const isMfaVerified = sessionData?.user?.mfaVerified;

        if (!isTwoFactorEnabled) {
          router.push(`/quadrox-lorabiz-team/setup-2fa?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        } else if (!isMfaVerified) {
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
    <div className="fixed inset-0 w-full flex bg-slate-950 font-sans selection:bg-teal-500 selection:text-black overflow-hidden transition-colors duration-300">
      
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[45%] shrink-0 h-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800/80">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse shadow-lg shadow-teal-500/50" />
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            Executive Control Plane
          </span>
        </div>

        <div className="relative z-10 text-white space-y-6 max-w-lg mx-auto my-auto">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 mb-2">
            <CrownSimple weight="fill" className="h-8 w-8 text-teal-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight text-white">
            Managing Director Portal
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Authorized executive access only. Oversee platform filings, review financial ledgers, and manage operational compliance across LoraBiz.
          </p>
          
          <div className="pt-6 space-y-4 border-t border-slate-800/80">
            <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
              <Fingerprint weight="fill" className="h-5 w-5 text-teal-400 shrink-0" />
              <span>Full cryptographic audit logging active</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
              <ShieldCheck weight="fill" className="h-5 w-5 text-cyan-400 shrink-0" />
              <span>Zero-trust isolated session boundaries with mandatory 2FA</span>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
            Quadrox Technologies Limited &bull; Internal System
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 h-full overflow-y-auto overflow-x-hidden relative block bg-slate-950 text-slate-100">
        <div className="w-full max-w-md mx-auto p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 mt-6 sm:mt-12">
          
          <div className="mb-8 flex justify-center lg:justify-start">
            <Image 
              src="/logo.png" 
              alt="LoraBiz Logo" 
              width={300} 
              height={100} 
              className="object-contain h-16 sm:h-20 w-auto brightness-200"
              priority
            />
          </div>

          <div className="mb-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <CrownSimple weight="bold" className="h-3.5 w-3.5" /> MD Authentication
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Executive Sign In</h2>
            <p className="text-slate-400 mt-2 text-sm">Enter your administrative credentials to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-rose-500/10 text-rose-400 text-sm font-medium rounded-lg border border-rose-500/20 flex items-center gap-2 animate-in shake">
                <Info weight="bold" className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200 font-medium text-sm">Administrative Email</Label>
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                    placeholder="example@quadrox.io" 
                    className="pl-11 h-12 text-sm bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-teal-500 transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-200 font-medium text-sm">Passkey / Password</Label>
                </div>
                <div className="relative">
                  <LockKey className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-500" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password}
                    onChange={handleChange}
                    required 
                    placeholder="••••••••••••" 
                    className="pl-11 pr-10 h-12 text-sm bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-teal-500 transition-all" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 focus:outline-none transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeSlash className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-14 text-base font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-black shadow-lg shadow-teal-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <Spinner className="animate-spin h-6 w-6 text-black" weight="bold" />
                ) : (
                  <>Authorize Access <SignIn className="h-5 w-5" weight="bold" /></>
                )}
              </Button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-center">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong className="text-slate-400">Restricted Area:</strong> Unauthorized attempts to access this executive interface are monitored and reported to security personnel.
              </p>
            </div>
          </form>

          <div className="lg:hidden mt-12 text-center pb-8">
             <p className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase">
              Quadrox Technologies Ltd &bull; Security Operations
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
        <Spinner className="animate-spin h-8 w-8 text-teal-500" weight="bold" />
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}
