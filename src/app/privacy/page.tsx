"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import { ShieldCheck, LockKey, EnvelopeSimple, Buildings, UserCheck, EyeSlash, Database } from "@phosphor-icons/react";

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState("");

  const sections = [
    { id: "overview", title: "1. Scope & Regulatory Framework (NDPA 2023)" },
    { id: "collection", title: "2. Categories of Personal Data Collected" },
    { id: "lawful-basis", title: "3. Lawful Bases for Processing" },
    { id: "usage", title: "4. Processing Purposes & Verification Caching" },
    { id: "sharing", title: "5. Statutory Transmissions & Disclosures" },
    { id: "security", title: "6. Technical & Organizational Security Safeguards" },
    { id: "retention", title: "7. Data Retention & Erasure Schedule" },
    { id: "rights", title: "8. Data Subject Rights (Sections 34–37 NDPA)" },
    { id: "breach", title: "9. 72-Hour Data Breach Notification Protocol" },
    { id: "dpo", title: "10. Data Protection Officer (DPO) Contact" },
    { id: "cookies", title: "11. Cookies, Telemetry & Session Tokens" },
    { id: "updates", title: "12. Policy Governance & Amendments" },
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
          
          {/* Header */}
          <div className="mb-12 border-b border-black/5 dark:border-white/5 pb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-bold tracking-widest uppercase bg-[#c7365f]/10 text-[#c7365f] mb-6">
              <ShieldCheck className="h-4 w-4" weight="bold" />
              <span>Data Protection & Privacy Charter</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#1a1a1a] dark:text-white mb-4">
              Privacy Policy
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-[14px] text-[#767676] dark:text-white/60">
              <p>Effective Date: <span className="text-zinc-900 dark:text-white font-medium">July 30, 2026</span></p>
              <span>•</span>
              <p>Regulatory Standard: <span className="text-zinc-900 dark:text-white font-medium">Nigeria Data Protection Act (NDPA) 2023 / NDPC</span></p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-16 relative">
            
            {/* Sticky Sidebar Navigation */}
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
                    href="/compliance"
                    className="text-xs font-bold text-[#c7365f] hover:underline flex items-center gap-1.5"
                  >
                    <LockKey className="h-4 w-4" weight="bold" />
                    <span>View NDPC Compliance Portal</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full lg:w-3/4 bg-white dark:bg-[#111827] border border-black/5 dark:border-white/5 rounded-3xl p-8 md:p-12 shadow-sm">
              <div className="prose prose-zinc dark:prose-invert max-w-none text-[#767676] dark:text-white/70 leading-relaxed text-[15px] sm:text-[16px] space-y-10">
                
                <p className="text-lg text-zinc-900 dark:text-white font-medium">
                  <strong>Quadrox Technologies Limited</strong> ("LoraBiz", "Company", "we", "us", or "our") is dedicated to protecting the fundamental privacy rights and personal data of our users and data subjects in strict compliance with the <strong>Nigeria Data Protection Act (NDPA) 2023</strong>, General Application and Implementation Directives of the <strong>Nigeria Data Protection Commission (NDPC)</strong>, and applicable international privacy frameworks.
                </p>

                {/* Section 1 */}
                <section id="overview" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">1. Scope & Regulatory Framework (NDPA 2023)</h2>
                  <p><strong>1.1. Data Controller vs. Data Processor Role:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>As a Data Controller:</strong> LoraBiz determines the purposes and means of processing personal data directly collected from registered users for account creation, platform billing, KYC, and security management.</li>
                    <li><strong>As a Data Processor:</strong> When you use LoraBiz to initiate third-party business registrations (CAC), Tax ID lookups (FIRS), AML filings (SCUML), or identity slip generations (NIMC/NIBSS), LoraBiz acts purely as a <em>Data Processor and Technological Conduit</em> processing data on your explicit lawful instruction and statutory proxy mandate pursuant to Section 24 and Section 25 of the NDPA 2023.</li>
                  </ul>
                  <p><strong>1.2. Scope of Application:</strong> This Policy applies to all visitors, registered business clients, registration agents, and individual consumers accessing our website, portals, APIs, and digital applications.</p>
                </section>

                {/* Section 2 */}
                <section id="collection" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">2. Categories of Personal Data Collected</h2>
                  <p>In operating our B2B SaaS and statutory processing infrastructure, we collect and process the following categories of personal information:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Account & Identity Data:</strong> Full legal name, gender, residential address, state, LGA, email address, verifiable phone number, WhatsApp number, encrypted password hash, and profile image.</li>
                    <li><strong>Statutory Registration Records:</strong> National Identification Number (NIN), Bank Verification Number (BVN), Tax Identification Number (TIN), passport photographs, digital specimen signatures, dates of birth, and identity documentation required by statutory bodies (CAC, NIMC, FIRS, EFCC).</li>
                    <li><strong>Corporate Filing Data:</strong> Proposed business names, LLC articles of association, objects of business, director, shareholder, secretary, and Persons with Significant Control (PSC) details.</li>
                    <li><strong>Financial & Transactional Logs:</strong> Wallet transaction ledgers, Paystack payment references, timestamped debit/credit logs, bank account numbers submitted for payouts, and promo code redemptions. (Raw payment card credentials are tokenized and processed exclusively by PCI-DSS certified payment gateways).</li>
                    <li><strong>Technical & Non-Repudiation Telemetry:</strong> Real client IP addresses, browser user-agent signatures, device fingerprints, login timestamps, and statutory consent acceptance timestamps.</li>
                  </ul>
                </section>

                {/* Section 3 */}
                <section id="lawful-basis" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">3. Lawful Bases for Processing</h2>
                  <p>Pursuant to Section 25 of the NDPA 2023, LoraBiz processes your personal data only where at least one of the following lawful bases applies:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-1.5">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">A. Performance of Contract</h4>
                      <p className="text-xs text-muted-foreground">Processing necessary to deliver the requested service (e.g. submitting your CAC incorporation application or issuing your verification slip).</p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-1.5">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">B. Legal & Statutory Obligation</h4>
                      <p className="text-xs text-muted-foreground">Compliance with Nigerian statutory requirements under CAMA 2020, NIMC Act 2007, Money Laundering (Prevention and Prohibition) Act 2022, and FIRS tax laws.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-1.5">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">C. Explicit Consent</h4>
                      <p className="text-xs text-muted-foreground">Specific, freely given, informed, and unambiguous statutory consent provided by you (or obtained by you from third-party data subjects as their lawful proxy) prior to initiating identity verification.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-1.5">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">D. Legitimate Interests</h4>
                      <p className="text-xs text-muted-foreground">Preventing identity theft, maintaining non-repudiation audit trails, thwarting cyberattacks, and protecting the security of our platform.</p>
                    </div>
                  </div>
                </section>

                {/* Section 4 */}
                <section id="usage" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">4. Processing Purposes & Verification Caching</h2>
                  <p>Your data is used strictly for legitimate, declared operational purposes:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Transmitting incorporation forms and statutory documents to the Corporate Affairs Commission (CAC).</li>
                    <li>Routing verification queries to accredited identity gateways (NIMC/DataVerify/NIBSS) to generate authorized slip formats.</li>
                    <li>Managing your digital wallet, executing debit/credit settlements, and issuing transaction receipts.</li>
                    <li>Enforcing multi-factor authentication (2FA) and mitigating fraudulent account takeovers.</li>
                    <li><strong>Short-Term Demographic Caching:</strong> Verification records generated on user request are retained in an encrypted, authenticated storage bucket for a limited operational window (enabling you to view and download your slip) and subsequent statutory audit trail preservation.</li>
                  </ul>
                </section>

                {/* Section 5 */}
                <section id="sharing" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">5. Statutory Transmissions & Disclosures</h2>
                  <p>LoraBiz maintains a strict <strong>NO DATA SALE POLICY</strong>. We never sell, monetize, or rent personal data to advertisers or commercial brokers. Personal data is transmitted only to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Statutory & Regulatory Bodies:</strong> CAC, NIMC, FIRS, and SCUML/EFCC solely for fulfilling user-requested corporate filings and certifications.</li>
                    <li><strong>Licensed Identity & Payment Partners:</strong> PCI-DSS certified payment processors (Paystack) and accredited technical identity routing nodes under strict confidentiality and NDPA-compliant data processing addenda.</li>
                    <li><strong>Law Enforcement & Judicial Authorities:</strong> In accordance with Section 6 of our Terms of Service, where an official request, court order, or subpoena is received from the EFCC, Nigeria Police Force, DSS, or NDPC in connection with criminal identity theft investigations.</li>
                  </ul>
                </section>

                {/* Section 6 */}
                <section id="security" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">6. Technical & Organizational Security Safeguards (TOMS)</h2>
                  <p>We deploy bank-grade technical and organizational safeguards to protect data against unauthorized disclosure, interception, or destruction:</p>
                  <div className="space-y-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-secondary/30 border border-border flex items-start gap-3">
                      <LockKey className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" weight="bold" />
                      <div>
                        <strong className="text-foreground text-sm block">Advanced Cryptography:</strong>
                        <p className="text-xs text-muted-foreground">All data in transit is encrypted using TLS 1.3 / HTTPS. Sensitive data at rest (including passwords, tokens, and verification payloads) is secured using AES-256 encryption.</p>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-secondary/30 border border-border flex items-start gap-3">
                      <Database className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" weight="bold" />
                      <div>
                        <strong className="text-foreground text-sm block">Role-Based Access Control (RBAC):</strong>
                        <p className="text-xs text-muted-foreground">Internal administrative access is strictly restricted to vetted compliance staff on a principle of least privilege, guarded by mandatory Two-Factor Authentication (2FA).</p>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-secondary/30 border border-border flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-[#c7365f] shrink-0 mt-0.5" weight="bold" />
                      <div>
                        <strong className="text-foreground text-sm block">Immutable Audit Trails:</strong>
                        <p className="text-xs text-muted-foreground">Every query, document upload, and administrative action is logged with IP address, device signature, and UTC timestamp to guarantee non-repudiation.</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 7 */}
                <section id="retention" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">7. Data Retention & Erasure Schedule</h2>
                  <p><strong>7.1. Account Data:</strong> Retained for the duration of your active account relationship plus five (5) years following account closure to satisfy anti-money laundering (AML) and statutory tax records requirements under Nigerian law.</p>
                  <p><strong>7.2. Identity Query Telemetry:</strong> Transaction metadata (User ID, IP address, masked identifier, timestamp, and consent affirmation) is retained for regulatory audit trail compliance with the NDPC and law enforcement authorities.</p>
                  <p><strong>7.3. Secure Purging:</strong> Upon expiry of the retention window or upon valid data subject erasure request (where no overriding statutory retention obligation exists), records are permanently shredded or anonymized.</p>
                </section>

                {/* Section 8 */}
                <section id="rights" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">8. Data Subject Rights (Sections 34–37 NDPA)</h2>
                  <p>Under the Nigeria Data Protection Act 2023, data subjects possess enforceable statutory rights regarding their personal information:</p>
                  <ul className="list-disc pl-6 space-y-1.5">
                    <li><strong>Right of Access (Section 34):</strong> Right to obtain confirmation and a copy of personal data processed by LoraBiz.</li>
                    <li><strong>Right to Rectification (Section 35):</strong> Right to request correction of inaccurate, misleading, or outdated records.</li>
                    <li><strong>Right to Erasure / "Right to be Forgotten" (Section 36):</strong> Right to request deletion of personal data where processing is no longer lawful or required.</li>
                    <li><strong>Right to Restrict or Object to Processing (Section 36 & 37):</strong> Right to object to automated profiling or marketing communications.</li>
                    <li><strong>Right to Data Portability (Section 38):</strong> Right to receive personal data in a structured, machine-readable format.</li>
                    <li><strong>Right to Lodge Complaint with NDPC:</strong> Right to petition the Nigeria Data Protection Commission (<a href="https://ndpc.gov.ng" target="_blank" rel="noreferrer" className="text-[#c7365f] underline">ndpc.gov.ng</a>) if you believe your privacy rights have been infringed.</li>
                  </ul>
                  <p className="text-xs bg-secondary/40 p-3 rounded-xl border border-border">
                    To exercise any of these rights, submit a formal request to our Data Protection Officer at <a href="mailto:dpo@lorabiz.com" className="text-[#c7365f] font-bold">dpo@lorabiz.com</a>. We process statutory requests within twenty-one (21) days.
                  </p>
                </section>

                {/* Section 9 */}
                <section id="breach" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">9. 72-Hour Data Breach Notification Protocol</h2>
                  <p>Pursuant to Section 40 of the NDPA 2023, in the unlikely event of a security compromise resulting in unauthorized access, alteration, or disclosure of personal data likely to result in risk to data subjects, LoraBiz shall:</p>
                  <ul className="list-disc pl-6 space-y-1.5">
                    <li>Formally notify the <strong>Nigeria Data Protection Commission (NDPC)</strong> within seventy-two (72) hours of becoming aware of the breach;</li>
                    <li>Promptly communicate the nature of the breach, affected datasets, and recommended mitigating steps to affected data subjects;</li>
                    <li>Execute incident response protocols to contain and neutralize the vulnerability.</li>
                  </ul>
                </section>

                {/* Section 10 */}
                <section id="dpo" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">10. Data Protection Officer (DPO) Contact</h2>
                  <p>Quadrox Technologies Limited has appointed a designated <strong>Data Protection Officer (DPO)</strong> responsible for overseeing compliance with the NDPA 2023, coordinating with licensed Data Protection Compliance Organizations (DPCO), and serving as the primary point of contact for regulatory authorities and data subjects:</p>
                  <div className="p-5 rounded-2xl bg-secondary/40 border border-border space-y-2 text-sm">
                    <p><strong>Office of the Data Protection Officer</strong></p>
                    <p className="text-muted-foreground">Quadrox Technologies Limited</p>
                    <p className="text-muted-foreground">Address: Lagos State, Nigeria</p>
                    <p>Official DPO Email: <a href="mailto:dpo@lorabiz.com" className="text-[#c7365f] font-bold">dpo@lorabiz.com</a></p>
                    <p>Privacy Desk: <a href="mailto:privacy@lorabiz.com" className="text-[#c7365f] font-bold">privacy@lorabiz.com</a></p>
                  </div>
                </section>

                {/* Section 11 */}
                <section id="cookies" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">11. Cookies, Telemetry & Session Tokens</h2>
                  <p>We use essential session tokens and encrypted cookies strictly required for secure authentication, CSRF attack prevention, and platform navigation. We do not use intrusive third-party cross-site advertising cookies.</p>
                </section>

                {/* Section 12 */}
                <section id="updates" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">12. Policy Governance & Amendments</h2>
                  <p>This Privacy Policy is periodically reviewed to reflect regulatory changes enacted by the NDPC or improvements in our data security architecture. Any material updates will be published on this page with an updated Effective Date.</p>
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
