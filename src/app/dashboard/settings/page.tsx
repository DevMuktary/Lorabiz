"use client";

import { useState, useEffect } from "react";
import { 
  UserCircle, LockKey, EnvelopeSimple, DeviceMobile, 
  WhatsappLogo, CheckCircle, WarningCircle, Spinner, CaretRight, ShieldCheck, Info
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info", message: string } | null>(null);

  // Profile State
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phoneChangedAt: null as string | null,
  });

  // Phone Change State
  const [phoneState, setPhoneState] = useState<{
    newPhone: string;
    otpCode: string;
    step: "INPUT" | "VERIFY";
    loading: boolean;
  }>({ newPhone: "", otpCode: "", step: "INPUT", loading: false });

  // Password Change State
  const [pwdState, setPwdState] = useState<{
    current: string;
    new: string;
    confirm: string;
    otpCode: string;
    step: "INPUT" | "VERIFY";
    loading: boolean;
  }>({ current: "", new: "", confirm: "", otpCode: "", step: "INPUT", loading: false });

  // Notifications State (Visual Only)
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.success) {
        setProfile({
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          phoneChangedAt: data.user.phoneChangedAt,
        });
      }
    } catch (err) {
      showToast("error", "Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // ============================================================================
  // PROFILE HANDLERS
  // ============================================================================
  const handleSaveProfile = async () => {
    if (!profile.firstName || !profile.lastName) {
      return showToast("error", "First and Last names are required.");
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: profile.firstName, lastName: profile.lastName })
      });
      const data = await res.json();
      if (data.success) showToast("success", "Profile updated successfully!");
      else showToast("error", data.message);
    } catch (err) {
      showToast("error", "A network error occurred.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleNotificationToggle = () => {
    showToast("info", "This action is not permissible. Critical notifications cannot be disabled.");
  };

  // ============================================================================
  // PHONE CHANGE HANDLERS
  // ============================================================================
  const handleRequestPhoneOtp = async () => {
    if (!phoneState.newPhone || phoneState.newPhone === profile.phone) {
      return showToast("error", "Please enter a valid new phone number.");
    }
    setPhoneState(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/user/security/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND_OTP", newPhone: phoneState.newPhone })
      });
      const data = await res.json();
      if (data.success) {
        setPhoneState(prev => ({ ...prev, step: "VERIFY" }));
        showToast("success", "Verification code sent to your email.");
      } else {
        showToast("error", data.message);
      }
    } catch (err) {
      showToast("error", "Network error.");
    } finally {
      setPhoneState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneState.otpCode) return showToast("error", "Please enter the verification code.");
    setPhoneState(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/user/security/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VERIFY_OTP", newPhone: phoneState.newPhone, otpCode: phoneState.otpCode })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Phone number updated successfully!");
        setPhoneState({ newPhone: "", otpCode: "", step: "INPUT", loading: false });
        fetchProfile(); // Refresh to get the new lock date
      } else {
        showToast("error", data.message);
      }
    } catch (err) {
      showToast("error", "Network error.");
    } finally {
      setPhoneState(prev => ({ ...prev, loading: false }));
    }
  };

  // ============================================================================
  // PASSWORD CHANGE HANDLERS
  // ============================================================================
  const handleRequestPasswordOtp = async () => {
    if (!pwdState.current || !pwdState.new || !pwdState.confirm) {
      return showToast("error", "Please fill all password fields.");
    }
    if (pwdState.new !== pwdState.confirm) {
      return showToast("error", "New passwords do not match.");
    }
    if (pwdState.new.length < 8) {
      return showToast("error", "New password must be at least 8 characters long.");
    }

    setPwdState(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/user/security/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SEND_OTP", currentPassword: pwdState.current })
      });
      const data = await res.json();
      if (data.success) {
        setPwdState(prev => ({ ...prev, step: "VERIFY" }));
        showToast("success", "Verification code sent to your email.");
      } else {
        showToast("error", data.message);
      }
    } catch (err) {
      showToast("error", "Network error.");
    } finally {
      setPwdState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleVerifyPasswordOtp = async () => {
    if (!pwdState.otpCode) return showToast("error", "Please enter the verification code.");
    setPwdState(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/user/security/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VERIFY_OTP", newPassword: pwdState.new, otpCode: pwdState.otpCode })
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", "Password updated successfully!");
        setPwdState({ current: "", new: "", confirm: "", otpCode: "", step: "INPUT", loading: false });
      } else {
        showToast("error", data.message);
      }
    } catch (err) {
      showToast("error", "Network error.");
    } finally {
      setPwdState(prev => ({ ...prev, loading: false }));
    }
  };

  // Helper to determine if phone is locked
  const isPhoneLocked = () => {
    if (!profile.phoneChangedAt) return false;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return new Date(profile.phoneChangedAt) > thirtyDaysAgo;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner className="animate-spin h-10 w-10 text-primary" weight="bold" />
        <p className="mt-4 text-sm font-bold text-muted-foreground">Loading your preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-4xl mx-auto font-sans">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black text-foreground">Profile Settings</h1>
        <p className="text-sm font-medium text-muted-foreground mt-0.5">Manage your identity, security, and notification preferences.</p>
      </div>

      {/* TOAST SYSTEM */}
      {toast && (
        <div className={`p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-4 shadow-sm ${
          toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400" :
          toast.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400" :
          "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400"
        } border`}>
          {toast.type === "success" && <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" weight="fill" />}
          {toast.type === "error" && <WarningCircle className="h-5 w-5 shrink-0 mt-0.5" weight="fill" />}
          {toast.type === "info" && <Info className="h-5 w-5 shrink-0 mt-0.5" weight="fill" />}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Identity & Notifications */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* CARD 1: PERSONAL INFORMATION */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
              <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <UserCircle className="h-6 w-6" weight="duotone" />
              </div>
              <h3 className="font-black text-lg text-foreground">Personal Information</h3>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">First Name</label>
                  <Input value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} className="h-12 bg-secondary/50 font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Last Name</label>
                  <Input value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} className="h-12 bg-secondary/50 font-bold" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" weight="bold" />
                  <Input value={profile.email} readOnly className="pl-11 h-12 bg-secondary border-border text-muted-foreground font-bold cursor-not-allowed" />
                  <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 text-emerald-500">
                    <ShieldCheck weight="fill" className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Verified</span>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-muted-foreground ml-1">Your email is permanently tied to your wallet and cannot be changed.</p>
              </div>

              <button 
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="h-12 px-6 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50"
              >
                {savingProfile ? <Spinner className="animate-spin h-5 w-5" weight="bold" /> : "Save Changes"}
              </button>
            </div>
          </div>

          {/* CARD 2: NOTIFICATION PREFERENCES */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
              <div className="h-10 w-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
                <DeviceMobile className="h-6 w-6" weight="duotone" />
              </div>
              <h3 className="font-black text-lg text-foreground">Notification Preferences</h3>
            </div>

            <div className="space-y-4">
              <div onClick={handleNotificationToggle} className="flex items-center justify-between p-4 bg-secondary/30 border border-border rounded-2xl cursor-not-allowed opacity-80 group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center">
                    <WhatsappLogo className="h-5 w-5" weight="fill" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">WhatsApp Alerts</p>
                    <p className="text-xs font-medium text-muted-foreground">Receive application updates instantly.</p>
                  </div>
                </div>
                {/* Forced Toggle Design */}
                <div className="w-10 h-6 bg-primary rounded-full relative transition-colors">
                  <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full"></div>
                </div>
              </div>

              <div onClick={handleNotificationToggle} className="flex items-center justify-between p-4 bg-secondary/30 border border-border rounded-2xl cursor-not-allowed opacity-80 group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center">
                    <EnvelopeSimple className="h-5 w-5" weight="fill" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">Email Receipts</p>
                    <p className="text-xs font-medium text-muted-foreground">Receive payment and official document links.</p>
                  </div>
                </div>
                {/* Forced Toggle Design */}
                <div className="w-10 h-6 bg-primary rounded-full relative transition-colors">
                  <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Security & Access */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* CARD 3: PHONE NUMBER SECURITY */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-5 border-b border-border pb-4">
              <div className="h-10 w-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" weight="duotone" />
              </div>
              <h3 className="font-black text-lg text-foreground">Phone Security</h3>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="bg-secondary/50 p-3 rounded-xl border border-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Current Number</p>
                <p className="font-black text-foreground text-lg tracking-wider">{profile.phone}</p>
              </div>

              {isPhoneLocked() ? (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                  <WarningCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" weight="fill" />
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                    Security Lock Active: You recently updated your phone number. You must wait 30 days before changing it again to prevent fraud.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {phoneState.step === "INPUT" ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">New Phone Number</label>
                        <Input 
                          placeholder="e.g. 08012345678" 
                          value={phoneState.newPhone} 
                          onChange={e => setPhoneState({...phoneState, newPhone: e.target.value.replace(/\D/g, "")})} 
                          className="h-12 bg-secondary/50 font-bold tracking-widest" 
                        />
                      </div>
                      <button 
                        onClick={handleRequestPhoneOtp}
                        disabled={phoneState.loading || !phoneState.newPhone}
                        className="w-full h-12 bg-secondary text-foreground hover:bg-foreground hover:text-background font-bold rounded-xl transition-all flex items-center justify-center disabled:opacity-50"
                      >
                        {phoneState.loading ? <Spinner className="animate-spin h-5 w-5" weight="bold" /> : "Request Change"}
                      </button>
                    </>
                  ) : (
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl space-y-4">
                      <p className="text-xs font-bold text-primary text-center">Enter the code sent to your email</p>
                      <Input 
                        placeholder="6-Digit OTP" 
                        maxLength={6}
                        value={phoneState.otpCode} 
                        onChange={e => setPhoneState({...phoneState, otpCode: e.target.value.replace(/\D/g, "")})} 
                        className="h-12 text-center text-lg tracking-[8px] font-black border-primary/30 focus-visible:ring-primary" 
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setPhoneState({...phoneState, step: "INPUT", otpCode: ""})}
                          className="h-12 px-4 bg-background border border-border text-foreground font-bold rounded-xl hover:bg-secondary transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleVerifyPhoneOtp}
                          disabled={phoneState.loading || phoneState.otpCode.length < 6}
                          className="flex-1 h-12 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50"
                        >
                          {phoneState.loading ? <Spinner className="animate-spin h-5 w-5" weight="bold" /> : "Verify & Save"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* CARD 4: PASSWORD CHANGE */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-border pb-4">
              <div className="h-10 w-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
                <LockKey className="h-6 w-6" weight="duotone" />
              </div>
              <h3 className="font-black text-lg text-foreground">Change Password</h3>
            </div>

            <div className="space-y-4">
              {pwdState.step === "INPUT" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Current Password</label>
                    <Input type="password" value={pwdState.current} onChange={e => setPwdState({...pwdState, current: e.target.value})} className="h-12 bg-secondary/50 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">New Password</label>
                    <Input type="password" value={pwdState.new} onChange={e => setPwdState({...pwdState, new: e.target.value})} className="h-12 bg-secondary/50 font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Confirm New Password</label>
                    <Input type="password" value={pwdState.confirm} onChange={e => setPwdState({...pwdState, confirm: e.target.value})} className="h-12 bg-secondary/50 font-bold" />
                  </div>
                  
                  <button 
                    onClick={handleRequestPasswordOtp}
                    disabled={pwdState.loading || !pwdState.current || !pwdState.new || !pwdState.confirm}
                    className="w-full h-12 mt-2 bg-secondary text-foreground hover:bg-red-500 hover:border-red-500 hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {pwdState.loading ? <Spinner className="animate-spin h-5 w-5" weight="bold" /> : <>Request OTP <CaretRight weight="bold" /></>}
                  </button>
                </>
              ) : (
                <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl space-y-4">
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 text-center">Verify your identity to apply the new password</p>
                  <Input 
                    placeholder="6-Digit OTP" 
                    maxLength={6}
                    value={pwdState.otpCode} 
                    onChange={e => setPwdState({...pwdState, otpCode: e.target.value.replace(/\D/g, "")})} 
                    className="h-12 text-center text-lg tracking-[8px] font-black border-red-500/30 focus-visible:ring-red-500" 
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPwdState({...pwdState, step: "INPUT", otpCode: ""})}
                      className="h-12 px-4 bg-background border border-border text-foreground font-bold rounded-xl hover:bg-secondary transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleVerifyPasswordOtp}
                      disabled={pwdState.loading || pwdState.otpCode.length < 6}
                      className="flex-1 h-12 bg-red-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50"
                    >
                      {pwdState.loading ? <Spinner className="animate-spin h-5 w-5" weight="bold" /> : "Apply Password"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
