"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Storefront, CaretLeft, MagnifyingGlass, CheckCircle, 
  WarningCircle, XCircle, ArrowRight, User, Users
} from "@phosphor-icons/react";

export default function BusinessNameRegistration() {
  const [step, setStep] = useState(1);

  // Step 1 State: Name Search
  const [proposedName, setProposedName] = useState("");
  const [lineOfBusiness, setLineOfBusiness] = useState("");
  const [altName1, setAltName1] = useState("");
  const [altName2, setAltName2] = useState("");
  
  // Search Status: 'IDLE' | 'LOADING' | 'PASSED' | 'WARNING' | 'BLOCKED'
  const [searchStatus, setSearchStatus] = useState("IDLE");
  const [searchMessage, setSearchMessage] = useState("");

  // Step 2 State: Ownership Structure
  const [ownershipType, setOwnershipType] = useState<"SOLE" | "PARTNERSHIP" | null>(null);

  const handleNameSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedName || !lineOfBusiness) return;

    setSearchStatus("LOADING");

    try {
      // Calls the exact backend API you provided earlier
      const res = await fetch("/api/cac/name-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          proposedName, 
          lineOfBusiness, 
          entityType: "Business Name", 
          mode: "CHECK" 
        }),
      });

      const data = await res.json();

      if (data.isBlocked) {
        setSearchStatus("BLOCKED");
        setSearchMessage(data.reasonMessage);
      } else if (data.warningMessage) {
        setSearchStatus("WARNING");
        setSearchMessage(data.warningMessage);
      } else {
        setSearchStatus("PASSED");
        setSearchMessage("Great news! This name is available and ready for registration.");
      }
    } catch (error) {
      // Graceful Degradation: If the API crashes, let them proceed with a warning.
      setSearchStatus("WARNING");
      setSearchMessage("Registry connection is currently slow. You may proceed, and our team will verify the name manually before final submission.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-8 pt-2 flex items-center gap-4">
        <Link 
          href="/dashboard/new" 
          className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm transition-colors"
        >
          <CaretLeft className="h-5 w-5" weight="bold" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Register Business Name</h1>
          <p className="text-sm font-medium text-slate-500">Step {step} of 4</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full mb-10 overflow-hidden">
        <div 
          className="bg-[#ff3f7a] h-full rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${(step / 4) * 100}%` }}
        ></div>
      </div>

      {/* ========================================== */}
      {/* STEP 1: NAME SEARCH & ALTERNATIVES           */}
      {/* ========================================== */}
      {step === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Storefront className="h-6 w-6" weight="fill" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Name Availability</h2>
              <p className="text-sm text-slate-500 font-medium">Let's ensure your dream name isn't taken.</p>
            </div>
          </div>

          <form onSubmit={handleNameSearch} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Proposed Business Name</label>
              <input 
                type="text" 
                value={proposedName}
                onChange={(e) => { setProposedName(e.target.value); setSearchStatus("IDLE"); }}
                placeholder="e.g. Peak Performance Logistics"
                className="w-full h-14 px-4 border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-[#ff3f7a] focus:ring-[#ff3f7a] outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nature of Business</label>
              <select 
                value={lineOfBusiness}
                onChange={(e) => { setLineOfBusiness(e.target.value); setSearchStatus("IDLE"); }}
                className="w-full h-14 px-4 border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-[#ff3f7a] outline-none bg-white transition-colors"
                required
              >
                <option value="" disabled>Select the closest industry...</option>
                <option value="Information Technology">Information Technology</option>
                <option value="General Contracts">General Contracts & Merchandise</option>
                <option value="Agriculture">Agriculture & Farming</option>
                <option value="Fashion">Fashion & Tailoring</option>
                <option value="Consulting">Consulting Services</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={searchStatus === "LOADING" || !proposedName || !lineOfBusiness}
              className="w-full h-14 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {searchStatus === "LOADING" ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <><MagnifyingGlass className="h-5 w-5" weight="bold" /> Search Name for Free</>
              )}
            </button>
          </form>

          {/* DYNAMIC RESULT BANNERS */}
          {searchStatus === "BLOCKED" && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
              <XCircle className="h-6 w-6 text-red-500 shrink-0" weight="fill" />
              <div>
                <h4 className="font-bold text-red-900">Name Unavailable</h4>
                <p className="text-sm text-red-700 mt-0.5">{searchMessage}</p>
              </div>
            </div>
          )}

          {searchStatus === "WARNING" && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
              <WarningCircle className="h-6 w-6 text-amber-500 shrink-0" weight="fill" />
              <div>
                <h4 className="font-bold text-amber-900">Proceed with Caution</h4>
                <p className="text-sm text-amber-800 mt-0.5 leading-relaxed">{searchMessage}</p>
              </div>
            </div>
          )}

          {searchStatus === "PASSED" && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
              <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" weight="fill" />
              <p className="text-sm font-bold text-emerald-900">{searchMessage}</p>
            </div>
          )}

          {/* ALTERNATIVE NAMES (Only shows if PASSED or WARNING) */}
          {(searchStatus === "PASSED" || searchStatus === "WARNING") && (
            <div className="mt-8 pt-8 border-t border-slate-100 animate-in fade-in">
              <div className="mb-5">
                <h3 className="text-sm font-bold text-slate-900">Add Alternative Names (Highly Recommended)</h3>
                <p className="text-xs text-slate-500 mt-1">If the CAC examiner rejects your primary name, they will automatically approve one of these to save you time.</p>
              </div>

              <div className="space-y-4">
                <input 
                  type="text" value={altName1} onChange={(e) => setAltName1(e.target.value)}
                  placeholder="Alternative Name 1 (Optional)"
                  className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-slate-400 outline-none"
                />
                <input 
                  type="text" value={altName2} onChange={(e) => setAltName2(e.target.value)}
                  placeholder="Alternative Name 2 (Optional)"
                  className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-slate-400 outline-none"
                />
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full h-14 mt-8 bg-[#ff3f7a] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#ff3f7a]/20 hover:bg-[#e02b62] transition-transform active:scale-95"
              >
                Save & Continue <ArrowRight className="h-5 w-5" weight="bold" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* STEP 2: OWNERSHIP STRUCTURE DYNAMIC TOGGLE   */}
      {/* ========================================== */}
      {step === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in slide-in-from-right-8">
          <div className="mb-8">
            <h2 className="text-xl font-black text-slate-900">Who owns this business?</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Select your ownership structure to generate the correct forms.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {/* Sole Proprietor Card */}
            <button 
              onClick={() => setOwnershipType("SOLE")}
              className={`p-6 rounded-2xl border-2 text-left transition-all ${
                ownershipType === "SOLE" 
                  ? "border-[#ff3f7a] bg-[#ff3f7a]/5 ring-4 ring-[#ff3f7a]/10" 
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <User className={`h-8 w-8 mb-4 ${ownershipType === "SOLE" ? "text-[#ff3f7a]" : "text-slate-400"}`} weight={ownershipType === "SOLE" ? "fill" : "regular"} />
              <h3 className="font-bold text-slate-900 mb-1">Sole Proprietor</h3>
              <p className="text-xs text-slate-500 font-medium">I am the single, 100% owner of this business.</p>
            </button>

            {/* Partnership Card */}
            <button 
              onClick={() => setOwnershipType("PARTNERSHIP")}
              className={`p-6 rounded-2xl border-2 text-left transition-all ${
                ownershipType === "PARTNERSHIP" 
                  ? "border-[#ff3f7a] bg-[#ff3f7a]/5 ring-4 ring-[#ff3f7a]/10" 
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <Users className={`h-8 w-8 mb-4 ${ownershipType === "PARTNERSHIP" ? "text-[#ff3f7a]" : "text-slate-400"}`} weight={ownershipType === "PARTNERSHIP" ? "fill" : "regular"} />
              <h3 className="font-bold text-slate-900 mb-1">Partnership</h3>
              <p className="text-xs text-slate-500 font-medium">Two or more people co-own this business.</p>
            </button>
          </div>

          <div className="flex gap-4">
             <button onClick={() => setStep(1)} className="h-14 px-6 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
               Back
             </button>
             <button 
               disabled={!ownershipType}
               onClick={() => setStep(3)} // This will go to the dynamic form
               className="flex-1 h-14 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
             >
               Proceed to Details <ArrowRight className="h-5 w-5" weight="bold" />
             </button>
          </div>
        </div>
      )}

    </div>
  );
}
