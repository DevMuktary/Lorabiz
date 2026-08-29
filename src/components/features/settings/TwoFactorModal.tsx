"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  ShieldCheck, LockKey, DeviceMobile, EnvelopeSimple, 
  Key, Copy, Check, Spinner, X, ArrowLeft, DownloadSimple, AlertTriangle
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  twoFactorEnabled: boolean;
  twoFactorMethod: "EMAIL" | "AUTHENTICATOR" | null;
  backupCodesCount: number;
  userEmail: string;
  onStatusChange: () => void;
}

export default function TwoFactorModal({
  isOpen,
  onClose,
  twoFactorEnabled,
  twoFactorMethod,
  backupCodesCount,
  userEmail,
  onStatusChange,
}: TwoFactorModalProps) {
  // Setup steps: 'CHOICE' | 'AUTHENTICATOR_SETUP' | 'EMAIL_SETUP' | 'SHOW_BACKUP_CODES' | 'DISABLE_CONFIRM' | 'REGENERATE_CONFIRM'
  const [step, setStep] = useState<
    "CHOICE" | "AUTHENTICATOR_SETUP" | "EMAIL_SETUP" | "SHOW_BACKUP_CODES" | "DISABLE_CONFIRM" | "REGENERATE_CONFIRM"
  >("CHOICE");

  const [selectedMethod, setSelectedMethod] = useState<"EMAIL" | "AUTHENTICATOR">("AUTHENTICATOR");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const resetState = () => {
    setStep("CHOICE");
    setQrCode(null);
    setSecret(null);
    setVerificationCode("");
    setPassword("");
    setError("");
    setSuccessMsg("");
    setBackupCodes([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // 1. Initialize Setup
  const startSetup = async (method: "EMAIL" | "AUTHENTICATOR") => {
    setSelectedMethod(method);
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to initialize 2FA setup.");
        setLoading(false);
        return;
      }

      if (method === "AUTHENTICATOR") {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setStep("AUTHENTICATOR_SETUP");
      } else {
        setStep("EMAIL_SETUP");
      }
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Confirm Setup Code
  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/confirm-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode.trim(), method: selectedMethod }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setBackupCodes(data.backupCodes || []);
        setStep("SHOW_BACKUP_CODES");
        onStatusChange();
      } else {
        setError(data.error || "Invalid verification code.");
      }
    } catch (e) {
      setError("Network error verifying code.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Disable 2FA
  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        onStatusChange();
        handleClose();
      } else {
        setError(data.error || "Failed to disable 2FA.");
      }
    } catch (e) {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Regenerate Backup Codes
  const handleRegenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/backup-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setBackupCodes(data.backupCodes || []);
        setStep("SHOW_BACKUP_CODES");
        onStatusChange();
      } else {
        setError(data.error || "Failed to regenerate backup codes.");
      }
    } catch (e) {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  const copyAllCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const downloadCodes = () => {
    const textContent = `LORABIZ 2FA RECOVERY BACKUP CODES\nGenerated: ${new Date().toLocaleString()}\nEmail: ${userEmail}\n\nIMPORTANT: Each backup code can only be used once if you lose access to your authenticator app.\n\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n`;
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lorabiz-recovery-codes.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <ShieldCheck weight="fill" className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-foreground">Two-Factor Authentication</h3>
              <p className="text-xs font-medium text-muted-foreground">Add an extra layer of security to your wallet & account.</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary">
            <X size={18} weight="bold" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-destructive/10 text-destructive text-xs font-bold rounded-2xl border border-destructive/20 animate-in shake">
            {error}
          </div>
        )}

        {/* STEP: CURRENT STATUS / CHOICE */}
        {step === "CHOICE" && (
          <div className="space-y-5">
            {twoFactorEnabled ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 space-y-1">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <ShieldCheck weight="fill" className="h-5 w-5" />
                    <span>2FA is Currently Active</span>
                  </div>
                  <p className="text-xs opacity-90">
                    Your account is protected via <strong>{twoFactorMethod === "AUTHENTICATOR" ? "Google / Authy Authenticator" : "Email Passkey"}</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Key weight="fill" className="text-amber-500" /> Recovery Codes Available:
                    </span>
                    <span className="font-black font-mono px-2.5 py-0.5 rounded-full bg-secondary text-foreground">
                      {backupCodesCount} Remaining
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Single-use recovery codes allow you to log in if you ever lose your authenticator app or phone.
                  </p>
                  <button 
                    type="button" 
                    onClick={() => { setError(""); setStep("REGENERATE_CONFIRM"); }} 
                    className="text-primary font-black hover:underline inline-block pt-1"
                  >
                    Generate New Recovery Codes →
                  </button>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => { setError(""); setStep("DISABLE_CONFIRM"); }} 
                    className="w-full h-11 text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 rounded-xl"
                  >
                    Disable Two-Factor Authentication
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Choose how you want to receive your one-time authorization codes when signing in:
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {/* Authenticator App */}
                  <div 
                    onClick={() => startSetup("AUTHENTICATOR")}
                    className="p-4 rounded-2xl border-2 border-border hover:border-primary bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-all flex items-center gap-4 group"
                  >
                    <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <DeviceMobile weight="fill" className="h-6 w-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-foreground">Authenticator App</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">Recommended</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Google Authenticator, Microsoft Authenticator, or Authy.</p>
                    </div>
                  </div>

                  {/* Email Passkey */}
                  <div 
                    onClick={() => startSetup("EMAIL")}
                    className="p-4 rounded-2xl border-2 border-border hover:border-primary bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-all flex items-center gap-4 group"
                  >
                    <div className="h-11 w-11 rounded-xl bg-secondary text-foreground flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <EnvelopeSimple weight="fill" className="h-6 w-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-black text-sm text-foreground">Email OTP</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Receive a 6-digit code in your email inbox at every login.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP: AUTHENTICATOR APP SETUP (QR CODE) */}
        {step === "AUTHENTICATOR_SETUP" && (
          <form onSubmit={handleConfirmCode} className="space-y-4">
            <button 
              type="button" 
              onClick={() => setStep("CHOICE")} 
              className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1"
            >
              <ArrowLeft weight="bold" /> Back
            </button>

            <div className="text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                1. Scan this QR code with your authenticator app (Google Authenticator, Authy):
              </p>

              {qrCode ? (
                <div className="inline-block p-3 rounded-2xl bg-white border border-border shadow-md">
                  <Image src={qrCode} alt="2FA QR Code" width={180} height={180} className="object-contain" />
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center">
                  <Spinner className="animate-spin h-8 w-8 text-primary" weight="bold" />
                </div>
              )}

              {secret && (
                <div className="text-[11px] text-muted-foreground">
                  <span>Manual key: </span>
                  <code className="font-mono font-bold text-foreground bg-secondary px-2 py-1 rounded select-all">{secret}</code>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-foreground">2. Enter the 6-digit code shown in your app:</label>
              <Input 
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
                className="h-12 text-center text-xl font-mono tracking-widest font-black bg-secondary"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || verificationCode.length !== 6} 
              className="w-full h-11 font-bold text-xs rounded-xl"
            >
              {loading ? <Spinner className="animate-spin h-4 w-4" weight="bold" /> : "Verify & Activate 2FA"}
            </Button>
          </form>
        )}

        {/* STEP: EMAIL OTP SETUP */}
        {step === "EMAIL_SETUP" && (
          <form onSubmit={handleConfirmCode} className="space-y-4">
            <button 
              type="button" 
              onClick={() => setStep("CHOICE")} 
              className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1"
            >
              <ArrowLeft weight="bold" /> Back
            </button>

            <div className="p-4 rounded-2xl bg-secondary/40 border border-border text-center space-y-1">
              <p className="text-xs font-bold text-foreground">Verification Code Sent</p>
              <p className="text-xs text-muted-foreground">
                We sent a 6-digit passkey to <strong className="text-foreground">{userEmail}</strong>.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-foreground">Enter 6-digit Passkey:</label>
              <Input 
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
                className="h-12 text-center text-xl font-mono tracking-widest font-black bg-secondary"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || verificationCode.length !== 6} 
              className="w-full h-11 font-bold text-xs rounded-xl"
            >
              {loading ? <Spinner className="animate-spin h-4 w-4" weight="bold" /> : "Verify & Activate 2FA"}
            </Button>
          </form>
        )}

        {/* STEP: SHOW BACKUP RECOVERY CODES */}
        {step === "SHOW_BACKUP_CODES" && (
          <div className="space-y-5">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-2xl flex items-start gap-2.5">
              <AlertTriangle weight="fill" className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold">Save Your Recovery Backup Codes!</p>
                <p className="opacity-90">
                  If you ever lose access to your phone or authenticator app, each code can be used <strong>once</strong> to log in.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-4 rounded-2xl bg-secondary/50 border border-border font-mono text-xs sm:text-sm font-bold text-foreground text-center">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="p-2 rounded-xl bg-background border border-border select-all">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2.5">
              <Button 
                type="button" 
                variant="outline" 
                onClick={copyAllCodes} 
                className="flex-1 h-11 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                {copiedCode ? <Check weight="bold" className="text-emerald-500" /> : <Copy weight="bold" />}
                <span>{copiedCode ? "Copied!" : "Copy Codes"}</span>
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={downloadCodes} 
                className="flex-1 h-11 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <DownloadSimple weight="bold" />
                <span>Download .TXT</span>
              </Button>
            </div>

            <Button 
              type="button" 
              onClick={handleClose} 
              className="w-full h-11 font-bold text-xs rounded-xl"
            >
              I Have Saved My Recovery Codes
            </Button>
          </div>
        )}

        {/* STEP: DISABLE CONFIRMATION */}
        {step === "DISABLE_CONFIRM" && (
          <form onSubmit={handleDisable2FA} className="space-y-4">
            <button 
              type="button" 
              onClick={() => setStep("CHOICE")} 
              className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1"
            >
              <ArrowLeft weight="bold" /> Back
            </button>

            <p className="text-xs text-muted-foreground">
              Please confirm your current password to disable Two-Factor Authentication:
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Account Password</label>
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 bg-secondary"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || !password} 
              className="w-full h-11 bg-destructive hover:bg-destructive/90 text-white font-bold text-xs rounded-xl"
            >
              {loading ? <Spinner className="animate-spin h-4 w-4" weight="bold" /> : "Confirm & Disable 2FA"}
            </Button>
          </form>
        )}

        {/* STEP: REGENERATE CODES CONFIRMATION */}
        {step === "REGENERATE_CONFIRM" && (
          <form onSubmit={handleRegenerateCodes} className="space-y-4">
            <button 
              type="button" 
              onClick={() => setStep("CHOICE")} 
              className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1"
            >
              <ArrowLeft weight="bold" /> Back
            </button>

            <p className="text-xs text-muted-foreground">
              Generating new recovery codes will immediately invalidate any previous unused codes. Confirm your password to proceed:
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Account Password</label>
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 bg-secondary"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || !password} 
              className="w-full h-11 font-bold text-xs rounded-xl"
            >
              {loading ? <Spinner className="animate-spin h-4 w-4" weight="bold" /> : "Generate Fresh Backup Codes"}
            </Button>
          </form>
        )}

      </div>
    </div>
  );
}
