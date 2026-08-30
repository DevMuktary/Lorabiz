"use client";

import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import { 
  ShieldCheck, 
  LockKey, 
  Scales, 
  FileText, 
  EnvelopeSimple, 
  CheckCircle, 
  WarningCircle, 
  Fingerprint, 
  Database,
  ArrowRight,
  UserCheck,
  Building
} from "@phosphor-icons/react";

export default function CompliancePage() {
  const [requestType, setRequestType] = useState<"access" | "rectify" | "delete" | "query">("access");

  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-[#0a0f1e] text-zinc-900 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-[1200px] mx-auto space-y-16">
          
          {/* Hero / Header Section */}
          <div className="border-b border-black/5 dark:border-white/5 pb-12 text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" weight="bold" />
              <span>NDPC & Statutory Data Governance Portal</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#1a1a1a] dark:text-white">
              Data Privacy & NDPC Compliance Charter
            </h1>
            
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Quadrox Technologies Limited ("LoraBiz") operates in rigorous compliance with the <strong>Nigeria Data Protection Act (NDPA) 2023</strong> and directives of the <strong>Nigeria Data Protection Commission (NDPC)</strong>.
            </p>
          </div>

          {/* Core Governance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-[#c7365f]/10 text-[#c7365f] flex items-center justify-center">
                <Scales className="h-6 w-6" weight="bold" />
              </div>
              <h3 className="text-lg font-bold text-foreground">NDPA 2023 Statutory Adherence</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We operate strictly within lawful processing bases (Contractual performance, statutory compliance under CAMA 2020, legitimate interest, and verifiable proxy consent).
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <LockKey className="h-6 w-6" weight="bold" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Bank-Grade Encryption (TOMS)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All data in transit is protected via TLS 1.3 encryption. Sensitive demographic records and credentials at rest are secured with AES-256 standard encryption.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Fingerprint className="h-6 w-6" weight="bold" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Non-Repudiation Audit Logs</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every query logs authenticated User ID, IP address, geolocation telemetry, device signature, and exact timestamp to ensure complete accountability and anti-fraud defense.
              </p>
            </div>

          </div>

          {/* Detailed Regulatory Pillars */}
          <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-sm space-y-10">
            
            <div>
              <h2 className="text-2xl font-black text-foreground mb-3">
                Our Data Protection & Regulatory Architecture
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                How Quadrox Technologies Limited shields data subjects, corporate clients, and partner institutions.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Pillar 1 */}
              <div className="p-6 rounded-2xl bg-secondary/30 border border-border space-y-3">
                <div className="flex items-center gap-2.5 font-bold text-foreground">
                  <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black shrink-0">1</span>
                  <span>Independent Technological Conduit (Data Processor Role)</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-8">
                  LoraBiz functions as an intermediary technological conduit under Section 24/25 of the NDPA 2023. We do not synthesize or store unauthorized government registers; we securely transmit user-initiated queries to accredited statutory databases on direct instruction.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="p-6 rounded-2xl bg-secondary/30 border border-border space-y-3">
                <div className="flex items-center gap-2.5 font-bold text-foreground">
                  <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black shrink-0">2</span>
                  <span>Mandatory Proxy Consent for CAC & Business Agents</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-8">
                  Registration consultants and agents submitting third-party NINs or director details for CAC filings warrant that they hold documented written consent and proxy mandates from the data subject. Users assume 100% legal responsibility for unauthorized entries.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="p-6 rounded-2xl bg-secondary/30 border border-border space-y-3">
                <div className="flex items-center gap-2.5 font-bold text-foreground">
                  <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black shrink-0">3</span>
                  <span>Zero-Tolerance Fraud Surrender to EFCC & Police</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-8">
                  In accordance with the Cybercrimes Act 2015, any query flagged for unauthorized lookups or forgery results in immediate account freeze and full surrender of technical audit trails (real IP, device fingerprints, KYC) to law enforcement authorities.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="p-6 rounded-2xl bg-secondary/30 border border-border space-y-3">
                <div className="flex items-center gap-2.5 font-bold text-foreground">
                  <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black shrink-0">4</span>
                  <span>72-Hour Data Breach Response Protocol</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-8">
                  Pursuant to Section 40 of the NDPA 2023, our Security Incident Response Team is mandated to report any qualifying data breach to the NDPC within 72 hours and notify impacted data subjects with remediation guidance.
                </p>
              </div>

            </div>

          </div>

          {/* Interactive Data Subject Access Request (DSAR) Portal */}
          <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-sm space-y-8">
            
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase bg-primary/10 text-primary mb-3">
                <UserCheck className="h-3.5 w-3.5" weight="bold" />
                <span>Data Subject Rights (Sections 34–37 NDPA)</span>
              </div>
              <h2 className="text-2xl font-black text-foreground">
                Exercise Your Privacy Rights (DSAR)
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Any Nigerian citizen or platform user whose data is processed by LoraBiz may exercise their statutory rights. Select your request type below:
              </p>
            </div>

            {/* Request Type Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "access", label: "Right of Access", desc: "Request copy of your data" },
                { id: "rectify", label: "Right of Rectification", desc: "Correct inaccurate data" },
                { id: "delete", label: "Right to Erasure", desc: "Request data deletion" },
                { id: "query", label: "General Inquiry", desc: "NDPC / Audit question" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRequestType(tab.id as any)}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                    requestType === tab.id
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border hover:bg-secondary/40 text-foreground"
                  }`}
                >
                  <p className="text-xs font-bold">{tab.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{tab.desc}</p>
                </button>
              ))}
            </div>

            {/* Instructions Callout Box */}
            <div className="p-6 rounded-2xl bg-secondary/40 border border-border space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <EnvelopeSimple className="h-5 w-5 text-primary" weight="bold" />
                <span>How to Submit a Formal Statutory Request</span>
              </div>
              
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                To guarantee security and prevent unauthorized impersonation, all Data Subject Access Requests must be sent directly from your registered email address to our <strong>Office of the Data Protection Officer (DPO)</strong>:
              </p>

              <div className="bg-background rounded-xl p-4 border border-border space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-muted-foreground">Designated Official Email:</span>
                  <a href="mailto:dpo@lorabiz.com" className="font-mono font-bold text-[#c7365f] text-sm">
                    dpo@lorabiz.com
                  </a>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/60 pt-2">
                  <span className="text-muted-foreground">Statutory Response Window:</span>
                  <span className="font-bold text-foreground">Within 21 business days (NDPA Section 34)</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/60 pt-2">
                  <span className="text-muted-foreground">Required Attachments:</span>
                  <span className="text-muted-foreground font-medium">Valid Government ID (NIN/Voter's Card/Passport) for identity verification</span>
                </div>
              </div>
            </div>

          </div>

          {/* DPO & Corporate Information Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border space-y-4">
              <div className="flex items-center gap-2.5 font-bold text-foreground">
                <Building className="h-5 w-5 text-primary" weight="bold" />
                <span>Corporate Registration & Governance</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                <p><strong>Operating Entity:</strong> Quadrox Technologies Limited</p>
                <p><strong>Jurisdiction:</strong> Federal Republic of Nigeria (CAMA 2020 Registered)</p>
                <p><strong>Headquarters:</strong> Lagos State, Nigeria</p>
                <p><strong>Legal Inquiries:</strong> <a href="mailto:legal@lorabiz.com" className="text-[#c7365f] font-semibold">legal@lorabiz.com</a></p>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border space-y-4">
              <div className="flex items-center gap-2.5 font-bold text-foreground">
                <ShieldCheck className="h-5 w-5 text-emerald-500" weight="bold" />
                <span>National Regulatory Authority</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                <p><strong>Regulator:</strong> Nigeria Data Protection Commission (NDPC)</p>
                <p><strong>Governing Statute:</strong> Nigeria Data Protection Act (NDPA) 2023</p>
                <p><strong>Official Portal:</strong> <a href="https://ndpc.gov.ng" target="_blank" rel="noreferrer" className="text-[#c7365f] font-semibold underline">ndpc.gov.ng</a></p>
                <p><strong>Public Inquiries:</strong> <a href="mailto:privacy@lorabiz.com" className="text-[#c7365f] font-semibold">privacy@lorabiz.com</a></p>
              </div>
            </div>

          </div>

          {/* Footer Quick Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground underline">Terms of Service</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-foreground underline">Privacy Policy</Link>
            <span>•</span>
            <Link href="/acceptable-use" className="hover:text-foreground underline">Acceptable Use Policy</Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
