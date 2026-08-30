"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Phone, 
  WhatsappLogo, 
  Users, 
  CheckCircle, 
  WarningCircle, 
  Spinner,
  ArrowRight
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NIGERIA_STATES_LGA } from "@/lib/nigeria-states";

export default function CompleteProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [imgError, setImgError] = useState(false);

  const [formData, setFormData] = useState({
    phone: "",
    whatsapp: "",
    gender: "MALE",
    state: "",
    lga: "",
    street: "",
    buildingNo: "",
    referralCode: "",
  });

  // Live Referral Validation State
  const [referralState, setReferralState] = useState<{
    status: "idle" | "validating" | "valid" | "invalid";
    referrerName?: string;
    message?: string;
  }>({ status: "idle" });

  // Read initial cookie referral code if present
  useEffect(() => {
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    };
    const cookieRef = getCookie("lorabiz_ref");
    if (cookieRef && !formData.referralCode) {
      setFormData(prev => ({ ...prev, referralCode: cookieRef }));
      validateReferral(cookieRef);
    }
  }, []);

  // Validate referral code function
  const validateReferral = useCallback(async (code: string) => {
    const clean = code.trim();
    if (!clean) {
      setReferralState({ status: "idle" });
      return;
    }

    setReferralState({ status: "validating" });
    try {
      const res = await fetch(`/api/auth/validate-referral?code=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (data.valid) {
        setReferralState({
          status: "valid",
          referrerName: data.referrerName,
        });
      } else {
        setReferralState({
          status: "invalid",
          message: data.message || "Referral code not found",
        });
      }
    } catch {
      setReferralState({ status: "idle" });
    }
  }, []);

  // Debounced referral validation
  useEffect(() => {
    if (!formData.referralCode) {
      setReferralState({ status: "idle" });
      return;
    }
    const timer = setTimeout(() => {
      validateReferral(formData.referralCode);
    }, 450);
    return () => clearTimeout(timer);
  }, [formData.referralCode, validateReferral]);

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [id]: value };
      if (id === "phone" && sameAsPhone) {
        updated.whatsapp = value;
      }
      return updated;
    });

    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: "" }));
    }
  };

  const availableLgas = formData.state ? NIGERIA_STATES_LGA[formData.state] || [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
    else if (formData.phone.startsWith("0") && formData.phone.length !== 11) newErrors.phone = "Phone numbers starting with 0 must be 11 digits.";
    else if (!formData.phone.startsWith("0") && formData.phone.length !== 10) newErrors.phone = "Phone numbers without a leading 0 must be 10 digits.";

    if (formData.whatsapp.trim()) {
      if (formData.whatsapp.startsWith("0") && formData.whatsapp.length !== 11) newErrors.whatsapp = "WhatsApp numbers starting with 0 must be 11 digits.";
      else if (!formData.whatsapp.startsWith("0") && formData.whatsapp.length !== 10) newErrors.whatsapp = "WhatsApp numbers without a leading 0 must be 10 digits.";
    }

    if (!formData.state) newErrors.state = "Please select a state.";
    if (!formData.lga) newErrors.lga = "Please select an LGA.";
    if (!termsAccepted) newErrors.terms = "You must agree to the Terms & Conditions to complete your account.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          termsAccepted,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        await update({ isProfileComplete: true });
        router.push("/dashboard");
      } else {
        setErrors({ form: data.message || "Failed to save profile. Please try again." });
      }
    } catch {
      setErrors({ form: "Network error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8 animate-spin text-[#ff3f7a]" weight="bold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-background text-foreground">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        
        {/* Clean Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <Image src="/logo.png" alt="LoraBiz" width={140} height={45} className="object-contain h-10 w-auto dark:brightness-110" priority />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground">
            Add your contact details to finish setting up your account.
          </p>
        </div>

        {/* Pre-filled Google User Details */}
        <div className="bg-secondary/30 border border-border rounded-xl p-3.5 flex items-center gap-3">
          {session?.user?.image && !imgError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img 
              src={session.user.image} 
              alt="Avatar" 
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-10 h-10 rounded-full border border-border object-cover shrink-0" 
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#ff3f7a]/15 text-[#ff3f7a] flex items-center justify-center font-bold text-sm shrink-0 border border-[#ff3f7a]/30">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{session?.user?.name || "Google User"}</p>
            <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
          </div>
        </div>

        {errors.form && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg font-medium">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-foreground">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="phone" 
                  type="tel" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  placeholder="08012345678" 
                  className="pl-9 h-11 text-[16px] bg-secondary/30 border-border"
                />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsapp" className="text-xs font-semibold text-foreground">WhatsApp Number</Label>
                <label className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={sameAsPhone} 
                    onChange={(e) => {
                      setSameAsPhone(e.target.checked);
                      if (e.target.checked) setFormData(p => ({ ...p, whatsapp: p.phone }));
                    }}
                    className="h-3 w-3 accent-[#ff3f7a] rounded"
                  />
                  Same as phone
                </label>
              </div>
              <div className="relative">
                <WhatsappLogo className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="whatsapp" 
                  type="tel" 
                  value={formData.whatsapp} 
                  onChange={handleChange} 
                  placeholder="08012345678" 
                  className="pl-9 h-11 text-[16px] bg-secondary/30 border-border"
                />
              </div>
              {errors.whatsapp && <p className="text-xs text-destructive">{errors.whatsapp}</p>}
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <Label htmlFor="gender" className="text-xs font-semibold text-foreground">Gender</Label>
            <select
              id="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full h-11 px-3 text-[16px] rounded-lg bg-background dark:bg-slate-900 border border-border text-foreground dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ff3f7a] [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Prefer not to say</option>
            </select>
          </div>

          {/* State & LGA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="state" className="text-xs font-semibold text-foreground">State *</Label>
              <select
                id="state"
                value={formData.state}
                onChange={(e) => {
                  handleChange(e);
                  setFormData(p => ({ ...p, lga: "" }));
                }}
                className="w-full h-11 px-3 text-[16px] rounded-lg bg-background dark:bg-slate-900 border border-border text-foreground dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ff3f7a] [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
              >
                <option value="">Select State</option>
                {Object.keys(NIGERIA_STATES_LGA).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lga" className="text-xs font-semibold text-foreground">LGA *</Label>
              <select
                id="lga"
                value={formData.lga}
                onChange={handleChange}
                disabled={!formData.state}
                className="w-full h-11 px-3 text-[16px] rounded-lg bg-background dark:bg-slate-900 border border-border text-foreground dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#ff3f7a] disabled:opacity-50 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
              >
                <option value="">Select LGA</option>
                {availableLgas.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              {errors.lga && <p className="text-xs text-destructive">{errors.lga}</p>}
            </div>
          </div>

          {/* Referral Code (With Real-Time Validation Feedback) */}
          <div className="space-y-1.5 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <Label htmlFor="referralCode" className="text-xs font-semibold text-foreground">Referral Code (Optional)</Label>
              {referralState.status === "validating" && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Spinner className="h-3 w-3 animate-spin text-[#ff3f7a]" /> Checking...
                </span>
              )}
              {referralState.status === "valid" && (
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" weight="bold" />
                  Referred by {referralState.referrerName}
                </span>
              )}
              {referralState.status === "invalid" && (
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <WarningCircle className="w-3.5 h-3.5" weight="bold" />
                  {referralState.message}
                </span>
              )}
            </div>
            <div className="relative">
              <Users className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="referralCode" 
                value={formData.referralCode} 
                onChange={handleChange} 
                placeholder="Enter referral code if invited" 
                className={`pl-9 h-11 text-[16px] bg-secondary/30 border-border uppercase ${
                  referralState.status === "valid" ? "border-emerald-500 focus-visible:ring-emerald-500" : ""
                }`}
              />
            </div>
          </div>

          {/* Terms Agreement */}
          <div className="pt-2 space-y-2">
            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-secondary/20 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={termsAccepted} 
                onChange={(e) => setTermsAccepted(e.target.checked)} 
                className="mt-0.5 h-4 w-4 accent-[#ff3f7a] rounded border-border shrink-0 cursor-pointer" 
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I agree to LoraBiz&apos;s{" "}
                <Link href="/terms" target="_blank" className="text-[#ff3f7a] font-semibold hover:underline">Terms</Link>,{" "}
                <Link href="/privacy" target="_blank" className="text-[#ff3f7a] font-semibold hover:underline">Privacy Policy</Link>, and{" "}
                <Link href="/acceptable-use" target="_blank" className="text-[#ff3f7a] font-semibold hover:underline">Acceptable Use</Link>.
              </span>
            </label>
            {errors.terms && <p className="text-xs text-destructive">{errors.terms}</p>}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-12 text-base font-semibold bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-lg shadow-[#ff3f7a]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <Spinner className="animate-spin h-5 w-5" weight="bold" />
            ) : (
              <>
                <span>Complete Account</span>
                <ArrowRight className="w-4 h-4" weight="bold" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
