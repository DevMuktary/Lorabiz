// src/app/acceptable-use/page.tsx
import Link from "next/link";
import { ArrowLeft, ShieldWarning } from "@phosphor-icons/react/dist/ssr";

export default function AcceptableUsePolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft weight="bold" className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-2 font-black text-primary">
            <ShieldWarning weight="fill" className="h-5 w-5" />
            LoraBiz Legal
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-12 animate-in fade-in duration-500">
        
        {/* Title Section */}
        <div className="space-y-4 border-b border-border pb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Acceptable Use Policy
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm font-medium text-muted-foreground">
            <p>Last Updated: <span className="text-foreground">July 30, 2026</span></p>
            <p className="hidden sm:block">•</p>
            <p>Effective Date: <span className="text-foreground">July 30, 2026</span></p>
          </div>
        </div>

        {/* Document Body */}
        <div className="space-y-10 text-[15px] leading-relaxed text-muted-foreground">
          
          <p className="text-foreground font-medium text-lg">
            This Acceptable Use Policy (“AUP”) governs your access to and use of the LoraBiz website, platform, application, and services (collectively, the “Services”) provided by Quadrox Technologies Limited (“LoraBiz,” “we,” “us,” or “our”).
          </p>

          <p>
            By accessing or using the Services, you agree to comply with this AUP. If you do not agree, you must immediately cease all use of LoraBiz. We reserve the right to amend this AUP at any time by posting a revised version on our platform.
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">1. Purpose of the Platform</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p>LoraBiz is a Business-to-Business (B2B) platform designed to streamline corporate compliance, statutory registrations (CAC, TIN, SCUML), and identity verification (NIMC), as well as provide basic utility services. The platform must be used solely for legitimate business, administrative, and compliance purposes.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">2. Prohibited Content and Submissions</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p>You are strictly prohibited from submitting, uploading, processing, or sharing any data, documents, or content through LoraBiz that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Is Fraudulent or Forged:</strong> Submitting fake, altered, or synthetic identification documents (NIN, Passports, Driver’s Licenses), falsified Memorandums (MEMART), fake signatures, or forged corporate status reports.</li>
                <li><strong>Is Illegal:</strong> Violates any applicable local, state, national, or international law, including the laws of the Federal Republic of Nigeria.</li>
                <li><strong>Infringes on Rights:</strong> Infringes upon the trademark, copyright, privacy, or intellectual property rights of any third party (e.g., attempting to register a business name you do not have the legal right to use).</li>
                <li><strong>Is Malicious:</strong> Contains software viruses, malware, trojan horses, worms, ransomware, or any other computer code designed to disrupt, damage, or limit the functioning of the LoraBiz platform or external statutory portals.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">3. Prohibited Activities</h2>
            <div className="space-y-6 pl-4 border-l-2 border-primary/20">
              <p>When using LoraBiz, you agree that you will <strong>not</strong> under any circumstances:</p>
              
              <div>
                <h3 className="font-bold text-foreground mb-2">A. Engage in Financial Crimes:</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Use the platform to facilitate money laundering, terrorist financing, or any other financial crimes.</li>
                  <li>Use stolen, cloned, or unauthorized bank cards, bank accounts, or digital assets to fund your LoraBiz wallet.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">B. Disrupt Platform Integrity:</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Attempt to bypass, disable, or interfere with any security features of the platform, including Two-Factor Authentication (2FA) mechanisms or wallet withdrawal locks.</li>
                  <li>Overload our infrastructure by launching Denial of Service (DoS) attacks, automated bot scripts, scrapers, or excessive, unreasonable API requests.</li>
                  <li>Reverse-engineer, decompile, disassemble, or attempt to derive the source code or underlying algorithms of the LoraBiz platform.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">C. Abuse Statutory Systems:</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Submit deliberately conflicting, repetitive, or nonsense applications to the Corporate Affairs Commission (CAC) or other statutory bodies through our API to cause systemic delays.</li>
                  <li>Use the platform to generate Tax Identification Numbers (TINs) or Identity slips (NIMC) for fictitious entities or deceased individuals.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-foreground mb-2">D. Misrepresentation:</h3>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
                  <li>Represent yourself as a direct agent, employee, or official representative of Quadrox Technologies Limited, CAC, EFCC, or NIMC without explicit written authorization.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">4. Responsibilities of Agents and Proxies</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20 bg-secondary/30 p-5 rounded-r-2xl border-y border-r border-transparent">
              <p>If you are using LoraBiz on behalf of a third-party client (e.g., as a lawyer, accountant, internet cafe operator, or registration agent processing NIN slips, TINs, or CAC registrations for others), you warrant that:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground font-medium">
                <li>You have obtained explicit, legally binding consent from the client to submit their personal and corporate data to LoraBiz.</li>
                <li>You will not exploit the platform to overcharge, defraud, or deceive your clients regarding statutory fees and timelines.</li>
                <li>You remain fully and legally responsible for the authenticity of the documents and identity data provided by your client.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">5. Account and Wallet Abuse</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Wallet Manipulation:</strong> Any attempt to manipulate wallet balances, exploit pricing bugs, or initiate fraudulent chargebacks with your bank after a service has been rendered will result in immediate account termination.</li>
                <li><strong>Account Sharing:</strong> Your LoraBiz account is intended for your use or the use of your authorized corporate team. You may not sell, trade, or lease your LoraBiz account to unauthorized third parties.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">6. Enforcement and Penalties</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p>We take violations of this AUP very seriously. If we reasonably suspect that you have violated any part of this policy, LoraBiz reserves the right to take any of the following actions without prior notice:</p>
              <ol className="list-decimal pl-6 space-y-2 font-medium text-foreground">
                <li><strong>Immediate Suspension:</strong> Temporarily or permanently suspend your access to the LoraBiz platform.</li>
                <li><strong>Wallet Freezing:</strong> Freeze and hold any funds currently existing in your LoraBiz wallet pending a full financial investigation.</li>
                <li><strong>Application Halting:</strong> Intercept and cancel any pending statutory applications initiated from your account.</li>
                <li><strong>Reporting to Authorities:</strong> Report fraudulent activities, forgery, or financial crimes to the relevant authorities, including the Nigerian Police Force, the Economic and Financial Crimes Commission (EFCC), and the Corporate Affairs Commission (CAC). We will fully cooperate with law enforcement in any resulting investigations.</li>
                <li><strong>Legal Action:</strong> Pursue civil or criminal litigation to recover damages caused by your prohibited conduct.</li>
              </ol>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">7. Reporting Violations</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20 bg-secondary/30 p-6 rounded-2xl border-none">
              <p>If you become aware of any violation of this Acceptable Use Policy by any user, you are encouraged to report it immediately to our security operations team at:</p>
              <p className="font-bold text-primary text-lg">compliance@lorabiz.com</p>
            </div>
          </section>

        </div>
        
        {/* Footer Note */}
        <div className="pt-10 border-t border-border text-center text-sm">
          <p>© {new Date().getFullYear()} Quadrox Technologies Limited. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
