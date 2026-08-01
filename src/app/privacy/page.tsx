"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState("");

  const sections = [
    { id: "overview", title: "1. Overview" },
    { id: "collection", title: "2. Information We Collect" },
    { id: "usage", title: "3. How We Use Your Data" },
    { id: "sharing", title: "4. Information Sharing" },
    { id: "security", title: "5. Data Security" },
    { id: "rights", title: "6. Your Privacy Rights" },
    { id: "cookies", title: "7. Cookies & Tracking" },
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
              Privacy Policy
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
                  Quadrox Technologies Limited ("LoraBiz", "we", "our") respects your privacy. This policy complies with the Nigeria Data Protection Regulation (NDPR) and outlines how we collect, use, and protect your data.
                </p>

                <section id="overview" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">1. Overview</h2>
                  <p>When you use LoraBiz to register businesses, generate tax IDs, or vend utilities, we act as a data processor transmitting your information to statutory bodies. We are committed to securing this sensitive information.</p>
                </section>

                <section id="collection" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">2. Information We Collect</h2>
                  <p className="mb-3">We collect the following categories of information:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Account Data:</strong> Name, email address, phone number, and password.</li>
                    <li><strong>Statutory Data:</strong> NIN, BVN, signatures, passport photographs, and home addresses required for CAC, FIRS, or EFCC processing.</li>
                    <li><strong>Financial Data:</strong> Wallet balances and transaction history. (Note: We do not store raw credit card details; these are handled by our payment partners like Paystack).</li>
                  </ul>
                </section>

                <section id="usage" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">3. How We Use Your Data</h2>
                  <p className="mb-3">Your data is strictly used to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Execute the services you ordered (e.g., submitting your details to the CAC to generate your business certificate).</li>
                    <li>Process wallet deposits and utility vending.</li>
                    <li>Send you system alerts, 2FA codes, and application status updates.</li>
                    <li>Comply with anti-money laundering (AML) and KYC regulations.</li>
                  </ul>
                </section>

                <section id="sharing" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">4. Information Sharing</h2>
                  <p className="mb-3">We do not sell your personal data to marketers. Your data is only shared with:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Government Agencies:</strong> CAC, FIRS, EFCC, and NIMC in order to fulfill your requested services.</li>
                    <li><strong>Payment Gateways:</strong> To process secure deposits into your wallet.</li>
                    <li><strong>Law Enforcement:</strong> If compelled by a legally binding subpoena or court order in Nigeria.</li>
                  </ul>
                </section>

                <section id="security" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">5. Data Security</h2>
                  <p>We implement bank-grade encryption (AES-256) for data at rest and TLS 1.2+ for data in transit. Access to sensitive documents (like NIN slips or signatures) is strictly controlled and monitored within our internal staff infrastructure.</p>
                </section>

                <section id="rights" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">6. Your Privacy Rights</h2>
                  <p>Under the NDPR, you have the right to request access to your data, request corrections, or request deletion (subject to legal retention requirements for financial transactions and corporate filings). Contact <a href="mailto:privacy@lorabiz.com" className="text-[#c7365f]">privacy@lorabiz.com</a> to exercise these rights.</p>
                </section>

                <section id="cookies" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">7. Cookies & Tracking</h2>
                  <p>We use functional cookies to keep you logged in securely and analytics cookies to understand platform performance. You can control cookie preferences via your browser settings.</p>
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
