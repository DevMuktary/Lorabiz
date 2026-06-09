"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CircleNotch, CircleDashed } from "@phosphor-icons/react";
import CompanyStep from "@/components/dashboard/register/biz-name/CompanyStep";
import ProprietorStep from "@/components/dashboard/register/biz-name/ProprietorStep";
import DocumentStep from "@/components/dashboard/register/biz-name/DocumentStep";
import PreviewStep from "@/components/dashboard/register/biz-name/PreviewStep";
import PaymentModal from "@/components/dashboard/register/biz-name/PaymentModal";
import { CompanyInfo, Proprietor, isValidEmail, isValidPhone, calculateAge } from "@/components/dashboard/register/biz-name/schema";

export default function RegistrationDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // NEW: State to lock the screen if someone else already submitted it
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
    if (!id || loading || lockedStatus) return; // Do not autosave if locked
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/register/details/${id}`, {
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

  // INITIAL FETCH & MULTI-TAB LOCKOUT CHECK
  useEffect(() => {
    if (!id) return;
    fetch(`/api/register/details/${id}`).then(res => res.json()).then(json => {
      if (json.success) {
        
        // LOCKOUT CHECK: If already submitted, lock the screen and boot them out
        if (json.data.status !== "UNSUBMITTED") {
          setLockedStatus(json.data.status);
          setTimeout(() => router.push("/dashboard"), 3500);
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

    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenPayment = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/register/details/${id}`, {
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
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50/50">
        <CircleDashed className="animate-spin h-28 w-28 text-[#ff3f7a] mb-8" weight="bold" />
        <h2 className="text-3xl font-black text-slate-900 mb-3 text-center">Application Locked</h2>
        <p className="text-slate-500 font-medium text-lg text-center max-w-md">
          This application is already submitted and is currently in <span className="font-bold text-[#ff3f7a]">{lockedStatus}</span> status.
        </p>
        <p className="text-sm font-bold tracking-widest uppercase text-slate-400 mt-8 animate-pulse">
          Redirecting to Dashboard...
        </p>
      </div>
    );
  }

  // BIG ZIGZAG LOADER FOR INITIAL PAGE LOAD
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CircleDashed className="animate-spin h-28 w-28 text-[#ff3f7a]" weight="bold" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 pt-8 px-4 font-sans relative">
      
      {toast.show && (
        <div className={`fixed bottom-10 right-4 z-[9999] animate-in slide-in-from-right flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white font-bold ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* TEXT-BASED STEPPER & SIMPLE AUTOSAVE */}
      <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
        <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-2 w-full md:w-auto">
          {[ 
            { step: 1, title: "Company Information" }, 
            { step: 2, title: "Proprietor Information" }, 
            { step: 3, title: "Document Uploads" }, 
            { step: 4, title: "Preview" }
          ].map((s) => (
            <div key={s.step} className={`flex items-center gap-2 whitespace-nowrap text-sm ${currentStep === s.step ? "text-[#ff3f7a] font-black" : currentStep > s.step ? "text-slate-800 font-bold" : "text-slate-400 font-medium"}`}>
              <span className={`flex items-center justify-center h-6 w-6 rounded-md text-xs font-bold ${currentStep === s.step ? "bg-[#ff3f7a] text-white" : currentStep > s.step ? "bg-slate-200 text-slate-800" : "bg-slate-100"}`}>{s.step}</span>
              {s.title}
            </div>
          ))}
        </div>
        <div className="hidden md:block text-xs font-bold text-slate-400">
          {saveStatus === "saving" && "Saving draft..."}
          {saveStatus === "saved" && "Saved"}
          {saveStatus === "error" && <span className="text-red-500">Save failed</span>}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
        {currentStep === 1 && <CompanyStep draft={draft} companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />}
        {currentStep === 2 && <ProprietorStep proprietors={proprietors} setProprietors={setProprietors} isSoleProprietor={draft.ownershipType === "SOLE"} />}
        {currentStep === 3 && <DocumentStep proprietors={proprietors} setProprietors={setProprietors} />}
        {currentStep === 4 && <PreviewStep draft={draft} companyInfo={companyInfo} proprietors={proprietors} setCurrentStep={setCurrentStep} />}

        <div className="bg-slate-50 border-t border-slate-200 p-6 flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(p => p - 1)} disabled={currentStep === 1 || isSubmitting} className="h-12 px-6 rounded-xl font-bold bg-white">
            Back
          </Button>
          {currentStep < 4 ? (
             <Button onClick={handleNextStep} className="h-12 px-8 bg-[#ff3f7a] text-white font-bold rounded-xl shadow-md hover:bg-[#e02b62]">
               Continue
             </Button>
          ) : (
             <Button 
                onClick={handleOpenPayment} 
                disabled={isSubmitting} 
                className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg flex items-center"
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
