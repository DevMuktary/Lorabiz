"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CircleNotch, CircleDashed } from "@phosphor-icons/react";
import CompanyStep from "@/components/features/cac/register/biz-name/CompanyStep";
import ProprietorStep from "@/components/features/cac/register/biz-name/ProprietorStep";
import DocumentStep from "@/components/features/cac/register/biz-name/DocumentStep";
import PreviewStep from "@/components/features/cac/register/biz-name/PreviewStep";
import PaymentModal from "@/components/features/cac/register/biz-name/PaymentModal";
import { CompanyInfo, Proprietor, isValidEmail, isValidPhone, calculateAge } from "@/components/features/cac/register/biz-name/schema";

export default function RegistrationDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  // NEW: Track the highest unlocked step so they can click backward/forward safely
  const [highestStepReached, setHighestStepReached] = useState(1); 
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const [lockedStatus, setLockedStatus] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{show: boolean, msg: string, type: "error" | "success"}>({ show: false, msg: "", type: "success" });
  const showToast = (msg: string, type: "error" | "success" = "error") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 4000);
  };

  const [draft, setDraft] = useState({ proposedName: "LOADING...", ownershipType: "SOLE", specificNature: "LOADING..." });
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({ email: "", state: "", city: "", streetNo: "", address: "", commencementDate: "" });
  const [proprietors, setProprietors] = useState<Proprietor[]>([]);

  // AUTO-SAVE LOGIC
  const saveDraftToDB = useCallback(async () => {
    if (!id || loading || lockedStatus) return; 
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/cac/register/business-name/details/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyInfo, proprietors, isDraft: true })
      });
      if (res.ok) setSaveStatus("saved");
      else setSaveStatus("error");
    } catch {
      setSaveStatus("error");
    }
  }, [id, companyInfo, proprietors, loading, lockedStatus]);

  useEffect(() => {
    const timer = setTimeout(() => saveDraftToDB(), 2000);
    return () => clearTimeout(timer);
  }, [companyInfo, proprietors, saveDraftToDB]);

  // INITIAL FETCH
  useEffect(() => {
    if (!id) return;
    fetch(`/api/cac/register/business-name/details/${id}`).then(res => res.json()).then(json => {
      if (json.success) {
        if (json.data.status !== "UNSUBMITTED") {
          setLockedStatus(json.data.status);
          setTimeout(() => router.push("/dashboard/cac/new-incorporation"), 3500);
          setLoading(false);
          return;
        }

        setDraft(json.data);
        setCompanyInfo({
          email: json.data.companyEmail || "", state: json.data.companyState || "", city: json.data.companyCity || "", 
          streetNo: json.data.companyStreetNo || "", address: json.data.companyAddress || "", commencementDate: json.data.commencementDate || ""
        });
        if (json.data.proprietors?.length > 0) {
          setProprietors(json.data.proprietors.map((p: any) => ({
            ...p, documents: { nin: p.ninUrl || null, passport: p.passportUrl || null, signature: p.signatureUrl || null }
          })));
        }
      }
      setLoading(false);
    });
  }, [id, router]);

  // VALIDATION & PROGRESSION PIPELINE
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!companyInfo.email || !companyInfo.state || !companyInfo.city || !companyInfo.streetNo || !companyInfo.address || !companyInfo.commencementDate) {
        showToast("Please fill all compulsory company fields.", "error"); return;
      }
      if (!isValidEmail(companyInfo.email)) { showToast("Invalid company email format.", "error"); return; }
    }
    
    if (currentStep === 2) {
      const isSole = draft.ownershipType === "SOLE";
      if (isSole && proprietors.length !== 1) { showToast("Sole Proprietorship requires exactly 1 proprietor.", "error"); return; }
      if (!isSole && proprietors.length < 2) { showToast("Partnerships require at least 2 proprietors.", "error"); return; }
      
      for (const p of proprietors) {
        if (!p.surname || !p.firstName || !p.email || !p.phone || !p.gender || !p.dob || !p.state || !p.lga || !p.city || !p.streetNo || !p.serviceAddress) {
          showToast(`Proprietor ${p.firstName || "Form"} is missing compulsory fields.`, "error"); return;
        }
        if (!isValidEmail(p.email)) { showToast(`Proprietor ${p.firstName} has an invalid email.`, "error"); return; }
        if (!isValidPhone(p.phone)) { showToast(`Proprietor ${p.firstName} has an invalid phone.`, "error"); return; }
        
        if (calculateAge(p.dob) < 18) {
          const adults = proprietors.filter(adult => calculateAge(adult.dob) >= 18);
          if (adults.length < 2) { showToast(`Under 18 detected. CAC requires at least 2 adult partners for a minor.`, "error"); return; }
        }
      }
    }

    if (currentStep === 3) {
      const missingDocs = proprietors.some(p => !p.documents.nin || !p.documents.passport || !p.documents.signature);
      if (missingDocs) { showToast("Ensure NIN, Passport, and Signature are uploaded for all proprietors.", "error"); return; }
    }

    setCurrentStep(prev => {
      const next = prev + 1;
      // Unlock the next step if they successfully validate through the current one
      setHighestStepReached(h => Math.max(h, next));
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenPayment = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/cac/register/business-name/details/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyInfo, proprietors, isDraft: true }) 
      });
      
      if (res.ok) {
        setSaveStatus("saved");
        setShowPaymentModal(true); 
      } else {
        showToast("Failed to sync final details. Please try again.", "error");
      }
    } catch {
      showToast("Network error. Please check your connection.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // MULTI-TAB / ALREADY SUBMITTED LOCKOUT SCREEN
  if (lockedStatus) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <CircleDashed className="animate-spin h-28 w-28 text-primary mb-8" weight="bold" />
        <h2 className="text-3xl font-black text-foreground mb-3 text-center">Application Locked</h2>
        <p className="text-muted-foreground font-medium text-lg text-center max-w-md">
          This application is already submitted and is currently in <span className="font-bold text-primary">{lockedStatus}</span> status.
        </p>
        <p className="text-sm font-bold tracking-widest uppercase text-muted-foreground/50 mt-8 animate-pulse">
          Redirecting to Dashboard...
        </p>
      </div>
    );
  }

  // BIG ZIGZAG LOADER FOR INITIAL PAGE LOAD
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <CircleDashed className="animate-spin h-28 w-28 text-primary" weight="bold" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 pt-4 px-4 font-sans relative">
      
      {toast.show && (
        <div className={`fixed bottom-10 right-4 z-[9999] animate-in slide-in-from-right flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white font-bold ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* STICKY TEXT-BASED STEPPER */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md pb-4 pt-4 mb-8 border-b border-border flex justify-between items-end">
        <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-2 w-full md:w-auto">
          {[ 
            { step: 1, title: "Company Information" }, 
            { step: 2, title: "Proprietor Information" }, 
            { step: 3, title: "Document Uploads" }, 
            { step: 4, title: "Preview" }
          ].map((s) => {
            const isAccessible = s.step <= highestStepReached;
            const isActive = currentStep === s.step;
            const isPast = currentStep > s.step;

            return (
              <button 
                key={s.step} 
                onClick={() => isAccessible && setCurrentStep(s.step)}
                disabled={!isAccessible}
                className={`flex items-center gap-2 whitespace-nowrap text-sm transition-colors ${
                  isActive ? "text-primary font-black" : 
                  isPast ? "text-foreground font-bold hover:text-primary cursor-pointer" : 
                  isAccessible ? "text-muted-foreground font-medium hover:text-foreground cursor-pointer" : 
                  "text-muted-foreground/40 font-medium cursor-not-allowed"
                }`}
              >
                <span className={`flex items-center justify-center h-6 w-6 rounded-md text-xs font-bold transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : 
                  isPast ? "bg-secondary text-foreground border border-border" : 
                  "bg-secondary/50 text-muted-foreground/50"
                }`}>
                  {s.step}
                </span>
                {s.title}
              </button>
            );
          })}
        </div>
        <div className="hidden md:block text-xs font-bold text-muted-foreground">
          {saveStatus === "saving" && "Saving draft..."}
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "error" && <span className="text-red-500">Save failed</span>}
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden relative">
        {currentStep === 1 && <CompanyStep draft={draft} companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />}
        {currentStep === 2 && <ProprietorStep proprietors={proprietors} setProprietors={setProprietors} isSoleProprietor={draft.ownershipType === "SOLE"} />}
        {currentStep === 3 && <DocumentStep proprietors={proprietors} setProprietors={setProprietors} />}
        {currentStep === 4 && <PreviewStep draft={draft} companyInfo={companyInfo} proprietors={proprietors} setCurrentStep={setCurrentStep} />}

        <div className="bg-secondary/30 border-t border-border p-6 flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(p => p - 1)} disabled={currentStep === 1 || isSubmitting} className="h-12 px-6 rounded-xl font-bold bg-background text-foreground border-border hover:bg-secondary cursor-pointer">
            Back
          </Button>
          {currentStep < 4 ? (
             <Button onClick={handleNextStep} className="h-12 px-8 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-90 cursor-pointer">
               Continue
             </Button>
          ) : (
             <Button 
                onClick={handleOpenPayment} 
                disabled={isSubmitting} 
                className="h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg flex items-center cursor-pointer"
              >
               {isSubmitting ? <><CircleNotch className="animate-spin h-5 w-5 mr-2" weight="bold" /> Loading...</> : "Checkout & Submit"}
             </Button>
          )}
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal 
          registrationId={id} 
          proposedName={draft.proposedName} 
          onClose={() => setShowPaymentModal(false)} 
        />
      )}
    </div>
  );
}
