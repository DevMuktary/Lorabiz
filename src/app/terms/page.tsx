// src/app/terms/page.tsx
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

export default function TermsOfServicePage() {
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
            <ShieldCheck weight="fill" className="h-5 w-5" />
            LoraBiz Legal
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-12 animate-in fade-in duration-500">
        
        {/* Title Section */}
        <div className="space-y-4 border-b border-border pb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Terms of Service
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
            Welcome to LoraBiz! These Terms of Service ("Terms") govern your access to and use of the LoraBiz website, platform, application, and services (collectively, the "Services") provided by Quadrox Technologies Limited ("LoraBiz," "we," "us," or "our").
          </p>

          <p>
            By accessing, registering for, or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must not access or use the Services.
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">1. Acceptance of Terms</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p><strong>1.1. Legally Binding Agreement:</strong> These Terms constitute a legally binding agreement between you (whether an individual or a corporate entity) and Quadrox Technologies Limited, a company registered in the Federal Republic of Nigeria.</p>
              <p><strong>1.2. Capacity:</strong> By using LoraBiz, you represent and warrant that you are at least 18 years of age and possess the legal authority, right, and capacity to enter into these Terms. If you are using the Services on behalf of a company, organization, or other legal entity, you represent that you have the authority to bind such entity to these Terms.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">2. Description of Services</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p><strong>2.1. Nature of Services:</strong> LoraBiz operates as a Business-to-Business (B2B) Software-as-a-Service (SaaS) platform facilitating the processing of statutory registrations and regulatory compliance, including but not limited to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Corporate Affairs Commission (CAC) Registrations (Business Names, LLCs, NGOs).</li>
                <li>Tax Identification Number (TIN) Generation.</li>
                <li>Special Control Unit Against Money Laundering (SCUML) Certification.</li>
                <li>National Identity Management Commission (NIMC) Services (NIN Slip printing).</li>
                <li>Utility Services (Airtime top-up).</li>
              </ul>
              <p><strong>2.2. Third-Party Agency:</strong> You acknowledge and agree that LoraBiz acts as an intermediary technology platform and authorized processing agent. We are not a government agency. We transmit your data to the relevant statutory bodies (CAC, FIRS, NIMC, EFCC) directly or via accredited third-party partners.</p>
              <p><strong>2.3. No Legal Advice:</strong> The information provided on LoraBiz does not constitute legal, tax, or financial advice. Users are encouraged to seek independent professional advice regarding their specific corporate structuring or compliance needs.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">3. User Accounts and Security</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p><strong>3.1. Registration:</strong> To access certain features, you must create a LoraBiz account. You agree to provide accurate, current, and complete information during registration and keep your account information updated.</p>
              <p><strong>3.2. Security:</strong> You are responsible for safeguarding your login credentials, including passwords and Two-Factor Authentication (2FA) codes. You agree to notify us immediately of any unauthorized access to your account.</p>
              <p><strong>3.3. Liability:</strong> LoraBiz shall not be liable for any loss or damage arising from your failure to protect your account credentials or from unauthorized access to your digital wallet.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">4. Wallet, Pricing, and Payments</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p><strong>4.1. Digital Wallet:</strong> LoraBiz utilizes a digital wallet system for processing transactions. You must fund your wallet to access paid services.</p>
              <p><strong>4.2. Dynamic Pricing:</strong> Prices for services (excluding explicitly stated open-price utilities like Airtime) are clearly displayed prior to checkout. LoraBiz reserves the right to adjust service fees at any time based on changes to government statutory fees, partner costs, or platform operational costs.</p>
              <p><strong>4.3. Deductions:</strong> By clicking "Pay & Submit" (or similar confirmation buttons), you explicitly authorize LoraBiz to deduct the stated service fee from your wallet balance.</p>
              <p><strong>4.4. Non-Refundable Statutory Fees:</strong> Fees remitted to government agencies (e.g., CAC, EFCC, FIRS) on your behalf are strictly non-refundable once the application has been submitted and processing has commenced.</p>
              <p><strong>4.5. Platform Refunds:</strong> Refunds to your LoraBiz wallet are issued solely at our discretion and generally only apply in cases of technical failure on our platform before an application is transmitted to a statutory body.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">5. Document Submission and User Responsibilities</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p><strong>5.1. Accuracy of Information:</strong> You bear full responsibility for the accuracy, legality, and authenticity of all information, names, and documents (including IDs, MEMART, Constitutions, and Status Reports) submitted through LoraBiz.</p>
              <p><strong>5.2. Fraud and Forgery:</strong> You explicitly warrant that no document uploaded to LoraBiz is forged, altered, or fraudulent. Submission of falsified documents may result in immediate account suspension, forfeiture of wallet funds, and reporting to relevant Nigerian law enforcement agencies (e.g., EFCC, Police).</p>
              <p><strong>5.3. Government Queries:</strong> If a statutory body (e.g., CAC) queries or rejects your application due to naming conflicts, incomplete data, or regulatory restrictions, LoraBiz will notify you. You are responsible for providing the necessary corrections. LoraBiz is not liable for delays caused by government queries.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">6. Processing Timelines</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p><strong>6.1. Estimates:</strong> Any processing timelines displayed on the platform (e.g., "24 to 72 hours" or "30 minutes") are estimates based on standard operational conditions.</p>
              <p><strong>6.2. External Dependencies:</strong> You acknowledge that processing times are heavily dependent on the operational capacity, network uptime, and internal processes of external government agencies.</p>
              <p><strong>6.3. No Guarantee:</strong> LoraBiz does not guarantee specific delivery times for statutory certificates and shall not be held liable for any business loss, missed deadlines, or damages resulting from processing delays by government agencies or third-party partners.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">7. Intellectual Property</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p><strong>7.1. Platform Ownership:</strong> All intellectual property rights in the LoraBiz platform, including its software, UI/UX, algorithms, text, graphics, logos, and trademarks, are owned by Quadrox Technologies Limited.</p>
              <p><strong>7.2. License:</strong> We grant you a limited, non-exclusive, non-transferable, and revocable license to use the Services strictly in accordance with these Terms. You may not copy, modify, distribute, sell, or lease any part of our Services.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">8. Acceptable Use and Prohibited Conduct</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p>You agree NOT to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use LoraBiz for any illegal, fraudulent, or money-laundering activities.</li>
                <li>Attempt to bypass, breach, or disable any security mechanism or 2FA system on the platform.</li>
                <li>Upload documents containing malware, viruses, or malicious code.</li>
                <li>Reverse engineer, decompile, or disassemble any aspect of the LoraBiz software.</li>
                <li>Use automated scripts, bots, or scrapers to extract data or interact with the platform.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">9. Limitation of Liability</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p><strong>9.1. As-Is Basis:</strong> The Services are provided "AS IS" and "AS AVAILABLE" without any warranties of any kind, whether express or implied.</p>
              <p><strong>9.2. Indirect Damages:</strong> To the maximum extent permitted by Nigerian law, Quadrox Technologies Limited, its directors, employees, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, revenue, data, or goodwill, arising out of your use of or inability to use the Services.</p>
              <p><strong>9.3. Liability Cap:</strong> In no event shall our aggregate liability for any claims related to the Services exceed the amount you actually paid to LoraBiz for the specific service out of which the claim arose.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">10. Indemnification</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p>You agree to indemnify, defend, and hold harmless Quadrox Technologies Limited and its affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or related to:</p>
              <ul className="list-[lower-alpha] pl-6 space-y-2">
                <li>Your use of the Services;</li>
                <li>Your violation of these Terms;</li>
                <li>Your submission of inaccurate, false, or fraudulent documents;</li>
                <li>Your violation of any third-party right or any applicable Nigerian law or regulation.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">11. Termination and Suspension</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p><strong>11.1. Termination by User:</strong> You may cease using our Services at any time.</p>
              <p><strong>11.2. Termination by LoraBiz:</strong> We reserve the right to suspend or terminate your account and access to the Services at our sole discretion, without notice or liability, if we determine that you have violated these Terms, engaged in fraudulent activity, or posed a security risk to the platform.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">12. Governing Law and Dispute Resolution</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p><strong>12.1. Jurisdiction:</strong> These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria.</p>
              <p><strong>12.2. Arbitration:</strong> Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or invalidity thereof, shall be settled by binding arbitration in Lagos, Nigeria, in accordance with the Arbitration and Mediation Act, 2023. The language of arbitration shall be English.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">13. Modifications to Terms</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20">
              <p>We reserve the right to update or modify these Terms at any time. We will notify you of material changes by posting the updated Terms on the platform or sending an email. Your continued use of the Services after such changes constitutes your acceptance of the revised Terms.</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-foreground">14. Contact Information</h2>
            <div className="space-y-3 pl-4 border-l-2 border-primary/20 bg-secondary/30 p-6 rounded-2xl border-none">
              <p>If you have any questions or concerns regarding these Terms, please contact us via the support widget on your dashboard or email us directly at:</p>
              <p className="font-bold text-primary text-lg">legal@lorabiz.com</p>
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
