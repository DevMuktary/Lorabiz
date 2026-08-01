"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function AcceptableUsePage() {
  const [activeSection, setActiveSection] = useState("");

  const sections = [
    { id: "introduction", title: "1. Introduction" },
    { id: "unlawful", title: "2. Unlawful Activities" },
    { id: "fraud", title: "3. Fraud & Forgery" },
    { id: "system-abuse", title: "4. System Abuse & APIs" },
    { id: "nin-usage", title: "5. Identity & NIN Usage" },
    { id: "enforcement", title: "6. Enforcement" },
  ];

  // Scroll Spy Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-[#0a0f1e] text-zinc-900 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          
          <div className="mb-12 border-b border-black/5 dark:border-white/5 pb-10">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-bold tracking-widest uppercase bg-[#c7365f]/10 text-[#c7365f] mb-6">
              Legal Documents
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1a1a1a] dark:text-white mb-4">
              Acceptable Use Policy
            </h1>
            <div className="flex items-center gap-4 text-[15px] text-[#767676] dark:text-white/60">
              <p>Effective Date: <span className="text-zinc-900 dark:text-white font-medium">July 30, 2026</span></p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-16 relative">
            
            <div className="w-full lg:w-1/4">
              <div className="sticky top-32 bg-white dark:bg-[#111827] border border-black/5 dark:border-white/5 rounded-2xl p-6 shadow-xl hidden lg:block">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Table of Contents</h3>
                <nav className="flex flex-col gap-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`text-left text-[14px] px-3 py-2 rounded-lg transition-all duration-200 ${
                        activeSection === section.id
                          ? "bg-[#c7365f]/10 text-[#c7365f] font-semibold"
                          : "text-[#767676] dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            <div className="w-full lg:w-3/4 bg-white dark:bg-[#111827] border border-black/5 dark:border-white/5 rounded-3xl p-8 md:p-12 shadow-sm">
              <div className="prose prose-zinc dark:prose-invert max-w-none text-[#767676] dark:text-white/70 leading-relaxed text-[16px]">
                
                <p className="text-lg text-zinc-900 dark:text-white font-medium mb-10">
                  This Acceptable Use Policy dictates the boundaries of acceptable behavior while utilizing the LoraBiz platform, APIs, and infrastructure. By using LoraBiz, you agree to adhere to these rules.
                </p>

                <section id="introduction" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">1. Introduction</h2>
                  <p>Quadrox Technologies Limited provides LoraBiz to facilitate legitimate business operations, statutory registrations, and utility payments. This policy ensures our platform remains secure, legal, and reliable for all users and our government partners.</p>
                </section>

                <section id="unlawful" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">2. Unlawful Activities</h2>
                  <p className="mb-3">You may not use LoraBiz to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Register businesses intended for fraud, money laundering, terrorism financing, or illegal pyramid schemes.</li>
                    <li>Violate the laws of the Federal Republic of Nigeria or any applicable international regulations.</li>
                    <li>Engage in activities that deliberately violate the policies of the CAC, EFCC, FIRS, or NIMC.</li>
                  </ul>
                </section>

                <section id="fraud" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">3. Fraud & Forgery</h2>
                  <p className="mb-3">Our system maintains a zero-tolerance policy for forgery. You must not:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Upload manipulated, photoshopped, or counterfeit identity documents (passports, driver's licenses).</li>
                    <li>Falsify signatures on CAC incorporation documents.</li>
                    <li>Provide false residential addresses or phantom directors during registration processes.</li>
                  </ul>
                </section>

                <section id="system-abuse" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">4. System Abuse & APIs</h2>
                  <p className="mb-3">To maintain platform stability, you are prohibited from:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Using automated bots, scrapers, or scripts to extract data from LoraBiz without explicit API access.</li>
                    <li>Attempting to bypass rate limits or artificially inflate server load (DDoS).</li>
                    <li>Reverse engineering the platform to discover underlying infrastructure.</li>
                  </ul>
                </section>

                <section id="nin-usage" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">5. Identity & NIN Usage</h2>
                  <p className="mb-3">The NIN verification and slip generation tools are strictly for legitimate verification purposes required for business setup. You must not:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Generate NIN slips for individuals without their explicit, documented consent.</li>
                    <li>Use the NIMC integration for mass-surveillance or unauthorized data harvesting.</li>
                  </ul>
                </section>

                <section id="enforcement" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">6. Enforcement</h2>
                  <p>Violation of this policy will result in immediate suspension of your LoraBiz account, forfeiture of wallet balances, and if applicable, reporting of your activities to the Economic and Financial Crimes Commission (EFCC) or the Nigeria Police Force.</p>
                </section>

              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
