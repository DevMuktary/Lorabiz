"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, WarningCircle, CheckCircle, X, CircleNotch, CircleDashed 
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { DESIGNATED_COMPANIES } from "@/lib/share-capital-data";

// Import all 8 LLC Steps (Skipping Preview/Payment)
import CompanyDetailsStep from "@/components/features/cac/register/llc/CompanyDetailsStep";
import ArticlesStep from "@/components/features/cac/register/llc/ArticlesStep";
import MemorandumStep from "@/components/features/cac/register/llc/MemorandumStep";
import OfficersStep from "@/components/features/cac/register/llc/OfficersStep";
import ShareCapitalStep from "@/components/features/cac/register/llc/ShareCapitalStep";
import PscStep from "@/components/features/cac/register/llc/PscStep";
import ComplianceStep from "@/components/features/cac/register/llc/ComplianceStep";
import UploadsStep from "@/components/features/cac/register/llc/UploadsStep";

export default function LlcQueryResolutionPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [highestStep, setHighestStep] = useState(1); 
  
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<any>(null);
  
  // UX STATES
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success">("idle");
  const [isAlreadyResolved, setIsAlreadyResolved] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);

  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
  // FETCH INITIAL DATA
  // ==========================================
  useEffect(() => {
    if (!id) return;
    
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/cac/register/llc/details/${id}`);
        const json = await res.json();
        
        if (json.success) {
          // LOCKOUT CHECK: If already resolved on another tab/device
          if (json.data.status !== "QUERIED") {
            setIsAlreadyResolved(true);
            setTimeout(() => router.push("/dashboard/cac/new-incorporation"), 3000);
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
      } catch (err) {
        console.error("Failed to load application details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();

    // BACKGROUND POLLING: Check every 5 seconds if someone else fixed it
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/cac/register/llc/details/${id}`);
        const json = await res.json();
        if (json.success && json.data.status !== "QUERIED") {
          setIsAlreadyResolved(true);
          setTimeout(() => router.push("/dashboard/cac/new-incorporation"), 3000);
        }
      } catch (err) {}
    }, 5000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  // ==========================================
  // AUTO-SCROLL HORIZONTAL STEPPER
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
  // ERROR BANNER MANAGER
  // ==========================================
  const triggerError = (message: string, anchorId?: string) => {
    setShowErrors(true);
    setTopError(message);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setTopError(null), 6000);

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
  const handleValidateStep = () => {
    setTopError(null);
    setShowErrors(true);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);

    const d = companyDetails;

    // STEP 1
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

    // STEP 2 
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
      if (age < 18) return triggerError("The witness must be at least 18 years old.", "field-w-dob");
      if (w.phone.replace(/\D/g, '').length < 5) return triggerError("Please provide a valid Witness Phone Number.", "field-w-phone");
    }

    // STEP 3 
    if (currentStep === 3 && d.memorandumObjects.length === 0) return triggerError("Please add at least one Object of Memorandum.");
    
    // STEP 4 
    if (currentStep === 4 && d.officers.filter(o => o.roles.includes("DIRECTOR")).length === 0) return triggerError("You must add at least one Director.");

    // STEP 5 
    if (currentStep === 5) {
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
      if (!classes.some((c: any) => c.type === "EQUITY (ORDINARY)")) return triggerError("You must add at least one EQUITY (ORDINARY) share class.");

      const totalRequiredUnits = classes.reduce((acc: number, c: any) => acc + (Number(c.units) || 0), 0);
      const allotments = sc.allotments || [];
      const totalAllotted = allotments.reduce((acc: number, a: any) => acc + (Number(a.units) || 0), 0);
      const remainingAllotmentUnits = totalRequiredUnits - totalAllotted;

      if (d.officers.filter((o: any) => o.roles.includes("SHAREHOLDER")).length === 0) return triggerError("You must add at least one Shareholder before assigning shares.");
      if (remainingAllotmentUnits > 0) return triggerError(`You must allot 100% of the created shares. You still have ${remainingAllotmentUnits.toLocaleString()} units unassigned.`);
      if (remainingAllotmentUnits < 0) return triggerError(`You have over-distributed your shares by ${Math.abs(remainingAllotmentUnits).toLocaleString()} units. Please correct the allotments.`);
    }

    // STEP 6
    if (currentStep === 6) {
        const incompletePsc = d.officers.filter(o => o.roles.includes("PSC")).find((p: any) => !p.pscDetails?.isPep || !p.pscDetails?.hasAffiliation);
        if (incompletePsc) return triggerError(`Please complete the details for PSC: ${incompletePsc.firstName} ${incompletePsc.surname}`);
    }

    // STEP 7
    if (currentStep === 7) {
        const dec = d.declarantDetails || {};
        if (!dec.surname || !dec.firstName || !dec.phone || !dec.email || !dec.state || !dec.lga || !dec.city || !dec.street) return triggerError("Please fill in all required fields for the Declarant.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dec.email)) return triggerError("Please provide a valid Declarant Email address.");
        if (dec.phone.replace(/\D/g, '').length < 5) return triggerError("Please provide a valid Declarant Phone Number.");
        if (!dec.isAcknowledged) return triggerError("You must acknowledge the Statement of Compliance to proceed.");
    }

    // STEP 8
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
        const errorText = missingDocs.length === 1 ? `Missing required upload: ${missingDocs[0]}` : `Missing required uploads: ${missingDocs[0]} (+${missingDocs.length - 1} more)`;
        return triggerError(errorText);
      }

      // If validation passes on Step 8, show the Confirm Submission Modal
      setShowConfirmModal(true);
      return;
    }
    
    // SUCCESS! Proceed to next step
    setShowErrors(false);
    const nextStepNum = currentStep + 1;
    setCurrentStep(nextStepNum);
    setHighestStep(prev => Math.max(prev, nextStepNum));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitResolution = async () => {
    setSubmitState("submitting");
    try {
      const saveRes = await fetch(`/api/cac/register/llc/details/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...companyDetails, headOfficeSameAsRegistered: false, isDraft: false })
      });

      if (!saveRes.ok) throw new Error("Failed to save changes");

      const resolveRes = await fetch(`/api/cac/register/llc/details/${id}/resolve`, { method: "POST" });
      if (!resolveRes.ok) throw new Error("Failed to clear query status");

      setSubmitState("success");
      
      setTimeout(() => { 
        setShowConfirmModal(false);
        router.push("/dashboard/cac/new-incorporation?success=true");
      }, 2500);

    } catch (error) {
      setSubmitState("idle");
      alert("Failed to submit resolution. Please check your connection and try again.");
    }
  };

  // MULTI-TAB LOCKOUT SCREEN
  if (isAlreadyResolved) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <CheckCircle className="h-28 w-28 text-emerald-500 mb-8" weight="fill" />
        <h2 className="text-3xl font-black text-foreground mb-3 text-center">Query Already Fixed</h2>
        <p className="text-muted-foreground font-medium text-lg text-center max-w-md">
          This query has already been resolved and submitted.
        </p>
        <p className="text-sm font-bold tracking-widest uppercase text-muted-foreground mt-8 animate-pulse">
          Redirecting to Dashboard...
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <CircleDashed className="animate-spin h-12 w-12 text-primary" weight="bold" />
      </div>
    );
  }

  const STEPS = ["Company", "Articles", "Objects", "Officers", "Capital", "PSC", "Compliance", "Uploads"];

  return (
    <div className="min-h-screen bg-background pb-20 font-sans relative">
      
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
              className="shrink-0 bg-destructive-foreground/10 hover:bg-destructive-foreground/20 rounded-full p-1.5 transition-colors relative z-10 cursor-pointer"
            >
              <X weight="bold" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* COMPACT HEADER */}
      <div className="bg-card border-b border-border px-4 py-3 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center">
          <button 
            onClick={() => router.push("/dashboard/cac/new-incorporation")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold transition-colors px-2 py-2 rounded-lg hover:bg-secondary -ml-2 cursor-pointer"
          >
            <ArrowLeft weight="bold" className="h-5 w-5" /> Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-6 space-y-6 animate-in fade-in duration-500">
        
        {/* COMPACT CAC QUERY ALERT */}
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row gap-4 sm:items-start shadow-sm">
          <div className="bg-amber-500/20 p-2 rounded-full shrink-0 w-fit">
            <WarningCircle className="h-6 w-6 text-amber-500" weight="fill" />
          </div>
          <div>
            <h2 className="text-sm font-black text-amber-500 mb-1">Official CAC Query Feedback</h2>
            <p className="text-amber-500/80 font-medium text-sm leading-relaxed mb-2">
              {draft?.queryReason || "No specific reason provided by CAC."}
            </p>
            <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest">
              Please review your details step-by-step and fix the issues raised above.
            </p>
          </div>
        </div>

        {/* STEPPER INDICATOR */}
        <div ref={scrollContainerRef} className="flex gap-3 sm:gap-4 overflow-x-auto custom-scrollbar pb-3 w-full max-w-full snap-x scroll-smooth select-none border-b border-border">
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

        {/* WIZARD MOUNTING AREA */}
        <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden">
          {currentStep === 1 && <CompanyDetailsStep data={companyDetails} updateData={setCompanyDetails} draft={draft} showErrors={showErrors} />}
          {currentStep === 2 && <ArticlesStep data={companyDetails} updateData={setCompanyDetails} showErrors={showErrors} />}
          {currentStep === 3 && <MemorandumStep data={companyDetails} updateData={setCompanyDetails} />}
          {currentStep === 4 && <OfficersStep data={companyDetails} updateData={setCompanyDetails} showErrors={showErrors} />}
          {currentStep === 5 && <ShareCapitalStep data={companyDetails} updateData={setCompanyDetails} showErrors={showErrors} />}
          {currentStep === 6 && <PscStep data={companyDetails} updateData={setCompanyDetails} showErrors={showErrors} />}
          {currentStep === 7 && <ComplianceStep data={companyDetails} updateData={setCompanyDetails} showErrors={showErrors} />}
          {currentStep === 8 && <UploadsStep data={companyDetails} updateData={setCompanyDetails} showErrors={showErrors} />}

          {/* WIZARD FOOTER NAVIGATION */}
          <div className="bg-secondary/30 border-t border-border p-4 sm:p-6 flex justify-between items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => { setCurrentStep(p => p - 1); setTopError(null); }} 
              disabled={currentStep === 1 || submitState !== "idle"} 
              className="h-12 px-4 sm:px-6 rounded-xl font-bold bg-background border-border text-foreground hover:bg-secondary shrink-0 text-sm sm:text-base cursor-pointer"
            >
              Back
            </Button>
            
            {currentStep < 8 ? (
               <Button 
                 onClick={handleValidateStep} 
                 className="h-12 px-6 sm:px-8 bg-primary text-primary-foreground hover:opacity-90 font-bold rounded-xl shadow-md shrink-0 text-sm sm:text-base cursor-pointer"
               >
                 Save & Continue
               </Button>
            ) : (
               <Button 
                  onClick={handleValidateStep}
                  disabled={submitState !== "idle"} 
                  className="h-12 px-5 sm:px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg flex items-center gap-1.5 sm:gap-2 transition-all active:scale-95 shrink-0 text-sm sm:text-base cursor-pointer"
                >
                 <CheckCircle weight="bold" className="h-5 w-5 hidden sm:block" /> 
                 Submit Resolution
               </Button>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION / SUCCESS MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-border">
            
            {submitState === "success" ? (
              // --- BEAUTIFUL SUCCESS UI ---
              <div className="p-8 text-center animate-in zoom-in-95 duration-300">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-500 mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-bounce">
                  <CheckCircle className="h-10 w-10 text-white" weight="bold" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-2 tracking-tight">Query Resolved!</h3>
                <p className="text-sm font-medium text-muted-foreground mb-8 leading-relaxed">
                  Your application updates have been submitted to the registry.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground animate-pulse">
                  <CircleNotch className="animate-spin h-4 w-4" weight="bold" /> Redirecting to dashboard...
                </div>
              </div>
            ) : (
              // --- STANDARD CONFIRMATION UI ---
              <div className="p-8 text-center relative">
                <button 
                  onClick={() => submitState === "idle" && setShowConfirmModal(false)}
                  disabled={submitState === "submitting"}
                  className="absolute top-5 right-5 p-2 text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <X weight="bold" size={16} />
                </button>
                
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-500/10 mb-6 border border-emerald-500/20">
                  <CheckCircle className="h-7 w-7 text-emerald-500" weight="fill" />
                </div>
                
                <h3 className="text-xl font-black text-foreground mb-2 tracking-tight">Submit Resolution?</h3>
                <p className="text-sm font-medium text-muted-foreground mb-8 px-2 leading-relaxed">
                  Are you absolutely sure you have resolved all the issues raised by the CAC? Submitting incomplete fixes may lead to further delays.
                </p>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowConfirmModal(false)}
                    disabled={submitState === "submitting"}
                    className="flex-1 h-12 rounded-xl font-bold border-border text-foreground bg-background hover:bg-secondary cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitResolution}
                    disabled={submitState === "submitting"}
                    className="flex-1 h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_4px_14px_rgba(5,150,105,0.3)] flex items-center justify-center cursor-pointer"
                  >
                    {submitState === "submitting" ? <CircleNotch className="animate-spin h-5 w-5" weight="bold" /> : "Yes, Submit"}
                  </Button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
}
