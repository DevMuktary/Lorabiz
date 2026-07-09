"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  User, EnvelopeSimple, LockKey, Spinner, CheckCircle, 
  GenderIntersex, MapPin, Buildings, WhatsappLogo, Eye, EyeSlash
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NIGERIA_STATES_LGA } from "@/lib/nigeria-states";

export default function RegisterForm() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Loading states for OTP specific actions
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "", middleName: "", lastName: "", email: "", phone: "",
    whatsapp: "", password: "", confirmPassword: "", gender: "", state: "",
    lga: "", street: "", buildingNo: "",
  });

  const [otpStep, setOtpStep] = useState<"idle" | "sent" | "verified">("idle");
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  // Safely fetch the LGAs from the Record object using the selected state key
  const availableLgas = formData.state ? NIGERIA_STATES_LGA[formData.state] || [] : [];

  // Helper to nicely format the uppercase state keys (e.g., "AKWA IBOM" -> "Akwa Ibom")
  const formatStateName = (name: string) => {
    return name.split(' ').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  const getPasswordStrength = () => {
    let score = 0;
    if (!formData.password) return score;
    if (formData.password.length > 7) score += 1;
    if (/[A-Z]/.test(formData.password)) score += 1;
    if (/[0-9]/.test(formData.password)) score += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) score += 1;
    return score;
  };
  const passScore = getPasswordStrength();

  useEffect(() => {
    if (sameAsPhone) {
      setFormData((prev) => ({ ...prev, whatsapp: prev.phone }));
    }
  }, [formData.phone, sameAsPhone]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { id, value } = e.target;
    if (id === "whatsapp" || id === "phone") {
      value = value.replace(/\D/g, ""); 
    }
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: "" }));
  };

  useEffect(() => {
    if (termsAccepted && errors.terms) {
      setErrors(prev => ({ ...prev, terms: "" }));
    }
  }, [termsAccepted, errors.terms]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0 && otpStep === "sent") {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer, otpStep]);

  const handleSendOTP = async () => {
    if (!formData.email || !formData.email.includes("@")) {
      setErrors({ email: "Please enter a valid email address first." });
      return;
    }
    
    setErrors({ email: "" });
    setIsSendingOtp(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      if (res.ok) {
        setOtpStep("sent");
        setOtpTimer(30);
      } else {
        const data = await res.json();
        setErrors({ email: data.message || "Failed to send code." });
        setOtpStep("idle"); // Reset if failed so they can try again
      }
    } catch (err) {
      setErrors({ email: "Network error. Try again." });
      setOtpStep("idle");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) { 
      setErrors({ email: "Invalid OTP Code. Must be 6 digits." });
      return;
    }

    setIsVerifying(true);
    setErrors({ email: "" });

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otpCode }),
      });

      if (res.ok) {
        setOtpStep("verified");
      } else {
        const data = await res.json();
        setErrors({ email: data.message || "Invalid OTP code." });
      }
    } catch (err) {
      setErrors({ email: "Verification failed. Check your network." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    let newErrors: Record<string, string> = {};

    if (!termsAccepted) newErrors.terms = "You must agree to the Terms and Conditions to create an account.";
    if (otpStep !== "verified") newErrors.email = "You must verify your email to continue.";
    
    if (formData.phone.startsWith("0") && formData.phone.length !== 11) newErrors.phone = "Phone numbers starting with 0 must be 11 digits.";
    else if (!formData.phone.startsWith("0") && formData.phone.length !== 10) newErrors.phone = "Phone numbers without a leading 0 must be 10 digits.";

    if (formData.whatsapp.startsWith("0") && formData.whatsapp.length !== 11) newErrors.whatsapp = "WhatsApp numbers starting with 0 must be 11 digits.";
    else if (!formData.whatsapp.startsWith("0") && formData.whatsapp.length !== 10) newErrors.whatsapp = "WhatsApp numbers without a leading 0 must be 10 digits.";

    if (passScore < 3) newErrors.password = "Password is too weak. Add numbers or symbols.";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
    if (!formData.state) newErrors.state = "Please select a state.";
    if (!formData.lga) newErrors.lga = "Please select an LGA.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        state: formatStateName(formData.state), 
        otpCode
      };

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/auth/login?registered=true");
      } else {
        const data = await res.json();
        if (data.message?.toLowerCase().includes("code") || data.message?.toLowerCase().includes("verification")) {
          setOtpStep("sent");
          setErrors({ email: data.message });
        } else {
          setErrors({ form: data.message || "Registration failed." });
        }
      }
    } catch (err) {
      setErrors({ form: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="mb-8 flex justify-center lg:justify-start mt-2 sm:mt-0">
        <Image src="/logo.png" alt="LoraBiz Logo" width={340} height={120} className="object-contain h-20 lg:h-24 w-auto dark:brightness-110" priority />
      </div>

      <div className="mb-8 text-center lg:text-left">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Create an account</h2>
        <p className="text-muted-foreground mt-2 text-[16px]">Enter your details to create your portal account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {errors.form && (
          <div className="p-4 bg-destructive/10 text-destructive text-sm font-medium rounded-lg border border-destructive/20 flex items-center gap-2">
            <CheckCircle weight="bold" className="h-5 w-5 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* SECTION 1: Personal Details */}
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">1. Personal Identity</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-foreground font-medium">First Name</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input id="firstName" value={formData.firstName} onChange={handleChange} required placeholder="John" className="pl-11 h-12 text-[16px] bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-[#ff3f7a]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-foreground font-medium">Last Name</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input id="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Doe" className="pl-11 h-12 text-[16px] bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-[#ff3f7a]" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="middleName" className="text-foreground font-medium">Middle Name <span className="text-muted-foreground font-normal">(Optional)</span></Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input id="middleName" value={formData.middleName} onChange={handleChange} placeholder="Smith" className="pl-11 h-12 text-[16px] bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-[#ff3f7a]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="text-foreground font-medium">Gender</Label>
              <div className="relative">
                <GenderIntersex className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <select id="gender" value={formData.gender} onChange={handleChange} required className="flex h-12 w-full rounded-md border border-border bg-secondary/40 pl-11 pr-3 text-[16px] text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff3f7a] [&>option]:bg-background [&>option]:text-foreground dark:bg-[#121212]">
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Contact & Security */}
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">2. Contact & Security</h3>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <EnvelopeSimple className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input id="email" type="email" disabled={otpStep === "verified"} value={formData.email} onChange={handleChange} required placeholder="you@example.com" className="pl-11 h-12 text-[16px] bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-[#ff3f7a]" />
              </div>
              
              {otpStep === "idle" && (
                <Button 
                  type="button" 
                  onClick={handleSendOTP} 
                  disabled={isSendingOtp}
                  className="h-12 bg-[#ff3f7a] hover:bg-[#e02b62] text-white px-6 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed min-w-[100px]"
                >
                  {isSendingOtp ? <Spinner className="animate-spin h-5 w-5" /> : "Verify"}
                </Button>
              )}
              
              {otpStep === "verified" && (
                <Button type="button" disabled className="h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-6 min-w-[100px]">Verified ✓</Button>
              )}
            </div>
            
            {otpStep === "sent" && (
              <div className="p-4 bg-secondary/40 rounded-lg border border-border mt-2 flex gap-2 animate-in fade-in zoom-in-95">
                <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} maxLength={6} placeholder="Enter 6-digit OTP" className="h-12 text-center text-lg tracking-widest bg-background border-border text-foreground" />
                <Button type="button" onClick={handleVerifyOTP} disabled={isVerifying} className="h-12 bg-[#ff3f7a] text-white min-w-[100px] cursor-pointer">
                  {isVerifying ? <Spinner className="animate-spin h-5 w-5 mx-auto" /> : "Confirm"}
                </Button>
                {otpTimer > 0 ? (
                  <div className="h-12 px-4 flex items-center justify-center bg-secondary border border-border rounded-md text-muted-foreground font-mono font-medium min-w-[80px]">{otpTimer}s</div>
                ) : (
                  <Button 
                    type="button" 
                    onClick={handleSendOTP} 
                    variant="outline" 
                    disabled={isSendingOtp}
                    className="h-12 border-border text-foreground hover:bg-secondary cursor-pointer disabled:opacity-50 min-w-[80px]"
                  >
                    {isSendingOtp ? <Spinner className="animate-spin h-5 w-5 mx-auto" /> : "Resend"}
                  </Button>
                )}
              </div>
            )}
            {errors.email && <p className="text-sm text-destructive font-medium mt-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground font-medium">Phone Number</Label>
              <div className="flex items-center">
                <div className="flex items-center justify-center h-12 px-3 border border-r-0 border-border bg-secondary/60 rounded-l-md text-[16px] font-medium text-foreground"><span className="mr-2 text-lg">🇳🇬</span> +234</div>
                <Input id="phone" type="tel" maxLength={11} value={formData.phone} onChange={handleChange} required placeholder="800 000 0000" className="h-12 text-[16px] bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground rounded-l-none focus-visible:ring-[#ff3f7a]" />
              </div>
              {errors.phone && <p className="text-sm text-destructive font-medium mt-1">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsapp" className="text-foreground font-medium">WhatsApp Number</Label>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer font-medium hover:text-[#ff3f7a] transition-colors select-none">
                  <input type="checkbox" checked={sameAsPhone} onChange={(e) => setSameAsPhone(e.target.checked)} className="h-3.5 w-3.5 accent-[#ff3f7a] rounded border-border cursor-pointer"/> Same as Phone
                </label>
              </div>
              <div className="flex items-center relative">
                <div className="flex items-center justify-center h-12 px-3 border border-r-0 border-border bg-secondary/60 rounded-l-md text-[16px] font-medium text-foreground"><WhatsappLogo className="h-5 w-5 text-emerald-500 mr-2" weight="fill" /> +234</div>
                <Input id="whatsapp" type="tel" maxLength={11} value={formData.whatsapp} onChange={handleChange} required disabled={sameAsPhone} placeholder="800 000 0000" className="h-12 text-[16px] bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground rounded-l-none focus-visible:ring-[#ff3f7a] disabled:opacity-50 disabled:cursor-not-allowed" />
              </div>
              {errors.whatsapp && <p className="text-sm text-destructive font-medium mt-1">{errors.whatsapp}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Create Password</Label>
              <div className="relative">
                <LockKey className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} required placeholder="••••••••" className="pl-11 pr-10 h-12 text-[16px] bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-[#ff3f7a]" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none transition-colors cursor-pointer">{showPassword ? <EyeSlash className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
              </div>
              {formData.password && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4].map((level) => (
                    <div key={level} className={`h-1.5 w-full rounded-full transition-all duration-300 ${passScore >= level ? (passScore < 3 ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-secondary'}`} />
                  ))}
                </div>
              )}
              {errors.password && <p className="text-sm text-destructive font-medium mt-1">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirm Password</Label>
              <div className="relative">
                <LockKey className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" className="pl-11 pr-10 h-12 text-[16px] bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-[#ff3f7a]" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none transition-colors cursor-pointer">{showConfirmPassword ? <EyeSlash className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-destructive font-medium mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>
        </div>

        {/* SECTION 3: Office Address */}
        <div className="space-y-5">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">3. Office Address</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="state" className="text-foreground font-medium">State</Label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <select id="state" value={formData.state} onChange={handleChange} required className="flex h-12 w-full rounded-md border border-border bg-secondary/40 pl-11 pr-3 text-[16px] text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff3f7a] [&>option]:bg-background [&>option]:text-foreground dark:bg-[#121212]">
                  <option value="" disabled>Select State</option>
                  {Object.keys(NIGERIA_STATES_LGA).map((stateKey) => (
                    <option key={stateKey} value={stateKey}>{formatStateName(stateKey)} State</option>
                  ))}
                </select>
              </div>
              {errors.state && <p className="text-sm text-destructive font-medium mt-1">{errors.state}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lga" className="text-foreground font-medium">Local Government (LGA)</Label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <select id="lga" value={formData.lga} onChange={handleChange} required disabled={!formData.state} className="flex h-12 w-full rounded-md border border-border bg-secondary/40 pl-11 pr-3 text-[16px] text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff3f7a] disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-background [&>option]:text-foreground dark:bg-[#121212]">
                  <option value="" disabled>Select LGA</option>
                  {availableLgas.map((lga) => <option key={lga} value={lga}>{lga}</option>)}
                </select>
              </div>
              {errors.lga && <p className="text-sm text-destructive font-medium mt-1">{errors.lga}</p>}
            </div>
          </div>

          <div className="grid grid-cols-[2fr_1fr] gap-5">
            <div className="space-y-2">
              <Label htmlFor="street" className="text-foreground font-medium">Street Name</Label>
              <div className="relative">
                <Buildings className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input id="street" value={formData.street} onChange={handleChange} required placeholder="e.g. 12 Awolowo Way" className="pl-11 h-12 text-[16px] bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-[#ff3f7a]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buildingNo" className="text-foreground font-medium">Building No.</Label>
              <Input id="buildingNo" value={formData.buildingNo} onChange={handleChange} placeholder="Optional" className="h-12 text-[16px] bg-secondary/40 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-[#ff3f7a]" />
            </div>
          </div>
        </div>

        {/* CHECKBOX & SUBMIT CONTAINER */}
        <div className="pt-6 border-t border-border space-y-4">
          <label className="flex items-start gap-3 p-4 border border-border bg-secondary/30 rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors select-none">
            <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#ff3f7a] rounded border-border cursor-pointer shrink-0" />
            <span className="text-sm text-muted-foreground leading-relaxed">
              I agree to LoraBiz&apos;s <Link href="/terms" className="text-[#ff3f7a] font-semibold hover:underline">Terms & Conditions</Link>, <Link href="/acceptable-use" className="text-[#ff3f7a] font-semibold hover:underline">Acceptable Use</Link> and <Link href="/privacy" className="text-[#ff3f7a] font-semibold hover:underline">Privacy Policy</Link>.
            </span>
          </label>
          
          {errors.terms && <p className="text-sm text-destructive font-medium pl-1">{errors.terms}</p>}

          <Button type="submit" disabled={loading} className="w-full h-14 text-lg font-semibold bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-xl shadow-[#ff3f7a]/25 transition-all cursor-pointer">
            {loading ? <Spinner className="animate-spin h-6 w-6" weight="bold" /> : <>Create Account</>}
          </Button>
        </div>

        <div className="text-center text-muted-foreground mt-6 pb-8">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-[#ff3f7a] hover:underline transition-all">Sign in</Link>
        </div>
      </form>
    </div>
  );
}
