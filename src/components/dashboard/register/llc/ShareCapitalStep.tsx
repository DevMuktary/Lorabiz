"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChartPieSlice, Info, Plus, Trash, PencilSimple, WarningCircle, X, ListMagnifyingGlass, User, CaretDown, CaretUp, Coins, CheckCircle } from "@phosphor-icons/react";
import { DESIGNATED_COMPANIES, numberToWordsNaira } from "@/lib/share-capital-data";

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-start py-2.5 border-b border-slate-200/60 last:border-0 gap-4">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0 mt-0.5">{label}</span>
    <span className="text-[13px] font-black text-slate-900 text-right break-words">{value || "-"}</span>
  </div>
);

const formatNum = (val: any) => {
  if (val === "" || val === null || val === undefined || isNaN(val)) return "";
  return Number(val).toLocaleString("en-US");
};

const cleanNum = (val: string) => val.replace(/\D/g, "");

export default function ShareCapitalStep({ data, updateData, showErrors }: any) {
  const [showRefModal, setShowRefModal] = useState(true);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showAllotmentModal, setShowAllotmentModal] = useState(false);
  const [expandedOfficerId, setExpandedId] = useState<string | null>(null);

  // FIX: Class form now expects Units & Nominal Value. Total Value is calculated.
  const [classForm, setClassForm] = useState<any>({ id: null, type: "EQUITY (ORDINARY)", units: "", nominalValue: "1" });
  const [allotForm, setAllotForm] = useState<any>({ officerId: "", type: "EQUITY (ORDINARY)", units: "" });

  const rawShareData = data.shareCapital || {};
  const shareData = {
    companyType: rawShareData.companyType || "ENTITY WITH SHARES BELOW FIVE MILLION",
    totalIssuedCapital: rawShareData.totalIssuedCapital !== undefined ? rawShareData.totalIssuedCapital : "1000000",
    shareClasses: Array.isArray(rawShareData.shareClasses) ? rawShareData.shareClasses : [],
    allotments: Array.isArray(rawShareData.allotments) ? rawShareData.allotments : []
  };

  const shareholders = (data.officers || []).filter((o: any) => o.roles.includes("SHAREHOLDER"));

  const updateShareData = (field: string, value: any) => {
    updateData((prev: any) => ({ ...prev, shareCapital: { ...shareData, [field]: value } }));
  };

  // ==========================================
  // CORE MATH CONSTANTS
  // ==========================================
  const selectedCompanyInfo = DESIGNATED_COMPANIES.find(c => c.type === shareData.companyType);
  const minRequired = selectedCompanyInfo ? selectedCompanyInfo.min : 1000000;
  const totalIssuedCapitalNum = Number(shareData.totalIssuedCapital) || 0;

  // Class Math
  const totalClassesValue = shareData.shareClasses.reduce((acc: number, c: any) => acc + (Number(c.totalValue) || 0), 0);
  const remainingCapitalValue = totalIssuedCapitalNum - totalClassesValue;
  const classMathError = totalIssuedCapitalNum > 0 && totalClassesValue !== totalIssuedCapitalNum;
  
  // Strict Rule: Cannot have ONLY Preference Shares
  const hasOrdinaryShares = shareData.shareClasses.some((c: any) => c.type === "EQUITY (ORDINARY)");
  const ordinaryShareError = shareData.shareClasses.length > 0 && !hasOrdinaryShares;

  // Allotment Math
  const totalRequiredUnits = shareData.shareClasses.reduce((acc: number, c: any) => acc + (Number(c.units) || 0), 0);
  const totalAllotted = shareData.allotments.reduce((acc: number, a: any) => acc + (Number(a.units) || 0), 0);
  const remainingAllotmentUnits = totalRequiredUnits - totalAllotted;
  const isPerfectMatch = totalRequiredUnits > 0 && remainingAllotmentUnits === 0 && !classMathError && !ordinaryShareError;

  // ==========================================
  // CLASS FORM HELPERS
  // ==========================================
  // Live calculate total value as they type
  const classLiveTotalValue = (Number(classForm.units) || 0) * (Number(classForm.nominalValue) || 0);
  
  // Calculate remaining capital safely (accounting for edits vs new)
  const getAvailableCapitalForClass = () => {
    if (classForm.id !== null) {
      // If editing, add back the current value of the class being edited
      const currentClassValue = shareData.shareClasses[classForm.id].totalValue;
      return remainingCapitalValue + currentClassValue;
    }
    return remainingCapitalValue;
  };
  const availableCapital = getAvailableCapitalForClass();
  const isClassOverLimit = classLiveTotalValue > availableCapital;

  const saveShareClass = () => {
    if (!classForm.units || !classForm.nominalValue || isClassOverLimit) return;
    
    const units = Number(classForm.units);
    const nominalValue = Number(classForm.nominalValue);
    const totalValue = units * nominalValue;

    let updated = [...shareData.shareClasses];
    if (classForm.id !== null) {
      updated[classForm.id] = { type: classForm.type, totalValue, nominalValue, units };
    } else {
      updated.push({ type: classForm.type, totalValue, nominalValue, units });
    }
    updateShareData("shareClasses", updated);
    setShowClassModal(false);
  };

  const removeClass = (idx: number) => {
    const updated = shareData.shareClasses.filter((_: any, i: number) => i !== idx);
    updateShareData("shareClasses", updated);
  };

  // ==========================================
  // ALLOTMENT FORM HELPERS
  // ==========================================
  const getAvailableUnitsForType = (type: string) => {
    // Total units created for this type
    const classDef = shareData.shareClasses.find((c: any) => c.type === type);
    if (!classDef) return 0;
    
    // Total units already allotted for this type
    let allottedForType = shareData.allotments
      .filter((a: any) => a.type === type)
      .reduce((sum: number, a: any) => sum + Number(a.units), 0);
      
    // If editing, add back the units currently assigned in the form
    if (allotForm.officerId) {
       const existingRecord = shareData.allotments.find((a: any) => a.officerId === allotForm.officerId && a.type === type);
       if (existingRecord) {
         allottedForType -= existingRecord.units;
       }
    }

    return classDef.units - allottedForType;
  };

  const availableUnitsForCurrentType = getAvailableUnitsForType(allotForm.type);
  const isAllotmentOverLimit = Number(allotForm.units) > availableUnitsForCurrentType;

  const saveAllotment = () => {
    const unitsToAllot = Number(allotForm.units);
    if (unitsToAllot <= 0 || isAllotmentOverLimit) return;

    let updatedAllotments = [...shareData.allotments];
    const existingIdx = updatedAllotments.findIndex((a: any) => a.officerId === allotForm.officerId && a.type === allotForm.type);
    
    if (existingIdx >= 0) {
      updatedAllotments[existingIdx].units = unitsToAllot;
    } else {
      updatedAllotments.push({ officerId: allotForm.officerId, type: allotForm.type, units: unitsToAllot });
    }

    updateShareData("allotments", updatedAllotments);
    setShowAllotmentModal(false);
  };

  const openAllotment = (e: any, officerId: string) => {
    e.stopPropagation();
    const existing = shareData.allotments.find((a: any) => a.officerId === officerId);
    setAllotForm({ 
      officerId, 
      type: existing ? existing.type : (shareData.shareClasses[0]?.type || "EQUITY (ORDINARY)"), 
      units: existing ? existing.units.toString() : "" 
    });
    setShowAllotmentModal(true);
  };

  const getAllottedUnitsForOfficer = (officerId: string) => {
    const records = shareData.allotments.filter((a: any) => a.officerId === officerId);
    if (records.length === 0) return { text: "None Allotted", error: true };
    return { text: records.map((r: any) => `${formatNum(r.units)} ${r.type}`).join(" | "), error: false };
  };

  // Global Frontend Blocker Integration
  // To lock the parent page, we simulate an error state visually if showErrors is true
  const showGlobalBlocker = showErrors && (!isPerfectMatch || totalIssuedCapitalNum < minRequired);

  return (
    <div className="p-4 sm:p-10 space-y-10 animate-in fade-in duration-500 w-full overflow-hidden relative">
      
      {showGlobalBlocker && (
        <div className="bg-red-50 border-2 border-red-500 p-4 rounded-2xl mb-8 animate-bounce">
          <div className="flex items-center gap-3">
            <WarningCircle className="h-6 w-6 text-red-600 shrink-0" weight="fill" />
            <p className="text-sm font-black text-red-900">You cannot proceed. Ensure Total Capital is met, Share Classes match the total, and 100% of shares are allotted to Shareholders.</p>
          </div>
        </div>
      )}

      {showRefModal && (
        <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 flex flex-col max-h-[90vh] h-[90vh] sm:h-auto">
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
                  <ListMagnifyingGlass className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500" weight="fill" />
                  Statutory Share Capital
                </h3>
                <p className="text-[11px] sm:text-xs font-bold text-slate-500 mt-1">Check the minimum requirements based on your industry.</p>
              </div>
              <button onClick={() => setShowRefModal(false)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 transition-colors">
                <X weight="bold" className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-white">
              <div className="min-w-[600px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 sticky top-0 shadow-sm z-10">
                    <tr>
                      <th className="p-3 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 w-16 text-center">S/N</th>
                      <th className="p-3 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">Type of Company</th>
                      <th className="p-3 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 text-right pr-6">Minimum Share Capital (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold text-slate-700">
                    {DESIGNATED_COMPANIES.map((c, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3 text-slate-400 text-center">{c.id === 0 ? "-" : c.id}</td>
                        <td className="p-3 text-[11px] sm:text-xs leading-relaxed py-3">{c.type}</td>
                        <td className="p-3 text-right text-indigo-600 pr-6">{formatNum(c.min)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <Button onClick={() => setShowRefModal(false)} className="h-12 w-full sm:w-auto px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg">Close & Continue</Button>
            </div>
          </div>
        </div>
      )}

      <section>
        <div className="mb-6 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ChartPieSlice className="h-6 w-6" weight="fill" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Share Issue Capital</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Define the financial structure and volume of shares for the company.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Type of Company <span className="text-red-500">*</span></Label>
            <div className="relative">
              <select 
                className="w-full h-12 px-4 appearance-none border border-slate-200 rounded-xl text-[13px] sm:text-sm font-bold bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none" 
                value={shareData.companyType} 
                onChange={e => updateShareData("companyType", e.target.value)}
              >
                {DESIGNATED_COMPANIES.map(c => <option key={c.type} value={c.type}>{c.type}</option>)}
              </select>
              <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500 flex items-center justify-between">
              Required Minimum Capital
              <span className="text-indigo-600">₦</span>
            </Label>
            <Input type="text" value={formatNum(minRequired)} disabled className="h-12 font-black text-indigo-900 bg-indigo-50/50 border-indigo-100" />
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{numberToWordsNaira(minRequired)}</p>
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase flex items-center justify-between ${totalIssuedCapitalNum < minRequired ? 'text-red-500' : 'text-slate-500'}`}>
              Total Company Issued Share Capital
              <span className={totalIssuedCapitalNum < minRequired ? 'text-red-500' : 'text-slate-400'}>₦</span>
            </Label>
            <Input 
              type="text" 
              value={formatNum(shareData.totalIssuedCapital)} 
              onChange={e => updateShareData("totalIssuedCapital", cleanNum(e.target.value))} 
              className={`h-12 font-black text-lg ${totalIssuedCapitalNum < minRequired ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-300 focus:border-indigo-500'}`} 
            />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 bg-slate-100 px-3 py-1.5 rounded-md inline-block">
              {numberToWordsNaira(totalIssuedCapitalNum)}
            </p>
            {totalIssuedCapitalNum < minRequired && (
              <div className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1">
                <WarningCircle weight="fill" className="shrink-0" /> Must be at least {formatNum(minRequired)}
              </div>
            )}
          </div>
        </div>
      </section>

      <hr className="border-slate-100" />

      <section>
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Share Details Breakdown</h2>
            <div className="flex items-start gap-2 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" weight="fill" />
              <p className="text-xs font-medium text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-900">Preference shares</span> means a share which does not entitle the holder to participate beyond a specified amount. <br/>
                <span className="font-bold text-slate-900">Equity (ordinary) shares</span> means any share other than a preference share.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => { 
              // Intelligent pre-fill based on remaining capital
              const rem = totalIssuedCapitalNum - totalClassesValue;
              setClassForm({ id: null, type: "EQUITY (ORDINARY)", units: rem > 0 ? rem.toString() : "", nominalValue: "1" }); 
              setShowClassModal(true); 
            }} 
            disabled={remainingCapitalValue <= 0 && shareData.shareClasses.length > 0}
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shrink-0 shadow-md disabled:opacity-50"
          >
            <Plus weight="bold" className="mr-2" /> Add Share Class
          </Button>
        </div>

        {classMathError && (
          <div className="mb-4 bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3">
            <WarningCircle className="h-6 w-6 text-red-500 shrink-0" weight="fill" />
            <div>
              <p className="text-sm font-black text-red-900">Mismatch in Capital Breakdown</p>
              <p className="text-xs font-medium text-red-700">The total sum of your share classes (₦{formatNum(totalClassesValue)}) does not match your declared Total Issued Capital (₦{formatNum(totalIssuedCapitalNum)}). You have ₦{formatNum(remainingCapitalValue)} remaining to allocate.</p>
            </div>
          </div>
        )}

        {ordinaryShareError && (
          <div className="mb-4 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3">
            <WarningCircle className="h-6 w-6 text-amber-500 shrink-0" weight="fill" />
            <div>
              <p className="text-sm font-black text-amber-900">Missing Ordinary Shares</p>
              <p className="text-xs font-medium text-amber-800">A company cannot be registered with only Preference shares. You must add at least one EQUITY (ORDINARY) share class.</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">S/N</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Class Of Share</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Divided Into (Units)</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Price per Unit (₦)</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Calculated Total (₦)</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
              {shareData.shareClasses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">No share classes added. Click "Add Share Class" to begin.</td>
                </tr>
              ) : (
                shareData.shareClasses.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-4 text-slate-400">{idx + 1}</td>
                    <td className="p-4 text-indigo-600">{c.type}</td>
                    <td className="p-4 text-emerald-600 bg-emerald-50/50">{formatNum(c.units)}</td>
                    <td className="p-4">{formatNum(c.nominalValue)}</td>
                    <td className="p-4 font-black">
                      {formatNum(c.totalValue)}
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5">{numberToWordsNaira(c.totalValue)}</p>
                    </td>
                    <td className="p-4 text-center flex items-center justify-center gap-2">
                      <button onClick={() => { setClassForm({ id: idx, type: c.type, units: c.units.toString(), nominalValue: c.nominalValue.toString() }); setShowClassModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                        <PencilSimple className="h-4 w-4" weight="bold" />
                      </button>
                      <button onClick={() => removeClass(idx)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash className="h-4 w-4" weight="bold" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SHARE CLASS MODAL */}
      {showClassModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-black text-lg text-slate-900">{classForm.id !== null ? "Edit" : "Add"} Share Class</h3>
              <button onClick={() => setShowClassModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X weight="bold" /></button>
            </div>
            <div className="p-6 space-y-5">
              
              <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <span className="text-xs font-bold text-indigo-700">Available Capital</span>
                <span className="text-sm font-black text-indigo-900">₦{formatNum(availableCapital)}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Class of Shares <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <select value={classForm.type} onChange={e => setClassForm({...classForm, type: e.target.value})} className="w-full h-12 px-4 appearance-none border border-slate-200 rounded-xl text-sm font-bold bg-white focus:border-indigo-500 outline-none">
                    <option value="EQUITY (ORDINARY)">EQUITY (ORDINARY)</option>
                    <option value="PREFERENCE">PREFERENCE</option>
                  </select>
                  <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Divided Into (Units) <span className="text-red-500">*</span></Label>
                  <Input type="text" placeholder="E.g. 1,000,000" value={formatNum(classForm.units)} onChange={e => setClassForm({...classForm, units: cleanNum(e.target.value)})} className="h-12 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Price per Unit ₦ <span className="text-red-500">*</span></Label>
                  <Input type="text" placeholder="E.g. 1" value={formatNum(classForm.nominalValue)} onChange={e => setClassForm({...classForm, nominalValue: cleanNum(e.target.value)})} className="h-12 font-bold" />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label className="text-xs font-bold uppercase text-slate-500">Calculated Total Value ₦</Label>
                <Input type="text" disabled value={formatNum(classLiveTotalValue)} className={`h-12 font-black ${isClassOverLimit ? 'bg-red-50 text-red-600 border-red-300' : 'bg-slate-100 text-slate-900'}`} />
                {isClassOverLimit && (
                  <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1">
                    <WarningCircle weight="fill" /> Exceeds available capital by ₦{formatNum(classLiveTotalValue - availableCapital)}
                  </p>
                )}
              </div>

            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setShowClassModal(false)} className="h-12 px-6 rounded-xl font-bold bg-white">Cancel</Button>
              <Button onClick={saveShareClass} disabled={!classForm.units || !classForm.nominalValue || isClassOverLimit} className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50">Save Class</Button>
            </div>
          </div>
        </div>
      )}

      <hr className="border-slate-100" />

      {/* MAIN UI: SHAREHOLDER ALLOTMENT TABLE */}
      <section>
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Shareholders Allotment</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Assign the created shares to the owners.</p>
          </div>
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold text-sm ${
            isPerfectMatch ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
            'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            {isPerfectMatch ? <CheckCircle className="h-5 w-5" weight="fill" /> : <WarningCircle className="h-5 w-5" weight="fill" />}
            {isPerfectMatch ? "100% Distributed" : `${formatNum(Math.abs(remainingAllotmentUnits))} units unassigned`}
          </div>
        </div>

        {shareholders.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
            <User className="h-10 w-10 text-slate-300 mx-auto mb-3" weight="duotone" />
            <p className="text-sm font-medium text-slate-500">No Shareholders found.</p>
            <p className="text-xs font-bold text-indigo-500 mt-1">Please go back to Step 4 and add at least one Shareholder.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shareholders.map((officer: any, idx: number) => {
              const allotmentCheck = getAllottedUnitsForOfficer(officer.id);

              return (
                <div key={officer.id} className="bg-white border border-slate-200 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all overflow-hidden hover:border-indigo-300">
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedId(expandedOfficerId === officer.id ? null : officer.id)}>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                        <User className="h-6 w-6" weight="fill" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">{officer.firstName} {officer.surname}</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">S/N: {idx + 1} | SHAREHOLDER</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 w-full md:w-auto">
                      <div className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mr-auto md:mr-2 ${allotmentCheck.error ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        {allotmentCheck.text}
                      </div>

                      <div className={`hidden sm:flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-lg transition-colors ${expandedOfficerId === officer.id ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-600'}`}>
                        {expandedOfficerId === officer.id ? "Hide Details" : "View Details"}
                        {expandedOfficerId === officer.id ? <CaretUp weight="bold" /> : <CaretDown weight="bold" />}
                      </div>

                      <button onClick={(e) => openAllotment(e, officer.id)} disabled={shareData.shareClasses.length === 0} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors z-10 relative flex items-center gap-1.5 shadow-sm disabled:opacity-50">
                        <Coins className="h-4 w-4" weight="fill" /> Allot
                      </button>
                    </div>
                  </div>

                  {expandedOfficerId === officer.id && (
                    <div className="p-5 sm:p-6 border-t border-slate-200 bg-slate-50/50 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 border-b border-indigo-100 pb-1">Personal Details</h4>
                          <DetailRow label="Surname" value={officer.surname} />
                          <DetailRow label="First Name" value={officer.firstName} />
                          <DetailRow label="Other Name" value={officer.otherName} />
                          <DetailRow label="Gender" value={officer.gender} />
                          <DetailRow label="Date of Birth" value={officer.dob} />
                          <DetailRow label="Nationality" value={officer.nationality} />
                          <DetailRow label="Occupation" value={officer.occupation} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 border-b border-indigo-100 pb-1">Contact & ID</h4>
                          <DetailRow label="Phone" value={`${officer.phoneCode} ${officer.phone}`} />
                          <DetailRow label="Email" value={officer.email} />
                          <DetailRow label="ID Type" value={officer.idType} />
                          <DetailRow label="ID Number" value={officer.idNumber} />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 border-b border-indigo-100 pb-1">Residential Address</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1">
                            <DetailRow label="State / Province" value={officer.residentialAddress?.state} />
                            <DetailRow label="LGA / County" value={officer.residentialAddress?.lga} />
                            <DetailRow label="City / Town" value={officer.residentialAddress?.city} />
                            <DetailRow label="Street Address" value={officer.residentialAddress?.street} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ALLOTMENT MODAL */}
      {showAllotmentModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50 shrink-0">
              <h3 className="font-black text-lg text-emerald-900 flex items-center gap-2">
                <Coins className="h-6 w-6 text-emerald-500" weight="fill" />
                Allot Shares
              </h3>
              <button onClick={() => setShowAllotmentModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X weight="bold" /></button>
            </div>
            <div className="p-6 space-y-5">
              
              <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <span className="text-xs font-bold text-emerald-700">Available Units ({allotForm.type})</span>
                <span className="text-sm font-black text-emerald-900">{formatNum(availableUnitsForCurrentType)}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Select Share Class <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <select 
                    value={allotForm.type} 
                    onChange={e => {
                      const newType = e.target.value;
                      // Fetch existing if they switch types
                      const existing = shareData.allotments.find((a: any) => a.officerId === allotForm.officerId && a.type === newType);
                      setAllotForm({...allotForm, type: newType, units: existing ? existing.units.toString() : ""});
                    }} 
                    className="w-full h-12 px-4 appearance-none border border-slate-200 rounded-xl text-sm font-bold bg-white focus:border-indigo-500 outline-none"
                  >
                    {shareData.shareClasses.map((c: any) => (
                      <option key={c.type} value={c.type}>{c.type}</option>
                    ))}
                  </select>
                  <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Number of Units to Allot <span className="text-red-500">*</span></Label>
                <Input type="text" placeholder="E.g. 500,000" value={formatNum(allotForm.units)} onChange={e => setAllotForm({...allotForm, units: cleanNum(e.target.value)})} className={`h-12 font-black text-lg ${isAllotmentOverLimit ? 'border-red-500 text-red-600 bg-red-50' : ''}`} />
                {isAllotmentOverLimit && (
                  <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1">
                    <WarningCircle weight="fill" /> You cannot allot more units than are available in this class.
                  </p>
                )}
              </div>

            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setShowAllotmentModal(false)} className="h-12 px-6 rounded-xl font-bold bg-white">Cancel</Button>
              <Button onClick={saveAllotment} disabled={!allotForm.units || isAllotmentOverLimit} className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50">Assign Shares</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
