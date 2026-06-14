"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, WarningCircle, CheckCircle, X, CircleNotch, CircleDashed 
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// Import existing registration steps
import CompanyStep from "@/components/dashboard/register/biz-name/CompanyStep";
import ProprietorStep from "@/components/dashboard/register/biz-name/ProprietorStep";
import DocumentStep from "@/components/dashboard/register/biz-name/DocumentStep";

import { CompanyInfo, Proprietor } from "@/components/dashboard/register/biz-name/schema";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Wizard State (1: Company, 2: Proprietors, 3: Documents)
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (!id) return;
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/register/details/${id}`);
        const json = await res.json();
        
        if (json.success) {
          setData(json.data);
          
          // Hydrate Company Info
          setCompanyInfo({
            email: json.data.companyEmail || "", 
            state: json.data.companyState || "", 
            city: json.data.companyCity || "", 
            streetNo: json.data.companyStreetNo || "", 
            address: json.data.companyAddress || "", 
            commencementDate: json.data.commencementDate || ""
          });

          // Hydrate Proprietor Info
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
  }, [id]);

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitResolution = async () => {
    setIsSubmitting(true);
    try {
      // 1. Save all the updated fields first
      const saveRes = await fetch(`/api/register/details/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyInfo, proprietors, isDraft: true })
      });

      if (!saveRes.ok) throw new Error("Failed to save changes");

      // 2. TODO: Call your backend to officially update the status to "PENDING"
      // await fetch(`/api/register/details/${id}/resolve-query`, { method: "POST" });
      
      setTimeout(() => { 
        setIsSubmitting(false);
        setShowConfirmModal(false);
        router.push("/dashboard");
      }, 1500);

    } catch (error) {
      setIsSubmitting(false);
      alert("Failed to submit resolution. Please check your connection and try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-slate-50">
        <CircleDashed className="animate-spin h-12 w-12 text-[#ff3f7a]" weight="bold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* COMPACT HEADER */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center">
          <button 
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors px-2 py-2 rounded-lg hover:bg-slate-50 -ml-2"
          >
            <ArrowLeft weight="bold" className="h-5 w-5" /> Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 mt-6 space-y-6 animate-in fade-in duration-500">
        
        {/* COMPACT CAC QUERY ALERT */}
        <div className="bg-amber-50 border border-amber-200 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row gap-4 sm:items-start shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="bg-amber-100 p-2 rounded-full shrink-0 w-fit">
            <WarningCircle className="h-6 w-6 text-amber-600" weight="fill" />
          </div>
          <div>
            <h2 className="text-sm font-black text-amber-900 mb-1">Official CAC Query Feedback</h2>
            <p className="text-amber-800 font-medium text-sm leading-relaxed mb-2">
              {data?.queryReason || "No specific reason provided by CAC."}
            </p>
            <p className="text-[10px] font-black text-amber-700/60 uppercase tracking-widest">
              Please review your details step-by-step and fix the issues raised above.
            </p>
          </div>
        </div>

        {/* STEPPER INDICATOR */}
        <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-2 w-full">
          {[ 
            { step: 1, title: "Company Information" }, 
            { step: 2, title: "Proprietor Information" }, 
            { step: 3, title: "Document Uploads" }
          ].map((s) => (
            <div key={s.step} className={`flex items-center gap-2 whitespace-nowrap text-sm ${currentStep === s.step ? "text-[#ff3f7a] font-black" : currentStep > s.step ? "text-slate-800 font-bold" : "text-slate-400 font-medium"}`}>
              <span className={`flex items-center justify-center h-6 w-6 rounded-md text-xs font-bold ${currentStep === s.step ? "bg-[#ff3f7a] text-white" : currentStep > s.step ? "bg-slate-200 text-slate-800" : "bg-slate-100"}`}>
                {s.step}
              </span>
              {s.title}
            </div>
          ))}
        </div>

        {/* WIZARD MOUNTING AREA */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {currentStep === 1 && <CompanyStep draft={data} companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />}
          {currentStep === 2 && <ProprietorStep proprietors={proprietors} setProprietors={setProprietors} isSoleProprietor={data?.ownershipType === "SOLE"} />}
          {currentStep === 3 && <DocumentStep proprietors={proprietors} setProprietors={setProprietors} />}

          {/* WIZARD FOOTER NAVIGATION */}
          <div className="bg-slate-50 border-t border-slate-200 p-6 flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(p => p - 1)} 
              disabled={currentStep === 1 || isSubmitting} 
              className="h-12 px-6 rounded-xl font-bold bg-white"
            >
              Back
            </Button>
            
            {currentStep < 3 ? (
               <Button onClick={handleNextStep} className="h-12 px-8 bg-[#ff3f7a] text-white font-bold rounded-xl shadow-md hover:bg-[#e02b62]">
                 Continue to Next Step
               </Button>
            ) : (
               <Button 
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isSubmitting} 
                  className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
                >
                 <CheckCircle weight="bold" className="h-5 w-5" /> Complete & Submit Resolution
               </Button>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_20px_60px_rgb(0,0,0,0.1)] animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-8 text-center relative">
              <button 
                onClick={() => !isSubmitting && setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X weight="bold" size={16} />
              </button>
              
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 mb-6 border border-emerald-100">
                <CheckCircle className="h-7 w-7 text-emerald-500" weight="fill" />
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Submit Resolution?</h3>
              <p className="text-sm font-medium text-slate-500 mb-8 px-2 leading-relaxed">
                Are you absolutely sure you have resolved all the issues raised by the CAC? Submitting incomplete fixes may lead to further delays.
              </p>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitResolution}
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_4px_14px_rgba(5,150,105,0.3)] flex items-center justify-center"
                >
                  {isSubmitting ? <CircleNotch className="animate-spin h-5 w-5" weight="bold" /> : "Yes, Submit"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
