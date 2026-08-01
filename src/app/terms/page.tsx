"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState("");

  const sections = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "description", title: "2. Description of Services" },
    { id: "accounts", title: "3. User Accounts and Security" },
    { id: "wallet", title: "4. Wallet, Pricing, and Payments" },
    { id: "responsibilities", title: "5. Document Submission" },
    { id: "timelines", title: "6. Processing Timelines" },
    { id: "ip", title: "7. Intellectual Property" },
    { id: "prohibited", title: "8. Prohibited Conduct" },
    { id: "liability", title: "9. Limitation of Liability" },
    { id: "indemnification", title: "10. Indemnification" },
    { id: "termination", title: "11. Termination" },
    { id: "disputes", title: "12. Dispute Resolution" },
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
      { rootMargin: "-20% 0px -60% 0px" } // Adjust to trigger when section is near top
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
      const y = element.getBoundingClientRect().top + window.scrollY - 120; // Offset for navbar
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-[#0a0f1e] text-zinc-900 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          
          {/* Header */}
          <div className="mb-12 border-b border-black/5 dark:border-white/5 pb-10">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-bold tracking-widest uppercase bg-[#c7365f]/10 text-[#c7365f] mb-6">
              Legal Documents
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-[#1a1a1a] dark:text-white mb-4">
              Terms of Service
            </h1>
            <div className="flex items-center gap-4 text-[15px] text-[#767676] dark:text-white/60">
              <p>Effective Date: <span className="text-zinc-900 dark:text-white font-medium">July 30, 2026</span></p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-16 relative">
            
            {/* Sticky Sidebar Navigation */}
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

            {/* Main Content Area */}
            <div className="w-full lg:w-3/4 bg-white dark:bg-[#111827] border border-black/5 dark:border-white/5 rounded-3xl p-8 md:p-12 shadow-sm">
              <div className="prose prose-zinc dark:prose-invert max-w-none text-[#767676] dark:text-white/70 leading-relaxed text-[16px]">
                
                <p className="text-lg text-zinc-900 dark:text-white font-medium mb-10">
                  Welcome to LoraBiz! These Terms of Service ("Terms") govern your access to and use of the LoraBiz website, platform, application, and services (collectively, the "Services") provided by Quadrox Technologies Limited ("LoraBiz," "we," "us," or "our").
                </p>

                <section id="acceptance" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
                  <p className="mb-3"><strong>1.1. Legally Binding Agreement:</strong> These Terms constitute a legally binding agreement between you (whether an individual or a corporate entity) and Quadrox Technologies Limited, a company registered in the Federal Republic of Nigeria.</p>
                  <p><strong>1.2. Capacity:</strong> By using LoraBiz, you represent and warrant that you are at least 18 years of age and possess the legal authority, right, and capacity to enter into these Terms.</p>
                </section>

                <section id="description" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">2. Description of Services</h2>
                  <p className="mb-3"><strong>2.1. Nature of Services:</strong> LoraBiz operates as a Business-to-Business (B2B) Software-as-a-Service (SaaS) platform facilitating the processing of statutory registrations and regulatory compliance, including but not limited to:</p>
                  <ul className="list-disc pl-6 mb-4 space-y-2">
                    <li>Corporate Affairs Commission (CAC) Registrations (Business Names, LLCs, NGOs).</li>
                    <li>Tax Identification Number (TIN) Generation.</li>
                    <li>Special Control Unit Against Money Laundering (SCUML) Certification.</li>
                    <li>National Identity Management Commission (NIMC) Services (NIN Slip printing).</li>
                    <li>Utility Services (Airtime & Data top-up, Electricity).</li>
                  </ul>
                  <p className="mb-3"><strong>2.2. Third-Party Agency:</strong> You acknowledge and agree that LoraBiz acts as an intermediary technology platform. We transmit your data to the relevant statutory bodies (CAC, FIRS, NIMC, EFCC) directly or via accredited third-party partners.</p>
                </section>

                <section id="accounts" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">3. User Accounts and Security</h2>
                  <p className="mb-3"><strong>3.1. Registration:</strong> To access certain features, you must create a LoraBiz account. You agree to provide accurate, current, and complete information.</p>
                  <p className="mb-3"><strong>3.2. Security:</strong> You are responsible for safeguarding your login credentials, including passwords and Two-Factor Authentication (2FA) codes.</p>
                </section>

                <section id="wallet" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">4. Wallet, Pricing, and Payments</h2>
                  <p className="mb-3"><strong>4.1. Digital Wallet:</strong> LoraBiz utilizes a digital wallet system for processing transactions. You must fund your wallet to access paid services.</p>
                  <p className="mb-3"><strong>4.2. Non-Refundable Fees:</strong> Fees remitted to government agencies (e.g., CAC, EFCC, FIRS) on your behalf are strictly non-refundable once the application has been submitted.</p>
                </section>

                <section id="responsibilities" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">5. Document Submission and User Responsibilities</h2>
                  <p className="mb-3"><strong>5.1. Accuracy of Information:</strong> You bear full responsibility for the accuracy, legality, and authenticity of all information and documents submitted.</p>
                  <p className="mb-3"><strong>5.2. Fraud and Forgery:</strong> Submission of falsified documents may result in immediate account suspension, forfeiture of wallet funds, and reporting to relevant Nigerian law enforcement agencies.</p>
                </section>

                <section id="timelines" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">6. Processing Timelines</h2>
                  <p className="mb-3"><strong>6.1. Estimates:</strong> Any processing timelines displayed on the platform are estimates based on standard operational conditions.</p>
                  <p className="mb-3"><strong>6.2. External Dependencies:</strong> You acknowledge that processing times are heavily dependent on the operational capacity and network uptime of external government agencies.</p>
                </section>

                <section id="ip" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">7. Intellectual Property</h2>
                  <p className="mb-3">All intellectual property rights in the LoraBiz platform, including its software, UI/UX, algorithms, text, graphics, logos, and trademarks, are owned by Quadrox Technologies Limited.</p>
                </section>

                <section id="prohibited" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">8. Prohibited Conduct</h2>
                  <p className="mb-3">You agree NOT to use LoraBiz for any illegal, fraudulent, or money-laundering activities, nor attempt to bypass security mechanisms, nor use automated scrapers on our platform.</p>
                </section>

                <section id="liability" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">9. Limitation of Liability</h2>
                  <p className="mb-3">The Services are provided "AS IS". To the maximum extent permitted by Nigerian law, Quadrox Technologies Limited shall not be liable for any indirect, incidental, special, or consequential damages.</p>
                </section>

                <section id="indemnification" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">10. Indemnification</h2>
                  <p className="mb-3">You agree to indemnify and hold harmless Quadrox Technologies Limited from claims arising out of your violation of these Terms or submission of fraudulent documents.</p>
                </section>

                <section id="termination" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">11. Termination</h2>
                  <p className="mb-3">We reserve the right to suspend or terminate your account at our sole discretion if we determine that you have violated these Terms or posed a security risk.</p>
                </section>

                <section id="disputes" className="scroll-mt-32 mb-12">
                  <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-4">12. Dispute Resolution</h2>
                  <p className="mb-3">These Terms shall be governed by the laws of the Federal Republic of Nigeria. Disputes shall be settled by binding arbitration in Lagos, Nigeria.</p>
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
