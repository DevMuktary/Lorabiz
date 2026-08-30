"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import { WarningOctagon, Prohibit, ShieldCheck, Scales, UserCircleMinus, Key } from "@phosphor-icons/react";

export default function AcceptableUsePage() {
  const [activeSection, setActiveSection] = useState("");

  const sections = [
    { id: "introduction", title: "1. Policy Purpose & Scope" },
    { id: "zero-tolerance", title: "2. Zero-Tolerance for Identity Fraud" },
    { id: "identity-rules", title: "3. Mandatory Rules for NIN & BVN Operations" },
    { id: "cac-rules", title: "4. Corporate Filing & CAMA Standards" },
    { id: "technical-abuse", title: "5. System Security, Bots & Rate Limits" },
    { id: "financial-crimes", title: "6. Anti-Money Laundering & CFT Standards" },
    { id: "enforcement", title: "7. Regulatory Reporting & Law Enforcement Surrender" },
    { id: "sanctions", title: "8. Penalties & Account Sanctions" },
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-bold tracking-widest uppercase bg-[#c7365f]/10 text-[#c7365f] mb-6">
              <Prohibit className="h-4 w-4" weight="bold" />
              <span>Platform Integrity Guidelines</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#1a1a1a] dark:text-white mb-4">
              Acceptable Use Policy
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-[14px] text-[#767676] dark:text-white/60">
              <p>Effective Date: <span className="text-zinc-900 dark:text-white font-medium">July 30, 2026</span></p>
              <span>•</span>
              <p>Enforcement Authority: <span className="text-zinc-900 dark:text-white font-medium">Quadrox Technologies Limited Compliance Bureau</span></p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-16 relative">
            
            <div className="w-full lg:w-1/4">
              <div className="sticky top-32 bg-white dark:bg-[#111827] border border-black/5 dark:border-white/5 rounded-2xl p-6 shadow-xl hidden lg:block">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Table of Contents</h3>
                <nav className="flex flex-col gap-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`text-left text-[13px] px-3 py-2 rounded-lg transition-all duration-200 ${
                        activeSection === section.id
                          ? "bg-[#c7365f]/10 text-[#c7365f] font-bold"
                          : "text-[#767676] dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>

                <div className="mt-6 pt-4 border-t border-border/60">
                  <Link
                    href="/terms"
                    className="text-xs font-bold text-[#c7365f] hover:underline flex items-center gap-1.5"
                  >
                    <Scales className="h-4 w-4" weight="bold" />
                    <span>Review Terms of Service</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-3/4 bg-white dark:bg-[#111827] border border-black/5 dark:border-white/5 rounded-3xl p-8 md:p-12 shadow-sm">
              <div className="prose prose-zinc dark:prose-invert max-w-none text-[#767676] dark:text-white/70 leading-relaxed text-[15px] sm:text-[16px] space-y-10">
                
                <p className="text-lg text-zinc-900 dark:text-white font-medium">
                  This Acceptable Use Policy ("AUP") defines the mandatory operational boundaries and code of conduct governing all registered users, registration agents, and developers utilizing the <strong>LoraBiz</strong> platform, applications, and routing APIs provided by <strong>Quadrox Technologies Limited</strong>.
                </p>

                {/* Section 1 */}
                <section id="introduction" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">1. Policy Purpose & Scope</h2>
                  <p>LoraBiz is dedicated to facilitating lawful, transparent business incorporation, regulatory compliance, and identity verification across Nigeria. This policy ensures our platform is never leveraged for criminal enterprise, unauthorized identity lookups, surveillance, or consumer deception.</p>
                </section>

                {/* Section 2 */}
                <section id="zero-tolerance" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">2. Zero-Tolerance for Identity Fraud & Cybercrime</h2>
                  <p>Quadrox Technologies Limited maintains an absolute <strong>ZERO-TOLERANCE POLICY</strong> for identity theft, spoofing, impersonation, and fraudulent documentation. Any attempt to abuse LoraBiz to commit cybercrime is a direct felony under the <strong>Cybercrimes (Prohibition, Prevention, etc.) Act 2015</strong> and the <strong>Nigeria Data Protection Act (NDPA) 2023</strong>.</p>
                </section>

                {/* Section 3 */}
                <section id="identity-rules" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">3. Mandatory Rules for NIN & BVN Operations</h2>
                  <p>When using our National Identification Number (NIN) and Bank Verification Number (BVN) verification or slip generation features, you are strictly prohibited from:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Unauthorized Third-Party Lookups:</strong> Inputting the NIN, BVN, or phone number of any person without their express, documented, written proxy consent.</li>
                    <li><strong>Predatory Profiling & Surveillance:</strong> Querying public figures, government officials, or individuals for harassment, unlawful background checks, or extortion.</li>
                    <li><strong>Unlawful Loan App Recovery Operations:</strong> Using our identity verification infrastructure to harass defaulting loan borrowers without lawful court orders.</li>
                    <li><strong>SIM-Swap & Account Takeover Preparation:</strong> Generating NIN or BVN slips to execute fraudulent telecom SIM swaps or illicit bank account takeovers.</li>
                    <li><strong>Mass Harvesting:</strong> Conducting sequential, automated, or bulk identity queries to amass unauthorized personal data databases.</li>
                  </ul>
                </section>

                {/* Section 4 */}
                <section id="cac-rules" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">4. Corporate Filing & CAMA Standards</h2>
                  <p>When submitting Corporate Affairs Commission (CAC) registrations (Business Names, LLCs, Incorporated Trustees), you must NOT:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Submit fictitious, phantom, or deceased persons as company directors, proprietors, or trustees without statutory legal letters of administration.</li>
                    <li>Upload manipulated, photoshopped, or forged government identity cards, utility bills, or specimen signatures.</li>
                    <li>Incorporate shell entities intended for advance-fee fraud ("419"), ponzi schemes, illegal forex syndicates, or illegal mining operations.</li>
                  </ul>
                </section>

                {/* Section 5 */}
                <section id="technical-abuse" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">5. System Security, Bots & Rate Limits</h2>
                  <p>To preserve platform availability and prevent denial of service (DoS), you agree NOT to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Employ scrapers, crawlers, or automated bots against any LoraBiz web endpoint without written API agreements.</li>
                    <li>Circumvent or tamper with client-side rate limits, payment gateways, or security firewalls.</li>
                    <li>Reverse-engineer, decompile, or extract proprietary software logic from the platform.</li>
                  </ul>
                </section>

                {/* Section 6 */}
                <section id="financial-crimes" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">6. Anti-Money Laundering & CFT Standards</h2>
                  <p>LoraBiz strictly adheres to the <strong>Money Laundering (Prevention and Prohibition) Act 2022</strong>. You may not fund your digital wallet with stolen credit cards, compromised bank accounts, or funds derived from extortion, kidnapping, drug trafficking, or wire fraud.</p>
                </section>

                {/* Section 7 */}
                <section id="enforcement" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">7. Regulatory Reporting & Law Enforcement Surrender</h2>
                  <p>Upon detection of fraudulent queries or falsified filings, LoraBiz automatically initiates internal containment and immediately surrenders full audit records (authenticated user ID, IP address, geolocation headers, transaction timestamp, and consent affirmation) to:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>The <strong>Economic and Financial Crimes Commission (EFCC)</strong></li>
                    <li>The <strong>Nigeria Police Force (NPF) Special Fraud Unit (SFU)</strong></li>
                    <li>The <strong>Nigeria Data Protection Commission (NDPC)</strong></li>
                    <li>The <strong>National Identity Management Commission (NIMC)</strong></li>
                  </ul>
                </section>

                {/* Section 8 */}
                <section id="sanctions" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">8. Penalties & Account Sanctions</h2>
                  <p>Any violation of this AUP results in immediate administrative actions:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 space-y-1">
                      <h4 className="font-bold text-sm">Immediate Lockout</h4>
                      <p className="text-xs">Permanent termination of account access and blacklisting of associated phone and IP records.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 space-y-1">
                      <h4 className="font-bold text-sm">Balance Forfeiture</h4>
                      <p className="text-xs">Forfeiture of all remaining wallet funds to offset administrative investigation costs.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 space-y-1">
                      <h4 className="font-bold text-sm">Criminal Referral</h4>
                      <p className="text-xs">Formal criminal transmission to law enforcement for arrest, asset seizure, and prosecution.</p>
                    </div>
                  </div>
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
