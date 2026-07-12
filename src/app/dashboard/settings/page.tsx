"use client";

import { useState, useEffect } from "react";
import { 
  UserCircle, LockKey, EnvelopeSimple, DeviceMobile, 
  WhatsappLogo, ShieldCheck, Spinner, PencilSimple, Camera
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import AvatarUploadModal from "@/components/features/settings/AvatarUploadModal";
import PhoneChangeModal from "@/components/features/settings/PhoneChangeModal";
import PasswordChangeModal from "@/components/features/settings/PasswordChangeModal";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info", message: string } | null>(null);

  // Modals state
  const [activeModal, setActiveModal] = useState<"AVATAR" | "PHONE" | "PASSWORD" | null>(null);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    image: null as string | null,
    phoneChangedAt: null as string | null,
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

  const handleSaveProfile = async () => {
    if (!profile.firstName || !profile.lastName) return showToast("error", "First and Last names are required.");
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
      showToast("error", "Network error occurred.");
    } finally {
      setSavingProfile(false);
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
        <h1 className="text-2xl font-black text-foreground">Profile Settings</h1>
        <p className="text-sm font-medium text-muted-foreground">Manage your identity, security, and notification preferences.</p>
      </div>

      {toast && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 shadow-sm border text-sm font-bold animate-in slide-in-from-top-2 ${
          toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
          toast.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-600" :
          "bg-blue-500/10 border-blue-500/20 text-blue-600"
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Identity & Avatar */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            {/* Avatar Section */}
            <div className="flex items-center gap-4 pb-6 border-b border-border">
              <div className="relative group cursor-pointer" onClick={() => setActiveModal("AVATAR")}>
                <div className="h-16 w-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-border">
                  {profile.image ? (
                    <img src={profile.image} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-black text-primary">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </span>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                  <Camera size={20} weight="fill" />
                </div>
              </div>
              <div>
                <h3 className="font-black text-base text-foreground">{profile.firstName} {profile.lastName}</h3>
                <button onClick={() => setActiveModal("AVATAR")} className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-0.5">
                  Change Profile Picture
                </button>
              </div>
            </div>

            {/* Basic Info Inputs */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">First Name</label>
                  <Input value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} className="h-11 bg-secondary/50 font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Last Name</label>
                  <Input value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} className="h-11 bg-secondary/50 font-bold" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Email Address</label>
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" weight="bold" />
                  <Input value={profile.email} readOnly className="pl-10 h-11 bg-secondary border-border text-muted-foreground font-bold cursor-not-allowed" />
                </div>
              </div>

              <button onClick={handleSaveProfile} disabled={savingProfile} className="h-11 px-6 bg-foreground text-background font-bold rounded-xl text-sm hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50">
                {savingProfile ? <Spinner className="animate-spin h-5 w-5" /> : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Notifications Summary */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
            <h3 className="font-black text-base text-foreground pb-2 border-b border-border">Notifications</h3>
            <div onClick={() => showToast("info", "Critical security notifications cannot be disabled.")} className="flex items-center justify-between p-3.5 bg-secondary/30 border border-border rounded-2xl cursor-not-allowed opacity-80">
              <div className="flex items-center gap-3">
                <WhatsappLogo className="h-5 w-5 text-[#25D366]" weight="fill" />
                <div>
                  <p className="font-bold text-sm text-foreground">WhatsApp Alerts</p>
                  <p className="text-xs text-muted-foreground">Application updates and security codes.</p>
                </div>
              </div>
              <div className="w-9 h-5 bg-primary rounded-full relative"><div className="absolute right-1 top-1 h-3 w-3 bg-white rounded-full" /></div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Security Summary Cards */}
        <div className="lg:col-span-5 space-y-6">
          {/* Phone Card */}
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" weight="fill" />
                <h3 className="font-black text-base text-foreground">Phone Number</h3>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground">Registered Number</p>
              <p className="font-black text-foreground text-lg tracking-wider mt-0.5">{profile.phone}</p>
            </div>
            {isPhoneLocked() ? (
              <p className="text-xs font-bold text-amber-600 bg-amber-500/10 p-3 rounded-xl">
                Security Lock: You updated your number recently. Wait 30 days before changing again.
              </p>
            ) : (
              <button onClick={() => setActiveModal("PHONE")} className="w-full h-11 bg-secondary hover:bg-foreground hover:text-background text-foreground font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                <PencilSimple weight="bold" /> Change Number
              </button>
            )}
          </div>

          {/* Password Card */}
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <LockKey className="h-5 w-5 text-red-500" weight="fill" />
              <h3 className="font-black text-base text-foreground">Password & Access</h3>
            </div>
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
              Ensure your account uses a strong, unique password. Updating requires verification.
            </p>
            <button onClick={() => setActiveModal("PASSWORD")} className="w-full h-11 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/* MODALS RENDERER */}
      <AvatarUploadModal isOpen={activeModal === "AVATAR"} onClose={() => setActiveModal(null)} currentImage={profile.image} onSuccess={(url) => setProfile({...profile, image: url})} />
      <PhoneChangeModal isOpen={activeModal === "PHONE"} onClose={() => setActiveModal(null)} currentPhone={profile.phone} onSuccess={() => { showToast("success", "Phone number updated!"); fetchProfile(); }} />
      <PasswordChangeModal isOpen={activeModal === "PASSWORD"} onClose={() => setActiveModal(null)} onSuccess={() => showToast("success", "Password successfully updated!")} />
    </div>
  );
}
