"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Info, CheckCircle, Warning, MagnifyingGlass, Spinner, ArrowRight, X, Pencil, Wallet
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CAC_CATEGORIES } from "@/lib/cac-categories";

export default function BusinessNameSearchPage() {
  const router = useRouter();

  // Core Form State
  const [loading, setLoading] = useState(false);
  const [isProceeding, setIsProceeding] = useState(false);
  const [entityType, setEntityType] = useState<"sole" | "partnership" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [specificNature, setSpecificNature] = useState("");
  const [proposedName, setProposedName] = useState("");
  
  // Wallet State
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0); 
  const CHECK_COST = 100;
  
  // Modal & Results State
  const [showModal, setShowModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [searchResult, setResult] = useState<{
    mostSimilarName: string;
    cleansedNameUsed: string;
    suggestedNames: string[];
    similarityScore?: number;
  } | null>(null);

  const availableNatures = selectedCategory ? CAC_CATEGORIES[selectedCategory] : [];

  // 1. Fetch real wallet balance on component mount
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch("/api/user/wallet");
        const data = await res.json();
        if (data.success) {
          setWalletBalance(data.balance);
        }
      } catch (error) {
        console.error("Failed to fetch wallet");
      } finally {
        setWalletLoading(false);
      }
    };
    fetchWallet();
  }, []);

  // 2. Perform Advanced Name Check & Deduct Funds
  const handleSearch = async (nameToSearch: string = proposedName) => {
    if (!entityType || !selectedCategory || !specificNature || !nameToSearch) return;

    setLoading(true);
    setResult(null);
    setRejectionReason("");
    setIsBlocked(false);
    setShowModal(true); 

    try {
      const res = await fetch("/api/cac/name-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedName: nameToSearch,
          lineOfBusiness: specificNature,
          entityType: entityType === "sole" ? "Sole Proprietorship" : "Partnership"
        })
      });

      const json = await res.json();
      
      if (res.ok && json.success !== false) {
        setIsBlocked(json.isBlocked);
        setRejectionReason(json.reasonMessage || "");
        setResult({
          mostSimilarName: json.data?.mostSimilarName || "N/A",
          cleansedNameUsed: json.data?.cleansedNameUsed || nameToSearch.toUpperCase(),
          suggestedNames: json.data?.suggestedNames || [],
          similarityScore: json.data?.similarityScore || 0
        });
        
        // Sync the UI wallet balance with the database's new balance
        if (json.newWalletBalance !== undefined) {
          setWalletBalance(json.newWalletBalance);
        }
      } else {
        setIsBlocked(true);
        setRejectionReason(json.reasonMessage || "Gateway connection failed. Please retry.");
        if (json.rejectionType === "INSUFFICIENT_FUNDS") {
           setShowModal(false);
           alert(json.reasonMessage); // Future enhancement: Trigger a Top Up modal here
        }
      }
    } catch (error) {
      console.error(error);
      setIsBlocked(true);
      setRejectionReason("A network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Save as Draft and Route to Step 2
  const handleProceed = async () => {
    setIsProceeding(true);
    try {
      const res = await fetch("/api/register/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposedName: resultName,
          entityType: entityType === "sole" ? "Sole Proprietorship" : "Partnership",
          category: selectedCategory,
          specificNature,
          similarityScore: searchResult?.similarityScore
        })
      });
      
      const json = await res.json();
      if (json.success) {
        // Route them to Step 2 with their newly saved Draft ID
        router.push(`/dashboard/register/details/${json.draftId}`);
      } else {
        alert(json.message || "Failed to save progress. Please try again.");
        setIsProceeding(false);
      }
    } catch (err) {
      console.error(err);
      alert("A network error occurred while saving.");
      setIsProceeding(false);
    }
  };

  // 4. Quick-apply a CAC suggested name
  const applySuggestedName = (name: string) => {
    setProposedName(name);
    setShowModal(false);
    setTimeout(() => {
      handleSearch(name);
    }, 300);
  };

  const resultName = searchResult?.cleansedNameUsed || proposedName;
  const isFormValid = entityType && selectedCategory && specificNature && proposedName.trim().length > 0;
  const hasFunds = walletBalance >= CHECK_COST;

  return (
    <div className="max-w-3xl mx-auto pb-12 antialiased selection:bg-[#ff3f7a] selection:text-white">
      
      {/* HEADER SECTION WITH WALLET */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Step 1: Advanced Registry Scan
          </h1>
          <p className="text-slate-500 mt-2 text-[16px] font-medium leading-relaxed max-w-lg">
            We query the official CAC registry using an advanced compliance scan. Each search deducts ₦{CHECK_COST} from your balance.
          </p>
        </div>

        {/* WALLET DISPLAY */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex items-center gap-4 shrink-0">
          <div className={`p-3 rounded-xl ${hasFunds ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            <Wallet className="h-6 w-6" weight="fill" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wallet Balance</p>
            {walletLoading ? (
               <Spinner className="animate-spin h-5 w-5 text-slate-400 mt-1" />
            ) : (
               <p className={`text-xl font-black ${hasFunds ? 'text-slate-900' : 'text-red-600'}`}>
                 ₦{Number(walletBalance).toLocaleString()}
               </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
        <div className="space-y-8">
          
          {/* ENTITY SELECTOR GRID */}
          <div className="space-y-4">
            <Label className="text-[15px] font-bold text-slate-900">Proprietorship Structure</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setEntityType("sole")}
                className={`relative flex flex-col p-5 rounded-2xl border-2 text-left transition-all outline-none cursor-pointer ${
                  entityType === "sole" ? "border-[#ff3f7a] bg-[#ff3f7a]/5" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <h3 className={`font-bold text-base ${entityType === "sole" ? "text-[#ff3f7a]" : "text-slate-900"}`}>Sole Proprietorship</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Owned by a single independent individual entity.</p>
              </button>

              <button
                type="button"
                onClick={() => setEntityType("partnership")}
                className={`relative flex flex-col p-5 rounded-2xl border-2 text-left transition-all outline-none cursor-pointer ${
                  entityType === "partnership" ? "border-[#ff3f7a] bg-[#ff3f7a]/5" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <h3 className={`font-bold text-base ${entityType === "partnership" ? "text-[#ff3f7a]" : "text-slate-900"}`}>Partnership Layout</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Shared corporate structure among 2 to 20 partners.</p>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* DUAL DROPDOWN FIELDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label htmlFor="category" className="text-[15px] font-bold text-slate-900">Line of Business Category</Label>
              <select 
                id="category" 
                value={selectedCategory} 
                onChange={(e) => { setSelectedCategory(e.target.value); setSpecificNature(""); }}
                className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-[15px] font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff3f7a] focus:border-[#ff3f7a] cursor-pointer"
              >
                <option value="" disabled>Select category umbrella...</option>
                {Object.keys(CAC_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="specificNature" className="text-[15px] font-bold text-slate-900">Specific Corporate Nature</Label>
              <select 
                id="specificNature" 
                value={specificNature} 
                onChange={(e) => setSpecificNature(e.target.value)}
                disabled={!selectedCategory}
                className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-[15px] font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff3f7a] focus:border-[#ff3f7a] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <option value="" disabled>Select specific line...</option>
                {availableNatures.map((nature) => (
                  <option key={nature} value={nature}>{nature}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100"></div>

          {/* DYNAMIC TEXT INPUT FIELD */}
          <div className="space-y-2.5">
            <Label htmlFor="proposedName" className="text-[15px] font-bold text-slate-900">Proposed Corporate Title</Label>
            <div className="relative flex items-center">
              <div className="absolute left-4 bg-[#ff3f7a]/10 p-1.5 rounded-lg">
                <MagnifyingGlass className="h-5 w-5 text-[#ff3f7a]" weight="bold" />
              </div>
              <Input 
                id="proposedName" 
                value={proposedName}
                onChange={(e) => setProposedName(e.target.value)}
                placeholder="e.g. HORIZON CONCEPTS" 
                className="pl-14 h-16 text-lg font-bold bg-white border-2 border-slate-200 focus-visible:ring-0 focus-visible:border-[#ff3f7a] transition-all rounded-2xl uppercase placeholder:normal-case placeholder:font-medium placeholder:text-slate-400" 
              />
            </div>
            {isFormValid && (
              <p className="text-xs font-bold text-slate-500 text-right mt-2">
                Cost: <span className="text-[#ff3f7a]">₦{CHECK_COST}</span>
              </p>
            )}
          </div>

          <Button 
            onClick={() => handleSearch(proposedName)}
            disabled={!isFormValid || !hasFunds} 
            className={`w-full h-14 text-lg font-bold shadow-xl transition-all rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              hasFunds ? "bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-[#ff3f7a]/25" : "bg-slate-800 text-white shadow-slate-900/25"
            }`}
          >
            {hasFunds ? "Run Advanced Registry Check" : "Insufficient Funds - Top Up Required"}
          </Button>
        </div>
      </div>

      {/* --- REARCHITECTED SCREEN MIDDLE INTERACTIVE OVERLAY MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200 relative">
            
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-colors z-50 cursor-pointer"
            >
              <X className="h-4 w-4" weight="bold" />
            </button>

            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                <Spinner className="animate-spin h-12 w-12 text-[#ff3f7a]" weight="bold" />
                <h3 className="font-bold text-lg text-slate-900">Querying CAC Advanced Registry</h3>
                <p className="text-slate-500 text-sm font-semibold max-w-xs">Running rigorous compliance algorithms natively on government servers...</p>
              </div>
            ) : (
              <div className="p-6 sm:p-8">
                
                {/* STATE CONDITION A: NAME REJECTED / BLOCKED FLOW */}
                {isBlocked ? (
                  <div className="space-y-6 text-center">
                    <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Warning className="h-8 w-8" weight="fill" />
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest text-red-500">Name Unavailable</p>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight break-words px-2">{resultName}</h2>
                      {rejectionReason && (
                        <p className="text-xs text-red-600 font-bold bg-red-50 border border-red-100 p-3 rounded-xl mt-2 text-left leading-relaxed">
                          {rejectionReason}
                        </p>
                      )}
                    </div>

                    {searchResult && searchResult.mostSimilarName !== "N/A" && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 text-left">
                        Direct Conflict Target: <span className="text-slate-900 font-bold block mt-0.5 uppercase">{searchResult.mostSimilarName}</span>
                      </div>
                    )}

                    {/* CAC PROVIDED SUGGESTIONS (IF ANY) */}
                    {searchResult && searchResult.suggestedNames && searchResult.suggestedNames.length > 0 && (
                      <div className="border-t border-slate-100 pt-5 space-y-3">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider text-left">CAC Suggested Alternatives:</p>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                          {searchResult.suggestedNames.map((name, idx) => (
                             <button
                               key={idx}
                               type="button"
                               onClick={() => applySuggestedName(name)}
                               className="w-full bg-slate-50 border border-slate-200 hover:border-emerald-400 p-3 rounded-xl text-left font-bold text-slate-700 hover:text-emerald-700 transition-all cursor-pointer text-sm"
                             >
                               {name}
                             </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-slate-100 pt-5 mt-4">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                        Modify Name (Cost: ₦{CHECK_COST})
                      </button>
                    </div>

                  </div>
                ) : (
                  /* STATE CONDITION B: PASSED AND COMPLIANT FLOW */
                  <div className="space-y-6 text-center">
                    <div className="h-16 w-16 bg-[#ff3f7a]/10 text-[#ff3f7a] rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <CheckCircle className="h-8 w-8" weight="fill" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest text-[#ff3f7a]">Congratulations!</p>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight break-words px-2">{resultName}</h2>
                      <p className="text-sm text-slate-500 font-semibold pt-1">The proposed name passed the Advanced Compliance Scan and is available for registration.</p>
                    </div>

                    {/* PROCEED BLOCK ANCHOR BUTTON */}
                    <div className="border-t border-slate-100 pt-5 flex flex-col gap-3">
                      <Button 
                        onClick={handleProceed}
                        disabled={isProceeding}
                        className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 cursor-pointer disabled:opacity-50"
                      >
                        {isProceeding ? (
                          <>
                            <Spinner className="animate-spin h-5 w-5" weight="bold" />
                            Saving Progress...
                          </>
                        ) : (
                          <>
                            Proceed to Registration Details
                            <ArrowRight className="h-5 w-5" weight="bold" />
                          </>
                        )}
                      </Button>
                      
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        disabled={isProceeding}
                        className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-30"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
