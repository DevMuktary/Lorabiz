"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircleNotch, CircleDashed } from "@phosphor-icons/react";
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

// Optional: Import your PaymentModal when ready for LLCs
// import PaymentModal from "@/components/dashboard/register/llc/PaymentModal";

export default function LlcRegistrationDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [draft, setDraft] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // STRICT VALIDATION STATE
  const [showErrors, setShowErrors] = useState(false);

  // ==========================================
  // MASTER FORM STATE
  // ==========================================
  const [companyDetails, setCompanyDetails] = useState({
    // Step 1
    email: "", principalActivity: "", specificActivity: "", description: "",
    registeredAddress: { state: "", lga: "", city: "", postCode: "", houseNo: "", street: "" },
    headOfficeSameAsRegistered: false, // Default to FALSE to force them to look at it
    headOfficeAddress: { state: "", lga: "", city: "", postCode: "", houseNo: "", street: "" },
    // Step 2 & 3
    useDefaultArticles: true,
    witnessDetails: {},
    memorandumObjects: [] as string[],
    // Step 4, 5, 6
    officers: [] as any[],
    shareCapital: null as any,
    // Step 7
    declarantDetails: null as any,
    // Step 8
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
          // Lockout if already paid or submitted
          if (json.data.status !== "UNSUBMITTED" && json.data.status !== "QUERIED") {
            router.push("/dashboard"); 
            return;
          }
          setDraft(json.data);
          
          // Hydrate master state if data exists from previous sessions
          setCompanyDetails(prev => ({
            ...prev,
            email: json.data.email || prev.email,
            principalActivity: json.data.principalActivity || prev.principalActivity,
            specificActivity: json.data.specificActivity || prev.specificActivity,
            description: json.data.description || prev.description,
            registeredAddress: json.data.registeredAddress || prev.registeredAddress,
            // If headOfficeAddress exists in DB, it means it's different
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
      .catch(err => {
        console.error("Error fetching LLC draft:", err);
        setLoading(false);
      });
  }, [id, router]);

  // ==========================================
  // SAVE TO DATABASE & NEXT STEP
  // ==========================================
  const handleSaveAndNext = async () => {
    
    // STRICT STEP 1 VALIDATION
    if (currentStep === 1) {
      const d = companyDetails;
      const rAddr = d.registeredAddress;
      const hAddr = d.headOfficeAddress;

      const isBaseValid = d.email && d.description && rAddr.state && rAddr.lga && rAddr.city && rAddr.houseNo && rAddr.street;
      const isHeadValid = d.headOfficeSameAsRegistered || (hAddr.state && hAddr.lga && hAddr.city && hAddr.houseNo && hAddr.street);

      if (!isBaseValid || !isHeadValid) {
        setShowErrors(true);
        alert("Please fill all required fields highlighted in red before continuing.");
        return; // BLOCK PROGRESS
      }
      setShowErrors(false);
    }

    // STRICT STEP 3 VALIDATION
    if (currentStep === 3 && companyDetails.memorandumObjects.length === 0) {
      alert("Please add at least one Object of Memorandum.");
      return;
    }
    
    // STRICT STEP 4 VALIDATION
    if (currentStep === 4 && companyDetails.officers.filter(o => o.roles.includes("DIRECTOR")).length === 0) {
      alert("You must add at least one Director.");
      return;
    }
    
    setSaveStatus("saving");
    
    try {
      // Background save to API
      const res = await fetch(`/api/register/llc/details/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...companyDetails, isDraft: true })
      });
      
      if (res.ok) {
        setSaveStatus("saved");
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSaveStatus("error");
        alert("Failed to save progress. Please check your connection.");
      }
    } catch (error) {
      setSaveStatus("error");
      alert("Network error while saving.");
    }
  };

  // ==========================================
  // FINAL SUBMISSION (TRIGGER PAYMENT)
  // ==========================================
  const handleFinalSubmit = async () => {
    setSaveStatus("saving");
    try {
      // Final strict sync to database
      const res = await fetch(`/api/register/llc/details/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...companyDetails, isDraft: false })
      });
      
      if (res.ok) {
        setSaveStatus("saved");
        setShowPaymentModal(true); // Open the checkout gateway
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Please complete all mandatory fields before submitting.");
        setSaveStatus("error");
      }
    } catch (error) {
      alert("Failed to initialize checkout. Please try again.");
      setSaveStatus("error");
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
      
      {/* Header & Stepper (FIXED HORIZONTAL SCROLL) */}
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
        
        {/* Autosave UI removed completely */}
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
            isSubmitting={saveStatus === "saving"} 
          />
        )}

        {/* Footer Navigation (Hidden on Step 9) */}
        {currentStep < 9 && (
          <div className="bg-slate-50 border-t border-slate-200 p-6 flex justify-between items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(p => p - 1)} 
              disabled={currentStep === 1 || saveStatus === "saving"} 
              className="h-12 px-6 rounded-xl font-bold bg-white text-slate-600"
            >
              Back
            </Button>
            
            <Button 
              onClick={handleSaveAndNext} 
              disabled={saveStatus === "saving"}
              className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md min-w-[160px] flex items-center justify-center gap-2"
            >
              {saveStatus === "saving" ? <CircleNotch className="animate-spin h-5 w-5" weight="bold" /> : "Save & Continue"}
            </Button>
          </div>
        )}
      </div>

      {/* PAYMENT MODAL (Mounts when ready to checkout) */}
      {/* {showPaymentModal && (
        <PaymentModal 
          registrationId={id} 
          proposedName={draft.proposedName} 
          onClose={() => setShowPaymentModal(false)} 
        />
      )} 
      */}

    </div>
  );
}
