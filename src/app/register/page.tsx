"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  User, EnvelopeSimple, Phone, LockKey, Spinner, CheckCircle, ShieldCheck, 
  RocketLaunch, CalendarBlank, MapPin, IdentificationBadge, GenderIntersex
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Comprehensive Nigeria States & LGA Dictionary
// (Fully populated for major hubs like Oyo, Lagos, FCT. Add others as needed).
const NIGERIA_STATES: Record<string, string[]> = {
  "Abuja (FCT)": ["Abaji", "Bwari", "Gwagwalada", "Kuje", "Kwali", "Municipal Area Council"],
  "Lagos": ["Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"],
  "Oyo": ["AFIJIO", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa", "Olorunsogo", "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo East", "Oyo West", "Saki East", "Saki West", "Surulere"],
  "Ogun": ["Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Ewekoro", "Ifo", "Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode", "Ikenne", "Imeko Afon", "Ipokia", "Obafemi Owode", "Odeda", "Odogbolu", "Ogun Waterside", "Remo North", "Shagamu", "Yewa North", "Yewa South"],
  "Rivers": ["Port Harcourt", "Obio-Akpor", "Eleme", "Ikwerre", "Gokana", "Khana", "Oyigbo", "Tai", "Ogu/Bolo", "Okrika", "Degema", "Asari-Toru", "Akuku-Toru", "Ahoada East", "Ahoada West", "Ogba/Egbema/Ndoni", "Emohua", "Etche", "Omuma", "Opobo/Nkoro", "Andoni", "Bonny", "Abua/Odual"],
  "Kano": ["Kano Municipal", "Dala", "Gwale", "Tarauni", "Nassarawa", "Fagge", "Kumbotso", "Ungogo"],
  // Add remaining states here...
  "Abia": ["Aba North", "Aba South", "Umuahia North", "Umuahia South"],
  "Adamawa": ["Yola North", "Yola South", "Mubi North"],
  "Akwa Ibom": ["Uyo", "Eket", "Ikot Ekpene"],
  "Anambra": ["Awka North", "Awka South", "Onitsha North", "Onitsha South"],
  "Bauchi": ["Bauchi", "Azare"],
  "Bayelsa": ["Yenagoa", "Ogbia"],
  "Benue": ["Makurdi", "Gboko"],
  "Borno": ["Maiduguri", "Jere"],
  "Cross River": ["Calabar Municipal", "Calabar South"],
  "Delta": ["Oshimili South", "Warri South", "Uvwie"],
  "Ebonyi": ["Abakaliki", "Afikpo North"],
  "Edo": ["Oredo", "Egor", "Ikpoba Okha"],
  "Ekiti": ["Ado Ekiti", "Ikere"],
  "Enugu": ["Enugu East", "Enugu North", "Enugu South"],
  "Gombe": ["Gombe", "Akko"],
  "Imo": ["Owerri Municipal", "Owerri North"],
  "Jigawa": ["Dutse", "Hadejia"],
  "Kaduna": ["Kaduna North", "Kaduna South", "Zaria"],
  "Katsina": ["Katsina", "Daura"],
  "Kebbi": ["Birnin Kebbi", "Argungu"],
  "Kogi": ["Lokoja", "Okene"],
  "Kwara": ["Ilorin West", "Ilorin East", "Ilorin South"],
  "Nasarawa": ["Lafia", "Keffi"],
  "Niger": ["Chanchaga", "Bosso", "Bida"],
  "Ondo": ["Akure South", "Akure North", "Ondo West"],
  "Osun": ["Osogbo", "Ilesa West", "Ife Central"],
  "Plateau": ["Jos North", "Jos South"],
  "Sokoto": ["Sokoto North", "Sokoto South"],
  "Taraba": ["Jalingo", "Wukari"],
  "Yobe": ["Damaturu", "Potiskum"],
  "Zamfara": ["Gusau", "Kaura Namoda"]
};

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Email Verification UI State
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [enteredOtp, setEnteredOtp] = useState("");

  // Form Data State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nin: "",
    dob: "",
    gender: "",
    state: "",
    lga: "",
    street: "",
    building: "",
    password: "",
    confirmPassword: ""
  });

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    
    // Reset LGA if State changes
    if (e.target.id === "state") {
      setFormData(prev => ({ ...prev, lga: "" }));
    }
  };

  // --- EMAIL OTP LOGIC ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && countdown > 0 && !otpVerified) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpSent, countdown, otpVerified]);

  const handleSendOtp = () => {
    if (!formData.email) return;
    setOtpSent(true);
    setCountdown(60); // 60 second countdown
  };

  const handleVerifyOtp = () => {
    // Frontend mockup: accept any 6 digit code for now
    if (enteredOtp.length === 6) {
      setOtpVerified(true);
      setOtpSent(false);
    }
  };

  // --- PASSWORD STRENGTH LOGIC ---
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // Returns 0 to 4
  };
  const passwordScore = calculatePasswordStrength(formData.password);

  // --- FORM SUBMISSION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    if (formData.nin.length !== 11) {
      setError("NIN must be exactly 11 digits.");
      setLoading(false);
      return;
    }
    if (!otpVerified) {
      setError("Please verify your email address before continuing.");
      setLoading(false);
      return;
    }

    try {
      // Re-map frontend fields to backend schema
      const submitData = {
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        // You can send the rest of the data to an updated backend endpoint later
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        router.push("/login?registered=true");
      } else {
        const data = await res.json();
        setError(data.message || "Registration failed.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans selection:bg-[#ff3f7a] selection:text-white">
      
      {/* LEFT PANEL - Fixed */}
      <div className="hidden lg:flex w-[45%] bg-[#ff3f7a] p-12 flex-col justify-center relative overflow-hidden sticky top-0 h-screen">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-white/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-black/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 text-white space-y-6 max-w-lg mx-auto">
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight">
            Launch your dream business today.
          </h1>
          <p className="text-lg text-white/90 leading-relaxed">
            Skip the legal jargon and the expensive agents. Register your business instantly with our seamless, automated CAC platform.
          </p>
          
          <div className="pt-8 space-y-4">
            <div className="flex items-center gap-3 text-white font-medium">
              <CheckCircle weight="fill" className="h-6 w-6 text-white/80" />
              <span>100% Agent-Free Process</span>
            </div>
            <div className="flex items-center gap-3 text-white font-medium">
              <ShieldCheck weight="fill" className="h-6 w-6 text-white/80" />
              <span>Bank-Grade Data Security</span>
            </div>
            <div className="flex items-center gap-3 text-white font-medium">
              <RocketLaunch weight="fill" className="h-6 w-6 text-white/80" />
              <span>Fast-Tracked Approvals</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-12 z-10">
          <p className="text-sm font-semibold tracking-widest text-white/70 uppercase">
            Powered by Quadrox Technologies Limited
          </p>
        </div>
      </div>

      {/* RIGHT PANEL - Scrollable Form */}
      <div className="w-full lg:w-[55%] flex items-start justify-center p-6 sm:p-12 overflow-y-auto h-screen">
        <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700 py-8">
          
          <div className="mb-8 flex justify-center lg:justify-start">
            <Image src="/logo.png" alt="Lumebiz Logo" width={340} height={120} className="object-contain h-20 lg:h-24 w-auto" priority />
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create an account</h2>
            <p className="text-gray-500 mt-2 text-[16px]">Enter your details to create your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100 flex items-center gap-2">
                <CheckCircle weight="bold" className="h-5 w-5 shrink-0" />
                {error}
              </div>
            )}

            {/* SECTION 1: Personal Details */}
            <div className="space-y-5">
              <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase border-b pb-2">1. Personal Identity</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                    <Input id="firstName" value={formData.firstName} onChange={handleChange} required placeholder="John" className="pl-11 h-12 text-[16px] bg-gray-50/50 focus-visible:ring-[#ff3f7a]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
                  <Input id="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Doe" className="h-12 text-[16px] bg-gray-50/50 focus-visible:ring-[#ff3f7a]" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-gray-700 font-medium">Date of Birth</Label>
                  <div className="relative">
                    <CalendarBlank className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                    <Input id="dob" type="date" value={formData.dob} onChange={handleChange} required className="pl-11 h-12 text-[16px] bg-gray-50/50 focus-visible:ring-[#ff3f7a]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-gray-700 font-medium">Gender</Label>
                  <div className="relative">
                    <GenderIntersex className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                    <select 
                      id="gender" 
                      value={formData.gender} 
                      onChange={handleChange} 
                      required 
                      className="w-full pl-11 h-12 text-[16px] bg-gray-50/50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#ff3f7a] focus:border-[#ff3f7a] text-gray-700"
                    >
                      <option value="" disabled>Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nin" className="text-gray-700 font-medium">NIN (National Identity Number)</Label>
                <div className="relative">
                  <IdentificationBadge className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                  <Input id="nin" type="text" maxLength={11} value={formData.nin} onChange={handleChange} required placeholder="11-digit NIN" className="pl-11 h-12 text-[16px] bg-gray-50/50 focus-visible:ring-[#ff3f7a]" />
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <LockKey weight="fill" className="h-3 w-3" /> Used for instant verification. We do not store your NIN.
                </p>
              </div>
            </div>

            {/* SECTION 2: Contact & Address */}
            <div className="space-y-5 pt-4">
              <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase border-b pb-2">2. Contact & Address</h3>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                <div className="relative flex items-center">
                  <EnvelopeSimple className="absolute left-3.5 h-5 w-5 text-gray-400" />
                  <Input 
                    id="email" type="email" value={formData.email} onChange={handleChange} required 
                    disabled={otpVerified}
                    placeholder="you@example.com" 
                    className="pl-11 pr-24 h-12 text-[16px] bg-gray-50/50 focus-visible:ring-[#ff3f7a]" 
                  />
                  
                  {/* Email Verification Button inside input */}
                  {formData.email && !otpVerified && !otpSent && (
                    <Button type="button" onClick={handleSendOtp} className="absolute right-1 h-10 px-3 bg-gray-900 hover:bg-gray-800 text-white text-xs">
                      Verify
                    </Button>
                  )}
                  {otpVerified && (
                    <span className="absolute right-3 flex items-center gap-1 text-green-600 text-sm font-bold">
                      <CheckCircle weight="fill" className="h-5 w-5" /> Verified
                    </span>
                  )}
                </div>
              </div>

              {/* OTP Input Section */}
              {otpSent && !otpVerified && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3 animate-in fade-in zoom-in duration-300">
                  <Label className="text-gray-700 font-medium text-sm">Enter the 6-digit code sent to your email</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="text" maxLength={6} placeholder="000000" 
                      value={enteredOtp} onChange={(e) => setEnteredOtp(e.target.value)}
                      className="h-12 text-center text-lg tracking-[0.5em] font-bold bg-white focus-visible:ring-[#ff3f7a]" 
                    />
                    <Button type="button" onClick={handleVerifyOtp} className="h-12 bg-[#ff3f7a] hover:bg-[#e02b62] text-white">
                      Confirm
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    {countdown > 0 ? (
                      <span className="text-gray-500">Resend code in {countdown}s</span>
                    ) : (
                      <button type="button" onClick={handleSendOtp} className="text-[#ff3f7a] font-semibold hover:underline">
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                  <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="0800 000 0000" className="pl-11 h-12 text-[16px] bg-gray-50/50 focus-visible:ring-[#ff3f7a]" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-gray-700 font-medium">State</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                    <select 
                      id="state" value={formData.state} onChange={handleChange} required 
                      className="w-full pl-11 h-12 text-[16px] bg-gray-50/50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#ff3f7a] focus:border-[#ff3f7a] text-gray-700"
                    >
                      <option value="" disabled>Select State</option>
                      {Object.keys(NIGERIA_STATES).sort().map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lga" className="text-gray-700 font-medium">L.G.A</Label>
                  <select 
                    id="lga" value={formData.lga} onChange={handleChange} required disabled={!formData.state}
                    className="w-full px-3 h-12 text-[16px] bg-gray-50/50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#ff3f7a] focus:border-[#ff3f7a] text-gray-700 disabled:opacity-50"
                  >
                    <option value="" disabled>Select L.G.A</option>
                    {formData.state && NIGERIA_STATES[formData.state]?.map(lga => (
                      <option key={lga} value={lga}>{lga}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="street" className="text-gray-700 font-medium">Street Name</Label>
                  <Input id="street" value={formData.street} onChange={handleChange} required placeholder="e.g. Allen Avenue" className="h-12 text-[16px] bg-gray-50/50 focus-visible:ring-[#ff3f7a]" />
                </div>
                <div className="col-span-1 space-y-2">
                  <Label htmlFor="building" className="text-gray-700 font-medium">Bldg No.</Label>
                  <Input id="building" value={formData.building} onChange={handleChange} placeholder="Optional" className="h-12 text-[16px] bg-gray-50/50 focus-visible:ring-[#ff3f7a]" />
                </div>
              </div>
            </div>

            {/* SECTION 3: Security */}
            <div className="space-y-5 pt-4">
              <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase border-b pb-2">3. Security</h3>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Create Password</Label>
                <div className="relative">
                  <LockKey className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                  <Input id="password" type="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" className="pl-11 h-12 text-[16px] bg-gray-50/50 focus-visible:ring-[#ff3f7a]" />
                </div>
                
                {/* Password Strength Meter */}
                {formData.password && (
                  <div className="pt-2">
                    <div className="flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-gray-100">
                      <div className={`h-full transition-all duration-300 ${passwordScore >= 1 ? 'w-1/4 bg-red-400' : 'w-0'}`}></div>
                      <div className={`h-full transition-all duration-300 ${passwordScore >= 2 ? 'w-1/4 bg-orange-400' : 'w-0'}`}></div>
                      <div className={`h-full transition-all duration-300 ${passwordScore >= 3 ? 'w-1/4 bg-yellow-400' : 'w-0'}`}></div>
                      <div className={`h-full transition-all duration-300 ${passwordScore >= 4 ? 'w-1/4 bg-green-500' : 'w-0'}`}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {passwordScore <= 1 && "Weak - Add numbers and uppercase letters"}
                      {passwordScore === 2 && "Fair - Add special characters"}
                      {passwordScore === 3 && "Good - Almost there"}
                      {passwordScore >= 4 && <span className="text-green-600 font-medium">Strong password!</span>}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
                <div className="relative">
                  <LockKey className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                  <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" className="pl-11 h-12 text-[16px] bg-gray-50/50 focus-visible:ring-[#ff3f7a]" />
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 font-medium">Passwords do not match.</p>
                )}
              </div>
            </div>

            <div className="pt-6 pb-12">
              <Button 
                type="submit" 
                disabled={loading || !otpVerified || (formData.password !== formData.confirmPassword)} 
                className="w-full h-14 text-lg font-bold bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-xl shadow-[#ff3f7a]/30 transition-all rounded-xl"
              >
                {loading ? (
                  <Spinner className="animate-spin h-6 w-6" weight="bold" />
                ) : (
                  <>Create My Account <RocketLaunch className="ml-2 h-6 w-6" weight="fill" /></>
                )}
              </Button>
              <p className="text-center text-gray-500 mt-6">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-[#ff3f7a] hover:underline transition-all">
                  Sign in instead
                </Link>
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
