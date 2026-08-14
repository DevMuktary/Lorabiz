"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  ShieldCheck, 
  Lock, 
  Sparkle, 
  ArrowRight, 
  DownloadSimple, 
  Eye, 
  Clock, 
  Tag, 
  CheckCircle, 
  Spinner, 
  X, 
  Info,
  Buildings,
  Handshake,
  Receipt,
  Users,
  Shield,
  FilePdf,
  Image as ImageIcon
} from "@phosphor-icons/react";
import { format } from "date-fns";
import ResolutionDocumentView from "@/components/features/documents/ResolutionDocumentView";

interface LegalDocSuite {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  turnaround: string;
  active: boolean;
  href?: string;
  badge?: string;
  popularFor: string[];
}

const DOCUMENT_CATALOGUE: LegalDocSuite[] = [
  {
    id: "BOARD_RESOLUTION",
    title: "Smart Board Resolution",
    category: "Corporate Banking & Governance",
    description: "Official extract of board minutes compliant with CAMA 2020 for opening corporate bank accounts and payment gateway KYC.",
    price: 3500,
    turnaround: "Instant Download",
    active: true,
    href: "/dashboard/documents/board-resolution",
    badge: "Most Popular in Nigeria",
    popularFor: ["Bank Account Opening (Access, GTB, Zenith)", "Paystack & Flutterwave KYC", "Director Mandate Updates"]
  },
  {
    id: "NDA",
    title: "Non-Disclosure Agreement (NDA)",
    category: "Confidentiality & Trade Secrets",
    description: "Unilateral or mutual confidentiality agreements protecting proprietary trade secrets, business models, and investor pitches.",
    price: 5000,
    turnaround: "Instant Download",
    active: false,
    badge: "Coming Soon",
    popularFor: ["Investor Pitching", "Hiring Freelancers/Vendors", "Partnership Discussions"]
  },
  {
    id: "TERMS_OF_SERVICE",
    title: "Terms of Service & Privacy Policy",
    category: "Digital Platform Compliance",
    description: "Comprehensive website and mobile app terms, disclaimer of warranties, user obligations, and NDPR compliant privacy policy.",
    price: 7500,
    turnaround: "Instant Download",
    active: false,
    badge: "Coming Soon",
    popularFor: ["Websites & SaaS", "Mobile Apps", "E-Commerce Stores"]
  },
  {
    id: "FOUNDERS_AGREEMENT",
    title: "Founders' Agreement",
    category: "Equity & Co-Founder Governance",
    description: "Clear equity split, milestone-based vesting schedules, IP assignment to company, and co-founder exit clauses.",
    price: 10000,
    turnaround: "Instant Download",
    active: false,
    badge: "Coming Soon",
    popularFor: ["Startup Co-Founders", "Equity Vesting", "IP Assignment"]
  },
  {
    id: "EMPLOYMENT_CONTRACT",
    title: "Standard Employment Contract",
    category: "Human Resources & Labor Law",
    description: "Nigerian Labor Act compliant employment contracts covering probation, compensation, IP assignment, and termination terms.",
    price: 6000,
    turnaround: "Instant Download",
    active: false,
    badge: "Coming Soon",
    popularFor: ["Full-time Staff", "Remote Employees", "Probation Agreements"]
  },
  {
    id: "SERVICE_AGREEMENT",
    title: "Service Level Agreement (SLA)",
    category: "Commercial Contracts",
    description: "Professional client service agreements defining deliverables, payment milestones, scope creep protection, and liability limits.",
    price: 6000,
    turnaround: "Instant Download",
    active: false,
    badge: "Coming Soon",
    popularFor: ["Consultants & Agencies", "Contractors", "Client Retainers"]
  },
  {
    id: "PRIVACY_POLICY",
    title: "NDPR Privacy Policy",
    category: "Data Protection Compliance",
    description: "Nigeria Data Protection Regulation (NDPR) compliant data governance disclosures for handling customer personal data.",
    price: 5000,
    turnaround: "Instant Download",
    active: false,
    badge: "Coming Soon",
    popularFor: ["Fintech Apps", "Customer Portals", "Data Collectors"]
  },
  {
    id: "MOU",
    title: "Memorandum of Understanding (MOU)",
    category: "Strategic Partnerships",
    description: "Formal framework outlining mutual intent, cooperative goals, and responsibilities for corporate partnerships.",
    price: 6000,
    turnaround: "Instant Download",
    active: false,
    badge: "Coming Soon",
    popularFor: ["Joint Ventures", "Strategic Alliances", "B2B Collaborations"]
  }
];

