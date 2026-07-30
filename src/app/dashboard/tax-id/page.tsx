// src/app/dashboard/tax-id/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Info, CheckCircle, X, WarningCircle, ArrowRight, ListDashes, ArrowLeft, Tag, IdentificationCard, Buildings } from "@phosphor-icons/react";

type TaxIdType = "INDIVIDUAL" | "CORPORATE";

const CORPORATE_CATEGORIES = [
  "Business Name",
  "Company (LLC)",
  "Incorporated Trustee",
  "Limited Partnership",
  "Limited Liability Partnership"
];

export default function TaxIdPage() {
  const [isActive, setIsActive] = useState(true);
  const [reqType, setReqType] = useState<TaxIdType>("INDIVIDUAL");
  
  const [prices, setPrices] = useState({ individual: 0, corporate: 0 });
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  
  const [consentChecked, setConsentChecked] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Individual Form
  const [nin, setNin] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");

  // Corporate Form
  const [cacNumber, setCacNumber] = useState("");
  const [corpCategory, setCorpCategory] = useState("");

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await fetch("/api/pricing");
        const data = await res.json();
        if (data.success) {
          setPrices({
            individual: data.data.TAX_ID_INDIVIDUAL || 500,
            corporate: data.data.TAX_ID_CORPORATE || 1000
          });
        }
      } catch (err) {
        console.error("Failed to fetch price");
      } finally {
        setIsLoadingPrice(false);
      }
    };
    fetchPricing();
  }, []);

  const currentPrice = reqType === "INDIVIDUAL" ? prices.individual : prices.corporate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!consentChecked) return;
    if (reqType === "INDIVIDUAL" && nin.length !== 11) {
      setErrorMsg("NIN must be exactly 11 digits.");
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const confirmAndPay = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/tax-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reqType,
          individualData: reqType === "INDIVIDUAL" ? { nin, firstName, lastName, dob } : null,
          corporateData: reqType === "CORPORATE" ? { cacNumber, category: corpCategory } : null,
          price: currentPrice
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setIsConfirmModalOpen(false);
      window.location.href = "/dashboard/tax-id/history?success=true";

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isActive) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-black text-foreground">Service Temporarily Unavailable</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative">
      
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Warning Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex gap-4 animate-in fade-in">
        <Info weight="fill" className="h-6 w-6 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
          <p className="font-bold mb-1">Processing Timeline</p>
          Processing time is within <strong className="text-foreground">30 minutes</strong> between 9:00 AM - 5:00 PM. Applications submitted outside these hours may take 1 hour or more. If your request is delayed, please log a complaint using the email option on our Support widget.
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center p-2 border border-border shrink-0">
            <Image src="/nrs.png" alt="TIN" width={40} height={40} className="object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Generate Tax ID (TIN)</h1>
            <p className="text-muted-foreground text-sm">Get your 13-digit Tax Identification Number instantly.</p>
          </div>
        </div>

        <Link href="/dashboard/tax-id/history" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground text-sm font-bold rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group shrink-0">
          <ListDashes weight="bold" className="h-4 w-4" />
          View History & Status
          <ArrowRight weight="bold" className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
            
            {/* Toggle Tabs */}
            <div className="space-y-4">
              <label className="text-sm font-bold">1. Select Request Type</label>
              <div className="flex bg-secondary p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setReqType("INDIVIDUAL")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${reqType === "INDIVIDUAL" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <IdentificationCard weight={reqType === "INDIVIDUAL" ? "fill" : "regular"} className="h-5 w-5" /> Individual
                </button>
                <button
                  type="button"
                  onClick={() => setReqType("CORPORATE")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${reqType === "CORPORATE" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Buildings weight={reqType === "CORPORATE" ? "fill" : "regular"} className="h-5 w-5" /> Corporate
                </button>
              </div>

              {!isLoadingPrice && (
                <div className="animate-in fade-in flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-500 px-3 py-2 rounded-lg w-fit">
                  <Tag weight="fill" className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Processing Fee: ₦{currentPrice.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="space-y-6 pt-4 border-t border-border">
              {reqType === "INDIVIDUAL" ? (
                <div className="space-y-5 animate-in fade-in">
                  <div>
                    <label className="text-sm font-bold mb-2 block">National Identity Number (NIN)</label>
                    <input required type="text" pattern="\d{11}" maxLength={11} value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))} placeholder="Enter your 11-digit NIN" className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold mb-2 block">First Name</label>
                      <input required type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. John" className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-sm font-bold mb-2 block">Last Name</label>
                      <input required type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Doe" className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold mb-2 block">Date of Birth</label>
                    <input required type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().split("T")[0]} className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all appearance-none cursor-pointer" style={{ colorScheme: "dark" }} />
                  </div>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in">
                  <div>
                    <label className="text-sm font-bold mb-2 block">CAC Registration Number</label>
                    <input required type="text" value={cacNumber} onChange={(e) => setCacNumber(e.target.value.toUpperCase())} placeholder="e.g. RC123456 or BN987654" className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all uppercase" />
                  </div>
                  <div>
                    <label className="text-sm font-bold mb-2 block">Registration Category</label>
                    <select required value={corpCategory} onChange={(e) => setCorpCategory(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer">
                      <option value="" disabled>Select your CAC Category...</option>
                      {CORPORATE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border space-y-5">
              <label className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl cursor-pointer border border-transparent hover:border-border transition-colors">
                <input type="checkbox" required checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer shrink-0" />
                <span className="text-xs text-muted-foreground leading-relaxed select-none">
                  I hereby consent to the processing of my information for tax-related identity verification and authorize Lorabiz to process it on my behalf.
                </span>
              </label>

              <button type="submit" disabled={!consentChecked || isLoadingPrice} className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md">
                {isLoadingPrice ? "Loading pricing..." : `Pay ₦${currentPrice.toLocaleString()} & Generate TIN`}
              </button>
            </div>
          </form>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-24">
            <h3 className="font-black text-sm uppercase tracking-wider text-muted-foreground mb-5">Why you need a TIN</h3>
            <ul className="space-y-5">
              <li className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">1</div>
                <p className="text-sm text-muted-foreground leading-relaxed">Required for opening corporate or personal bank accounts.</p>
              </li>
              <li className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">2</div>
                <p className="text-sm text-muted-foreground leading-relaxed">Necessary for processing SCUML and other regulatory certificates.</p>
              </li>
              <li className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">3</div>
                <p className="text-sm text-muted-foreground leading-relaxed">Mandatory for importing/exporting goods and bidding for government contracts.</p>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 md:p-8 space-y-6">
              
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black">Confirm Request</h3>
                <button onClick={() => setIsConfirmModalOpen(false)} disabled={isSubmitting} className="p-1 hover:bg-secondary rounded-full transition-colors disabled:opacity-50">
                  <X weight="bold" className="h-5 w-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="bg-destructive/10 text-destructive text-sm font-bold p-3 rounded-lg flex items-center gap-2 border border-destructive/20">
                  <WarningCircle weight="bold" className="h-4 w-4" /> {errorMsg}
                </div>
              )}

              <div className="bg-secondary/50 rounded-xl p-4 space-y-2 border border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-bold">{reqType}</span>
                </div>
                {reqType === "INDIVIDUAL" ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-bold">{firstName} {lastName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">NIN</span>
                      <span className="font-bold tracking-widest">{nin}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CAC Number</span>
                    <span className="font-bold">{cacNumber}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-end border-t border-border pt-3 mt-3">
                  <span className="text-muted-foreground text-sm">Total Cost</span>
                  <span className="font-black text-primary text-xl leading-none">₦{currentPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsConfirmModalOpen(false)} disabled={isSubmitting} className="flex-1 py-3 bg-secondary text-foreground font-bold rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={confirmAndPay} disabled={isSubmitting} className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? "Processing..." : <><CheckCircle weight="bold" className="h-4 w-4" /> Pay & Submit</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
