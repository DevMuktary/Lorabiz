// src/app/dashboard/scuml/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Info, CheckCircle, Clock, X, WarningCircle, ArrowRight, ListDashes } from "@phosphor-icons/react";
import FileUpload from "@/components/FileUpload";

type ScumlType = "BUSINESS_NAME" | "LLC" | "NGO";

export default function ScumlPage() {
  const [isActive, setIsActive] = useState(true);
  const [price, setPrice] = useState<number>(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  
  const [showIntroModal, setShowIntroModal] = useState(true);
  
  const [regType, setRegType] = useState<ScumlType | "">("");
  const [companyName, setCompanyName] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [documents, setDocuments] = useState({
    certificateUrl: "",
    statusReportUrl: "",
    memorandumUrl: "",
    constitutionUrl: ""
  });

  // Fetch Live Pricing from DB
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await fetch("/api/pricing");
        const data = await res.json();
        if (data.success && data.data.SCUML) {
          setPrice(data.data.SCUML);
        }
      } catch (err) {
        console.error("Failed to fetch price:", err);
      } finally {
        setIsLoadingPrice(false);
      }
    };
    fetchPricing();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!consentChecked) return;
    
    // Validation check for documents
    if (!documents.certificateUrl || !documents.statusReportUrl) {
      setErrorMsg("Please upload your Certificate and Status Report.");
      return;
    }
    if (regType === "LLC" && !documents.memorandumUrl) {
      setErrorMsg("Please upload your Memorandum (MEMART).");
      return;
    }
    if (regType === "NGO" && !documents.constitutionUrl) {
      setErrorMsg("Please upload your Constitution.");
      return;
    }

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
      setDocuments({ certificateUrl: "", statusReportUrl: "", memorandumUrl: "", constitutionUrl: "" });
      setConsentChecked(false);
      
      // Optionally redirect to history page, or just show success alert
      window.location.href = "/dashboard/scuml/history?success=true";

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isActive) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Image src="/scuml.png" alt="SCUML" width={80} height={80} className="mb-4 opacity-50 grayscale" />
        <h2 className="text-2xl font-black text-foreground">Service Temporarily Unavailable</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          SCUML registration is currently undergoing maintenance. Please check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto relative">
      
      {/* Intro Modal (Slides in middle of screen) */}
      {showIntroModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
                <Info weight="fill" className="h-6 w-6 text-blue-500" />
              </div>
              <h2 className="text-xl font-black">Before you proceed...</h2>
            </div>
            
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                Standard processing time is <strong className="text-foreground">24 to 72 hours</strong>. However, due to external agency factors, processing may occasionally extend to 4-5 working days. Sometimes, it may even be completed in less than 24 hours. 
              </p>
              <p>
                Your final SCUML certificate maybe sent to your registered company email, and will still be sent to your Lumebiz registered email. It will also be available to download later in your SCUML History.
              </p>
            </div>

            <button 
              onClick={() => setShowIntroModal(false)}
              className="mt-8 w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center p-2 border border-border shrink-0">
            <Image src="/scuml.png" alt="SCUML" width={40} height={40} className="object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-black">SCUML Registration</h1>
            <p className="text-muted-foreground text-sm">Apply for your Special Control Unit Against Money Laundering certificate.</p>
          </div>
        </div>

        <Link 
          href="/dashboard/scuml/history"
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-foreground text-sm font-bold rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group shrink-0"
        >
          <ListDashes weight="bold" className="h-4 w-4" />
          View History & Status
          <ArrowRight weight="bold" className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Main Application Form */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
        
        {/* Registration Type Buttons */}
        <div className="space-y-3">
          <label className="text-sm font-bold">1. Select Registration Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "BUSINESS_NAME", label: "Business Name" },
              { id: "LLC", label: "Limited Liability Co. (LLC)" },
              { id: "NGO", label: "NGO / Incorporated Trustees" }
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setRegType(type.id as ScumlType)}
                className={`px-4 py-4 rounded-xl border text-sm font-bold transition-all text-left ${
                  regType === type.id 
                    ? "bg-primary/10 border-primary text-primary shadow-sm" 
                    : "bg-background border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Company Name */}
        {regType && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
            <label className="text-sm font-bold">2. Exact Company / Business Name</label>
            <input 
              required
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Quadrox Technologies Limited"
              className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
            />
          </div>
        )}

        {/* Cloudinary Document Uploads */}
        {regType && (
          <div className="space-y-4 pt-4 border-t border-border animate-in fade-in">
            <h3 className="text-sm font-bold">3. Upload Required Documents</h3>
            <p className="text-xs text-muted-foreground mb-4">Please upload clear, legible copies of your official CAC documents.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FileUpload 
                label="CAC Certificate" 
                value={documents.certificateUrl}
                onChange={(url) => setDocuments(p => ({ ...p, certificateUrl: url }))}
              />
              <FileUpload 
                label="Status Report" 
                value={documents.statusReportUrl}
                onChange={(url) => setDocuments(p => ({ ...p, statusReportUrl: url }))}
              />

              {regType === "LLC" && (
                <div className="sm:col-span-2">
                  <FileUpload 
                    label="Memorandum & Articles (MEMART)" 
                    value={documents.memorandumUrl}
                    onChange={(url) => setDocuments(p => ({ ...p, memorandumUrl: url }))}
                  />
                </div>
              )}

              {regType === "NGO" && (
                <div className="sm:col-span-2">
                  <FileUpload 
                    label="NGO Constitution" 
                    value={documents.constitutionUrl}
                    onChange={(url) => setDocuments(p => ({ ...p, constitutionUrl: url }))}
                  />
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="mt-4 bg-destructive/10 text-destructive text-sm font-bold p-3 rounded-lg flex items-center gap-2 border border-destructive/20">
                <WarningCircle weight="bold" className="h-4 w-4" />
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Consent & Submit */}
        {regType && (
          <div className="pt-4 border-t border-border space-y-5 animate-in fade-in">
            <label className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl cursor-pointer border border-transparent hover:border-border transition-colors">
              <input 
                type="checkbox" 
                required
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer" 
              />
              <span className="text-xs text-muted-foreground leading-relaxed select-none">
                I acknowledge that this application is processed through an authorized third-party agency. I confirm that all uploaded documents are authentic.
              </span>
            </label>

            <button 
              type="submit"
              disabled={!consentChecked || !companyName || isLoadingPrice}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {isLoadingPrice ? "Loading pricing..." : `Proceed to Pay ₦${price.toLocaleString()}`}
            </button>
          </div>
        )}
      </form>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
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
                  <span className="font-bold text-right">{companyName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-bold">{regType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-2 mt-2">
                  <span className="text-muted-foreground">Total Cost</span>
                  <span className="font-black text-primary text-lg">₦{price.toLocaleString()}</span>
                </div>
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
