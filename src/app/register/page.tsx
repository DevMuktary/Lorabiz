"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { 
  User, 
  EnvelopeSimple, 
  Phone, 
  LockKey, 
  Spinner, 
  CheckCircle, 
  ShieldCheck,
  RocketLaunch
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      
      {/* LEFT PANEL - The Brand Experience */}
      <div className="hidden lg:flex w-1/2 bg-[#ff3f7a] p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle glowing orbs for texture */}
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-white/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-black/10 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Logo Area - Now with a White Background Container */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white p-2.5 rounded-xl shadow-lg flex items-center justify-center h-14 w-14">
            {/* The Next.js Image component pulling from your public folder */}
            <Image 
              src="/logo.png" 
              alt="Lumebiz Logo" 
              width={40} 
              height={40} 
              className="object-contain"
              priority
            />
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-white">Lumebiz</span>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 text-white space-y-6 max-w-lg">
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

        {/* Footer Area */}
        <div className="relative z-10">
          <p className="text-sm font-semibold tracking-widest text-white/70 uppercase">
            Powered by Quadrox Technologies Limited
          </p>
        </div>
      </div>

      {/* RIGHT PANEL - The Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Mobile Logo (Only shows on small screens) */}
          <div className="lg:hidden flex flex-col items-center justify-center gap-3 mb-10">
            <div className="bg-white p-2 rounded-xl shadow-md border border-gray-100 flex items-center justify-center h-16 w-16">
              <Image 
                src="/logo.png" 
                alt="Lumebiz Logo" 
                width={48} 
                height={48} 
                className="object-contain"
              />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-gray-900">Lumebiz</span>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create an account</h2>
            <p className="text-gray-500 mt-2 text-sm">Enter your details to access the dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100 flex items-center gap-2">
                <CheckCircle weight="bold" className="h-5 w-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-700 font-medium">Full Legal Name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                  <Input 
                    id="fullName" 
                    value={formData.fullName} 
                    onChange={handleChange} 
                    required 
                    placeholder="e.g. John Doe" 
                    className="pl-11 h-12 bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a] focus-visible:border-[#ff3f7a] transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                    placeholder="you@example.com" 
                    className="pl-11 h-12 bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a] focus-visible:border-[#ff3f7a] transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="0800 000 0000" 
                    className="pl-11 h-12 bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a] focus-visible:border-[#ff3f7a] transition-all" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Create Password</Label>
                <div className="relative">
                  <LockKey className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required 
                    placeholder="••••••••" 
                    className="pl-11 h-12 bg-gray-50/50 border-gray-200 focus-visible:ring-[#ff3f7a] focus-visible:border-[#ff3f7a] transition-all" 
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-12 text-base font-semibold bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-lg shadow-[#ff3f7a]/25 transition-all"
              >
                {loading ? (
                  <Spinner className="animate-spin h-5 w-5" weight="bold" />
                ) : (
                  <>Create Account</>
                )}
              </Button>
            </div>

            <p className="text-center text-gray-500 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-[#ff3f7a] hover:underline transition-all">
                Sign in
              </Link>
            </p>
          </form>
          
          {/* Mobile Footer */}
          <div className="lg:hidden mt-12 text-center">
             <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
              Powered by Quadrox Technologies Ltd
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
