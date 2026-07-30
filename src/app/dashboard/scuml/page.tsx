// src/app/dashboard/scuml/page.tsx
"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Info, UploadSimple, CheckCircle, Clock, X, WarningCircle } from "@phosphor-icons/react";
import ScumlHistoryTable from "@/components/features/scuml/ScumlHistoryTable";

type ScumlType = "BUSINESS_NAME" | "LLC" | "NGO";

export default function ScumlPage() {
  const [isActive, setIsActive] = useState(true);
  const [price, setPrice] = useState<number>(15000); // Should be fetched from /api/pricing
  
  const [regType, setRegType] = useState<ScumlType | "">("");
  const [companyName, setCompanyName] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Form Documents (In a real app, these would hold the Cloudinary URLs after upload)
  const [documents, setDocuments] = useState({
    certificateUrl: "https://example.com/cert.pdf", // Mock URL
    statusReportUrl: "https://example.com/status.pdf", // Mock URL
    memorandumUrl: "",
    constitutionUrl: ""
  });

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch("/api/scuml");
      const data = await res.json();
      if (data.history) setHistory(data.history);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // TODO: Fetch global pricing here if needed
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!consentChecked) return;
    setIsConfirmModalOpen(true);
  };

  const confirmAndPay = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/scuml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: regType,
          companyName,
          documents,
          price
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      // Success
      setIsConfirmModalOpen(false);
      setCompanyName("");
      setRegType("");
      setConsentChecked(false);
      fetchHistory(); // Refresh table
      alert("Submitted successfully! Wallet debited.");

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isActive) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldCheck className="h-20 w-20 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-black text-foreground">Service Temporarily Unavailable</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          SCUML registration is currently undergoing maintenance. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header & TAT Banner */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <ShieldCheck weight="fill" className="h-7 w-7 text-primary" />
            SCUML Certificate Registration
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Apply for your Special Control Unit Against Money Laundering certificate.
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-4">
          <Info weight="fill" className="h-6 w-6 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
            <p className="font-bold mb-1">Important Timeline Information</p>
            Standard processing time is <span className="font-black">24 to 72 hours</span>. However, due to external agency factors, processing may occasionally extend to 4-5 working days. Sometimes, it may even be completed in less than 24 hours. Your certificate will be sent directly to your registered company email and will also be available for download here.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Application Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            
            <div className="space-y-3">
              <label className="text-sm font-bold">Registration Type</label>
              <select 
                required
                value={regType}
                onChange={(e) => setRegType(e.target.value as ScumlType)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
              >
                <option value="" disabled>Select the type of your CAC registration...</option>
                <option value="BUSINESS_NAME">Business Name</option>
                <option value="LLC">Limited Liability Company (LLC)</option>
                <option value="NGO">Non-Governmental Organization (NGO)</option>
              </select>
            </div>

            {regType && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-bold">Company / Business Name</label>
                <input 
                  required
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter exact name as registered on CAC"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
              </div>
            )}

            {regType && (
              <div className="space-y-4 pt-4 border-t border-border animate-in fade-in">
                <h3 className="text-sm font-bold">Required Documents (PDF or Image)</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Universal Uploads */}
                  <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer group">
                    <UploadSimple weight="bold" className="h-6 w-6 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
                    <span className="text-xs font-bold">Upload CAC Certificate</span>
                  </div>
                  
                  <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer group">
                    <UploadSimple weight="bold" className="h-6 w-6 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
                    <span className="text-xs font-bold">Upload Status Report</span>
                  </div>

                  {/* Conditional Uploads */}
                  {regType === "LLC" && (
                    <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer group sm:col-span-2">
                      <UploadSimple weight="bold" className="h-6 w-6 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
                      <span className="text-xs font-bold">Upload Memorandum (MEMART)</span>
                    </div>
                  )}

                  {regType === "NGO" && (
                    <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer group sm:col-span-2">
                      <UploadSimple weight="bold" className="h-6 w-6 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
                      <span className="text-xs font-bold">Upload Constitution</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {regType && (
              <div className="pt-4 space-y-5 animate-in fade-in">
                <label className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl cursor-pointer border border-transparent hover:border-border transition-colors">
                  <input 
                    type="checkbox" 
                    required
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary accent-primary" 
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    I acknowledge that this application is processed through an authorized third-party agency. I confirm that all uploaded documents are authentic and understand that the final SCUML certificate will be delivered directly to my registered company email.
                  </span>
                </label>

                <button 
                  type="submit"
                  disabled={!consentChecked || !companyName}
                  className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Proceed to Pay ₦{price.toLocaleString()}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-black text-sm uppercase tracking-wider text-muted-foreground mb-4">How it works</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <p className="text-xs text-muted-foreground leading-relaxed">Select your registration type and upload the exact corresponding documents.</p>
              </li>
              <li className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <p className="text-xs text-muted-foreground leading-relaxed">Submit your application and pay the fixed processing fee securely from your wallet.</p>
              </li>
              <li className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <p className="text-xs text-muted-foreground leading-relaxed">Our third-party partners process the application. The status will show as Pending, then Processing.</p>
              </li>
              <li className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">4</div>
                <p className="text-xs text-muted-foreground leading-relaxed">Receive your official SCUML Certificate directly in your company inbox and on this dashboard.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* History Section Component */}
      <div className="pt-8 border-t border-border">
        <h2 className="text-lg font-black mb-4">Your SCUML Applications</h2>
        <ScumlHistoryTable history={history} isLoading={isLoadingHistory} />
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 md:p-8 space-y-6">
              
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black">Confirm Submission</h3>
                <button 
                  onClick={() => setIsConfirmModalOpen(false)} 
                  disabled={isSubmitting}
                  className="p-1 hover:bg-secondary rounded-full transition-colors disabled:opacity-50"
                >
                  <X weight="bold" className="h-5 w-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="bg-destructive/10 text-destructive text-sm font-bold p-3 rounded-lg flex items-center gap-2 border border-destructive/20">
                  <WarningCircle weight="bold" className="h-4 w-4" />
                  {errorMsg}
                </div>
              )}

              <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Company Name</span>
                  <span className="font-bold">{companyName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reg Type</span>
                  <span className="font-bold">{regType}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                  <span className="text-muted-foreground">Total Cost</span>
                  <span className="font-black text-primary">₦{price.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-muted-foreground bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                <Clock weight="fill" className="h-4 w-4 text-blue-500 shrink-0" />
                <p>By proceeding, ₦{price.toLocaleString()} will be deducted from your wallet. Processing takes 24-72 hours on average.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsConfirmModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-secondary text-foreground font-bold rounded-xl hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmAndPay}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>Processing...</>
                  ) : (
                    <><CheckCircle weight="bold" className="h-4 w-4" /> Pay & Submit</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
