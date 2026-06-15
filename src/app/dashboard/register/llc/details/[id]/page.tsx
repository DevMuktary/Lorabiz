"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircleDashed, WarningCircle, X, CircleNotch } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// Import all 9 Step Components
import CompanyDetailsStep from "@/components/dashboard/register/llc/CompanyDetailsStep";
import ArticlesStep from "@/components/dashboard/register/llc/ArticlesStep";
import MemorandumStep from "@/components/dashboard/register/llc/MemorandumStep";
import OfficersStep from "@/components/dashboard/register/llc/OfficersStep";
import ShareCapitalStep from "@/components/dashboard/register/llc/ShareCapitalStep";
import PscStep from "@/components/dashboard/register/llc/PscStep";
import ComplianceStep from "@/components/dashboard/register/llc/ComplianceStep";
import UploadsStep from "@/components/dashboard/register/llc/UploadsStep";
import PreviewStep from "@/components/dashboard/register/llc/PreviewStep";

export default function LlcRegistrationDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<any>(null);
  
  // UX STATES
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showErrors, setShowErrors] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Auto-dismiss timer reference for the error banner
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ==========================================
  // MASTER FORM STATE
  // ==========================================
  const [companyDetails, setCompanyDetails] = useState({
    email: "", principalActivity: "", specificActivity: "", description: "",
    registeredAddress: { state: "", lga: "", city: "", postCode: "", houseNo: "", street: "" },
    headOfficeSameAsRegistered: false, 
    headOfficeAddress: { state: "", lga: "", city: "", postCode: "", houseNo: "", street: "" },
    useDefaultArticles: true,
    witnessDetails: {},
    memorandumObjects: [] as string[],
    officers: [] as any[],
    shareCapital: null as any,
    declarantDetails: null as any,
    uploads: {} as any
  });

  // ==========================================
  // FETCH INITIAL DATA
  // ==========================================
  useEffect(() => {
    if (!id) return;
    
    fetch(`/api/register/llc/details/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          if (json.data.status !== "UNSUBMITTED" && json.data.status !== "QUERIED") {
            router.push("/dashboard"); 
            return;
          }
          setDraft(json.data);
          
          setCompanyDetails(prev => ({
            ...prev,
            email: json.data.email || prev.email,
            principalActivity: json.data.principalActivity || prev.principalActivity,
            specificActivity: json.data.specificActivity || prev.specificActivity,
            description: json.data.description || prev.description,
            registeredAddress: json.data.registeredAddress || prev.registeredAddress,
            headOfficeSameAsRegistered: json.data.headOfficeAddress ? false : prev.headOfficeSameAsRegistered,
            headOfficeAddress: json.data.headOfficeAddress || prev.headOfficeAddress,
            useDefaultArticles: json.data.useDefaultArticles ?? prev.useDefaultArticles,
            witnessDetails: json.data.witnessDetails || prev.witnessDetails,
            memorandumObjects: json.data.memorandumObjects || prev.memorandumObjects,
            officers: json.data.officers || prev.officers,
            shareCapital: json.data.shareCapital || prev.shareCapital,
            declarantDetails: json.data.declarantDetails || prev.declarantDetails,
            uploads: json.data.uploads || prev.uploads,
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, router]);

  // ==========================================
  // SILENT BACKGROUND AUTOSAVE
  // ==========================================
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (loading || !id || !draft) return; 

    setSaveStatus("saving");
    const timer = setTimeout(() => {
      fetch(`/api/register/llc/details/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...companyDetails, isDraft: true })
      })
      .then(res => res.ok ? setSaveStatus("saved") : setSaveStatus("error"))
      .catch(() => setSaveStatus("error")); 
    }, 2000); 

    return () => clearTimeout(timer);
  }, [companyDetails, id, loading, draft]);


  // ==========================================
  // ERROR BANNER MANAGER
  // ==========================================
  const triggerError = (message: string, anchorId?: string) => {
    setShowErrors(true);
    setTopError(message);
    
    // Clear any existing timer
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    
    // Auto-dismiss after 6 seconds
    errorTimerRef.current = setTimeout(() => {
      setTopError(null);
    }, 6000);

    // Scroll to the specific field if provided
    if (anchorId) {
      setTimeout(() => {
        const element = document.getElementById(anchorId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }, 100);
    }
  };


  // ==========================================
  // SMART VALIDATION & NEXT STEP
  // ==========================================
  const handleSaveAndNext = () => {
    setTopError(null);
    setShowErrors(false);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);

    // STRICT STEP 1 VALIDATION (Including Format Checking)
    if (currentStep === 1) {
      const d = companyDetails;
      const rAddr = d.registeredAddress;
      const hAddr = d.headOfficeAddress;

      // Ensure Email format is correct
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!d.email || !d.email.trim() || !emailRegex.test(d.email)) {
        triggerError("Please provide a valid Company Email address.", "field-email");
        return;
      }

      const checks = [
        { val: d.description, name: "Description of Business Activity", id: "field-desc" },
        { val: rAddr.state, name: "Registered State", id: "field-regState" },
        { val: rAddr.lga, name: "Registered LGA", id: "field-regLga" },
        { val: rAddr.city, name: "Registered City / Town", id: "field-regCity" },
        { val: rAddr.houseNo, name: "Registered House No.", id: "field-regHouse" },
        { val: rAddr.street, name: "Registered Street Name", id: "field-regStreet" }
      ];

      if (!d.headOfficeSameAsRegistered) {
        checks.push(
          { val: hAddr.state, name: "Head Office State", id: "field-hoState" },
          { val: hAddr.lga, name: "Head Office LGA", id: "field-hoLga" },
          { val: hAddr.city, name: "Head Office City / Town", id: "field-hoCity" },
          { val: hAddr.houseNo, name: "Head Office House No.", id: "field-hoHouse" },
          { val: hAddr.street, name: "Head Office Street Name", id: "field-hoStreet" }
        );
      }

      const firstError = checks.find(c => !c.val || !c.val.trim());

      if (firstError) {
        triggerError(`Please provide the ${firstError.name}.`, firstError.id);
        return; 
      }
    }

    if (currentStep === 3 && companyDetails.memorandumObjects.length === 0) {
      triggerError("Please add at least one Object of Memorandum.");
      return;
    }
    
    if (currentStep === 4 && companyDetails.officers.filter(o => o.roles.includes("DIRECTOR")).length === 0) {
      triggerError("You must add at least one Director.");
      return;
    }
    
    // If all clear, proceed! (Autosave handles the database sync)
    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ==========================================
  // FINAL SUBMISSION (TRIGGER PAYMENT)
  // ==========================================
  const handleFinalSubmit = async () => {
    setIsSubmittingFinal(true);
    setTopError(null);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    
    try {
      const res = await fetch(`/api/register/llc/details/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...companyDetails, isDraft: false })
      });
      
      if (res.ok) {
        setShowPaymentModal(true); 
      } else {
        const errorData = await res.json();
        triggerError(errorData.message || "Please complete all mandatory fields before submitting.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      triggerError("Failed to initialize checkout. Please check your connection.");
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CircleDashed className="animate-spin h-28 w-28 text-indigo-500" weight="bold" />
      </div>
    );
  }

  const STEPS = [
    "Company Details", "Articles", "Objects", "Officers", "Share Capital", 
    "PSC", "Compliance", "Uploads", "Preview"
  ];

  return (
    <div className="max-w-5xl mx-auto pb-16 pt-8 px-4 font-sans relative">
      
      {/* BEAUTIFUL GLOBAL ERROR BADGE (Z-Index increased, pushed down from very top, auto-fades) */}
      {topError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[999999] w-[90%] max-w-md animate-in slide-in-from-top-8 fade-in duration-500">
          <div className="bg-red-600 text-white px-5 py-3.5 rounded-2xl shadow-[0_10px_40px_rgba(220,38,38,0.3)] flex items-center justify-between gap-3 font-bold text-sm border-2 border-red-500 overflow-hidden relative">
            
            {/* The animated shrink bar (Water effect) */}
            <div className="absolute bottom-0 left-0 h-1 bg-red-400/50 animate-[shrink_6s_linear_forwards]" style={{ width: '100%' }} />

            <div className="flex items-center gap-3 relative z-10">
              <WarningCircle weight="fill" className="h-6 w-6 shrink-0 text-red-200" />
              <span>{topError}</span>
            </div>
            
            <button 
              onClick={() => {
                setTopError(null);
                if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
              }} 
              className="shrink-0 bg-red-700 hover:bg-red-800 rounded-full p-1.5 transition-colors relative z-10"
            >
              <X weight="bold" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header & Stepper */}
      <div className="mb-8 border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="w-full overflow-hidden">
          <h1 className="text-2xl font-black text-slate-900 mb-6 truncate pr-4">{draft?.proposedName || "Loading..."}</h1>
          <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 w-full max-w-full snap-x">
            {STEPS.map((title, index) => {
              const stepNum = index + 1;
              return (
                <div key={stepNum} className={`flex items-center gap-2 whitespace-nowrap text-sm snap-start shrink-0 ${currentStep === stepNum ? "text-indigo-600 font-black" : currentStep > stepNum ? "text-slate-800 font-bold" : "text-slate-400 font-medium"}`}>
                  <span className={`flex items-center justify-center h-6 w-6 rounded-md text-xs font-bold ${currentStep === stepNum ? "bg-indigo-600 text-white" : currentStep > stepNum ? "bg-slate-200 text-slate-800" : "bg-slate-100"}`}>
                    {stepNum}
                  </span>
                  {title}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Form Mounting */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {currentStep === 1 && <CompanyDetailsStep data={companyDetails} updateData={setCompanyDetails} draft={draft} showErrors={showErrors} />}
        {currentStep === 2 && <ArticlesStep data={companyDetails} updateData={setCompanyDetails} />}
        {currentStep === 3 && <MemorandumStep data={companyDetails} updateData={setCompanyDetails} />}
        {currentStep === 4 && <OfficersStep data={companyDetails} updateData={setCompanyDetails} />}
        {currentStep === 5 && <ShareCapitalStep data={companyDetails} updateData={setCompanyDetails} />}
        {currentStep === 6 && <PscStep data={companyDetails} updateData={setCompanyDetails} />}
        {currentStep === 7 && <ComplianceStep data={companyDetails} updateData={setCompanyDetails} />}
        {currentStep === 8 && <UploadsStep data={companyDetails} updateData={setCompanyDetails} />}
        {currentStep === 9 && (
          <PreviewStep 
            data={companyDetails} 
            draft={draft} 
            onSubmit={handleFinalSubmit} 
            isSubmitting={isSubmittingFinal} 
          />
        )}

        {/* Footer Navigation (Hidden on Step 9) */}
        {currentStep < 9 && (
          <div className="bg-slate-50 border-t border-slate-200 p-6 flex justify-between items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => { setCurrentStep(p => p - 1); setTopError(null); }} 
              disabled={currentStep === 1} 
              className="h-12 px-6 rounded-xl font-bold bg-white text-slate-600"
            >
              Back
            </Button>
            
            <Button 
              onClick={handleSaveAndNext} 
              className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md min-w-[160px] flex items-center justify-center gap-2"
            >
              Save & Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
