"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircleNotch, CircleDashed } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// Step Components
import CompanyDetailsStep from "@/components/dashboard/register/llc/CompanyDetailsStep";
// import ArticlesStep from "@/components/dashboard/register/llc/ArticlesStep";
// ... we will import the rest as we build them

export default function LlcRegistrationDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [draft, setDraft] = useState<any>(null);

  // Form State Payloads
  const [companyDetails, setCompanyDetails] = useState({
    email: "", principalActivity: "", specificActivity: "", description: "",
    registeredAddress: { state: "", lga: "", city: "", postCode: "", houseNo: "", street: "" },
    headOfficeSameAsRegistered: true,
    headOfficeAddress: { state: "", lga: "", city: "", postCode: "", houseNo: "", street: "" }
  });

  // Fetch initial data
  useEffect(() => {
    if (!id) return;
    fetch(`/api/register/llc/details/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          if (json.data.status !== "UNSUBMITTED" && json.data.status !== "QUERIED") {
            router.push("/dashboard"); // Lockout if already paid
            return;
          }
          setDraft(json.data);
          
          // Hydrate state if data exists
          if (json.data.email) {
            setCompanyDetails(prev => ({
              ...prev,
              email: json.data.email,
              principalActivity: json.data.principalActivity || "",
              specificActivity: json.data.specificActivity || "",
              description: json.data.description || "",
              registeredAddress: json.data.registeredAddress || prev.registeredAddress,
              headOfficeSameAsRegistered: json.data.headOfficeAddress ? false : true,
              headOfficeAddress: json.data.headOfficeAddress || prev.headOfficeAddress
            }));
          }
        }
        setLoading(false);
      });
  }, [id, router]);

  const handleNextStep = () => {
    // TODO: Add step-specific validation here before allowing them to proceed
    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      
      {/* Header & Stepper */}
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 mb-6">{draft?.proposedName || "Loading..."}</h1>
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 w-full">
          {STEPS.map((title, index) => {
            const stepNum = index + 1;
            return (
              <div key={stepNum} className={`flex items-center gap-2 whitespace-nowrap text-sm ${currentStep === stepNum ? "text-indigo-600 font-black" : currentStep > stepNum ? "text-slate-800 font-bold" : "text-slate-400 font-medium"}`}>
                <span className={`flex items-center justify-center h-6 w-6 rounded-md text-xs font-bold ${currentStep === stepNum ? "bg-indigo-600 text-white" : currentStep > stepNum ? "bg-slate-200 text-slate-800" : "bg-slate-100"}`}>
                  {stepNum}
                </span>
                {title}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Form Mounting */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {currentStep === 1 && <CompanyDetailsStep data={companyDetails} updateData={setCompanyDetails} draft={draft} />}
        {/* We will mount the other steps here as we build them */}
        {currentStep > 1 && (
           <div className="p-10 text-center text-slate-500 font-bold">Step {currentStep} Component Pending...</div>
        )}

        {/* Footer Navigation */}
        <div className="bg-slate-50 border-t border-slate-200 p-6 flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(p => p - 1)} disabled={currentStep === 1} className="h-12 px-6 rounded-xl font-bold bg-white text-slate-600">
            Back
          </Button>
          
          <Button onClick={handleNextStep} className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md">
            Save & Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
