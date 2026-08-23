"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Envelope, ArrowLeft, Spinner, CheckCircle, 
  ShieldCheck, Info, PaperPlaneTilt, LockKey, ArrowRight 
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TurnstileWidget } from "@/components/TurnstileWidget";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleTurnstileVerify = useCallback((token: string) => {
    (window as any).__lastForgotTurnstileToken = token;
    setCaptchaToken(token);
    setCaptchaVerified(true);
    setError("");
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");

    let activeToken = captchaToken || (window as any).__lastForgotTurnstileToken;
    if (!activeToken) {
      const startTime = Date.now();
      while (!activeToken && Date.now() - startTime < 2000) {
        await new Promise((r) => setTimeout(r, 100));
        activeToken = captchaToken || (window as any).__lastForgotTurnstileToken;
      }
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          captchaToken: activeToken || "",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to send reset link. Please try again.");
        setLoading(false);
        return;
      }

      setIsSubmitted(true);
      setResendCooldown(60); // 60s cooldown
    } catch (err: any) {
      setError("A network error occurred. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          captchaToken,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResendCooldown(60);
      } else {
        setError(data.message || "Could not resend email. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background font-sans selection:bg-[#ff3f7a] selection:text-white relative">
      
      {/* LEFT BRANDING PANEL (DESKTOP) */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-[45%] shrink-0 min-h-screen bg-slate-950 relative overflow-hidden flex-col justify-between">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#ff3f7a]/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 p-12">
          <Link href="/">
            <Image src="/logo.png" alt="LoraBiz Logo" width={160} height={50} className="brightness-0 invert object-contain cursor-pointer" priority />
          </Link>
        </div>

        <div className="relative z-10 p-12 space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold tracking-wide uppercase backdrop-blur-md">
            <LockKey size={14} weight="bold" />
            <span>Account Security</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight text-white">
            Secure Account Recovery
          </h2>

          <p className="text-white/80 text-base leading-relaxed">
            Forgot your credentials? We will send an encrypted one-time recovery link to your registered email address so you can regain access safely.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white/70 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <ShieldCheck size={16} weight="fill" className="text-emerald-400" />
              <span>End-to-End Cryptographic Security</span>
            </div>
            <p className="text-white/60">
              Reset links expire in 60 minutes and are permanently invalidated once used.
            </p>
          </div>
        </div>

        <div className="relative z-10 p-12 flex items-center gap-6 opacity-40 text-xs text-white uppercase tracking-widest font-mono">
          <span>CAC</span>
          <span>•</span>
          <span>NIMC</span>
          <span>•</span>
          <span>BVN</span>
          <span>•</span>
          <span>UTILITIES</span>
        </div>
      </aside>

      {/* RIGHT CONTENT PANEL */}
      <section className="flex-1 w-full lg:ml-[45%] min-h-screen relative flex flex-col justify-center bg-background py-12">
        <article className="w-full max-w-md mx-auto px-6 sm:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Mobile Logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Link href="/">
              <Image src="/logo.png" alt="LoraBiz Logo" width={180} height={60} className="object-contain h-12 w-auto dark:brightness-110" priority />
            </Link>
          </div>

          {/* Back to Login Link */}
          <div className="mb-6">
            <Link 
              href="/auth/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-lg cursor-pointer"
            >
              <ArrowLeft weight="bold" size={14} />
              <span>Back to Log In</span>
            </Link>
          </div>

          {!isSubmitted ? (
            /* ============================================================ */
            /* STEP 1: EMAIL INPUT FORM                                     */
            /* ============================================================ */
            <div>
              <header className="mb-6 text-left">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  Forgot Password?
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  Enter your registered email address and we&apos;ll send you a link to reset your password.
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-destructive/10 text-destructive text-sm font-medium rounded-xl border border-destructive/20 flex items-center gap-2 animate-in shake">
                    <Info weight="bold" size={18} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-semibold text-sm">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Envelope className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      className="pl-11 h-12 text-base bg-secondary/40 border-border text-foreground focus-visible:ring-[#ff3f7a] rounded-xl"
                    />
                  </div>
                </div>

                {/* Background Security Verification */}
                <TurnstileWidget onVerify={handleTurnstileVerify} />

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-base font-bold bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-lg shadow-[#ff3f7a]/20 rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Spinner className="animate-spin h-5 w-5" weight="bold" />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <PaperPlaneTilt size={16} weight="bold" />
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground pt-2">
                  Remember your password?{" "}
                  <Link href="/auth/login" className="font-bold text-[#ff3f7a] hover:underline">
                    Log In
                  </Link>
                </p>
              </form>
            </div>
          ) : (
            /* ============================================================ */
            /* STEP 2: CONFIRMATION SUCCESS VIEW                           */
            /* ============================================================ */
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
              <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle size={36} weight="fill" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">
                  Check your inbox
                </h2>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  We have dispatched a password reset link to:
                </p>
                <p className="font-bold text-foreground text-base mt-1 bg-secondary/60 py-1.5 px-3 rounded-lg border border-border inline-block">
                  {email}
                </p>
              </div>

              <div className="bg-secondary/40 border border-border rounded-xl p-4 text-xs text-muted-foreground text-left space-y-2">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Info size={15} weight="bold" className="text-primary" />
                  <span>Didn&apos;t receive the email?</span>
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11.5px]">
                  <li>Check your spam or junk folder.</li>
                  <li>Verify that you entered the correct email address.</li>
                  <li>Wait a minute before requesting a new link.</li>
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleResend}
                  className="w-full h-11 text-xs font-bold rounded-xl cursor-pointer"
                >
                  {loading ? (
                    <Spinner className="animate-spin h-4 w-4 mr-1.5" />
                  ) : null}
                  {resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : "Resend Reset Email"}
                </Button>

                <Link
                  href="/auth/login"
                  className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#ff3f7a] hover:underline pt-2"
                >
                  <span>Return to Log In</span>
                  <ArrowRight size={13} weight="bold" />
                </Link>
              </div>
            </div>
          )}

        </article>
      </section>

    </div>
  );
}
