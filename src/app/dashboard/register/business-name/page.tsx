"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Storefront, CaretLeft, MagnifyingGlass, CheckCircle, 
  WarningCircle, XCircle, ArrowRight, User, Users, CaretDown, Check, LockKey
} from "@phosphor-icons/react";
import { CAC_CATEGORIES } from "@/lib/cac-categories";

// ==========================================
// REUSABLE SEARCHABLE DROPDOWN
// ==========================================
function SearchableDropdown({ 
  label, value, onChange, options, disabled, placeholder 
}: { 
  label: string; value: string; onChange: (val: string) => void; options: string[]; disabled?: boolean; placeholder: string; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery(value);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filteredOptions = options.filter(opt => opt.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</label>
      <div 
        className={`flex items-center w-full h-14 px-4 border-2 rounded-xl transition-colors cursor-text ${
          disabled ? "bg-slate-50 border-slate-200 opacity-60" : isOpen ? "bg-white border-[#ff3f7a] ring-2 ring-[#ff3f7a]/10" : "bg-white border-slate-200 hover:border-slate-300"
        }`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <input
          type="text"
          value={isOpen ? query : value}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (e.target.value !== value) onChange("");
          }}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-full font-bold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-medium bg-transparent disabled:cursor-not-allowed truncate pr-2"
        />
        <CaretDown className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} weight="bold" />
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-50 top-[76px] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_rgb(0,0,0,0.1)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="max-h-60 overflow-y-auto overscroll-contain py-2 scrollbar-thin scrollbar-thumb-slate-200">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = value === opt;
                return (
                  <li 
                    key={idx}
                    onClick={() => { onChange(opt); setQuery(opt); setIsOpen(false); }}
                    className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between group ${isSelected ? "bg-[#ff3f7a]/10" : "hover:bg-slate-50"}`}
                  >
                    <span className={`text-sm font-bold ${isSelected ? "text-[#ff3f7a]" : "text-slate-900 group-hover:text-[#ff3f7a]"}`}>{opt}</span>
                    {isSelected && <Check className="h-4 w-4 text-[#ff3f7a] shrink-0" weight="bold" />}
                  </li>
                )
              })
            ) : (
              <li className="px-4 py-6 text-center text-sm font-medium text-slate-500">No results found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default function BusinessNameRegistration() {
  const [step, setStep] = useState(1);

  // Step 1 State: Name Search
  const [proposedName, setProposedName] = useState("");
  const [altName1, setAltName1] = useState("");
  const [altName2, setAltName2] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [specificNature, setSpecificNature] = useState("");
  
  // Search & Modal State
  const [searchStatus, setSearchStatus] = useState<"IDLE" | "LOADING" | "PASSED" | "WARNING" | "BLOCKED" | "ACCEPTED">("IDLE");
  const [searchMessage, setSearchMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Step 2 State
  const [ownershipType, setOwnershipType] = useState<"SOLE" | "PARTNERSHIP" | null>(null);

  const categories = Object.keys(CAC_CATEGORIES).sort();
  const specificNatures = selectedCategory ? CAC_CATEGORIES[selectedCategory].sort() : [];

  // Frontend Validation: Must be at least 2 words
  const isSingleWord = proposedName.trim().length > 0 && proposedName.trim().split(/\s+/).length < 2;

  const handleNameSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSingleWord || !proposedName || !selectedCategory || !specificNature) return;

    setSearchStatus("LOADING");

    try {
      const res = await fetch("/api/cac/name-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          proposedName, 
          lineOfBusiness: specificNature, 
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
      setIsModalOpen(true); // Open the result modal
      
    } catch (error) {
      setSearchStatus("WARNING");
      setSearchMessage("Registry connection is currently slow. You may proceed, and our team will verify the name manually before final submission.");
      setIsModalOpen(true);
    }
  };

  const handleAcceptName = () => {
    setIsModalOpen(false);
    setSearchStatus("ACCEPTED");
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-in fade-in duration-500 relative">
      
      {/* Header */}
      <div className="mb-8 pt-2 flex items-center gap-4">
        <Link href="/dashboard/new" className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm transition-colors">
          <CaretLeft className="h-5 w-5" weight="bold" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Register Business Name</h1>
          <p className="text-sm font-medium text-slate-500">Step {step} of 4</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full mb-10 overflow-hidden">
        <div className="bg-[#ff3f7a] h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${(step / 4) * 100}%` }}></div>
      </div>

      {/* ========================================== */}
      {/* STEP 1: NAME SEARCH & ALTERNATIVES */}
      {/* ========================================== */}
      {step === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          
          <div className="flex items-center gap-3 sm:gap-4 mb-8">
            <div className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center ${searchStatus === "ACCEPTED" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
              {searchStatus === "ACCEPTED" ? <LockKey className="h-6 w-6" weight="fill" /> : <Storefront className="h-6 w-6" weight="fill" />}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                {searchStatus === "ACCEPTED" ? "Name Secured" : "Name Availability"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {searchStatus === "ACCEPTED" ? "Your primary name is locked in." : "Let's ensure your dream name isn't taken."}
              </p>
            </div>
          </div>

          {/* SEARCH FORM (Hidden once accepted) */}
          {searchStatus !== "ACCEPTED" && (
            <form onSubmit={handleNameSearch} className="space-y-6 animate-in fade-in">
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Proposed Business Name</label>
                <input 
                  type="text" 
                  value={proposedName}
                  onChange={(e) => setProposedName(e.target.value)}
                  placeholder="e.g. Peak Performance Logistics"
                  className={`w-full h-14 px-4 border-2 rounded-xl font-bold text-slate-900 outline-none transition-colors ${
                    isSingleWord ? "border-red-300 focus:border-red-500 focus:ring-red-500" : "border-slate-200 focus:border-[#ff3f7a] focus:ring-[#ff3f7a]"
                  }`}
                  required
                />
                {isSingleWord && (
                  <p className="text-xs font-bold text-red-500 mt-1">CAC requires a minimum of two words (e.g., "Peak Ventures").</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SearchableDropdown 
                  label="Business Category"
                  placeholder="Search category..."
                  value={selectedCategory}
                  options={categories}
                  onChange={(val) => { setSelectedCategory(val); setSpecificNature(""); }}
                />

                <SearchableDropdown 
                  label="Specific Nature"
                  placeholder={selectedCategory ? "Search nature..." : "Select category first"}
                  value={specificNature}
                  options={specificNatures}
                  disabled={!selectedCategory}
                  onChange={(val) => setSpecificNature(val)}
                />
              </div>

              <button 
                type="submit" 
                disabled={searchStatus === "LOADING" || !proposedName || isSingleWord || !selectedCategory || !specificNature}
                className="w-full h-14 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 mt-4"
              >
                {searchStatus === "LOADING" ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <><MagnifyingGlass className="h-5 w-5" weight="bold" /> Check Availability</>
                )}
              </button>
            </form>
          )}

          {/* ACCEPTED STATE: Show Alternative Names */}
          {searchStatus === "ACCEPTED" && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              
              {/* Read-Only Summary Box */}
              <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Primary Choice</p>
                  <p className="font-black text-slate-900 text-lg uppercase">{proposedName}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Category</p>
                  <p className="font-bold text-slate-700 text-sm">{specificNature}</p>
                </div>
              </div>

              <div className="mb-5">
                <h3 className="text-lg font-black text-slate-900">Alternative Names <span className="text-[#ff3f7a]">*</span></h3>
                <p className="text-sm text-slate-500 font-medium mt-1">If the CAC examiner rejects your primary name, they will automatically approve one of these to save you time. <strong className="text-slate-700">Highly Recommended.</strong></p>
              </div>

              <div className="space-y-4 mb-8">
                <input 
                  type="text" value={altName1} onChange={(e) => setAltName1(e.target.value)}
                  placeholder="Alternative Name 1 (Optional but recommended)"
                  className="w-full h-14 px-4 border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-[#ff3f7a] focus:ring-[#ff3f7a] outline-none transition-colors"
                />
                <input 
                  type="text" value={altName2} onChange={(e) => setAltName2(e.target.value)}
                  placeholder="Alternative Name 2 (Optional but recommended)"
                  className="w-full h-14 px-4 border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-[#ff3f7a] focus:ring-[#ff3f7a] outline-none transition-colors"
                />
              </div>

              <button 
                onClick={() => setStep(2)}
                className="w-full h-14 bg-[#ff3f7a] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#ff3f7a]/20 hover:bg-[#e02b62] transition-transform active:scale-95"
              >
                Proceed to Details <ArrowRight className="h-5 w-5" weight="bold" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* STEP 2: OWNERSHIP STRUCTURE DYNAMIC TOGGLE */}
      {/* ========================================== */}
      {step === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm animate-in slide-in-from-right-8">
          <div className="mb-8">
            <h2 className="text-xl font-black text-slate-900">Who owns this business?</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Select your ownership structure to generate the correct forms.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button 
              onClick={() => setOwnershipType("SOLE")}
              className={`p-6 rounded-2xl border-2 text-left transition-all ${
                ownershipType === "SOLE" ? "border-[#ff3f7a] bg-[#ff3f7a]/5 ring-4 ring-[#ff3f7a]/10" : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <User className={`h-8 w-8 mb-4 ${ownershipType === "SOLE" ? "text-[#ff3f7a]" : "text-slate-400"}`} weight={ownershipType === "SOLE" ? "fill" : "regular"} />
              <h3 className="font-bold text-slate-900 mb-1">Sole Proprietor</h3>
              <p className="text-xs text-slate-500 font-medium">I am the single, 100% owner of this business.</p>
            </button>

            <button 
              onClick={() => setOwnershipType("PARTNERSHIP")}
              className={`p-6 rounded-2xl border-2 text-left transition-all ${
                ownershipType === "PARTNERSHIP" ? "border-[#ff3f7a] bg-[#ff3f7a]/5 ring-4 ring-[#ff3f7a]/10" : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <Users className={`h-8 w-8 mb-4 ${ownershipType === "PARTNERSHIP" ? "text-[#ff3f7a]" : "text-slate-400"}`} weight={ownershipType === "PARTNERSHIP" ? "fill" : "regular"} />
              <h3 className="font-bold text-slate-900 mb-1">Partnership</h3>
              <p className="text-xs text-slate-500 font-medium">Two or more people co-own this business.</p>
            </button>
          </div>

          <div className="flex gap-4">
             <button onClick={() => setStep(1)} className="h-14 px-6 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Back</button>
             <button 
               disabled={!ownershipType}
               onClick={() => setStep(3)}
               className="flex-1 h-14 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
             >
               Proceed to Details <ArrowRight className="h-5 w-5" weight="bold" />
             </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* THE RESULT MODAL */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => searchStatus === "BLOCKED" && setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Dynamic Modal Content based on Status */}
            {searchStatus === "PASSED" && (
              <div className="p-8 text-center">
                <div className="mx-auto h-20 w-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="h-10 w-10" weight="fill" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Congratulations!</h3>
                <p className="text-slate-600 font-medium mb-8 leading-relaxed">
                  <span className="font-bold text-slate-900 uppercase">{proposedName}</span> looks available and ready to be registered.
                </p>
                <button 
                  onClick={handleAcceptName}
                  className="w-full h-14 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25"
                >
                  Proceed
                </button>
              </div>
            )}

            {searchStatus === "WARNING" && (
              <div className="p-8 text-center">
                <div className="mx-auto h-20 w-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
                  <WarningCircle className="h-10 w-10" weight="fill" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Suggestion</h3>
                <p className="text-slate-600 font-medium mb-8 leading-relaxed text-sm">
                  {searchMessage}
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleAcceptName}
                    className="w-full h-14 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25"
                  >
                    Use Anyway
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-full h-12 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    Change Name
                  </button>
                </div>
              </div>
            )}

            {searchStatus === "BLOCKED" && (
              <div className="p-8 text-center">
                <div className="mx-auto h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                  <XCircle className="h-10 w-10" weight="fill" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Name Unavailable</h3>
                <p className="text-slate-600 font-medium mb-8 leading-relaxed text-sm">
                  {searchMessage}
                </p>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-full h-14 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/25"
                >
                  Try Another Name
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
