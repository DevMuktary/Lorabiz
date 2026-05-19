"use client";

import { useState } from "react";
import { 
  Info, CheckCircle, Warning, MagnifyingGlass, Spinner, ArrowRight, X, ArrowsClockwise
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CAC_CATEGORIES } from "@/lib/cac-categories";

export default function BusinessNameSearchPage() {
  const [loading, setLoading] = useState(false);
  const [entityType, setEntityType] = useState<"sole" | "partnership" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [specificNature, setSpecificNature] = useState("");
  const [proposedName, setProposedName] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [searchResult, setResult] = useState<{
    similarityScore: string;
    complianceScore: string;
    mostSimilarName: string;
    similarNames: string[];
    aiSuggestedNames: string[];
    cleansedNameUsed: string;
    message: string;
  } | null>(null);

  const availableNatures = selectedCategory ? CAC_CATEGORIES[selectedCategory] : [];

  const handleSearch = async (nameToSearch: string = proposedName) => {
    if (!entityType || !selectedCategory || !specificNature || !nameToSearch) return;

    setLoading(true);
    setShowModal(true); // Open modal immediately in loading state

    try {
      const res = await fetch("/api/cac/name-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedName: nameToSearch,
          lineOfBusiness: specificNature,
          entityType: "business-name" // Hardcoded for this specific page route
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setResult({
          similarityScore: data.data.similarityScore || "0%",
          complianceScore: data.data.complianceScore || "0%",
          mostSimilarName: data.data.mostSimilarName || "",
          similarNames: data.data.similarNames || [],
          aiSuggestedNames: data.data.aiSuggestedNames || [],
          cleansedNameUsed: data.data.cleansedNameUsed || nameToSearch,
          message: data.message
        });
      } else {
        // Handle 403 or API failures gracefully
        const score = data.message === "Name exist" ? "100%" : "0%";
        setResult({
          similarityScore: score,
          complianceScore: "0%",
          mostSimilarName: data.error || "Conflict Detected",
          similarNames: data.errors || [],
          aiSuggestedNames: data.data?.suggestedNames || [],
          cleansedNameUsed: nameToSearch.toUpperCase(),
          message: data.message || "Name unavailable or check failed."
        });
      }
    } catch (error) {
      console.error(error);
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  const scoreValue = searchResult ? parseFloat(searchResult.similarityScore) : 0;
  const isRedZone = scoreValue > 60;
  const isYellowZone = scoreValue > 40 && scoreValue <= 60;

  return (
    <div className="max-w-3xl mx-auto pb-12 relative">
      
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Step 1: Name Availability Search
        </h1>
        <p className="text-slate-500 mt-2 text-[16px]">
          Let’s ensure your proposed business name is available and legally compliant before we proceed with the registration.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
        <div className="space-y-8">
          
          {/* ENTITY TYPE SELECTION */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-bold text-slate-900">Entity Type</Label>
              <div className="group relative flex items-center">
                <Info className="h-4 w-4 text-slate-400 cursor-help" weight="fill" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-10 text-center pointer-events-none">
                  Select whether you are the sole owner or registering with partners.
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setEntityType("sole")}
                className={`relative flex flex-col p-4 rounded-2xl border-2 text-left transition-all ${
                  entityType === "sole" ? "border-[#ff3f7a] bg-[#ff3f7a]/5" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <h3 className={`font-bold ${entityType === "sole" ? "text-[#ff3f7a]" : "text-slate-900"}`}>Sole Proprietor</h3>
                <p className="text-xs text-slate-500 mt-1">Single owner, full control.</p>
              </button>

              <button
                type="button"
                onClick={() => setEntityType("partnership")}
                className={`relative flex flex-col p-4 rounded-2xl border-2 text-left transition-all ${
                  entityType === "partnership" ? "border-[#ff3f7a] bg-[#ff3f7a]/5" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <h3 className={`font-bold ${entityType === "partnership" ? "text-[#ff3f7a]" : "text-slate-900"}`}>Partnership</h3>
                <p className="text-xs text-slate-500 mt-1">2-20 owners sharing control.</p>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* BUSINESS NATURE DROPDOWNS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="category" className="text-[15px] font-semibold text-slate-900">Broad Category</Label>
                <div className="group relative flex items-center">
                  <Info className="h-4 w-4 text-slate-400 cursor-help" weight="fill" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-10 text-center pointer-events-none">
                    The general industry your business operates in.
                  </div>
                </div>
              </div>
              <select 
                id="category" 
                value={selectedCategory} 
                onChange={(e) => { setSelectedCategory(e.target.value); setSpecificNature(""); }}
                className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-[15px] font-medium text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3f7a] focus-visible:border-[#ff3f7a]"
              >
                <option value="" disabled>Select a broad category...</option>
                {Object.keys(CAC_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="specificNature" className="text-[15px] font-semibold text-slate-900">Specific Nature</Label>
                <div className="group relative flex items-center">
                  <Info className="h-4 w-4 text-slate-400 cursor-help" weight="fill" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-10 text-center pointer-events-none">
                    The exact daily activities your business will perform.
                  </div>
                </div>
              </div>
              <select 
                id="specificNature" 
                value={specificNature} 
                onChange={(e) => setSpecificNature(e.target.value)}
                disabled={!selectedCategory}
                className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-[15px] font-medium text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3f7a] focus-visible:border-[#ff3f7a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>Select specific nature...</option>
                {availableNatures.map((nature) => (
                  <option key={nature} value={nature}>{nature}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* THE NAME SEARCH */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="proposedName" className="text-base font-bold text-slate-900">Proposed Business Name</Label>
              <div className="group relative flex items-center">
                <Info className="h-4 w-4 text-slate-400 cursor-help" weight="fill" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-10 text-center pointer-events-none">
                  Enter your desired name. Our AI will automatically correct illegal words (like LTD) before checking.
                </div>
              </div>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-4 bg-[#ff3f7a]/10 p-1.5 rounded-lg">
                <MagnifyingGlass className="h-5 w-5 text-[#ff3f7a]" weight="bold" />
              </div>
              <Input 
                id="proposedName" 
                value={proposedName}
                onChange={(e) => setProposedName(e.target.value)}
                placeholder="e.g. Chukz Ventures" 
                className="pl-14 h-16 text-lg font-bold bg-white border-2 border-slate-200 focus-visible:ring-0 focus-visible:border-[#ff3f7a] transition-all rounded-2xl uppercase placeholder:normal-case placeholder:font-medium placeholder:text-slate-400" 
              />
            </div>
          </div>

          <Button 
            onClick={() => handleSearch(proposedName)}
            disabled={!entityType || !selectedCategory || !specificNature || !proposedName} 
            className="w-full h-14 text-lg font-bold bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-xl shadow-[#ff3f7a]/25 transition-all rounded-xl"
          >
            Check Availability
          </Button>
        </div>
      </div>

      {/* --- CENTERED OVERLAY MODAL FOR RESULTS --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-10"
            >
              <X className="h-5 w-5" weight="bold" />
            </button>

            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center space-y-4">
                <Spinner className="animate-spin h-12 w-12 text-[#ff3f7a]" weight="bold" />
                <p className="text-slate-600 font-medium">Running AI Cleansing & CAC Search...</p>
              </div>
            ) : searchResult && (
              <div className="p-8">
                
                {/* Traffic Light Header */}
                <div className="flex flex-col items-center text-center border-b border-slate-100 pb-6 mb-6">
                  {isRedZone ? (
                     <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                       <Warning className="h-8 w-8" weight="fill" />
                     </div>
                  ) : isYellowZone ? (
                     <div className="h-16 w-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                       <Warning className="h-8 w-8" weight="fill" />
                     </div>
                  ) : (
                     <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-inner">
                       <CheckCircle className="h-8 w-8" weight="fill" />
                     </div>
                  )}

                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                    {searchResult.cleansedNameUsed}
                  </h2>
                  <p className={`mt-2 font-bold ${isRedZone ? 'text-red-600' : isYellowZone ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {isRedZone ? 'HIGH RISK OF REJECTION' : isYellowZone ? 'MODERATE RISK' : 'AVAILABLE & SAFE'}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-4 w-full">
                    <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <p className="text-xs font-bold text-slate-400 uppercase">Similarity</p>
                      <p className="text-lg font-black text-slate-900">{searchResult.similarityScore}</p>
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <p className="text-xs font-bold text-slate-400 uppercase">Compliance</p>
                      <p className="text-lg font-black text-slate-900">{searchResult.complianceScore}</p>
                    </div>
                  </div>
                </div>

                {/* Conflict List */}
                {searchResult.similarNames.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Warning className="text-amber-500" weight="fill" /> Known Conflicts:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {searchResult.similarNames.map((name, idx) => (
                        <span key={idx} className="bg-red-50 text-red-700 px-2.5 py-1 rounded-md text-xs font-bold border border-red-200">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Suggestions Engine (Shows on Red/Yellow) */}
                {(isRedZone || isYellowZone) && searchResult.aiSuggestedNames.length > 0 && (
                  <div className="mb-6 bg-[#ff3f7a]/5 p-4 rounded-2xl border border-[#ff3f7a]/20">
                    <p className="text-sm font-bold text-[#ff3f7a] mb-3">AI Guaranteed Safe Alternatives:</p>
                    <div className="flex flex-col gap-2">
                      {searchResult.aiSuggestedNames.map((suggestion, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => {
                            setProposedName(suggestion);
                            handleSearch(suggestion);
                          }}
                          className="w-full text-left bg-white px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:border-[#ff3f7a] hover:text-[#ff3f7a] transition-all flex items-center justify-between group"
                        >
                          {suggestion}
                          <ArrowsClockwise className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" weight="bold" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* PROCEED BUTTON (Only for Green/Yellow) */}
                {!isRedZone && (
                  <Button className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20">
                    Proceed to Registration Details
                    <ArrowRight className="h-5 w-5" weight="bold" />
                  </Button>
                )}

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