export default function DocumentsHubPage() {
  const [loading, setLoading] = useState(true);
  const [userVault, setUserVault] = useState<any[]>([]);
  const [pricingMap, setPricingMap] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<"catalogue" | "vault">("catalogue");
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchVault();
  }, []);

  const fetchVault = async () => {
    try {
      const res = await fetch("/api/documents/user-vault");
      const json = await res.json();
      if (json.success) {
        setUserVault(json.data.documents || []);
        if (json.data.pricing) {
          setPricingMap(json.data.pricing);
        }
      }
    } catch (e) {
      console.error("Failed to fetch user documents:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlist = async (title: string) => {
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: `Smart Document: ${title}` }),
      });
      if (res.ok) {
        showToast(`You have been added to the waitlist for "${title}". We will notify you once it goes live!`, "success");
      } else if (res.status === 409) {
        showToast(`You are already registered on the waitlist for "${title}".`, "info");
      } else {
        showToast("Request recorded. We will notify you upon launch.", "info");
      }
    } catch {
      showToast("Network error. Please try again.", "info");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-4 z-[100] animate-in slide-in-from-right-8 fade-in duration-300">
          <div className="flex items-center gap-3 p-4 pr-10 rounded-2xl shadow-2xl bg-card border border-border text-foreground">
            <CheckCircle className="h-5 w-5 text-primary shrink-0" weight="fill" />
            <p className="text-xs font-semibold">{toast.message}</p>
            <button 
              onClick={() => setToast(null)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-secondary/40 border border-border p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            <Sparkle className="h-3.5 w-3.5" weight="fill" />
            <span>AI Legal & Corporate Secretarial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Smart Legal Documents
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Generate legally watertight resolutions and contracts tailored for Nigerian companies under CAMA 2020. Instant download in high-resolution PDF and PNG.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/70">
          <button
            onClick={() => setActiveTab("catalogue")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "catalogue"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Document Catalogue ({DOCUMENT_CATALOGUE.length})
          </button>
          
          <button
            onClick={() => setActiveTab("vault")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "vault"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>My Document Vault</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-background/20 font-mono">
              {userVault.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CATALOGUE VIEW                                                         */}
      {/* ========================================================================= */}
      {activeTab === "catalogue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DOCUMENT_CATALOGUE.map((doc) => {
              const livePrice = pricingMap[`DOC_${doc.id}`] || doc.price;

              return (
                <div
                  key={doc.id}
                  className={`p-6 rounded-3xl bg-card border transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                    doc.active 
                      ? "border-primary/40 shadow-md hover:shadow-xl hover:border-primary" 
                      : "border-border/80 opacity-90 hover:border-border"
                  }`}
                >
                  {/* Top Accent Strip for Live Service */}
                  {doc.active && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#ff7b9f] to-primary" />
                  )}

                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {doc.category}
                      </span>
                      {doc.badge && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.active 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                            : "bg-secondary text-muted-foreground border border-border"
                        }`}>
                          {doc.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-foreground tracking-tight mb-2">
                      {doc.title}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      {doc.description}
                    </p>

                    {/* Popular Use Cases */}
                    <div className="space-y-1.5 mb-6 bg-secondary/40 p-3 rounded-2xl border border-border/60">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Common Use Cases:
                      </p>
                      <ul className="space-y-1">
                        {doc.popularFor.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 text-[11px] text-foreground font-medium">
                            <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="pt-3 border-t border-border/70 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground">Fee: </span>
                        <span className="text-xl font-black text-foreground">
                          ₦{livePrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                        <Clock className="h-3 w-3 text-primary" weight="bold" />
                        <span>{doc.turnaround}</span>
                      </div>
                    </div>

                    {doc.active && doc.href ? (
                      <Link
                        href={doc.href}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all"
                      >
                        <span>Generate Resolution</span>
                        <ArrowRight className="h-3.5 w-3.5" weight="bold" />
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleWaitlist(doc.title)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground font-bold text-xs rounded-xl border border-border transition-colors cursor-pointer"
                      >
                        <Sparkle className="h-3.5 w-3.5" weight="fill" />
                        <span>Notify Me When Live</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. USER DOCUMENT VAULT VIEW                                               */}
      {/* ========================================================================= */}
      {activeTab === "vault" && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="h-8 w-8 animate-spin text-primary" weight="bold" />
            </div>
          ) : userVault.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-3xl p-8 max-w-md mx-auto">
              <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8" weight="fill" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Your Vault is Empty</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-6 leading-relaxed">
                You have not generated any legal documents yet. Start with our Smart Board Resolution generator for corporate bank accounts.
              </p>
              <Link
                href="/dashboard/documents/board-resolution"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <span>Generate Board Resolution</span>
                <ArrowRight className="h-3.5 w-3.5" weight="bold" />
              </Link>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">Generated Documents Vault</h2>
                  <p className="text-xs text-muted-foreground">All generated resolutions are stored permanently here for easy re-download.</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-secondary rounded-full border border-border">
                  {userVault.length} Stored
                </span>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-secondary/40 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-3.5 pl-5 font-bold">Document Title</th>
                      <th className="p-3.5 font-bold">Company</th>
                      <th className="p-3.5 font-bold">Date Generated</th>
                      <th className="p-3.5 font-bold">Amount Paid</th>
                      <th className="p-3.5 font-bold">Reference</th>
                      <th className="p-3.5 pr-5 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {userVault.map((doc) => (
                      <tr key={doc.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-3.5 pl-5 font-bold text-foreground flex items-center gap-2">
                          <FilePdf className="h-4 w-4 text-primary shrink-0" weight="fill" />
                          <span className="truncate max-w-[200px] sm:max-w-xs">{doc.title}</span>
                        </td>
                        <td className="p-3.5 text-foreground font-semibold">
                          {doc.companyName}
                        </td>
                        <td className="p-3.5 text-muted-foreground whitespace-nowrap">
                          {format(new Date(doc.createdAt), "MMM d, yyyy • h:mm a")}
                        </td>
                        <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                          ₦{Number(doc.amountPaid).toLocaleString()}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-muted-foreground">
                          {doc.transactionRef}
                        </td>
                        <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedDoc(doc)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground font-bold text-xs rounded-lg border border-border transition-colors cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View & Download</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DOCUMENT VIEW & DOWNLOAD MODAL                                         */}
      {/* ========================================================================= */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-card rounded-3xl border border-border shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-secondary/30">
              <div>
                <h3 className="text-base font-bold text-foreground">{selectedDoc.title}</h3>
                <p className="text-xs text-muted-foreground">Ref: {selectedDoc.transactionRef}</p>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="h-8 w-8 rounded-full bg-secondary hover:bg-secondary/80 border border-border flex items-center justify-center text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" weight="bold" />
              </button>
            </div>

            <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <ResolutionDocumentView
                data={selectedDoc.structuredData}
                accentColor={selectedDoc.accentColor || "#0f172a"}
                logoUrl={selectedDoc.logoUrl}
                isWatermarked={false}
                documentRef={selectedDoc.transactionRef}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
