"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Info, CheckCircle, Clock, X, WarningCircle, ArrowRight, ListDashes, 
  ArrowLeft, CaretDown, CaretUp, Buildings, Storefront, Globe, Tag, Spinner
} from "@phosphor-icons/react";
import { FileUpload } from "@/components/FileUpload";
import ScumlPaymentModal from "@/components/features/scuml/ScumlPaymentModal";

type ScumlType = "BUSINESS_NAME" | "LLC" | "NGO";

const REG_OPTIONS = [
  { id: "BUSINESS_NAME", label: "Business Name", icon: Storefront, desc: "For Enterprises and Ventures" },
  { id: "LLC", label: "Limited Liability Co. (LLC)", icon: Buildings, desc: "For Private Limited Companies" },
  { id: "NGO", label: "NGO / Incorporated Trustees", icon: Globe, desc: "For Foundations, Churches, etc." }
] as const;

export default function ScumlPage() {
  const [isActive, setIsActive] = useState(true);
  const [price, setPrice] = useState<number>(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  
  const [showIntroModal, setShowIntroModal] = useState(true);
  
  const [regType, setRegType] = useState<ScumlType | "">("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const [paymentDraftId, setPaymentDraftId] = useState<string | null>(null);
  
  // UX State for Verification
  const [alertInfo, setAlertInfo] = useState<{title: string, message: string} | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  // =========================================================================
  // ROBUST PAYMENT VERIFICATION & CANCEL HANDLER
  // =========================================================================
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isVerifying = params.get("verifying") === "true";
      const draftId = params.get("draftId");
      const reference = params.get("reference");

      if (isVerifying && draftId) {
        // Immediately clean the URL so the PaymentModal doesn't get stuck in a loading state
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        if (reference) {
          setIsVerifyingPayment(true);
          setAlertInfo({ title: "Verifying Payment 🔄", message: "Confirming your transaction with the bank..." });

          fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setAlertInfo({ title: "Payment Successful 🎉", message: "Your application is now processing! Redirecting..." });
              setTimeout(() => {
                window.location.href = "/dashboard/scuml/history";
              }, 1500);
            } else {
              setAlertInfo({ title: "Payment Incomplete ⚠️", message: "Transaction failed or was cancelled. You can try again." });
              setPaymentDraftId(draftId); // Opens modal with clear URL so they can retry
            }
          })
          .catch(() => {
            setAlertInfo({ title: "Status Pending ⏳", message: "Network error during verification. We'll keep checking." });
            setPaymentDraftId(draftId);
          })
          .finally(() => {
            setIsVerifyingPayment(false);
          });
        } else {
          // User closed the KoraPay checkout without a reference being passed back
          setAlertInfo({ title: "Payment Cancelled ⚠️", message: "You closed the payment gateway. No funds were debited." });
          setPaymentDraftId(draftId); // Opens modal with clear URL so they can retry
        }
      }
    }
  }, []);

  useEffect(() => {
    if (alertInfo) {
      const timer = setTimeout(() => setAlertInfo(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alertInfo]);

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

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!consentChecked) return;
    
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
          documents
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Something went wrong generating the application.");
      }

      const draftId = data.data.id;
      setIsConfirmModalOpen(false);
      setPaymentDraftId(draftId);

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDynamicLabel = () => {
    if (regType === "BUSINESS_NAME") return "2. Exact Business Name";
    if (regType === "LLC") return "2. Exact Company Name";
    if (regType === "NGO") return "2. Exact NGO / Trustees Name";
    return "2. Exact Name";
  };

  const getDynamicPlaceholder = () => {
    if (regType === "BUSINESS_NAME") return "e.g. Adebayo & Sons Enterprises";
    if (regType === "LLC") return "e.g. Zenith Tech Limited";
    if (regType === "NGO") return "e.g. Harmony Foundation Initiative";
    return "Select a type first...";
  };

  const selectedOptionDetails = REG_OPTIONS.find(o => o.id === regType);

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
    <div className="space-y-6 max-w-6xl mx-auto relative">
      
      {/* Full Screen Loading Overlay for Verification */}
      {isVerifyingPayment && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <Spinner className="animate-spin h-12 w-12 text-primary mb-4" weight="bold" />
          <h2 className="text-xl font-black">Verifying Payment</h2>
          <p className="text-muted-foreground mt-2">Please wait while we confirm your transaction...</p>
        </div>
      )}

      {showIntroModal && !isVerifyingPayment && (
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
                Your final SCUML certificate maybe sent to your registered company email, and will still be sent to your <strong className="text-foreground">Lorabiz registered email</strong>. It will also be available to download later in your SCUML History dashboard.
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

      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
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
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground text-sm font-bold rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group shrink-0"
        >
          <ListDashes weight="bold" className="h-4 w-4" />
          View History & Status
          <ArrowRight weight="bold" className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-8">
            
            <div className="space-y-3" ref={dropdownRef}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold">1. Select Registration Type</label>
              </div>
              
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all text-left ${isDropdownOpen ? 'border-primary ring-2 ring-primary/20 bg-background' : 'border-border bg-background hover:border-primary/50'}`}
                >
                  {selectedOptionDetails ? (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <selectedOptionDetails.icon weight="fill" className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-sm text-foreground">{selectedOptionDetails.label}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Select your CAC registration type...</span>
                  )}
                  {isDropdownOpen ? <CaretUp weight="bold" className="h-4 w-4 text-muted-foreground" /> : <CaretDown weight="bold" className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {REG_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setRegType(option.id as ScumlType);
                          setIsDropdownOpen(false);
                          setCompanyName(""); 
                        }}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-secondary transition-colors text-left border-b border-border last:border-0"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <option.icon weight="fill" className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {regType && !isLoadingPrice && (
                <div className="animate-in fade-in slide-in-from-top-1 flex items-center gap-2 mt-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-500 px-3 py-2 rounded-lg w-fit">
                  <Tag weight="fill" className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Processing Fee: ₦{price.toLocaleString()}</span>
                </div>
              )}
            </div>

            {regType && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-bold">{getDynamicLabel()}</label>
                <input 
                  required
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={getDynamicPlaceholder()}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
              </div>
            )}

            {regType && (
              <div className="space-y-4 pt-4 border-t border-border animate-in fade-in">
                <h3 className="text-sm font-bold">3. Upload Required Documents</h3>
                <p className="text-xs text-muted-foreground mb-4">Please upload clear, legible copies of your official CAC documents. Maximum file size is 5MB.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FileUpload 
                    label="CAC Certificate" 
                    description="PDF, JPG, or PNG"
                    accept="application/pdf, image/jpeg, image/png"
                    value={documents.certificateUrl}
                    onUploadSuccess={(url) => setDocuments(p => ({ ...p, certificateUrl: url }))}
                    onRemove={() => setDocuments(p => ({ ...p, certificateUrl: "" }))}
                  />
                  <FileUpload 
                    label="Status Report" 
                    description="Strictly PDF"
                    accept="application/pdf"
                    value={documents.statusReportUrl}
                    onUploadSuccess={(url) => setDocuments(p => ({ ...p, statusReportUrl: url }))}
                    onRemove={() => setDocuments(p => ({ ...p, statusReportUrl: "" }))}
                  />

                  {regType === "LLC" && (
                    <div className="sm:col-span-2">
                      <FileUpload 
                        label="Memorandum & Articles (MEMART)" 
                        description="Strictly PDF"
                        accept="application/pdf"
                        value={documents.memorandumUrl}
                        onUploadSuccess={(url) => setDocuments(p => ({ ...p, memorandumUrl: url }))}
                        onRemove={() => setDocuments(p => ({ ...p, memorandumUrl: "" }))}
                      />
                    </div>
                  )}

                  {regType === "NGO" && (
                    <div className="sm:col-span-2">
                      <FileUpload 
                        label="NGO Constitution" 
                        description="Strictly PDF"
                        accept="application/pdf"
                        value={documents.constitutionUrl}
                        onUploadSuccess={(url) => setDocuments(p => ({ ...p, constitutionUrl: url }))}
                        onRemove={() => setDocuments(p => ({ ...p, constitutionUrl: "" }))}
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

            {regType && (
              <div className="pt-4 border-t border-border space-y-5 animate-in fade-in">
                <label className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl cursor-pointer border border-transparent hover:border-border transition-colors">
                  <input 
                    type="checkbox" 
                    required
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer shrink-0" 
                  />
                  <span className="text-xs text-muted-foreground leading-relaxed select-none">
                    I acknowledge that this application is processed through an authorized third-party agency. I confirm that all uploaded documents are authentic.
                  </span>
                </label>

                <button 
                  type="submit"
                  disabled={!consentChecked || !companyName || isLoadingPrice || isSubmitting}
                  className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                >
                  {isLoadingPrice ? "Loading pricing..." : `Proceed to Review`}
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-24">
            <h3 className="font-black text-sm uppercase tracking-wider text-muted-foreground mb-5">How it works</h3>
            <ul className="space-y-5">
              <li className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">1</div>
                <p className="text-sm text-muted-foreground leading-relaxed">Select your registration type and upload the exact corresponding documents.</p>
              </li>
              <li className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">2</div>
                <p className="text-sm text-muted-foreground leading-relaxed">Submit your application and pay the processing fee from your wallet.</p>
              </li>
              <li className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">3</div>
                <p className="text-sm text-muted-foreground leading-relaxed">Our partners process the application. The status will update to <strong className="text-foreground">Processing</strong> in your history.</p>
              </li>
              <li className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-xs font-bold shrink-0 border border-green-500/20">4</div>
                <p className="text-sm text-muted-foreground leading-relaxed">Receive your official SCUML Certificate directly in your company inbox and on this dashboard.</p>
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

              <div className="bg-secondary/50 rounded-xl p-4 space-y-2 border border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Company Name</span>
                  <span className="font-bold text-right max-w-[200px] truncate">{companyName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-bold">{regType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-end border-t border-border pt-3 mt-3">
                  <span className="text-muted-foreground text-sm">Total Cost</span>
                  <span className="font-black text-primary text-xl leading-none">₦{price.toLocaleString()}</span>
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
                  {isSubmitting ? "Generating..." : <><ArrowRight weight="bold" className="h-4 w-4" /> Proceed to Pay</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentDraftId && (
        <ScumlPaymentModal
          registrationId={paymentDraftId}
          companyName={companyName}
          onClose={() => setPaymentDraftId(null)}
        />
      )}

      {/* Toast Alert Component */}
      {alertInfo && (
        <div className="fixed bottom-6 right-6 bg-foreground text-background px-5 py-4 rounded-2xl shadow-2xl z-[99999] flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm border border-border">
          <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
            <Info weight="fill" className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight">{alertInfo.title}</h4>
            <p className="text-xs opacity-90 mt-1 leading-snug">{alertInfo.message}</p>
          </div>
          <button 
            onClick={() => setAlertInfo(null)} 
            className="ml-2 p-1.5 hover:bg-background/20 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
}
