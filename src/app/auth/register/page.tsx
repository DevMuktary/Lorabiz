"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CheckCircle, ShieldCheck, RocketLaunch, WhatsappLogo, Buildings, IdentificationCard, Cards, Copyright, Handshake, DeviceMobile } from "@phosphor-icons/react";
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

  const activeSupportNumber = supportNumber || "2348000000000";

  return (
    <div className="flex min-h-[100dvh] w-full bg-background font-sans selection:bg-[#ff3f7a] selection:text-white flex-col lg:flex-row relative">
      
      {/* LEFT PANEL (Sticky desktop sidebar with upgraded branding & SEO H2) */}
      <div className="hidden lg:flex lg:w-[45%] lg:sticky lg:top-0 lg:h-[100dvh] bg-slate-950 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#ff3f7a]/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Official Logo in Side Panel */}
        <div className="relative z-10">
          <Image 
            src="/logo.png" 
            alt="LoraBiz Official Logo" 
            width={160} 
            height={50} 
            className="brightness-0 invert object-contain" 
            priority 
          />
        </div>

        <div className="relative z-10 text-white space-y-6 max-w-lg mx-auto w-full">
          {/* SEO Optimized H2 matching actual platform services */}
          <h2 className="text-4xl xl:text-5xl font-bold leading-[1.1] tracking-tight">
            Automate Your Corporate & Business Journey.
          </h2>
          <p className="text-base text-white/80 leading-relaxed">
            Seamlessly register your CAC Business Name or LLC, generate instant NIN slips, process SCUML, or Generate your Tax ID, and handle utility top-ups all in one place.
          </p>
          
          <div className="pt-6 space-y-3.5">
            <div className="flex items-center gap-3 text-white/90 text-sm font-medium">
              <Buildings className="h-5 w-5 text-[#ff3f7a]" weight="fill" />
              <span>CAC Registrations & Post-Incorporation</span>
            </div>
            <div className="flex items-center gap-3 text-white/90 text-sm font-medium">
              <IdentificationCard className="h-5 w-5 text-[#ff3f7a]" weight="fill" />
              <span>Instant NIN Slips</span>
            </div>
            <div className="flex items-center gap-3 text-white/90 text-sm font-medium">
              <ShieldCheck className="h-5 w-5 text-[#ff3f7a]" weight="fill" />
              <span>SCUML, Trademark (IPO), Tax ID & SMEDAN</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-white/50 font-semibold tracking-widest uppercase">
          <span>Powered by Quadrox Technologies Limited</span>
        </div>
      </div>

      {/* RIGHT PANEL (Scrolls natively with the form) */}
      <div className="flex-1 w-full relative">
         <RegisterForm />
      </div>

      {/* DYNAMIC WHATSAPP SUPPORT ICON */}
      <a 
        href={`https://wa.me/${activeSupportNumber}`}
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="Chat with Support"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#25D366] rounded-full shadow-lg shadow-black/20 hover:bg-[#1EBE5D] hover:scale-105 transition-all duration-300 group"
      >
        <WhatsappLogo className="h-8 w-8 text-white" weight="fill" />
        <span className="absolute right-16 bg-foreground text-background text-sm font-medium px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
          Need Help? Chat with Support
        </span>
      </a>

    </div>
  );
}
