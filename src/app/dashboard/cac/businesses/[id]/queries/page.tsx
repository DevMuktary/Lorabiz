"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, WarningCircle, CheckCircle, X, CircleNotch, CircleDashed 
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// Import existing registration steps
import CompanyStep from "@/components/features/cac/register/biz-name/CompanyStep";
import ProprietorStep from "@/components/features/cac/register/biz-name/ProprietorStep";
import DocumentStep from "@/components/features/cac/register/biz-name/DocumentStep";

import { CompanyInfo, Proprietor } from "@/components/features/cac/register/biz-name/schema";

export default function QueryResolutionPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  // Core Data States
  const [data, setData] = useState<any>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({ email: "", state: "", city: "", streetNo: "", address: "", commencementDate: "" });
  const [proprietors, setProprietors] = useState<Proprietor[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success">("idle");
  const [isAlreadyResolved, setIsAlreadyResolved] = useState(false);
  
  // Wizard State (1: Company, 2: Proprietors, 3: Documents)
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!id) return;
    
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/cac/register/business-name/details/${id}`);
        const json = await res.json();
        
        if (json.success) {
          if (json.data.status !== "QUERIED") {
            setIsAlreadyResolved(true);
            setTimeout(() => router.push("/dashboard/cac/new-incorporation"), 3000);
            setLoading(false);
            return;
          }

          setData(json.data);
          
          setCompanyInfo({
            email: json.data.companyEmail || "", 
            state: json.data.companyState || "", 
            city: json.data.companyCity || "", 
            streetNo: json.data.companyStreetNo || "", 
            address: json.data.companyAddress || "", 
            commencementDate: json.data.commencementDate || ""
          });

          if (json.data.proprietors?.length > 0) {
            setProprietors(json.data.proprietors.map((p: any) => ({
              ...p, 
              documents: { 
                nin: p.ninUrl || null, 
                passport: p.passportUrl || null, 
                signature: p.signatureUrl || null 
              }
            })));
          }
        }
      } catch (err) {
        console.error("Failed to load application details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/cac/register/business-name/details/${id}`);
        const json = await res.json();
        if (json.success && json.data.status !== "QUERIED") {
          setIsAlreadyResolved(true);
          setTimeout(() => router.push("/dashboard/cac/new-incorporation"), 3000);
        }
      } catch (err) {}
    }, 5000);

    return () => clearInterval(interval);
  }, [id, router]);

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitResolution = async () => {
    setSubmitState("submitting");
    try {
      const saveRes = await fetch(`/api/cac/register/business-name/details/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyInfo, proprietors, isDraft: false })
      });

      if (!saveRes.ok) throw new Error("Failed to save changes");

      const resolveRes = await fetch(`/api/cac/register/business-name/details/${id}/resolve`, { method: "POST" });
      
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

  return (
    <div className="min-h-screen bg-background pb-20 font-sans">
      
      {/* COMPACT HEADER */}
      <div className="bg-card border-b border-border px-4 py-3 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center">
          <button 
            onClick={() => router.push("/dashboard/cac/new-incorporation")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold transition-colors px-2 py-2 rounded-lg hover:bg-secondary -ml-2 cursor-pointer"
          >
            <ArrowLeft weight="bold" className="h-5 w-5" /> Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 mt-6 space-y-6 animate-in fade-in duration-500">
        
        {/* VIBRANT CAC QUERY ALERT (Dark Mode Safe) */}
        <div className="bg-amber-500/10 border-2 border-amber-500/30 p-5 sm:p-6 rounded-3xl flex flex-col sm:flex-row gap-4 sm:items-start shadow-md">
          <div className="bg-amber-500 text-white p-3 rounded-2xl shrink-0 shadow-sm self-start">
            <WarningCircle className="h-7 w-7" weight="fill" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md">Official CAC Feedback</span>
              <span className="text-xs font-bold text-muted-foreground">Action Required</span>
            </div>
            <p className="text-amber-950 dark:text-amber-200 font-extrabold text-base sm:text-lg leading-relaxed pt-1">
              {data?.queryReason || "No specific reason provided by CAC. Please review your application step-by-step."}
            </p>
            <p className="text-xs font-semibold text-amber-800/80 dark:text-amber-300/80 pt-2">
              Please review your details step-by-step and fix the issues raised above.
            </p>
          </div>
        </div>

        {/* STEPPER INDICATOR */}
        <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-2 w-full border-b border-border">
          {[ 
            { step: 1, title: "Company Information" }, 
            { step: 2, title: "Proprietor Information" }, 
            { step: 3, title: "Document Uploads" }
          ].map((s) => {
             const isActive = currentStep === s.step;
             const isCompleted = currentStep > s.step;
             return (
              <div key={s.step} className={`flex items-center gap-2 whitespace-nowrap text-sm px-2 py-1 rounded-lg transition-colors ${
                isActive ? "text-primary font-black bg-primary/10" : 
                isCompleted ? "text-foreground font-bold hover:bg-secondary cursor-pointer" : 
                "text-muted-foreground font-medium opacity-60 cursor-not-allowed"
              }`}>
                <span className={`flex items-center justify-center h-6 w-6 rounded-md text-xs font-bold transition-colors ${
                  isActive ? "bg-primary text-primary-foreground shadow-sm" : 
                  isCompleted ? "bg-secondary border border-border text-foreground" : 
                  "bg-secondary/50 border border-border/50 text-muted-foreground/50"
                }`}>
                  {s.step}
                </span>
                {s.title}
              </div>
            )
          })}
        </div>

        {/* WIZARD MOUNTING AREA */}
        <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden">
          {currentStep === 1 && <CompanyStep draft={data} companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />}
          {currentStep === 2 && <ProprietorStep proprietors={proprietors} setProprietors={setProprietors} isSoleProprietor={data?.ownershipType === "SOLE"} />}
          {currentStep === 3 && <DocumentStep proprietors={proprietors} setProprietors={setProprietors} />}

          {/* WIZARD FOOTER NAVIGATION */}
          <div className="bg-secondary/30 border-t border-border p-4 sm:p-6 flex justify-between items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(p => p - 1)} 
              disabled={currentStep === 1 || submitState !== "idle"} 
              className="h-12 px-4 sm:px-6 rounded-xl font-bold bg-background border-border text-foreground hover:bg-secondary shrink-0 text-sm sm:text-base cursor-pointer"
            >
              Back
            </Button>
            
            {currentStep < 3 ? (
               <Button 
                 onClick={handleNextStep} 
                 className="h-12 px-6 sm:px-8 bg-primary text-primary-foreground hover:opacity-90 font-bold rounded-xl shadow-md shrink-0 text-sm sm:text-base cursor-pointer"
               >
                 Save & Continue
               </Button>
            ) : (
               <Button 
                  onClick={() => setShowConfirmModal(true)}
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
