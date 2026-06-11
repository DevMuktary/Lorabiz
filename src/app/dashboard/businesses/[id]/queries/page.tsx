"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, WarningCircle, CheckCircle, Info, Spinner, X, CircleNotch 
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function QueryResolutionPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/register/details/${id}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Failed to load application details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleSubmitResolution = async () => {
    setIsSubmitting(true);
    try {
      // Typically, you would make a PUT request to your API here to update the status to "PENDING"
      // await fetch(`/api/register/details/${id}/resolve`, { method: "POST" });
      
      setTimeout(() => { // Simulated delay for realism
        setIsSubmitting(false);
        setShowConfirmModal(false);
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      setIsSubmitting(false);
      alert("Failed to submit resolution. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner className="animate-spin h-10 w-10 text-[#ff3f7a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors px-2 py-2 rounded-lg hover:bg-slate-100 -ml-2"
          >
            <ArrowLeft weight="bold" className="h-5 w-5" /> Back
          </button>
          <div className="bg-amber-100 text-amber-800 border border-amber-200 px-4 py-1.5 rounded-full flex items-center gap-2 text-xs font-black uppercase tracking-widest">
            <WarningCircle weight="bold" className="h-4 w-4" /> Query Mode Active
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 mt-8 space-y-8 animate-in fade-in duration-500">
        
        {/* THE QUERY BANNER */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl shadow-sm relative overflow-hidden">
          <WarningCircle className="absolute -right-6 -top-6 h-32 w-32 text-amber-500/10" weight="fill" />
          <h2 className="text-xl font-black text-amber-900 mb-2 flex items-center gap-2">
            <Info weight="fill" className="text-amber-500" /> Action Required
          </h2>
          <p className="text-amber-800 font-medium text-sm leading-relaxed max-w-2xl">
            This application has been queried by the CAC. Please review the official feedback below and update your application details accordingly. Ensure you resolve all highlighted issues before submitting.
          </p>
          <div className="mt-4 bg-white/60 p-4 rounded-xl border border-amber-200">
            <p className="text-[10px] font-black text-amber-700/60 uppercase tracking-widest mb-1">CAC Feedback</p>
            <p className="text-amber-900 font-bold text-sm">
              {data?.queryReason || "Names closely resemble an existing entity. Please provide new alternative names."}
            </p>
          </div>
        </div>

        {/* MOCK FORM AREA (This will eventually wrap your actual registration form components) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm opacity-60 pointer-events-none">
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <p className="text-slate-500 font-bold text-center">
              [ Your Standard Registration Form Components Render Here ]<br/>
              <span className="text-xs font-normal">Users will edit their data exactly like they did when applying.</span>
            </p>
          </div>
        </div>

        {/* ACTION FOOTER */}
        <div className="flex justify-end pt-4 border-t border-slate-200">
          <Button 
            onClick={() => setShowConfirmModal(true)}
            className="h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-transform active:scale-95"
          >
            <CheckCircle weight="bold" className="h-6 w-6" /> Complete & Submit Resolution
          </Button>
        </div>

      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center relative">
              <button 
                onClick={() => !isSubmitting && setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X weight="bold" />
              </button>
              
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6 mt-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" weight="fill" />
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-2">Submit Resolution?</h3>
              <p className="text-sm font-medium text-slate-500 mb-8 px-2">
                Are you absolutely sure you have resolved all the issues raised by the CAC? Submitting incomplete fixes may lead to further delays.
              </p>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitResolution}
                  disabled={isSubmitting}
                  className="flex-1 h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center"
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
