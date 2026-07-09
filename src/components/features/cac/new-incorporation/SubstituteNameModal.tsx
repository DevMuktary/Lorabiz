"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, TextAa, WarningCircle, CheckCircle, Spinner } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SubstituteNameModal({ reg, onClose }: { reg: any, onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    proposedName: reg.proposedName || "",
    altName1: reg.altName1 || "",
    altName2: reg.altName2 || ""
  });

  const validateNames = () => {
    // SECURITY: Prevent Business Names from using LTD/LLC suffixes
    if (reg._appType === "BUSINESS_NAME") {
      const restricted = /limited|ltd|plc|inc|incorporated|llc/i;
      if (restricted.test(formData.proposedName) || restricted.test(formData.altName1) || restricted.test(formData.altName2)) {
        return "Business Names cannot contain Limited, Ltd, Plc, Inc, or LLC. If you need a company, please register an LLC.";
      }
    }
    if (!formData.proposedName) return "Proposed name is required.";
    return null;
  };

  const handlePaymentAndSubmit = async () => {
    const validationError = validateNames();
    if (validationError) return setError(validationError);

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/cac/substitute-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reg.id,
          type: reg._appType,
          ...formData
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.message || "Failed to process substitution. Ensure you have ₦5,000 in your wallet.");
      }
    } catch (e) {
      setError("A network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveQuery = async () => {
    setLoading(true);
    try {
      await fetch("/api/cac/submit-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reg.id, type: reg._appType })
      });
      window.location.reload(); // Refresh dashboard to show PENDING state
    } catch (e) {
      setError("Failed to submit query.");
      setLoading(false);
    }
  };

  const handleContinueEditing = () => {
    if (reg._appType === "LLC") {
      router.push(`/dashboard/cac/register/llc/details/${reg.id}`);
    } else {
      router.push(`/dashboard/cac/register/business-name/details/${reg.id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 relative">
        {!success && (
          <button onClick={onClose} disabled={loading} className="absolute top-4 right-4 p-2 bg-secondary text-muted-foreground rounded-full hover:text-foreground transition-colors disabled:opacity-50">
            <X weight="bold" />
          </button>
        )}

        {success ? (
          <div className="text-center py-4">
            <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-emerald-500/5">
              <CheckCircle weight="fill" className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">Names Substituted!</h3>
            <p className="text-sm text-muted-foreground font-medium mb-8">
              Your new names have been saved. Is your query fully resolved, or do you still need to edit other details (like addresses or IDs)?
            </p>
            
            <div className="flex flex-col gap-3">
              <button onClick={handleResolveQuery} disabled={loading} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center shadow-lg shadow-emerald-500/20">
                {loading ? <Spinner className="animate-spin h-5 w-5" /> : "Yes, Submit Query Now"}
              </button>
              <button onClick={handleContinueEditing} disabled={loading} className="w-full h-14 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/80 transition-colors">
                No, Continue Editing
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <TextAa weight="fill" className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground">Substitute Name</h3>
                <p className="text-sm font-medium text-muted-foreground">Substitution Fee: <span className="font-bold text-foreground">₦5,000</span></p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-3 rounded-lg mb-6 flex items-start gap-2">
                <WarningCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div className="space-y-2">
                <Label>New Proposed Name *</Label>
                <Input value={formData.proposedName} onChange={e => {setFormData({...formData, proposedName: e.target.value}); setError(null);}} placeholder="Enter exact new name" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Alternative Name 1</Label>
                <Input value={formData.altName1} onChange={e => {setFormData({...formData, altName1: e.target.value}); setError(null);}} placeholder="Optional" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label>Alternative Name 2</Label>
                <Input value={formData.altName2} onChange={e => {setFormData({...formData, altName2: e.target.value}); setError(null);}} placeholder="Optional" className="h-12" />
              </div>
            </div>

            <button onClick={handlePaymentAndSubmit} disabled={loading} className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center">
              {loading ? <Spinner className="animate-spin h-5 w-5" /> : "Pay ₦5,000 & Update Names"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
