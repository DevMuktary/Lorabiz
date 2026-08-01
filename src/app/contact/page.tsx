"use client";

import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";

export default function ContactPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct the pre-filled email content
    const subject = encodeURIComponent(`LoraBiz Inquiry from ${firstName} ${lastName}`);
    const body = encodeURIComponent(`Name: ${firstName} ${lastName}\nEmail: ${email}\n\nMessage:\n${message}`);
    
    // Trigger the user's default email client (Gmail, Apple Mail, Outlook, etc.)
    window.location.href = `mailto:support@lorabiz.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-[#0a0f1e] text-zinc-900 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* BRAND GLOW EFFECT */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#c7365f]/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[1200px] mx-auto relative z-10">
          
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight text-[#1a1a1a] dark:text-white">Get in touch</h1>
            <p className="text-lg text-[#767676] dark:text-white/60" style={{ fontFamily: '"DM Sans", sans-serif' }}>
              Whether you have a question about registration, pricing, or our APIs, our team is ready to answer all your questions.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-0 bg-white dark:bg-[#111827] rounded-[40px] border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden">
            
            {/* Left Side - Contact Info */}
            <div className="w-full lg:w-[45%] bg-zinc-50 dark:bg-black/20 p-10 lg:p-16 flex flex-col justify-between border-r border-black/5 dark:border-white/5">
              <div>
                <h3 className="text-2xl font-semibold mb-2 text-[#1a1a1a] dark:text-white">Contact Information</h3>
                <p className="text-[15px] text-[#767676] dark:text-white/60 mb-10 leading-relaxed">
                  For external inquiries, use the details below. If you already have an account, please use the comprehensive 24/7 support ticketing system directly inside your dashboard.
                </p>
                
                <div className="space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#c7365f]/10 flex items-center justify-center text-[#c7365f] flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-400 dark:text-white/40 uppercase tracking-wider mb-1">Email Us</p>
                      <a href="mailto:support@lorabiz.com" className="text-[17px] font-semibold text-[#1a1a1a] dark:text-white hover:text-[#c7365f] transition-colors">
                        support@lorabiz.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#c7365f]/10 flex items-center justify-center text-[#c7365f] flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-400 dark:text-white/40 uppercase tracking-wider mb-1">Working Hours</p>
                      <p className="text-[17px] font-semibold text-[#1a1a1a] dark:text-white">9:00 AM — 5:00 PM</p>
                      <p className="text-[14px] text-[#767676] dark:text-white/60">Monday to Friday</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#c7365f]/10 flex items-center justify-center text-[#c7365f] flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-400 dark:text-white/40 uppercase tracking-wider mb-1">Office Address</p>
                      <p className="text-[17px] font-semibold text-[#1a1a1a] dark:text-white">Ibadan, Oyo State,<br />Nigeria.</p>
                    </div>
                  </div>
                </div>

                {/* --- Social Media Section --- */}
                <div className="mt-10 pt-8 border-t border-black/5 dark:border-white/5">
                  <p className="text-sm font-bold text-zinc-400 dark:text-white/40 uppercase tracking-wider mb-2">Connect With Us</p>
                  <p className="text-[14px] text-[#767676] dark:text-white/60 mb-5">You can also reach out to us via our official social media channels.</p>
                  
                  <div className="flex items-center gap-4">
                    {/* X / Twitter */}
                    <a href="https://x.com/use_lorabiz" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-[#c7365f] hover:text-white transition-all duration-300">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.918H5.078z"/></svg>
                    </a>
                    {/* Instagram */}
                    <a href="https://instagram.com/use_lorabiz" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-[#c7365f] hover:text-white transition-all duration-300">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.46 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" /></svg>
                    </a>
                    {/* Facebook */}
                    <a href="https://facebook.com/use_lorabiz" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-[#c7365f] hover:text-white transition-all duration-300">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
                    </a>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Side - The Form (No Backend Required) */}
            <div className="w-full lg:w-[55%] p-10 lg:p-16">
              <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] font-semibold text-[#1a1a1a] dark:text-white">First Name</label>
                    <input 
                      type="text" 
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John" 
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3.5 focus:outline-none focus:border-[#c7365f] focus:ring-1 focus:ring-[#c7365f] transition-all" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[14px] font-semibold text-[#1a1a1a] dark:text-white">Last Name</label>
                    <input 
                      type="text" 
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe" 
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3.5 focus:outline-none focus:border-[#c7365f] focus:ring-1 focus:ring-[#c7365f] transition-all" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-semibold text-[#1a1a1a] dark:text-white">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@company.com" 
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3.5 focus:outline-none focus:border-[#c7365f] focus:ring-1 focus:ring-[#c7365f] transition-all" 
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-semibold text-[#1a1a1a] dark:text-white">Message</label>
                  <textarea 
                    rows={5} 
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help you?" 
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl p-3.5 focus:outline-none focus:border-[#c7365f] focus:ring-1 focus:ring-[#c7365f] transition-all resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 mt-4 bg-[#c7365f] hover:bg-[#e8447a] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#c7365f]/20 hover:shadow-[#c7365f]/40 hover:-translate-y-0.5"
                >
                  Send via Email Client
                </button>

                <p className="text-center text-[13px] text-[#767676] dark:text-white/50 mt-2">
                  Clicking this will open your default email app (Gmail, Apple Mail, etc.) with your message pre-filled.
                </p>

              </form>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}