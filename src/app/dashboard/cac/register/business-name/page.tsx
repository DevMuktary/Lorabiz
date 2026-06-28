"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Storefront, CaretLeft, MagnifyingGlass, CheckCircle, 
  WarningCircle, XCircle, ArrowRight, User, Users, CaretDown, Check, Sparkle, PencilSimple
} from "@phosphor-icons/react";
import { CAC_CATEGORIES } from "@/lib/cac-categories";
import { AiCategoryAssistant } from "@/components/AiCategoryAssistant";

// ==========================================
// SEARCHABLE DROPDOWN COMPONENT
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
      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</label>
      <div 
        className={`flex items-center w-full h-14 px-4 border-2 rounded-xl transition-colors cursor-text ${
          disabled 
            ? "bg-secondary/50 border-border opacity-60" 
            : isOpen 
              ? "bg-background border-primary ring-2 ring-primary/10" 
              : "bg-background border-border hover:border-primary/50"
        }`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <input
          type="text" value={isOpen ? query : value}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); if (e.target.value !== value) onChange(""); }}
          onFocus={() => !disabled && setIsOpen(true)} placeholder={placeholder} disabled={disabled}
          className="w-full h-full font-bold text-foreground outline-none placeholder:text-muted-foreground placeholder:font-medium bg-transparent disabled:cursor-not-allowed truncate pr-2"
        />
        <CaretDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} weight="bold" />
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-50 top-[76px] left-0 right-0 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="max-h-60 overflow-y-auto overscroll-contain py-2 scrollbar-thin scrollbar-thumb-secondary">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = value === opt;
                return (
                  <li key={idx} onClick={() => { onChange(opt); setQuery(opt); setIsOpen(false); }} className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between group ${isSelected ? "bg-primary/10" : "hover:bg-secondary/50"}`}>
                    <span className={`text-sm font-bold ${isSelected ? "text-primary" : "text-foreground group-hover:text-primary"}`}>{opt}</span>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" weight="bold" />}
                  </li>
                )
              })
            ) : <li className="px-4 py-6 text-center text-sm font-medium text-muted-foreground">No results found.</li>}
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
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 State: Form Inputs
  const [proposedName, setProposedName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [specificNature, setSpecificNature] = useState("");
  
  // Step 1 State: Alternatives & Lock-in
  const [isNameLocked, setIsNameLocked] = useState(false);
  const [altName1, setAltName1] = useState("");
  const [altName2, setAltName2] = useState("");
  
  // UI States
  const [isSearching, setIsSearching] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  // Modal State (Added searchedName to strictly track what was checked)
  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    status: "PASSED" | "WARNING" | "BLOCKED" | "IDLE";
    title: string;
    message: string;
    searchedName: string;
  }>({ isOpen: false, status: "IDLE", title: "", message: "", searchedName: "" });

  // Step 2 State
  const [ownershipType, setOwnershipType] = useState<"SOLE" | "PARTNERSHIP" | null>(null);

  const categories = Object.keys(CAC_CATEGORIES).sort();
  const specificNatures = selectedCategory ? CAC_CATEGORIES[selectedCategory].sort() : [];

  const handleNameSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedName || !selectedCategory || !specificNature) return;

    const wordCount = proposedName.trim().split(/\s+/).length;
    if (wordCount < 2) {
      setResultModal({
        isOpen: true,
        status: "BLOCKED",
        title: "Name Too Short",
        searchedName: proposedName,
        message: "CAC requires business names to be descriptive. Please use at least two words (e.g., 'Ade Ventures' instead of just 'Ade')."
      });
      return;
    }

    // Trigger the big full-screen loading modal
    setIsSearching(true);

    try {
      const res = await fetch("/api/cac/name-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposedName, lineOfBusiness: specificNature, entityType: "Business Name", mode: "CHECK" }),
      });

      const data = await res.json();

      if (data.isBlocked) {
        setResultModal({
          isOpen: true, status: "BLOCKED", title: "Name Unavailable", searchedName: proposedName, message: data.reasonMessage
        });
      } else if (data.warningMessage) {
        setResultModal({
          isOpen: true, status: "WARNING", title: "Proceed With Caution", searchedName: proposedName, message: data.warningMessage
        });
      } else {
        setResultModal({
          isOpen: true, status: "PASSED", title: "Congratulations!", searchedName: proposedName, message: "Great news! This name is available and perfectly structured for registration."
        });
      }
    } catch (error) {
      setResultModal({
        isOpen: true, status: "WARNING", title: "Registry Slow", searchedName: proposedName, message: "CAC registry connection is currently slow. You may use this name anyway, and our team will verify it manually."
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAcceptName = () => {
    setResultModal({ ...resultModal, isOpen: false });
    setIsNameLocked(true);
  };

  const handleProceedToDetails = async () => {
    if (!ownershipType) return;
    setIsCreatingDraft(true);

    try {
      const res = await fetch("/api/cac/register/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedName,
          altName1,
          altName2,
          entityType: "Business Name",
          ownershipType,
          category: selectedCategory,
          specificNature,
          similarityScore: "0" 
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        router.push(`/dashboard/cac/register/details/${data.draftId}`);
      } else {
        alert(data.message || "Failed to create draft.");
        setIsCreatingDraft(false);
      }
    } catch (error) {
      alert("Network error. Please try again.");
      setIsCreatingDraft(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-in fade-in duration-500 relative">
      
      {/* ========================================== */}
      {/* BIG FULL-SCREEN LOADING MODAL              */}
      {/* ========================================== */}
      {isSearching && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="flex flex-col items-center justify-center p-8 sm:p-10 bg-card border border-border rounded-[2rem] shadow-2xl max-w-sm w-full text-center">
            <div className="relative h-20 w-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-secondary"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <MagnifyingGlass className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" weight="bold" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2 tracking-tight">Checking Database...</h3>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Please wait while we cross-check <br/>
              <span className="font-black text-foreground inline-block mt-1 px-2 py-1 bg-secondary rounded-md">"{proposedName}"</span><br/>
              against the CAC registry.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 pt-2 flex items-center gap-4">
        <Link href="/dashboard/cac/new-incorporation" className="p-2 bg-card rounded-xl border border-border text-muted-foreground hover:text-foreground shadow-sm transition-colors cursor-pointer">
          <CaretLeft className="h-5 w-5" weight="bold" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Register Business Name</h1>
          <p className="text-sm font-medium text-muted-foreground">Step {step} of 4</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-secondary h-2 rounded-full mb-10 overflow-hidden">
        <div className="bg-primary h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${(step / 4) * 100}%` }}></div>
      </div>

      {/* ========================================== */}
      {/* STEP 1: NAME SEARCH                        */}
      {/* ========================================== */}
      {step === 1 && (
        <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm relative transition-colors duration-300">
          
          <div className="flex items-center gap-3 sm:gap-4 mb-8">
            <div className="h-12 w-12 shrink-0 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Storefront className="h-6 w-6" weight="fill" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground leading-tight">Name Availability</h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">Let's ensure your dream name isn't taken.</p>
            </div>
          </div>

          {/* UNLOCKED STATE */}
          {!isNameLocked ? (
            <form onSubmit={handleNameSearch} className="space-y-6 animate-in fade-in">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Proposed Business Name</label>
                <input 
                  type="text" value={proposedName}
                  onChange={(e) => setProposedName(e.target.value.toUpperCase())}
                  placeholder="e.g. PEAK PERFORMANCE LOGISTICS"
                  className="w-full h-14 px-4 border-2 border-border bg-background rounded-xl font-bold text-foreground focus:border-primary focus:ring-primary outline-none transition-colors placeholder:text-muted-foreground"
                  required
                />
              </div>

              <div className="flex justify-end items-center gap-2 -mt-3">
                <span className="text-xs font-medium text-muted-foreground">Unsure what to pick?</span>
                <button type="button" onClick={() => setIsAiAssistantOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-orange-500/10 text-primary text-xs font-bold hover:from-primary/20 hover:to-orange-500/20 transition-all border border-primary/20 shadow-sm cursor-pointer">
                  <Sparkle className="h-3.5 w-3.5" weight="fill" /> Ask LorabizAI
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SearchableDropdown label="Business Category" placeholder="Search category..." value={selectedCategory} options={categories} onChange={(val) => { setSelectedCategory(val); setSpecificNature(""); }} />
                <SearchableDropdown label="Specific Nature" placeholder={selectedCategory ? "Search nature..." : "Select category first"} value={specificNature} options={specificNatures} disabled={!selectedCategory} onChange={(val) => setSpecificNature(val)} />
              </div>

              <button type="submit" disabled={isSearching || !proposedName || !selectedCategory || !specificNature} className="w-full h-14 bg-foreground text-background font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 mt-2 cursor-pointer">
                <MagnifyingGlass className="h-5 w-5" weight="bold" /> Check Availability
              </button>
            </form>
          ) : (
            
            // LOCKED STATE
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <div className="p-5 border-2 border-primary bg-primary/5 rounded-2xl relative mb-8">
                <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">Primary Name Secured</div>
                <div className="flex justify-between items-start mt-2">
                  <div>
                    <h3 className="text-lg font-black text-foreground">{proposedName}</h3>
                    <p className="text-sm font-medium text-muted-foreground mt-1">{specificNature}</p>
                  </div>
                  <button onClick={() => setIsNameLocked(false)} className="h-10 w-10 shrink-0 bg-background border border-border text-muted-foreground rounded-full flex items-center justify-center hover:bg-secondary hover:text-foreground transition-colors shadow-sm cursor-pointer" title="Edit Name">
                    <PencilSimple className="h-5 w-5" weight="bold" />
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <div className="mb-5">
                  <h3 className="text-sm font-bold text-foreground">Add Alternative Names (Highly Recommended)</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">If the CAC examiner rejects your primary name during manual review, they will automatically approve one of these to save you days of delay.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" value={altName1} onChange={(e) => setAltName1(e.target.value.toUpperCase())}
                    placeholder="Alternative Name 1 (Optional)"
                    className="w-full h-12 px-4 border-2 border-border bg-background rounded-xl text-sm font-bold text-foreground focus:border-primary focus:ring-primary outline-none transition-colors placeholder:text-muted-foreground"
                  />
                  <input 
                    type="text" value={altName2} onChange={(e) => setAltName2(e.target.value.toUpperCase())}
                    placeholder="Alternative Name 2 (Optional)"
                    className="w-full h-12 px-4 border-2 border-border bg-background rounded-xl text-sm font-bold text-foreground focus:border-primary focus:ring-primary outline-none transition-colors placeholder:text-muted-foreground"
                  />
                </div>

                <button onClick={() => setStep(2)} className="w-full h-14 mt-8 bg-foreground text-background font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-transform active:scale-95 cursor-pointer">
                  Save & Continue <ArrowRight className="h-5 w-5" weight="bold" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* STEP 2: OWNERSHIP STRUCTURE                */}
      {/* ========================================== */}
      {step === 2 && (
        <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm animate-in slide-in-from-right-8 transition-colors duration-300">
          <div className="mb-8">
            <h2 className="text-xl font-black text-foreground">Who owns this business?</h2>
            <p className="text-sm text-muted-foreground font-medium mt-1">Select your ownership structure to generate the correct forms.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button onClick={() => setOwnershipType("SOLE")} className={`p-6 rounded-2xl border-2 text-left transition-all cursor-pointer ${ownershipType === "SOLE" ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border hover:border-primary/50 bg-background"}`}>
              <User className={`h-8 w-8 mb-4 ${ownershipType === "SOLE" ? "text-primary" : "text-muted-foreground"}`} weight={ownershipType === "SOLE" ? "fill" : "regular"} />
              <h3 className="font-bold text-foreground mb-1">Sole Proprietor</h3>
              <p className="text-xs text-muted-foreground font-medium">I am the single, 100% owner of this business.</p>
            </button>

            <button onClick={() => setOwnershipType("PARTNERSHIP")} className={`p-6 rounded-2xl border-2 text-left transition-all cursor-pointer ${ownershipType === "PARTNERSHIP" ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border hover:border-primary/50 bg-background"}`}>
              <Users className={`h-8 w-8 mb-4 ${ownershipType === "PARTNERSHIP" ? "text-primary" : "text-muted-foreground"}`} weight={ownershipType === "PARTNERSHIP" ? "fill" : "regular"} />
              <h3 className="font-bold text-foreground mb-1">Partnership</h3>
              <p className="text-xs text-muted-foreground font-medium">Two or more people co-own this business.</p>
            </button>
          </div>

          <div className="flex gap-4">
             <button onClick={() => setStep(1)} className="h-14 px-6 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/80 transition-colors cursor-pointer">Back</button>
             <button 
               disabled={!ownershipType || isCreatingDraft} 
               onClick={handleProceedToDetails} 
               className="flex-1 h-14 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer"
             >
               {isCreatingDraft ? (
                 <div className="h-5 w-5 border-2 border-background/30 border-t-background rounded-full animate-spin"></div>
               ) : (
                 <>Proceed to Details <ArrowRight className="h-5 w-5" weight="bold" /></>
               )}
             </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* THE AVAILABILITY RESULT MODAL              */}
      {/* ========================================== */}
      <div className={`fixed inset-0 z-[150] flex items-center justify-center p-4 ${resultModal.isOpen ? "visible" : "invisible pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${resultModal.isOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setResultModal({ ...resultModal, isOpen: false })} />
        
        <div className={`relative w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-6 text-center transition-all duration-300 ${resultModal.isOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-8 opacity-0"}`}>
          
          <div className="flex justify-center mb-4">
            {resultModal.status === "PASSED" && (
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center ring-8 ring-emerald-500/5">
                <CheckCircle className="h-10 w-10" weight="fill" />
              </div>
            )}
            {resultModal.status === "WARNING" && (
              <div className="h-20 w-20 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center ring-8 ring-amber-500/5">
                <WarningCircle className="h-10 w-10" weight="fill" />
              </div>
            )}
            {resultModal.status === "BLOCKED" && (
              <div className="h-20 w-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center ring-8 ring-red-500/5">
                <XCircle className="h-10 w-10" weight="fill" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-black text-foreground mb-2">{resultModal.title}</h3>
          
          {/* Explicitly displays the searched name */}
          <div className="mb-3">
             <span className="inline-block px-3 py-1.5 bg-secondary text-foreground font-black text-sm rounded-lg border border-border">
               "{resultModal.searchedName}"
             </span>
          </div>

          <p className="text-sm font-medium text-muted-foreground leading-relaxed mb-8">{resultModal.message}</p>

          <div className="flex flex-col gap-3">
            {resultModal.status === "PASSED" && (
              <button onClick={handleAcceptName} className="w-full h-14 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer">
                Continue Registration
              </button>
            )}

            {resultModal.status === "WARNING" && (
              <>
                <button onClick={handleAcceptName} className="w-full h-14 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer">
                  Use Name Anyway
                </button>
                <button onClick={() => setResultModal({ ...resultModal, isOpen: false })} className="w-full h-14 bg-secondary text-foreground font-bold rounded-xl hover:bg-secondary/80 transition-colors cursor-pointer">
                  Modify Name
                </button>
              </>
            )}

            {resultModal.status === "BLOCKED" && (
              <button onClick={() => setResultModal({ ...resultModal, isOpen: false })} className="w-full h-14 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-colors shadow-lg cursor-pointer">
                Try Another Name
              </button>
            )}
          </div>
        </div>
      </div>

      <AiCategoryAssistant isOpen={isAiAssistantOpen} onClose={() => setIsAiAssistantOpen(false)} />
    </div>
  );
}
