"use client";

import { useState, useEffect } from "react";
import { CheckCircle, ShieldCheck, RocketLaunch, WhatsappLogo } from "@phosphor-icons/react";
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
  const activeSupportNumber = supportNumber || "2348000000000";

  return (
    // FIX: Using min-h-[100dvh] allows native browser scrolling instead of a fixed wrapper.
    // This entirely removes the Safari iOS "white bar / scrolling inside a box" bug.
    <div className="flex min-h-[100dvh] w-full bg-background font-sans selection:bg-[#ff3f7a] selection:text-white flex-col lg:flex-row transition-colors duration-300 relative">
      
      {/* LEFT PANEL (Sticky on desktop so it doesn't scroll out of view) */}
      <div className="hidden lg:flex lg:w-[45%] lg:sticky lg:top-0 lg:h-[100dvh] bg-[#ff3f7a] p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-white/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-black/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 text-white space-y-6 max-w-lg mx-auto">
          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight">
            Welcome to LoraBiz.
          </h1>
          <p className="text-lg text-white/90 leading-relaxed">
            Skip the legal jargon and expensive agents. Register and manage your business instantly with our seamless, automated platform.
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

      {/* RIGHT PANEL (Scrolls natively with the page) */}
      <div className="flex-1 w-full relative">
         <RegisterForm />
      </div>

      {/* DYNAMIC WHATSAPP SUPPORT ICON (Permanently visible) */}
      <a 
        href={`https://wa.me/${activeSupportNumber}`}
        target="_blank" 
        rel="noopener noreferrer"
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
