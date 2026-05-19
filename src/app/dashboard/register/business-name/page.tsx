"use client";

import { useState } from "react";
import { 
  Info, CheckCircle, Warning, MagnifyingGlass, Spinner, ArrowRight 
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
  
  // Results State updated to include similarNames array
  const [searchResult, setResult] = useState<{
    similarityScore: string;
    complianceScore: string;
    mostSimilarName: string;
    similarNames: string[];
    message: string;
  } | null>(null);

  const availableNatures = selectedCategory ? CAC_CATEGORIES[selectedCategory] : [];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityType || !selectedCategory || !specificNature || !proposedName) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/cac/name-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedName,
          lineOfBusiness: specificNature
        })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setResult({
          similarityScore: data.data.similarityScore || "0%",
          complianceScore: data.data.complianceScore || "0%",
          mostSimilarName: data.data.mostSimilarName || "",
          similarNames: data.data.similarNames || [], // Capture the array
          message: data.message
        });
      } else {
        setResult({
          similarityScore: "100%",
          complianceScore: "0%",
          mostSimilarName: "Error or Conflict",
          similarNames: [],
          message: data.message || "Failed to check name availability."
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      
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
        <form onSubmit={handleSearch} className="space-y-8">
          
          {/* ENTITY TYPE SELECTION */}
          <div className="space-y-4">
            <Label className="text-base font-bold text-slate-900">Entity Type</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Sole Proprietor Option */}
              <button
                type="button"
                onClick={() => setEntityType("sole")}
                className={`relative flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all ${
                  entityType === "sole" 
                    ? "border-[#ff3f7a] bg-[#ff3f7a]/5" 
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <h3 className={`font-bold ${entityType === "sole" ? "text-[#ff3f7a]" : "text-slate-900"}`}>
                    Sole Proprietor
                  </h3>
                </div>
                {/* Tooltip Group */}
                <div className="group relative flex items-center">
                  <Info className="h-5 w-5 text-slate-400 cursor-help" weight="fill" />
                  <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-10 pointer-events-none">
                    You are the sole owner of the business. You will bear all responsibilities and profits alone.
                  </div>
                </div>
              </button>

              {/* Partnership Option */}
              <button
                type="button"
                onClick={() => setEntityType("partnership")}
                className={`relative flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all ${
                  entityType === "partnership" 
                    ? "border-[#ff3f7a] bg-[#ff3f7a]/5" 
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div>
                  <h3 className={`font-bold ${entityType === "partnership" ? "text-[#ff3f7a]" : "text-slate-900"}`}>
                    Partnership
                  </h3>
                </div>
                {/* Tooltip Group */}
                <div className="group relative flex items-center">
                  <Info className="h-5 w-5 text-slate-400 cursor-help" weight="fill" />
                  <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-10 pointer-events-none">
                    Registering with 2 to 20 partners. You will share ownership, responsibilities, and profits.
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* BUSINESS NATURE DROPDOWNS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label htmlFor="category" className="text-[15px] font-semibold text-slate-900">
                Nature of Business Category
              </Label>
              <select 
                id="category" 
                value={selectedCategory} 
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSpecificNature(""); 
                }}
                required 
                className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-[15px] font-medium text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff3f7a] focus-visible:border-[#ff3f7a]"
              >
                <option value="" disabled>Select a broad category...</option>
                {Object.keys(CAC_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="specificNature" className="text-[15px] font-semibold text-slate-900">
                Specific Nature of Business
              </Label>
              <select 
                id="specificNature" 
                value={specificNature} 
                onChange={(e) => setSpecificNature(e.target.value)}
                required 
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
            <Label htmlFor="proposedName" className="text-base font-bold text-slate-900">
              Proposed Business Name
            </Label>
            <div className="relative flex items-center">
              <div className="absolute left-4 bg-[#ff3f7a]/10 p-1.5 rounded-lg">
                <MagnifyingGlass className="h-5 w-5 text-[#ff3f7a]" weight="bold" />
              </div>
              <Input 
                id="proposedName" 
                value={proposedName}
                onChange={(e) => setProposedName(e.target.value)}
                required 
                placeholder="e.g. Chukz Ventures" 
                className="pl-14 h-16 text-lg font-bold bg-white border-2 border-slate-200 focus-visible:ring-0 focus-visible:border-[#ff3f7a] transition-all rounded-2xl uppercase placeholder:normal-case placeholder:font-medium placeholder:text-slate-400" 
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading || !entityType || !selectedCategory || !specificNature || !proposedName} 
            className="w-full h-14 text-lg font-bold bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-xl shadow-[#ff3f7a]/25 transition-all rounded-xl"
          >
            {loading ? (
              <Spinner className="animate-spin h-6 w-6" weight="bold" />
            ) : (
              "Check Availability"
            )}
          </Button>
        </form>

        {/* RESULTS CARD */}
        {searchResult && (
          <div className="mt-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className={`p-6 rounded-2xl border-2 ${
              parseFloat(searchResult.similarityScore) > 50 
                ? "bg-red-50 border-red-200" 
                : "bg-emerald-50 border-emerald-200"
            }`}>
              <div className="flex items-start gap-4">
                {parseFloat(searchResult.similarityScore) > 50 ? (
                  <Warning className="h-8 w-8 text-red-500 shrink-0" weight="fill" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-emerald-500 shrink-0" weight="fill" />
                )}
                
                <div className="flex-1">
                  <h3 className={`text-lg font-bold ${
                    parseFloat(searchResult.similarityScore) > 50 ? "text-red-900" : "text-emerald-900"
                  }`}>
                    {searchResult.message}
                  </h3>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Similarity</p>
                      <p className={`text-xl font-black ${
                        parseFloat(searchResult.similarityScore) > 50 ? "text-red-600" : "text-emerald-600"
                      }`}>
                        {searchResult.similarityScore}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Compliance</p>
                      <p className="text-xl font-black text-slate-800">
                        {searchResult.complianceScore}
                      </p>
                    </div>
                  </div>

                  {/* DISPLAY SIMILAR NAMES */}
                  {searchResult.similarNames && searchResult.similarNames.length > 0 && parseFloat(searchResult.similarityScore) > 0 && (
                    <div className="mt-4 bg-white px-4 py-3 rounded-xl border border-slate-100 text-sm shadow-sm">
                      <p className="font-bold text-slate-900 mb-2">Similar Registered Names:</p>
                      <div className="flex flex-wrap gap-2">
                        {searchResult.similarNames.map((name, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-md text-xs font-bold tracking-wide border border-slate-200">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PROCEED BUTTON (Only show if similarity is low) */}
                  {parseFloat(searchResult.similarityScore) <= 50 && (
                    <Button className="mt-6 w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                      Proceed to Details
                      <ArrowRight className="h-4 w-4" weight="bold" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
