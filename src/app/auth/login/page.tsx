"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  EnvelopeSimple, LockKey, SignIn, Spinner, 
  RocketLaunch, CheckCircle, ShieldCheck, Eye, EyeSlash, Info
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRegistered = searchParams.get("registered") === "true";
  
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

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
      });

      if (res?.error) {
        // Handle native NextAuth errors vs our custom thrown errors (Suspended, Rate Limit)
        setError(res.error === "CredentialsSignin" ? "Invalid email or password. Please try again." : res.error);
        setLoading(false);
      } else {
        // Password was correct, redirect to the new 2FA screen
        router.push(`/auth/verify-login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full flex bg-background font-sans selection:bg-[#ff3f7a] selection:text-white overflow-hidden transition-colors duration-300">
      
      {/* LEFT PANEL - Fixed Branding */}
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
            <Image 
              src="/logo.png" 
              alt="LoraBiz Logo" 
              width={340} 
              height={120} 
              className="object-contain h-20 lg:h-24 w-auto dark:brightness-110"
              priority
            />
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Log in</h2>
            <p className="text-muted-foreground mt-2 text-[16px]">Enter your credentials to access your portal.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Success Message from Registration */}
            {isRegistered && !error && (
              <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-lg border border-emerald-500/20 flex items-start gap-3 animate-in fade-in">
                <CheckCircle weight="fill" className="h-5 w-5 shrink-0 mt-0.5" />
                <p>Account created successfully! Please log in below to continue.</p>
              </div>
            )}

            {/* Error Message (Handles Suspension / Rate Limits / Invalid Creds) */}
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
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={handleChange}
                    required 
                    placeholder="you@example.com" 
                    className="pl-11 h-12 text-[16px] bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-[#ff3f7a] transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                  <Link href="/auth/forgot-password" className="text-sm font-semibold text-[#ff3f7a] hover:underline transition-all">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <LockKey className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={formData.password}
                    onChange={handleChange}
                    required 
                    placeholder="••••••••" 
                    className="pl-11 pr-10 h-12 text-[16px] bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-[#ff3f7a] transition-all" 
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

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-14 text-lg font-semibold bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-xl shadow-[#ff3f7a]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <Spinner className="animate-spin h-6 w-6" weight="bold" />
                ) : (
                  <>Log In <SignIn className="h-5 w-5" weight="bold" /></>
                )}
              </Button>
            </div>

            <div className="text-center text-muted-foreground mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="font-semibold text-[#ff3f7a] hover:underline transition-all">
                Register here
              </Link>
            </div>
          </form>

          <div className="lg:hidden mt-12 text-center pb-8">
             <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Powered by Quadrox Technologies Ltd
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Spinner className="animate-spin h-8 w-8 text-[#ff3f7a]" weight="bold" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
