"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircleDashed, WarningCircle, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { DESIGNATED_COMPANIES } from "@/lib/share-capital-data";

// Import all 9 Step Components
import CompanyDetailsStep from "@/components/features/cac/register/llc/CompanyDetailsStep";
import ArticlesStep from "@/components/features/cac/register/llc/ArticlesStep";
import MemorandumStep from "@/components/features/cac/register/llc/MemorandumStep";
import OfficersStep from "@/components/features/cac/register/llc/OfficersStep";
import ShareCapitalStep from "@/components/features/cac/register/llc/ShareCapitalStep";
import PscStep from "@/components/features/cac/register/llc/PscStep";
import ComplianceStep from "@/components/features/cac/register/llc/ComplianceStep";
import UploadsStep from "@/components/features/cac/register/llc/UploadsStep";
import PreviewStep from "@/components/features/cac/register/llc/PreviewStep";

// FIXED IMPORT: Pointing to the LLC Payment Modal, NOT the Biz Name one!
import PaymentModal from "@/components/features/cac/register/llc/PaymentModal";

export default function LlcRegistrationDetailsPage() {
  const params = useParams();
  const id = params?.id as string; // Internal CUID for secure API database updates
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [highestStep, setHighestStep] = useState(1); // Tracks the furthest unlocked step
  
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<any>(null);
  
  // UX STATES
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showErrors, setShowErrors] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  
  // NEW STATES FOR CHECKOUT RETURN LOGIC
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [lockedStatus, setLockedStatus] = useState<string | null>(null);

  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null); // For horizontal stepper scrolling

  // ==========================================
  // MASTER FORM STATE
  // ==========================================
  const [companyDetails, setCompanyDetails] = useState({
    email: "", principalActivity: "", specificActivity: "", description: "",
    registeredAddress: { state: "", lga: "", city: "", postCode: "", houseNo: "", street: "" },
    headOfficeSameAsRegistered: false, 
    headOfficeAddress: { state: "", lga: "", city: "", postCode: "", houseNo: "", street: "" },
    useDefaultArticles: true,
    customArticles: [] as string[],
    witnessDetails: { surname: "", firstName: "", otherName: "", dob: "", gender: "", occupation: "", country: "Nigeria", phoneCode: "+234", phone: "", email: "", state: "", lga: "", street: "" },
    memorandumObjects: [] as string[],
    officers: [] as any[],
    shareCapital: null as any,
    declarantDetails: null as any,
    uploads: {} as any
  });

  // ==========================================
  // FETCH INITIAL DATA & HANDLE CHECKOUT RETURN
  // ==========================================
  useEffect(() => {
    if (!id) return;
    
    // Check if returning from Paystack checkout native redirect
    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const isReturningFromPaystack = searchParams?.get("verifying") === "true" || searchParams?.get("paid") === "true" || searchParams?.has("trxref");

    fetch(`/api/cac/register/llc/details/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          
          // If returning from Paystack, ALWAYS open the payment modal to show verification & checkmark!
          if (isReturningFromPaystack) {
            setShowPaymentModal(true);
          } 
          // Only show static lockout screen if NOT actively verifying payment
          else if (json.data.status !== "UNSUBMITTED" && json.data.status !== "QUERIED") {
            setLockedStatus(json.data.status);
            setTimeout(() => router.push("/dashboard/cac/new-incorporation"), 3500);
            setLoading(false);
            return;
          }

          setDraft(json.data);
          
          const rAddr = json.data.registeredAddress || companyDetails.registeredAddress;
          const hAddr = json.data.headOfficeAddress || companyDetails.headOfficeAddress;
          const isSame = JSON.stringify(rAddr) === JSON.stringify(hAddr);

          setCompanyDetails(prev => ({
            ...prev,
            email: json.data.email || prev.email,
            principalActivity: json.data.principalActivity || prev.principalActivity,
            specificActivity: json.data.specificActivity || prev.specificActivity,
            description: json.data.description || prev.description,
            registeredAddress: rAddr,
            headOfficeAddress: hAddr,
            headOfficeSameAsRegistered: isSame, 
            useDefaultArticles: json.data.useDefaultArticles ?? prev.useDefaultArticles,
            customArticles: json.data.customArticles || prev.customArticles,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  // ==========================================
  // AUTO-SCROLL HORIZONTAL STEPPER ON MOBILE
  // ==========================================
  useEffect(() => {
    const container = scrollContainerRef.current;
    const activeBtn = document.getElementById(`nav-step-${currentStep}`);
    
    if (container && activeBtn) {
      const scrollLeft = activeBtn.offsetLeft - container.offsetWidth / 2 + activeBtn.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [currentStep]);

  // ==========================================
  // SILENT BACKGROUND AUTOSAVE
  // ==========================================
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Prevent autosaving if locked or loading
    if (loading || !id || !draft || lockedStatus) return; 

    setSaveStatus("saving");
    const timer = setTimeout(() => {
      fetch(`/api/cac/register/llc/details/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...companyDetails, headOfficeSameAsRegistered: false, isDraft: true })
      })
      .then(res => res.ok ? setSaveStatus("saved") : setSaveStatus("error"))
      .catch(() => setSaveStatus("error")); 
    }, 2000); 

    return () => clearTimeout(timer);
  }, [companyDetails, id, loading, draft, lockedStatus]);

  // ==========================================
  // ERROR BANNER MANAGER
  // ==========================================
  const triggerError = (message: string, anchorId?: string) => {
    setShowErrors(true);
    setTopError(message);
    
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    
    errorTimerRef.current = setTimeout(() => {
      setTopError(null);
    }, 6000);

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
    if (currentStep !== 5) {
        setTopError(null);
    }
    setShowErrors(true);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);

    const d = companyDetails;

    // STRICT STEP 1
    if (currentStep === 1) {
      const rAddr = d.registeredAddress;
      const hAddr = d.headOfficeAddress;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!d.email || !d.email.trim() || !emailRegex.test(d.email)) return triggerError("Please provide a valid Company Email address.", "field-email");
      
      const checks = [
        { val: d.description, name: "Description of Business Activity", id: "field-desc" },
        { val: rAddr.state, name: "Registered State", id: "field-regState" },
        { val: rAddr.lga, name: "Registered LGA", id: "field-regLga" },
        { val: rAddr.city, name: "Registered City / Town", id: "field-regCity" },
        { val: rAddr.houseNo, name: "Registered House No.", id: "field-regHouse" },
        { val: rAddr.street, name: "Registered Street Name", id: "field-regStreet" },
        { val: hAddr.state, name: "Head Office State", id: "field-hoState" },
        { val: hAddr.lga, name: "Head Office LGA", id: "field-hoLga" },
        { val: hAddr.city, name: "Head Office City / Town", id: "field-hoCity" },
        { val: hAddr.houseNo, name: "Head Office House No.", id: "field-hoHouse" },
        { val: hAddr.street, name: "Head Office Street Name", id: "field-hoStreet" }
      ];

      const firstError = checks.find(c => !c.val || !c.val.trim());
      if (firstError) return triggerError(`Please provide the ${firstError.name}.`, firstError.id);
    }

    // STRICT STEP 2 
    if (currentStep === 2) {
      const w = d.witnessDetails;
      if (!d.customArticles || d.customArticles.length === 0) return triggerError("You must provide at least one Article of Association to proceed.");
      
      const witnessChecks = [
        { val: w.surname, name: "Witness Surname", id: "field-w-surname" },
        { val: w.firstName, name: "Witness First Name", id: "field-w-first" },
        { val: w.dob, name: "Witness Date of Birth", id: "field-w-dob" },
        { val: w.gender, name: "Witness Gender", id: "field-w-gender" },
        { val: w.occupation, name: "Witness Occupation", id: "field-w-occ" },
        { val: w.country, name: "Witness Country", id: "field-w-country" },
        { val: w.phoneCode, name: "Witness Phone Code", id: "field-w-phoneCode" },
        { val: w.phone, name: "Witness Phone Number", id: "field-w-phone" },
        { val: w.email, name: "Witness Email Address", id: "field-w-email" },
        { val: w.state, name: "Witness State", id: "field-w-state" },
        { val: w.lga, name: "Witness LGA", id: "field-w-lga" },
        { val: w.street, name: "Witness Full Street Address", id: "field-w-street" }
      ];

      const firstError = witnessChecks.find(c => !c.val || !c.val.trim());
      if (firstError) return triggerError(`Please provide the ${firstError.name}.`, firstError.id);

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(w.email)) return triggerError("Please provide a valid Witness Email address.", "field-w-email");
      
      const age = Math.abs(new Date(Date.now() - new Date(w.dob).getTime()).getUTCFullYear() - 1970);
      if (age < 18) return triggerError("The witness must be at least 18 years old to sign legal documents.", "field-w-dob");
      if (w.phone.replace(/\D/g, '').length < 5) return triggerError("Please provide a valid Witness Phone Number.", "field-w-phone");
    }

    // STRICT STEP 3 
    if (currentStep === 3 && d.memorandumObjects.length === 0) return triggerError("Please add at least one Object of Memorandum.");
    
    // STRICT STEP 4 
    if (currentStep === 4 && d.officers.filter(o => o.roles.includes("DIRECTOR")).length === 0) return triggerError("You must add at least one Director.");

    // STRICT STEP 5 
    if (currentStep === 5) {
      if (topError) {
         window.scrollTo({ top: 0, behavior: "smooth" });
         return; 
      }
      
      const sc = d.shareCapital || {};
      const companyType = sc.companyType || "ENTITY WITH SHARES BELOW FIVE MILLION";
      const selectedCompanyInfo = DESIGNATED_COMPANIES.find(c => c.type === companyType);
      const minRequired = selectedCompanyInfo ? selectedCompanyInfo.min : 1000000;
      const totalIssuedCapitalNum = Number(sc.totalIssuedCapital) || 0;

      if (totalIssuedCapitalNum < minRequired) return triggerError(`Total Issued Capital must be at least ₦${minRequired.toLocaleString()} for this company type.`);
      const classes = sc.shareClasses || [];
      if (classes.length === 0) return triggerError("You must create at least one Share Class (EQUITY (ORDINARY)).");
      const totalClassesValue = classes.reduce((acc: number, c: any) => acc + (Number(c.totalValue) || 0), 0);
      if (totalClassesValue !== totalIssuedCapitalNum) return triggerError(`Mismatch! Your Share Classes total ₦${totalClassesValue.toLocaleString()}, but your declared capital is ₦${totalIssuedCapitalNum.toLocaleString()}.`);
      if (!classes.some((c: any) => c.type === "EQUITY (ORDINARY)")) return triggerError("A company cannot be registered with only Preference shares. You must add at least one EQUITY (ORDINARY) share class.");

      const totalRequiredUnits = classes.reduce((acc: number, c: any) => acc + (Number(c.units) || 0), 0);
      const allotments = sc.allotments || [];
      const totalAllotted = allotments.reduce((acc: number, a: any) => acc + (Number(a.units) || 0), 0);
      const remainingAllotmentUnits = totalRequiredUnits - totalAllotted;

      if (d.officers.filter((o: any) => o.roles.includes("SHAREHOLDER")).length === 0) return triggerError("You must add at least one Shareholder before assigning shares.");
      if (remainingAllotmentUnits > 0) return triggerError(`You must allot 100% of the created shares. You still have ${remainingAllotmentUnits.toLocaleString()} units unassigned.`);
      if (remainingAllotmentUnits < 0) return triggerError(`You have over-distributed your shares by ${Math.abs(remainingAllotmentUnits).toLocaleString()} units. Please correct the allotments.`);
    }

    // STRICT STEP 6 (PSC)
    if (currentStep === 6) {
        const incompletePsc = d.officers.filter(o => o.roles.includes("PSC")).find((p: any) => !p.pscDetails?.isPep || !p.pscDetails?.hasAffiliation);
        if (incompletePsc) return triggerError(`Please complete the details for PSC: ${incompletePsc.firstName} ${incompletePsc.surname}`);
    }

    // STRICT STEP 7 (Compliance)
    if (currentStep === 7) {
        const dec = d.declarantDetails || {};
        if (!dec.surname || !dec.firstName || !dec.phone || !dec.email || !dec.state || !dec.lga || !dec.city || !dec.street) return triggerError("Please fill in all required fields for the Declarant.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dec.email)) return triggerError("Please provide a valid Declarant Email address.");
        if (dec.phone.replace(/\D/g, '').length < 5) return triggerError("Please provide a valid Declarant Phone Number.");
        if (!dec.isAcknowledged) return triggerError("You must acknowledge the Statement of Compliance to proceed.");
    }

    // STRICT STEP 8 (Uploads)
    if (currentStep === 8) {
      const u = d.uploads || {};
      const missingDocs: string[] = [];

      d.officers.forEach((o: any) => {
        if (!u[`id-${o.id}`]) missingDocs.push(`ID for ${o.firstName}`);
        if (!u[`sig-${o.id}`]) missingDocs.push(`Signature for ${o.firstName}`);
      });

      if (d.witnessDetails?.firstName && !u['witness-sig']) missingDocs.push("Witness Signature");
      if (d.declarantDetails?.firstName && !u['deponent-sig']) missingDocs.push("Declarant Signature");

      if (missingDocs.length > 0) {
        const errorText = missingDocs.length === 1 
          ? `Missing required upload: ${missingDocs[0]}` 
          : `Missing required uploads: ${missingDocs[0]} (+${missingDocs.length - 1} more)`;
        return triggerError(errorText);
      }
    }
    
    // SUCCESS! Proceed to next step
    setShowErrors(false);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    
    const nextStepNum = currentStep + 1;
    setCurrentStep(nextStepNum);
    setHighestStep(prev => Math.max(prev, nextStepNum));
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalSubmit = async () => {
    setIsSubmittingFinal(true);
    setTopError(null);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    
    try {
      const res = await fetch(`/api/cac/register/llc/details/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...companyDetails, headOfficeSameAsRegistered: false, isDraft: false })
      });
      
      if (res.ok) {
        setShowPaymentModal(true); 
      }
      else {
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

  // Helper to calculate exact Total Fee for LLC Checkout
  const calculateTotalFee = () => {
    const totalShares = Number(companyDetails.shareCapital?.totalIssuedCapital) || 1000000;
    const baseLLCFee = 35000;
    const extraMillionFee = 15000;
    const extraSharesFee = Math.max(0, Math.ceil((totalShares - 1000000) / 1000000)) * extraMillionFee;
    return baseLLCFee + extraSharesFee;
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <CircleDashed className="animate-spin h-28 w-28 text-primary" weight="bold" />
      </div>
    );
  }

  const STEPS = [
    "Company Details", "Articles", "Objects", "Officers", "Share Capital", 
    "PSC", "Compliance", "Uploads", "Preview"
  ];

  return (
    <div className="max-w-5xl mx-auto pb-16 pt-8 px-4 font-sans relative">
      
      {/* BEAUTIFUL GLOBAL ERROR BADGE */}
      {topError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[999999] w-[90%] max-w-md animate-in slide-in-from-top-8 fade-in duration-500">
          <div className="bg-destructive text-destructive-foreground px-5 py-3.5 rounded-2xl shadow-[0_10px_40px_rgba(220,38,38,0.3)] flex items-center justify-between gap-3 font-bold text-sm border-2 border-destructive/50 overflow-hidden relative">
            <div className="absolute bottom-0 left-0 h-1 bg-destructive-foreground/30 animate-[shrink_6s_linear_forwards]" style={{ width: '100%' }} />
            <div className="flex items-center gap-3 relative z-10">
              <WarningCircle weight="fill" className="h-6 w-6 shrink-0 text-destructive-foreground/80" />
              <span>{topError}</span>
            </div>
            <button 
              onClick={() => { setTopError(null); if (errorTimerRef.current) clearTimeout(errorTimerRef.current); }} 
              className="shrink-0 bg-destructive-foreground/10 hover:bg-destructive-foreground/20 rounded-full p-1.5 transition-colors relative z-10"
            >
              <X weight="bold" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header & Clickable Stepper */}
      <div className="mb-8 border-b border-border pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="w-full overflow-hidden">
          {/* UPDATED: Displays Tracking ID instead of CUID substring if available! */}
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5">
            Completing Application For {draft ? `• REF: ${draft.trackingId || draft.id?.substring(0, 8)}` : ""}
          </p>
          <h1 className="text-2xl font-black text-foreground mb-6 truncate pr-4">{draft?.proposedName || "Loading..."}</h1>
          
          <div ref={scrollContainerRef} className="flex gap-3 sm:gap-4 overflow-x-auto custom-scrollbar pb-3 w-full max-w-full snap-x scroll-smooth select-none">
            {STEPS.map((title, index) => {
              const stepNum = index + 1;
              const isUnlocked = stepNum <= highestStep;
              const isActive = currentStep === stepNum;
              
              return (
                <div 
                  key={stepNum} 
                  id={`nav-step-${stepNum}`}
                  onClick={() => {
                    if (isUnlocked && !isActive) {
                      setCurrentStep(stepNum);
                      setTopError(null);
                      setShowErrors(false);
                    }
                  }}
                  className={`flex items-center gap-2 whitespace-nowrap text-sm snap-start shrink-0 px-2 py-1 rounded-lg transition-colors ${
                    isActive ? "text-primary font-black bg-primary/10" : 
                    isUnlocked ? "text-foreground font-bold hover:bg-secondary cursor-pointer" : 
                    "text-muted-foreground font-medium opacity-60 cursor-not-allowed"
                  }`}
                >
                  <span className={`flex items-center justify-center h-6 w-6 rounded-md text-xs font-black transition-colors ${
                    isActive ? "bg-primary text-primary-foreground shadow-sm" : 
                    isUnlocked ? "bg-secondary border border-border text-foreground" : 
                    "bg-secondary/50 border border-border/50 text-muted-foreground/50"
                  }`}>
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
      <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden">
        
        {currentStep === 1 && <CompanyDetailsStep data={companyDetails} updateData={setCompanyDetails} draft={draft} showErrors={showErrors} />}
        {currentStep === 2 && <ArticlesStep data={companyDetails} updateData={setCompanyDetails} showErrors={showErrors} />}
        {currentStep === 3 && <MemorandumStep data={companyDetails} updateData={setCompanyDetails} />}
        {currentStep === 4 && <OfficersStep data={companyDetails} updateData={setCompanyDetails} showErrors={showErrors} />}
        {currentStep === 5 && <ShareCapitalStep data={companyDetails} updateData={setCompanyDetails} showErrors={showErrors} />}
        {currentStep === 6 && <PscStep data={companyDetails} updateData={setCompanyDetails} showErrors={showErrors} />}
        {currentStep === 7 && <ComplianceStep data={companyDetails} updateData={setCompanyDetails} showErrors={showErrors} />}
        {currentStep === 8 && <UploadsStep data={companyDetails} updateData={setCompanyDetails} showErrors={showErrors} />}
        {currentStep === 9 && (
          <PreviewStep 
            data={companyDetails} 
            draft={draft} 
            onSubmit={handleFinalSubmit} 
            isSubmitting={isSubmittingFinal} 
          />
        )}

        {/* Footer Navigation */}
        {currentStep < 9 && (
          <div className="bg-secondary/30 border-t border-border p-6 flex justify-between items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => { setCurrentStep(p => p - 1); setTopError(null); }} 
              disabled={currentStep === 1} 
              className="h-12 px-6 rounded-xl font-bold bg-background text-foreground border-border hover:bg-secondary shadow-sm cursor-pointer"
            >
              Back
            </Button>
            
            <Button 
              onClick={handleSaveAndNext} 
              className="h-12 px-8 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-md min-w-[160px] flex items-center justify-center gap-2 cursor-pointer"
            >
              Save & Continue
            </Button>
          </div>
        )}
      </div>

      {/* PAYMENT MODAL (RENDERED WHEN READY) */}
      {showPaymentModal && (
        <PaymentModal 
          registrationId={id} 
          proposedName={draft?.proposedName || ""} 
          totalAmount={calculateTotalFee()}
          onClose={() => setShowPaymentModal(false)} 
        />
      )}
    </div>
  );
}
