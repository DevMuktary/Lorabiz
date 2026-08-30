"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import { ShieldCheck, Scales, FileText, WarningCircle, CheckCircle, LockKey } from "@phosphor-icons/react";

export default function TermsOfServicePage() {
  const [activeSection, setActiveSection] = useState("");

  const sections = [
    { id: "acceptance", title: "1. Acceptance of Terms & Capacity" },
    { id: "nature", title: "2. Nature of Platform & Intermediary Role" },
    { id: "accounts", title: "3. User Accounts, Security & KYC" },
    { id: "wallet", title: "4. Digital Wallet & Payment Terms" },
    { id: "identity-warranty", title: "5. Strict Identity & Proxy Warranty (NIN/BVN/CAC)" },
    { id: "fraud-cooperation", title: "6. Anti-Fraud & Law Enforcement Surrender" },
    { id: "timelines", title: "7. Operational Estimates & Agency Outages" },
    { id: "ip", title: "8. Intellectual Property & Proprietary Rights" },
    { id: "prohibited", title: "9. Prohibited Conduct & Scraping Restrictions" },
    { id: "liability", title: "10. Limitation of Liability & 'AS-IS' Disclaimer" },
    { id: "indemnification", title: "11. Comprehensive Indemnification & Hold-Harmless" },
    { id: "sanctions", title: "12. Liquidated Damages & Account Forfeiture" },
    { id: "disputes", title: "13. Dispute Resolution & Governing Law" },
    { id: "modifications", title: "14. Amendments & Severability" },
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
              <Scales className="h-4 w-4" weight="bold" />
              <span>Statutory Legal Document</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#1a1a1a] dark:text-white mb-4">
              Terms of Service
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-[14px] text-[#767676] dark:text-white/60">
              <p>Effective Date: <span className="text-zinc-900 dark:text-white font-medium">July 30, 2026</span></p>
              <span>•</span>
              <p>Governing Law: <span className="text-zinc-900 dark:text-white font-medium">Federal Republic of Nigeria (NDPA 2023 & CAMA 2020)</span></p>
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
                    <ShieldCheck className="h-4 w-4" weight="bold" />
                    <span>View NDPC Compliance Portal</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="w-full lg:w-3/4 bg-white dark:bg-[#111827] border border-black/5 dark:border-white/5 rounded-3xl p-8 md:p-12 shadow-sm">
              <div className="prose prose-zinc dark:prose-invert max-w-none text-[#767676] dark:text-white/70 leading-relaxed text-[15px] sm:text-[16px] space-y-10">
                
                {/* Preamble Callout */}
                <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-black text-foreground">
                    <WarningCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" weight="fill" />
                    <span>IMPORTANT NOTICE REGARDING THIRD-PARTY DATA & PROXY LIABILITY</span>
                  </div>
                  <p className="text-xs sm:text-[13px] leading-relaxed">
                    LoraBiz operates strictly as a technological conduit and B2B SaaS platform. If you submit, query, or process any National Identification Number (NIN), Bank Verification Number (BVN), or personal identity data belonging to a third party, you <strong>warrant under penalty of perjury and criminal law</strong> that you possess explicit, lawful, documented authorization and consent from that individual in strict compliance with the <strong>Nigeria Data Protection Act (NDPA) 2023</strong> and the <strong>Cybercrimes Act 2015</strong>. LoraBiz maintains permanent audit trails and cooperates fully with law enforcement.
                  </p>
                </div>

                <p className="text-lg text-zinc-900 dark:text-white font-medium">
                  These Terms of Service ("Terms") constitute a legally binding agreement between you (the "User", "You", or "Your", whether acting in an individual capacity, as a business entity, or as a registration agent/proxy) and <strong>Quadrox Technologies Limited</strong> ("LoraBiz", "Company", "We", "Us", or "Our"), governing your access to and use of the LoraBiz website, digital applications, APIs, wallets, and processing services (collectively, the "Platform" or "Services").
                </p>

                {/* Section 1 */}
                <section id="acceptance" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">1. Acceptance of Terms & Capacity</h2>
                  <p><strong>1.1. Enforceability:</strong> By creating an account, depositing funds into your wallet, clicking any statutory consent box, or submitting any verification or registration request on LoraBiz, you acknowledge that you have read, understood, and agreed to be unconditionally bound by these Terms, our <Link href="/privacy" className="text-[#c7365f] font-semibold underline">Privacy Policy</Link>, and our <Link href="/acceptable-use" className="text-[#c7365f] font-semibold underline">Acceptable Use Policy</Link>.</p>
                  <p><strong>1.2. Legal Capacity:</strong> You warrant that you are at least 18 years of age, legally competent, and possess the requisite corporate, administrative, or personal authority to enter into these Terms. If you are acting on behalf of a corporate entity or another individual, you represent and warrant that you hold full legal power of attorney and statutory mandate to bind that principal.</p>
                  <p><strong>1.3. Rejection of Terms:</strong> If you do not agree with any provision of these Terms, you must immediately terminate use of the platform and refrain from accessing any services.</p>
                </section>

                {/* Section 2 */}
                <section id="nature" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">2. Nature of Platform & Intermediary Role</h2>
                  <p><strong>2.1. Technological Conduit:</strong> LoraBiz operates as an independent, private Business-to-Business (B2B) and Business-to-Consumer (B2C) software infrastructure provider. <strong>Quadrox Technologies Limited is NOT a government ministry, department, or statutory agency.</strong> We are not the National Identity Management Commission (NIMC), the Corporate Affairs Commission (CAC), the Federal Inland Revenue Service (FIRS), the Special Control Unit Against Money Laundering (SCUML/EFCC), or the Nigeria Inter-Bank Settlement System (NIBSS).</p>
                  <p><strong>2.2. Passive Data Processor Status:</strong> In facilitating identity verifications, slip printing, and statutory filings, LoraBiz acts purely as a <em>Data Processor</em> and technical intermediary pursuant to Sections 24 and 25 of the <strong>Nigeria Data Protection Act (NDPA) 2023</strong>. LoraBiz does not originate, alter, or synthesize government records; we transmit user-initiated queries to accredited technical partners and statutory databases on your direct instruction.</p>
                  <p><strong>2.3. No Guarantee of Government Approval:</strong> You acknowledge that the final approval, issuance, or rejection of business registrations (CAC), tax IDs (FIRS), AML certificates (SCUML), or identity status (NIMC) rests solely within the sovereign discretion and administrative processes of the respective government authorities.</p>
                </section>

                {/* Section 3 */}
                <section id="accounts" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">3. User Accounts, Security & KYC</h2>
                  <p><strong>3.1. Account Truthfulness:</strong> You agree to provide true, accurate, current, and complete registration details, including your legal name, functional email, verifiable phone number, and residential/business address. The creation of anonymous accounts, spoofed credentials, or disposable emails is strictly prohibited.</p>
                  <p><strong>3.2. Credential Confidentiality:</strong> You are solely responsible for maintaining the confidentiality of your login passwords, Two-Factor Authentication (2FA) tokens, and wallet transaction PINs. Any action performed through your authenticated account is conclusively presumed to have been authorized by you.</p>
                  <p><strong>3.3. Know-Your-Customer (KYC) & Verification:</strong> LoraBiz reserves the right to request additional KYC documentation (including government-issued ID, biometric facial match, utility bills, or proof of accreditation) at any time to verify account ownership or investigate flagged transactions.</p>
                </section>

                {/* Section 4 */}
                <section id="wallet" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">4. Digital Wallet & Payment Terms</h2>
                  <p><strong>4.1. Pre-funded Wallet Operations:</strong> Services on LoraBiz operate primarily via a pre-funded digital ledger. You must maintain sufficient cleared wallet funds to initiate transactions.</p>
                  <p><strong>4.2. Non-Refundable Statutory Fees:</strong> All statutory levies, filing fees, stamp duties, or verification provider charges successfully disbursed to government agency gateways (CAC, FIRS, NIMC, EFCC) or upstream routing providers on your behalf are <strong>strictly non-refundable</strong> under all circumstances once the request has been submitted to the upstream network.</p>
                  <p><strong>4.3. Wallet Balances & Non-Withdrawal Policy:</strong> Funds credited to your LoraBiz wallet are dedicated for service consumption on the platform and are non-withdrawable, except in cases of verified platform errors approved at the sole administrative discretion of Quadrox Technologies Limited.</p>
                </section>

                {/* Section 5 - CRITICAL SHIELD */}
                <section id="identity-warranty" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">5. Strict Identity & Proxy Warranty (NIN / BVN / CAC)</h2>
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-2">
                    <p className="font-bold text-foreground">
                      This clause is an absolute condition of your use of any identity verification, slip printing, or statutory filing service on LoraBiz.
                    </p>
                  </div>
                  <p><strong>5.1. Affirmation of Sole Ownership or Lawful Proxy Mandate:</strong> Whenever you submit an 11-digit National Identification Number (NIN), Bank Verification Number (BVN), Phone Number, or third-party demographic dataset for verification, slip generation, modification, or CAC registration, you solemnly swear and warrant under penalty of criminal prosecution that:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You are the <strong>sole, lawful owner</strong> of the submitted identity credentials; <em>OR</em></li>
                    <li>You are an accredited agent, corporate consultant, legal practitioner, or authorized representative who has obtained <strong>express, documented, and verifiable consent</strong> from the legitimate data subject pursuant to the <strong>Nigeria Data Protection Act (NDPA) 2023</strong> (Sections 24, 25 & 29) to process their details for a specific, lawful transaction (such as CAC company incorporation, Tax ID generation, or slip retrieval).</li>
                  </ul>
                  <p><strong>5.2. Prohibition of Unauthorized Lookups & Harassment:</strong> You are strictly forbidden from inputting the NIN, BVN, or personal data of any individual without their prior written consent for surveillance, stalking, unlawful background checks, loan shark recoveries, SIM-swap attacks, or any unauthorized profiling. Any such query constitutes a direct criminal breach of the <strong>Cybercrimes (Prohibition, Prevention, etc.) Act 2015</strong> and the <strong>NDPA 2023</strong>.</p>
                  <p><strong>5.3. Assumption of Sole Liability:</strong> You acknowledge and agree that <strong>you bear 100% sole civil, criminal, regulatory, and financial liability</strong> for any data query, document generation, or business filing initiated under your account. Quadrox Technologies Limited is completely absolved of any responsibility for unauthorized queries conducted by users.</p>
                </section>

                {/* Section 6 - AUDIT & SURRENDER */}
                <section id="fraud-cooperation" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">6. Anti-Fraud & Law Enforcement Surrender</h2>
                  <p><strong>6.1. Permanent Audit Logging:</strong> LoraBiz automatically and permanently records immutable audit trails for every transaction and query, including the authenticated User ID, real client IP address, geolocation headers, user-agent fingerprints, exact UTC timestamps, payment references, and statutory consent affirmations.</p>
                  <p><strong>6.2. Automatic Surrender to Regulatory & Police Authorities:</strong> You explicitly consent and agree that upon receipt of a formal investigation letter, query, or subpoena from the <strong>Economic and Financial Crimes Commission (EFCC)</strong>, the <strong>Nigeria Police Force (NPF)</strong>, the <strong>Department of State Services (DSS)</strong>, the <strong>Nigeria Data Protection Commission (NDPC)</strong>, the <strong>NIMC</strong>, or a competent Court of Law regarding suspected identity theft, impersonation, or fraud, LoraBiz shall, without prior notice to you, immediately surrender:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Your full account registration KYC details (Name, Email, Phone, Address).</li>
                    <li>The complete technical IP address and device logs associated with the disputed query.</li>
                    <li>Your digital wallet funding source, payment references, and transaction history.</li>
                    <li>The electronic timestamped record of your statutory consent affirmation.</li>
                  </ul>
                  <p><strong>6.3. Platform Witness Status:</strong> You acknowledge that in any subsequent criminal prosecution or civil lawsuit arising from unauthorized data processing, LoraBiz will provide all technical logs to substantiate that the query was initiated solely and unilaterally by you.</p>
                </section>

                {/* Section 7 */}
                <section id="timelines" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">7. Operational Estimates & Agency Outages</h2>
                  <p><strong>7.1. Indicative Timelines:</strong> Any processing timelines stated on our platform (e.g. CAC approval in 24–72 hours, TIN generation, or NIN verification response times) are operational estimates based on optimal network conditions.</p>
                  <p><strong>7.2. External Government Downtime:</strong> LoraBiz shall not be held liable for delays, query backlogs, or temporary failures resulting from government database scheduled maintenance, API downtimes, NIMC server timeouts, CAC portal upgrades, or national internet disruptions.</p>
                </section>

                {/* Section 8 */}
                <section id="ip" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">8. Intellectual Property & Proprietary Rights</h2>
                  <p><strong>8.1. Ownership:</strong> All software, user interfaces, visual designs, database architectures, graphics, algorithms, brand names, and documentation comprising the LoraBiz platform are the exclusive intellectual property of Quadrox Technologies Limited and are protected under Nigerian copyright, trademark, and intellectual property laws.</p>
                  <p><strong>8.2. Limited License:</strong> You are granted a revocable, non-exclusive, non-transferable license to access the platform solely for lawful business operations in accordance with these Terms.</p>
                </section>

                {/* Section 9 */}
                <section id="prohibited" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">9. Prohibited Conduct & Scraping Restrictions</h2>
                  <p>You strictly agree that you shall NOT:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use automated web crawlers, bots, headless browsers, or scripts to extract data, harvest records, or scrape LoraBiz without explicit written API licensing.</li>
                    <li>Probe, scan, or test the vulnerability of our systems, networks, or API authentication endpoints.</li>
                    <li>Upload forged, falsified, manipulated, or photoshopped identity documents or corporate records.</li>
                    <li>Facilitate money laundering, terrorist financing, illicit gambling, or illegal multi-level marketing (MLM) schemes.</li>
                  </ul>
                </section>

                {/* Section 10 */}
                <section id="liability" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">10. Limitation of Liability & "AS-IS" Disclaimer</h2>
                  <p><strong>10.1. "AS-IS" Provision:</strong> The Services are provided on an "AS-IS" and "AS-AVAILABLE" basis without warranties of any kind, whether express, statutory, or implied.</p>
                  <p><strong>10.2. Cap on Liability:</strong> To the maximum extent permitted under applicable Nigerian law, under no circumstances shall Quadrox Technologies Limited, its directors, officers, employees, affiliates, or technical partners be liable for any indirect, punitive, special, incidental, or consequential damages (including loss of profits, business interruption, or loss of data).</p>
                  <p><strong>10.3. Monetary Limit:</strong> In all events, the aggregate liability of Quadrox Technologies Limited arising out of or related to your use of the platform shall be strictly limited to the total service fee actually paid by you to LoraBiz for the specific disputed transaction giving rise to the claim.</p>
                </section>

                {/* Section 11 - INDEMNIFICATION */}
                <section id="indemnification" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">11. Comprehensive Indemnification & Hold-Harmless</h2>
                  <p><strong>11.1. Scope of Indemnity:</strong> You agree to defend, indemnify, and hold completely harmless Quadrox Technologies Limited, its parent, subsidiaries, affiliates, directors, officers, agents, employees, and licensors from and against any and all claims, liabilities, damages, losses, regulatory penalties, sanctions, fines (including statutory administrative fines levied by the <strong>NDPC</strong>, <strong>NIMC</strong>, or <strong>CAC</strong>), legal fees, and court costs arising out of or relating to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Your breach of these Terms, the Privacy Policy, or the Acceptable Use Policy;</li>
                    <li>Your unauthorized submission or querying of third-party personal data (NIN, BVN, Phone, etc.) without lawful consent;</li>
                    <li>Any claim by a data subject alleging that their personal data was unlawfully accessed or processed through your account;</li>
                    <li>Any fraudulent, falsified, or forged document uploaded by you during CAC or statutory filings;</li>
                    <li>Your violation of any applicable Nigerian statute, including the NDPA 2023, CAMA 2020, and Cybercrimes Act 2015.</li>
                  </ul>
                  <p><strong>11.2. Direct Legal Costs:</strong> In the event that LoraBiz is joined as a party or subpoenaed in any regulatory enforcement or litigation due to your unauthorized conduct, you agree to immediately reimburse LoraBiz for all legal representation and retainers incurred.</p>
                </section>

                {/* Section 12 */}
                <section id="sanctions" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">12. Liquidated Damages & Account Forfeiture</h2>
                  <p><strong>12.1. Immediate Suspension:</strong> LoraBiz reserves the right to immediately suspend, freeze, or permanently terminate your account without notice if we detect suspicious activity, fraud, unauthorized third-party lookups, or regulatory non-compliance.</p>
                  <p><strong>12.2. Forfeiture of Wallet Funds:</strong> In the event of confirmed identity fraud, malicious scraping, or criminal submission of falsified documents, any remaining wallet balance shall be forfeited as liquidated damages toward administrative investigation costs and statutory legal expenses, without prejudice to our right to pursue criminal charges.</p>
                </section>

                {/* Section 13 */}
                <section id="disputes" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">13. Dispute Resolution & Governing Law</h2>
                  <p><strong>13.1. Governing Law:</strong> These Terms shall be governed by and construed in accordance with the substantive laws of the <strong>Federal Republic of Nigeria</strong>.</p>
                  <p><strong>13.2. Amicable Settlement:</strong> The parties shall use good-faith efforts to resolve any dispute or controversy arising out of these Terms through mutual consultation within thirty (30) days of written notice.</p>
                  <p><strong>13.3. Binding Arbitration:</strong> Any dispute which cannot be settled amicably shall be submitted to and finally resolved by binding arbitration in accordance with the Arbitration and Mediation Act 2023. The seat of arbitration shall be Lagos, Nigeria, conducted in the English language before a single arbitrator appointed by the Chairman of the Chartered Institute of Arbitrators (UK, Nigeria Branch).</p>
                </section>

                {/* Section 14 */}
                <section id="modifications" className="scroll-mt-32 space-y-4">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white border-b border-border/60 pb-2">14. Amendments & Severability</h2>
                  <p><strong>14.1. Revisions:</strong> We may revise these Terms from time to time to reflect regulatory updates (including directives from the NDPC, CAC, or NIMC) or enhancements to our platform. The updated version will be indicated by the "Effective Date" at the top.</p>
                  <p><strong>14.2. Severability:</strong> If any provision of these Terms is found to be unlawful, void, or unenforceable by an arbitrator or court of competent jurisdiction, that provision shall be deemed severable and shall not affect the validity and enforceability of any remaining provisions.</p>
                </section>

                {/* Contact Footer */}
                <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted-foreground">
                  <div>
                    <p>Quadrox Technologies Limited (RC Registered in Nigeria)</p>
                    <p>Legal & Regulatory Affairs: <a href="mailto:legal@lorabiz.com" className="text-[#c7365f] font-semibold">legal@lorabiz.com</a></p>
                  </div>
                  <div>
                    <p>Data Protection Officer: <a href="mailto:dpo@lorabiz.com" className="text-[#c7365f] font-semibold">dpo@lorabiz.com</a></p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
