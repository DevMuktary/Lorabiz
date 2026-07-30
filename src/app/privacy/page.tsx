// src/app/privacy/page.tsx
import Link from "next/link";
import { ArrowLeft, LockKey } from "@phosphor-icons/react/dist/ssr";

export default function PrivacyPolicyPage() {
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
            <LockKey weight="fill" className="h-5 w-5" />
            LoraBiz Legal
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-12 animate-in fade-in duration-500">
        
        {/* Title Section */}
        <div className="space-y-4 border-b border-border pb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Privacy Policy
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
            Quadrox Technologies Limited ("LoraBiz," "we," "us," or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you access or use our platform, website, and services (collectively, the "Services").
          </p>

          <p>
            Please read this Privacy Policy carefully. By using our Services, you consent to the data practices described in this policy and comply with the Nigeria Data Protection Act (NDPA) and other applicable data protection regulations.
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">1. Information We Collect</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p>We collect several types of information from and about users of our platform to deliver our corporate registration, tax generation, identity verification, and utility services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Personal Identity Information:</strong> Full legal names, dates of birth, National Identification Numbers (NIN), phone numbers, and email addresses.</li>
                <li><strong>Corporate & Business Information:</strong> Company names, registration numbers (RC or BN numbers), memorandum and articles of association (MEMART), status reports, and NGO constitutions.</li>
                <li><strong>Financial & Transactional Data:</strong> Digital wallet balances, transaction references, funding histories, and payment logs (Note: We do not store raw debit card details; transactions are handled securely through licensed payment gateways).</li>
                <li><strong>Technical & Usage Data:</strong> IP addresses, browser types, device information, operating system details, access times, and interaction logs with our platform.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">2. How We Use Your Information</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p>We utilize the data we collect for legitimate business and compliance purposes, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Fulfillment:</strong> Processing your CAC incorporations, SCUML certificates, Tax IDs (TIN), and NIMC slip printings with relevant regulatory bodies.</li>
                <li><strong>Account Management:</strong> Maintaining your account, securing your digital wallet, executing 2FA verifications, and communicating updates regarding your applications.</li>
                <li><strong>Customer Support:</strong> Resolving disputes, answering inquiries submitted via support widgets, and investigating processing delays.</li>
                <li><strong>Legal & Regulatory Compliance:</strong> Complying with Nigerian anti-money laundering (AML) laws, know-your-customer (KYC) mandates, and cooperating with law enforcement when legally required.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">3. Legal Basis for Processing (NDPA Compliance)</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p>We process your personal data under the following legal frameworks:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Performance of a Contract:</strong> Processing your data is necessary to deliver the statutory registrations or utility services you paid for.</li>
                <li><strong>Legal Obligation:</strong> Compliance with mandatory statutory reporting, tax laws, and anti-fraud regulations.</li>
                <li><strong>Consent:</strong> Your explicit consent given when checking consent boxes during application submissions or account registration.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">4. Disclosure of Your Information</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p>We do not sell, trade, or rent your personal information to third parties. However, we may share your information under strict conditions with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Government & Statutory Bodies:</strong> The Corporate Affairs Commission (CAC), Federal Inland Revenue Service (FIRS), Special Control Unit Against Money Laundering (SCUML), and National Identity Management Commission (NIMC) for the explicit purpose of fulfilling your applications.</li>
                <li><strong>Accredited Third-Party Partners:</strong> Vetted processing agents and infrastructure providers who assist us in fulfilling registrations or handling communications (such as ZeptoMail for email dispatch).</li>
                <li><strong>Law Enforcement Agencies:</strong> Regulatory or law enforcement authorities (e.g., EFCC, Nigeria Police Force) if required by law or in response to fraudulent activities, forgery, or breaches of our Acceptable Use Policy.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">5. Data Security</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p>We implement robust administrative, technical, and physical security measures to protect your personal and corporate data against unauthorized access, alteration, disclosure, or destruction. These measures include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of sensitive data in transit and at rest.</li>
                <li>Strict role-based access control for internal staff and administrative personnel.</li>
                <li>Mandatory Multi-Factor Authentication (2FA) and cryptographic passkeys for administrative access zones.</li>
              </ul>
              <p className="text-sm font-semibold text-foreground mt-2">Despite our security measures, no electronic transmission over the internet or storage technology is 100% secure. You are responsible for safeguarding your login credentials and 2FA tokens.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">6. Data Retention</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p>We retain your personal and corporate registration data for as long as your account is active or as needed to provide you services, comply with our legal obligations, resolve disputes, and enforce our agreements. Regulatory filing histories are archived in accordance with Nigerian corporate record-keeping requirements.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">7. Your Data Protection Rights</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p>Under the Nigeria Data Protection Act (NDPA), you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request copies of your personal data held by us.</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete information.</li>
                <li><strong>Erasure:</strong> Request the deletion of your personal data, subject to legal and statutory retention exemptions.</li>
                <li><strong>Withdrawal of Consent:</strong> Withdraw your consent to process your data at any time, noting that this may prevent us from completing pending service applications.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">8. Changes to This Privacy Policy</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p>We may update this Privacy Policy from time to time to reflect operational, legal, or regulatory changes. We will notify you of any material updates by updating the "Last Updated" date at the top of this policy and, where appropriate, sending an email notice.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">9. Contact Us</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20 bg-secondary/30 p-6 rounded-2xl border-none">
              <p>If you have questions, concerns, or requests regarding this Privacy Policy or your data rights, please contact our Data Protection Officer (DPO) via the platform support widget or at:</p>
              <p className="font-bold text-primary text-lg">privacy@lorabiz.com</p>
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
