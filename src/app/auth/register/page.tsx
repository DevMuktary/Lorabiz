"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  CheckCircle, ShieldCheck, WhatsappLogo, 
  Buildings, Copyright, Cards, Handshake 
} from "@phosphor-icons/react";
import RegisterForm from "./components/RegisterForm"; 

export default function RegisterPage() {
  const [supportNumber, setSupportNumber] = useState<string | null>(null);

  // Fetch Global Settings (Support WhatsApp)
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings/global');
        if (res.ok) {
          const data = await res.json();
          if (data.SUPPORT_WHATSAPP) setSupportNumber(data.SUPPORT_WHATSAPP);
        }
      } catch (e) {
        console.error("Failed to fetch support config");
      }
    }
    fetchSettings();
  }, []);

  // Use the fetched number, OR fallback to the default permanent number instantly
  const activeSupportNumber = supportNumber || "2349024051958";

  return (
    // FIX: Using min-h-screen without `overflow-hidden` fixes Safari mobile repainting bugs
    <div className="flex min-h-screen w-full bg-background font-sans selection:bg-[#ff3f7a] selection:text-white relative">
      
      {/* LEFT PANEL (Fixed on desktop so it never scrolls out of view, matching the Login page) */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-[45%] shrink-0 min-h-screen bg-slate-950 relative overflow-hidden flex-col justify-between">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#ff3f7a]/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 p-12">
          <Image src="/logo.png" alt="LoraBiz Official Logo" width={160} height={50} className="brightness-0 invert object-contain" priority />
        </div>

        <div className="relative z-10 p-12 space-y-8 max-w-xl mt-auto mb-auto">
          {/* HIGHLY OPTIMIZED H2 FOR SEO */}
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight text-white">
            Nigeria&apos;s Comprehensive Hub for Business & Compliance.
          </h2>
          <p className="text-lg text-white/80 leading-relaxed font-medium">
            Create a free account to seamlessly access CAC Services, SCUML, Tax ID (TIN), Trademarks, SMEDAN, and Everyday Utilities—all from one powerful dashboard.
          </p>
          
          <div className="pt-6 space-y-5">
            <div className="flex items-center gap-4 text-white">
              <div className="bg-[#ff3f7a]/20 p-2 rounded-lg">
                <Buildings weight="fill" className="h-6 w-6 text-[#ff3f7a]" />
              </div>
              <span className="font-semibold text-[15px]">CAC Services, Post-Incorporation & Name Change</span>
            </div>
            <div className="flex items-center gap-4 text-white">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <ShieldCheck weight="fill" className="h-6 w-6 text-emerald-500" />
              </div>
              <span className="font-semibold text-[15px]">SCUML, Tax ID (TIN) & SMEDAN Registration</span>
            </div>
            <div className="flex items-center gap-4 text-white">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Copyright weight="fill" className="h-6 w-6 text-blue-500" />
              </div>
              <span className="font-semibold text-[15px]">Trademark (IPO) & Intellectual Property</span>
            </div>
            <div className="flex items-center gap-4 text-white">
              <div className="bg-amber-500/20 p-2 rounded-lg">
                <Cards weight="fill" className="h-6 w-6 text-amber-500" />
              </div>
              <span className="font-semibold text-[15px]">NIN Slips, Airtime Top-ups & Utility Payments</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-12">
          <p className="text-xs font-bold tracking-widest text-white/50 uppercase">
            &copy; {new Date().getFullYear()} Quadrox Technologies Limited
          </p>
        </div>
      </aside>

      {/* RIGHT PANEL (Scrolls naturally on all devices) */}
      <section className="flex-1 w-full lg:ml-[45%] min-h-screen relative flex flex-col justify-center bg-background py-10">
         <RegisterForm />
      </section>

      {/* DYNAMIC WHATSAPP SUPPORT ICON (Permanently visible) */}
      <a 
        href={`https://wa.me/${activeSupportNumber}`}
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] rounded-full shadow-xl hover:bg-[#1EBE5D] hover:scale-105 transition-all duration-300 group"
      >
        <WhatsappLogo className="h-8 w-8 text-white" weight="fill" />
        <span className="absolute right-16 bg-foreground text-background text-sm font-medium px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
          Chat with Support
        </span>
      </a>

    </div>
  );
}
