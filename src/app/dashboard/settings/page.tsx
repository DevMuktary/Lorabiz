"use client";

import { useState, useEffect } from "react";
import { 
  UserCircle, LockKey, EnvelopeSimple, DeviceMobile, 
  WhatsappLogo, ShieldCheck, Spinner, PencilSimple, Camera, Key, CheckCircle, Bell
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import AvatarUploadModal from "@/components/features/settings/AvatarUploadModal";
import PhoneChangeModal from "@/components/features/settings/PhoneChangeModal";
import PasswordChangeModal from "@/components/features/settings/PasswordChangeModal";
import TwoFactorModal from "@/components/features/settings/TwoFactorModal";
import TierAvatar from "@/components/ui/TierAvatar";
import { useLoyalty } from "@/lib/useLoyalty";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [updatingAlerts, setUpdatingAlerts] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info", message: string } | null>(null);

  const { profile: loyaltyProfile } = useLoyalty();

  // Modals state
  const [activeModal, setActiveModal] = useState<"AVATAR" | "PHONE" | "PASSWORD" | "2FA" | null>(null);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    image: null as string | null,
    phoneChangedAt: null as string | null,
    twoFactorEnabled: false,
    twoFactorMethod: null as "EMAIL" | "AUTHENTICATOR" | null,
    backupCodesCount: 0,
    emailLoginAlerts: true,
  });

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
          image: data.user.image || null,
          phoneChangedAt: data.user.phoneChangedAt,
          twoFactorEnabled: data.user.twoFactorEnabled || false,
          twoFactorMethod: data.user.twoFactorMethod || null,
          backupCodesCount: data.user.backupCodesCount || 0,
          emailLoginAlerts: data.user.emailLoginAlerts ?? true,
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
  }, []);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const toggleEmailLoginAlerts = async () => {
    const newValue = !profile.emailLoginAlerts;
    setProfile(prev => ({ ...prev, emailLoginAlerts: newValue }));
    setUpdatingAlerts(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailLoginAlerts: newValue }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", newValue ? "Login security alerts enabled." : "Login security alerts disabled.");
      } else {
        setProfile(prev => ({ ...prev, emailLoginAlerts: !newValue }));
        showToast("error", data.message || "Failed to update notification setting.");
      }
    } catch (err) {
      setProfile(prev => ({ ...prev, emailLoginAlerts: !newValue }));
      showToast("error", "Network error occurred.");
    } finally {
      setUpdatingAlerts(false);
    }
  };

  const isPhoneLocked = () => {
    if (!profile.phoneChangedAt) return false;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return new Date(profile.phoneChangedAt) > thirtyDaysAgo;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Spinner className="animate-spin h-8 w-8 text-primary" weight="bold" />
        <p className="mt-3 text-sm font-bold text-muted-foreground">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans pb-12">
      <div>
        <h1 className="text-2xl font-black text-foreground">Profile & Settings</h1>
        <p className="text-sm font-medium text-muted-foreground">Manage your identity, account security, and notification preferences.</p>
      </div>

      {toast && (
        <div className={`p-3.5 rounded-xl flex items-center gap-3 shadow-sm border text-xs font-bold ${
          toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
          toast.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-600" :
          "bg-blue-500/10 border-blue-500/20 text-blue-600"
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Identity & Notifications */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Identity Profile Card */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
            {/* Avatar Header */}
            <div className="flex items-center gap-4 pb-5 border-b border-border">
              <div className="relative group cursor-pointer" onClick={() => setActiveModal("AVATAR")}>
                <TierAvatar
                  image={profile.image}
                  initials={`${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`}
                  tierLevel={loyaltyProfile?.currentTier?.level || "TIER_1"}
                  size="xl"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                  <Camera size={18} weight="fill" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-foreground">{profile.firstName} {profile.lastName}</h3>
                  {loyaltyProfile?.currentTier && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {loyaltyProfile.currentTier.name}
                    </span>
                  )}
                </div>
                <button onClick={() => setActiveModal("AVATAR")} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  Change Photo
                </button>
              </div>
            </div>

            {/* Read-Only Verified Legal Name */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Legal Identity</span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-500/20">
                  <CheckCircle weight="fill" className="h-3 w-3" /> Verified Name
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">First Name</label>
                  <Input value={profile.firstName} readOnly className="h-10 bg-secondary border-border text-foreground font-semibold cursor-not-allowed" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Last Name</label>
                  <Input value={profile.lastName} readOnly className="h-10 bg-secondary border-border text-foreground font-semibold cursor-not-allowed" />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Legal names are locked to maintain compliance with CAC/NIN verification standards and loyalty tier status.
              </p>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Registered Email</label>
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" weight="bold" />
                  <Input value={profile.email} readOnly className="pl-10 h-10 bg-secondary border-border text-muted-foreground font-semibold cursor-not-allowed" />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Bell className="h-4 w-4 text-primary" weight="bold" />
              <h3 className="font-bold text-sm text-foreground">Notification Preferences</h3>
            </div>

            <div className="space-y-3">
              {/* Login Security Alerts */}
              <div 
                onClick={toggleEmailLoginAlerts} 
                className="flex items-center justify-between p-3.5 bg-secondary/30 hover:bg-secondary/50 border border-border rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <EnvelopeSimple className="h-5 w-5 text-primary" weight="bold" />
                  <div>
                    <p className="font-bold text-xs text-foreground">Email Sign-In Alerts</p>
                    <p className="text-[11px] text-muted-foreground">Instant notifications when a new login is detected on your account.</p>
                  </div>
                </div>
                <button 
                  type="button"
                  className={`w-9 h-5 rounded-full transition-colors relative focus:outline-none ${profile.emailLoginAlerts ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`absolute top-0.5 h-4 w-4 bg-white rounded-full transition-transform ${profile.emailLoginAlerts ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>

              {/* WhatsApp Alerts */}
              <div className="flex items-center justify-between p-3.5 bg-secondary/20 border border-border rounded-xl opacity-90">
                <div className="flex items-center gap-3">
                  <WhatsappLogo className="h-5 w-5 text-[#25D366]" weight="fill" />
                  <div>
                    <p className="font-bold text-xs text-foreground">WhatsApp Alerts</p>
                    <p className="text-[11px] text-muted-foreground">Critical registration updates and transaction notices.</p>
                  </div>
                </div>
                <div className="w-9 h-5 bg-primary rounded-full relative"><div className="absolute right-0.5 top-0.5 h-4 w-4 bg-white rounded-full" /></div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Phone & Unified Security Card */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Phone Card */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-500" weight="fill" />
                <h3 className="font-bold text-sm text-foreground">Phone Verification</h3>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">Registered Number</p>
              <p className="font-bold text-foreground text-base tracking-wider mt-0.5">{profile.phone}</p>
            </div>
            {isPhoneLocked() ? (
              <p className="text-[11px] font-semibold text-amber-600 bg-amber-500/10 p-2.5 rounded-lg">
                Security Lock: You updated your number recently. Wait 30 days before changing again.
              </p>
            ) : (
              <button 
                onClick={() => setActiveModal("PHONE")} 
                className="w-full h-9 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <PencilSimple weight="bold" /> Change Number
              </button>
            )}
          </div>

          {/* Unified Security & Access Card (Password & 2FA) */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-2.5">
              <LockKey className="h-4 w-4 text-primary" weight="fill" />
              <h3 className="font-bold text-sm text-foreground">Security & Access</h3>
            </div>

            {/* Section 1: Account Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Account Password</span>
                <span className="text-[10px] font-semibold text-muted-foreground">Protected</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Ensure your account uses a strong, unique password to safeguard your wallet balance.
              </p>
              <button 
                onClick={() => setActiveModal("PASSWORD")} 
                className="w-full h-9 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                Update Password
              </button>
            </div>

            <div className="border-t border-border pt-4 space-y-2.5">
              {/* Section 2: Two-Factor Authentication */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-primary" weight="bold" /> 2-Step Verification
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  profile.twoFactorEnabled 
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                    : "bg-secondary text-muted-foreground border-border"
                }`}>
                  {profile.twoFactorEnabled ? "Active" : "Disabled"}
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {profile.twoFactorEnabled 
                  ? `Protected via ${profile.twoFactorMethod === "AUTHENTICATOR" ? "Authenticator App" : "Email OTP"}. ${profile.backupCodesCount} recovery codes available.`
                  : "Add an extra layer of protection using Google Authenticator or Email OTP."}
              </p>

              <button 
                onClick={() => setActiveModal("2FA")} 
                className={`w-full h-9 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 ${
                  profile.twoFactorEnabled 
                    ? "bg-secondary hover:bg-secondary/80 text-foreground" 
                    : "bg-primary hover:bg-primary/90 text-primary-foreground"
                }`}
              >
                <Key weight="bold" />
                <span>{profile.twoFactorEnabled ? "Manage 2FA & Backup Codes" : "Enable Two-Factor (2FA)"}</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* MODALS RENDERER */}
      <AvatarUploadModal isOpen={activeModal === "AVATAR"} onClose={() => setActiveModal(null)} currentImage={profile.image} onSuccess={(url) => setProfile({...profile, image: url})} />
      <PhoneChangeModal isOpen={activeModal === "PHONE"} onClose={() => setActiveModal(null)} currentPhone={profile.phone} onSuccess={() => { showToast("success", "Phone number updated!"); fetchProfile(); }} />
      <PasswordChangeModal isOpen={activeModal === "PASSWORD"} onClose={() => setActiveModal(null)} onSuccess={() => showToast("success", "Password successfully updated!")} />
      <TwoFactorModal 
        isOpen={activeModal === "2FA"} 
        onClose={() => setActiveModal(null)} 
        twoFactorEnabled={profile.twoFactorEnabled}
        twoFactorMethod={profile.twoFactorMethod}
        backupCodesCount={profile.backupCodesCount}
        userEmail={profile.email}
        onStatusChange={() => {
          fetchProfile();
        }}
      />
    </div>
  );
}
