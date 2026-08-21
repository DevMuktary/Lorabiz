"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  LockKey, Eye, EyeSlash, CheckCircle, 
  WarningCircle, Spinner, ArrowLeft, ShieldCheck, 
  Sparkle, ArrowRight 
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [verifyingToken, setVerifyingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // 1. Verify token on page load
  useEffect(() => {
    async function verify() {
      if (!token || !email) {
        setTokenValid(false);
        setTokenError("Missing token or email in password reset URL.");
        setVerifyingToken(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/verify-reset-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });

        const data = await res.json();
        if (data.valid) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setTokenError(data.message || "This password reset link is invalid or has expired.");
        }
      } catch (err) {
        setTokenValid(false);
        setTokenError("Could not verify reset link. Please check your internet connection.");
      } finally {
        setVerifyingToken(false);
      }
    }

    verify();
  }, [token, email]);

  // 2. Countdown redirect on success
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success) {
      timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/auth/login");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [success, router]);

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecialOrUpper = /[A-Z]|[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasMinLength) {
      setSubmitError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(data.message || "Failed to reset password. Please request a new link.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setSubmitError("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background font-sans selection:bg-[#ff3f7a] selection:text-white relative">
      
      {/* LEFT BRANDING PANEL */}
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
            <ShieldCheck size={14} weight="fill" className="text-emerald-400" />
            <span>Encrypted Password Update</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight text-white">
            Set a New Secure Password
          </h2>

          <p className="text-white/80 text-base leading-relaxed">
            Create a strong, unique password to protect your LoraBiz dashboard, wallet, and statutory filing records.
          </p>
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

          {/* ============================================================ */}
          {/* STATE 1: LOADING & VERIFYING TOKEN                           */}
          {/* ============================================================ */}
          {verifyingToken ? (
            <div className="text-center py-12 space-y-4">
              <Spinner className="animate-spin h-10 w-10 text-[#ff3f7a] mx-auto" weight="bold" />
              <h2 className="text-xl font-bold text-foreground">Verifying security token...</h2>
              <p className="text-xs text-muted-foreground">Please hold on while we validate your reset link.</p>
            </div>
          ) : !tokenValid ? (
            /* ============================================================ */
            /* STATE 2: INVALID OR EXPIRED TOKEN                           */
            /* ============================================================ */
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
              <div className="h-16 w-16 bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <WarningCircle size={36} weight="fill" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">
                  Invalid or Expired Link
                </h2>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  {tokenError || "This password reset link has expired or has already been used."}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  href="/auth/forgot-password"
                  className="w-full inline-flex items-center justify-center gap-2 h-12 font-bold text-sm bg-[#ff3f7a] text-white hover:bg-[#e02b62] rounded-xl shadow-lg shadow-[#ff3f7a]/20 transition-all cursor-pointer"
                >
                  <span>Request a New Reset Link</span>
                  <ArrowRight size={15} weight="bold" />
                </Link>

                <Link
                  href="/auth/login"
                  className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground pt-2"
                >
                  <ArrowLeft size={13} weight="bold" />
                  <span>Back to Log In</span>
                </Link>
              </div>
            </div>
          ) : success ? (
            /* ============================================================ */
            /* STATE 3: PASSWORD RESET SUCCESS                             */
            /* ============================================================ */
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-300">
              <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle size={36} weight="fill" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight">
                  Password Updated!
                </h2>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  Your password has been successfully changed. Redirecting to login in{" "}
                  <strong className="text-foreground">{redirectCountdown}s</strong>...
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/auth/login"
                  className="w-full inline-flex items-center justify-center gap-2 h-12 font-bold text-sm bg-primary text-primary-foreground rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <span>Log In Now</span>
                  <ArrowRight size={15} weight="bold" />
                </Link>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* STATE 4: NEW PASSWORD FORM                                  */
            /* ============================================================ */
            <div>
              <header className="mb-6 text-left">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  Reset Password
                </h1>
                <p className="text-muted-foreground mt-1.5 text-xs sm:text-sm">
                  Create a new password for <strong className="text-foreground">{email}</strong>
                </p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-5">
                {submitError && (
                  <div className="p-4 bg-destructive/10 text-destructive text-sm font-medium rounded-xl border border-destructive/20 flex items-center gap-2 animate-in shake">
                    <WarningCircle weight="bold" size={18} className="shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-semibold text-sm">
                    New Password
                  </Label>
                  <div className="relative">
                    <LockKey className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" weight="bold" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (submitError) setSubmitError("");
                      }}
                      className="pl-11 pr-10 h-12 text-base bg-secondary/40 border-border text-foreground focus-visible:ring-[#ff3f7a] rounded-xl font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeSlash size={18} weight="fill" /> : <Eye size={18} weight="fill" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground font-semibold text-sm">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <LockKey className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" weight="bold" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (submitError) setSubmitError("");
                      }}
                      className="pl-11 pr-10 h-12 text-base bg-secondary/40 border-border text-foreground focus-visible:ring-[#ff3f7a] rounded-xl font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeSlash size={18} weight="fill" /> : <Eye size={18} weight="fill" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Checklist */}
                <div className="bg-secondary/40 border border-border rounded-xl p-3.5 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle
                      size={14}
                      weight="fill"
                      className={hasMinLength ? "text-emerald-500" : "text-muted-foreground/40"}
                    />
                    <span className={hasMinLength ? "text-foreground font-medium" : ""}>
                      At least 8 characters long
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle
                      size={14}
                      weight="fill"
                      className={hasNumber ? "text-emerald-500" : "text-muted-foreground/40"}
                    />
                    <span className={hasNumber ? "text-foreground font-medium" : ""}>
                      Contains at least one number
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle
                      size={14}
                      weight="fill"
                      className={passwordsMatch ? "text-emerald-500" : "text-muted-foreground/40"}
                    />
                    <span className={passwordsMatch ? "text-foreground font-medium" : ""}>
                      Passwords match
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !hasMinLength || !passwordsMatch}
                  className="w-full h-12 text-base font-bold bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-lg shadow-[#ff3f7a]/20 rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Spinner className="animate-spin h-5 w-5" weight="bold" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Sparkle size={18} weight="fill" />
                      <span>Update Password</span>
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground pt-1">
                  <Link href="/auth/login" className="font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                    <ArrowLeft size={13} weight="bold" />
                    <span>Cancel and Back to Login</span>
                  </Link>
                </p>
              </form>
            </div>
          )}

        </article>
      </section>

    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="animate-spin h-8 w-8 text-[#ff3f7a]" weight="bold" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
