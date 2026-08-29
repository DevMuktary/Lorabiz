"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  ShieldCheck, DeviceMobile, EnvelopeSimple, 
  Key, Copy, Check, Spinner, X, ArrowLeft, DownloadSimple, Warning
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

  if (!isOpen) return null;

  const resetState = () => {
    setStep("CHOICE");
    setQrCode(null);
    setSecret(null);
    setVerificationCode("");
    setPassword("");
    setError("");
    setBackupCodes([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

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
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const downloadCodes = () => {
    const textContent = `LORABIZ 2FA RECOVERY BACKUP CODES\nGenerated: ${new Date().toLocaleString()}\nEmail: ${userEmail}\n\nIMPORTANT: Each backup code can only be used once if you lose access to your primary device.\n\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n`;
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lorabiz-backup-codes.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-5 shadow-lg text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck weight="fill" className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Two-Factor Authentication</h3>
              <p className="text-xs text-muted-foreground">Protect your account and wallet access</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary">
            <X size={16} weight="bold" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-xs font-semibold rounded-xl border border-destructive/20">
            {error}
          </div>
        )}

        {/* STEP: CHOICE */}
        {step === "CHOICE" && (
          <div className="space-y-4">
            {twoFactorEnabled ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <ShieldCheck weight="fill" className="h-4 w-4" />
                    <span>2FA is Active</span>
                  </div>
                  <p className="text-xs opacity-90">
                    Active method: <strong>{twoFactorMethod === "AUTHENTICATOR" ? "Authenticator App" : "Email Passkey"}</strong>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/50 border border-border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Key weight="fill" className="text-amber-500" /> Recovery Codes:
                    </span>
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-background border border-border text-foreground">
                      {backupCodesCount} remaining
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Single-use codes allow login if you lose your phone or authenticator app.
                  </p>
                  <button 
                    type="button" 
                    onClick={() => { setError(""); setStep("REGENERATE_CONFIRM"); }} 
                    className="text-primary font-bold hover:underline inline-block pt-1 text-xs"
                  >
                    Generate New Recovery Codes →
                  </button>
                </div>

                <div className="pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => { setError(""); setStep("DISABLE_CONFIRM"); }} 
                    className="w-full h-10 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 rounded-xl"
                  >
                    Disable Two-Factor Authentication
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Select your preferred method for two-factor verification:
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  <div 
                    onClick={() => startSetup("AUTHENTICATOR")}
                    className="p-3.5 rounded-xl border border-border hover:border-primary/50 bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-colors flex items-center gap-3"
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <DeviceMobile weight="fill" className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">Authenticator App</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary">Recommended</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Google Authenticator, Microsoft Authenticator, or Authy</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => startSetup("EMAIL")}
                    className="p-3.5 rounded-xl border border-border hover:border-primary/50 bg-secondary/20 hover:bg-secondary/40 cursor-pointer transition-colors flex items-center gap-3"
                  >
                    <div className="h-9 w-9 rounded-lg bg-secondary text-foreground flex items-center justify-center shrink-0">
                      <EnvelopeSimple weight="fill" className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-xs text-foreground">Email Passkey</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Receive a 6-digit code in your email inbox at sign in</p>
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
              className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft weight="bold" /> Back
            </button>

            <div className="text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                1. Scan this QR code with Google Authenticator or Authy:
              </p>

              {qrCode ? (
                <div className="inline-block p-2 rounded-xl bg-white border border-border">
                  <Image src={qrCode} alt="2FA QR Code" width={150} height={150} className="object-contain" />
                </div>
              ) : (
                <div className="h-36 flex items-center justify-center">
                  <Spinner className="animate-spin h-6 w-6 text-primary" weight="bold" />
                </div>
              )}

              {secret && (
                <div className="text-[11px] text-muted-foreground">
                  <span>Secret Key: </span>
                  <code className="font-mono font-bold text-foreground bg-secondary px-2 py-0.5 rounded select-all">{secret}</code>
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-foreground">2. Enter 6-digit verification code:</label>
              <Input 
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
                className="h-10 text-center text-lg font-mono font-bold bg-secondary"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || verificationCode.length !== 6} 
              className="w-full h-10 font-bold text-xs rounded-xl"
            >
              {loading ? <Spinner className="animate-spin h-4 w-4" weight="bold" /> : "Verify & Enable 2FA"}
            </Button>
          </form>
        )}

        {/* STEP: EMAIL OTP SETUP */}
        {step === "EMAIL_SETUP" && (
          <form onSubmit={handleConfirmCode} className="space-y-4">
            <button 
              type="button" 
              onClick={() => setStep("CHOICE")} 
              className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft weight="bold" /> Back
            </button>

            <div className="p-3.5 rounded-xl bg-secondary/50 border border-border text-center space-y-0.5">
              <p className="text-xs font-bold text-foreground">Verification Code Sent</p>
              <p className="text-[11px] text-muted-foreground">
                We sent a 6-digit code to <strong className="text-foreground">{userEmail}</strong>.
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-foreground">Enter 6-digit code:</label>
              <Input 
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                required
                className="h-10 text-center text-lg font-mono font-bold bg-secondary"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || verificationCode.length !== 6} 
              className="w-full h-10 font-bold text-xs rounded-xl"
            >
              {loading ? <Spinner className="animate-spin h-4 w-4" weight="bold" /> : "Verify & Enable 2FA"}
            </Button>
          </form>
        )}

        {/* STEP: SHOW BACKUP RECOVERY CODES */}
        {step === "SHOW_BACKUP_CODES" && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl flex items-start gap-2">
              <Warning weight="fill" className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <p className="font-bold">Save Your Recovery Codes</p>
                <p className="opacity-90 text-[11px]">
                  If you lose your device, each code can be used once to sign in.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-secondary/40 border border-border font-mono text-xs font-bold text-foreground text-center">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="p-1.5 rounded-lg bg-background border border-border select-all">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={copyAllCodes} 
                className="flex-1 h-9 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
              >
                {copiedCode ? <Check weight="bold" className="text-emerald-500" /> : <Copy weight="bold" />}
                <span>{copiedCode ? "Copied" : "Copy Codes"}</span>
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={downloadCodes} 
                className="flex-1 h-9 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
              >
                <DownloadSimple weight="bold" />
                <span>Download .TXT</span>
              </Button>
            </div>

            <Button 
              type="button" 
              onClick={handleClose} 
              className="w-full h-10 font-bold text-xs rounded-xl"
            >
              Done, I Saved My Codes
            </Button>
          </div>
        )}

        {/* STEP: DISABLE CONFIRMATION */}
        {step === "DISABLE_CONFIRM" && (
          <form onSubmit={handleDisable2FA} className="space-y-4">
            <button 
              type="button" 
              onClick={() => setStep("CHOICE")} 
              className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft weight="bold" /> Back
            </button>

            <p className="text-xs text-muted-foreground">
              Confirm your password to disable Two-Factor Authentication:
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Password</label>
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-10 bg-secondary"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || !password} 
              className="w-full h-10 bg-destructive hover:bg-destructive/90 text-white font-bold text-xs rounded-xl"
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
              className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft weight="bold" /> Back
            </button>

            <p className="text-xs text-muted-foreground">
              Generating new codes will invalidate your previous recovery codes. Enter your password:
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Password</label>
              <Input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-10 bg-secondary"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || !password} 
              className="w-full h-10 font-bold text-xs rounded-xl"
            >
              {loading ? <Spinner className="animate-spin h-4 w-4" weight="bold" /> : "Generate New Backup Codes"}
            </Button>
          </form>
        )}

      </div>
    </div>
  );
}
