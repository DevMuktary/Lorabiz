"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChartPieSlice, Info, Plus, Trash, PencilSimple, CheckCircle, WarningCircle, X, ListMagnifyingGlass, User, CaretDown, CaretUp, Coins } from "@phosphor-icons/react";
import { DESIGNATED_COMPANIES, numberToWordsNaira, formatNumberWithCommas, parseNumber } from "@/lib/share-capital-data";

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-start py-2.5 border-b border-slate-200/60 last:border-0 gap-4">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0 mt-0.5">{label}</span>
    <span className="text-[13px] font-black text-slate-900 text-right break-words">{value || "-"}</span>
  </div>
);

export default function ShareCapitalStep({ data, updateData, showErrors }: any) {
  const [showRefModal, setShowRefModal] = useState(true);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showAllotmentModal, setShowAllotmentModal] = useState(false);
  const [expandedOfficerId, setExpandedId] = useState<string | null>(null);

  const [classForm, setClassForm] = useState<any>({ id: null, type: "EQUITY (ORDINARY)", totalValue: "", nominalValue: "" });
  const [allotForm, setAllotForm] = useState<any>({ officerId: "", type: "EQUITY (ORDINARY)", units: "" });

  // ==========================================
  // ANTI-CRASH SAFEGUARDS
  // ==========================================
  // If the database sends old object data, we force it to become an array to prevent .map() crashes
  const rawShareData = data.shareCapital || {};
  const shareData = {
    companyType: rawShareData.companyType || "ENTITY WITH SHARES BELOW FIVE MILLION",
    totalIssuedCapital: rawShareData.totalIssuedCapital || 1000000,
    shareClasses: Array.isArray(rawShareData.shareClasses) ? rawShareData.shareClasses : [],
    allotments: Array.isArray(rawShareData.allotments) ? rawShareData.allotments : []
  };

  const shareholders = (data.officers || []).filter((o: any) => o.roles.includes("SHAREHOLDER"));

  const updateShareData = (field: string, value: any) => {
    updateData((prev: any) => ({ ...prev, shareCapital: { ...shareData, [field]: value } }));
  };

  const selectedCompanyInfo = DESIGNATED_COMPANIES.find(c => c.type === shareData.companyType);
  const minRequired = selectedCompanyInfo ? selectedCompanyInfo.min : 1000000;

  // ==========================================
  // MATH & CLASSES ENGINE
  // ==========================================
  const totalClassesValue = shareData.shareClasses.reduce((acc: number, c: any) => acc + (Number(c.totalValue) || 0), 0);
  const classError = shareData.totalIssuedCapital > 0 && totalClassesValue !== shareData.totalIssuedCapital;

  const saveShareClass = () => {
    if (!classForm.totalValue || !classForm.nominalValue) return;
    const tv = parseNumber(classForm.totalValue);
    const nv = parseNumber(classForm.nominalValue);
    const units = Math.floor(tv / nv);

    let updated = [...shareData.shareClasses];
    if (classForm.id !== null) {
      updated[classForm.id] = { type: classForm.type, totalValue: tv, nominalValue: nv, units };
    } else {
      updated.push({ type: classForm.type, totalValue: tv, nominalValue: nv, units });
    }
    updateShareData("shareClasses", updated);
    setShowClassModal(false);
  };

  const removeClass = (idx: number) => {
    const updated = shareData.shareClasses.filter((_: any, i: number) => i !== idx);
    updateShareData("shareClasses", updated);
  };

  // ==========================================
  // ALLOTMENT ENGINE
  // ==========================================
  const totalAllotted = shareData.allotments.reduce((acc: number, a: any) => acc + (Number(a.units) || 0), 0);
  const totalRequired = shareData.totalIssuedCapital;
  const remainingShares = totalRequired - totalAllotted;
  const isPerfectMatch = remainingShares === 0 && !classError;

  const saveAllotment = () => {
    const unitsToAllot = parseNumber(allotForm.units);
    if (unitsToAllot <= 0) return;

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
      units: existing ? formatNumberWithCommas(existing.units) : "" 
    });
    setShowAllotmentModal(true);
  };

  const getAllottedUnitsForOfficer = (officerId: string) => {
    const records = shareData.allotments.filter((a: any) => a.officerId === officerId);
    if (records.length === 0) return { text: "None Allotted", error: true };
    return { text: records.map((r: any) => `${formatNumberWithCommas(r.units)} ${r.type}`).join(" | "), error: false };
  };

  return (
    <div className="p-4 sm:p-10 space-y-10 animate-in fade-in duration-500 w-full overflow-hidden relative">
      
      {/* 1. MINIMUM CAPITAL REFERENCE MODAL */}
      {showRefModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <ListMagnifyingGlass className="h-6 w-6 text-indigo-500" weight="fill" />
                  Statutory Share Capital Requirements
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-1">For most standard companies, it is usually under 5 Million Shares. You can close this to continue.</p>
              </div>
              <button onClick={() => setShowRefModal(false)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 transition-colors">
                <X weight="bold" />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="p-3 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">S/N</th>
                    <th className="p-3 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">Type of Company</th>
                    <th className="p-3 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200 text-right">Minimum Share Capital (₦)</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-bold text-slate-700">
                  {DESIGNATED_COMPANIES.map((c, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 text-slate-400">{c.id === 0 ? "-" : c.id}</td>
                      <td className="p-3">{c.type}</td>
                      <td className="p-3 text-right text-indigo-600">{formatNumberWithCommas(c.min)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <Button onClick={() => setShowRefModal(false)} className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl">Close & Continue</Button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN UI: CAPITAL DECLARATION */}
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
                className="w-full h-12 px-4 appearance-none border border-slate-200 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none" 
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
            <Input type="text" value={formatNumberWithCommas(minRequired)} disabled className="h-12 font-black text-indigo-900 bg-indigo-50/50 border-indigo-100" />
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{numberToWordsNaira(minRequired)}</p>
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase flex items-center justify-between ${shareData.totalIssuedCapital < minRequired ? 'text-red-500' : 'text-slate-500'}`}>
              Total Company Issued Share Capital
              <span className={shareData.totalIssuedCapital < minRequired ? 'text-red-500' : 'text-slate-400'}>₦</span>
            </Label>
            <Input 
              type="text" 
              value={formatNumberWithCommas(shareData.totalIssuedCapital)} 
              onChange={e => updateShareData("totalIssuedCapital", parseNumber(e.target.value))} 
              className={`h-12 font-black text-lg ${shareData.totalIssuedCapital < minRequired ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-300 focus:border-indigo-500'}`} 
            />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 bg-slate-100 px-3 py-1.5 rounded-md inline-block">
              {numberToWordsNaira(shareData.totalIssuedCapital)}
            </p>
            {shareData.totalIssuedCapital < minRequired && (
              <div className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1">
                <WarningCircle weight="fill" /> Must be at least {formatNumberWithCommas(minRequired)}
              </div>
            )}
          </div>
        </div>
      </section>

      <hr className="border-slate-100" />

      {/* MAIN UI: SHARE BREAKDOWN TABLE */}
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
          <Button onClick={() => { setClassForm({ id: null, type: "EQUITY (ORDINARY)", totalValue: "", nominalValue: "" }); setShowClassModal(true); }} className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shrink-0 shadow-md">
            <Plus weight="bold" className="mr-2" /> Add Share Class
          </Button>
        </div>

        {classError && (
          <div className="mb-4 bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3">
            <WarningCircle className="h-6 w-6 text-red-500 shrink-0" weight="fill" />
            <div>
              <p className="text-sm font-black text-red-900">Mismatch in Capital Breakdown</p>
              <p className="text-xs font-medium text-red-700">The total sum of your share classes (₦{formatNumberWithCommas(totalClassesValue)}) does not match your declared Total Issued Capital (₦{formatNumberWithCommas(shareData.totalIssuedCapital)}). Please correct this.</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">S/N</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Class Of Share</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Issue Share Capital (₦)</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Issued Capital in Words</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Divided Into (Units)</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 whitespace-nowrap">Price per Unit (₦)</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
              {shareData.shareClasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">No share classes added. Click "Add Share Class" to begin.</td>
                </tr>
              ) : (
                shareData.shareClasses.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-4 text-slate-400">{idx + 1}</td>
                    <td className="p-4 text-indigo-600">{c.type}</td>
                    <td className="p-4">{formatNumberWithCommas(c.totalValue)}</td>
                    <td className="p-4 text-[10px] uppercase text-slate-500 max-w-[200px] truncate" title={numberToWordsNaira(c.totalValue)}>{numberToWordsNaira(c.totalValue)}</td>
                    <td className="p-4 text-emerald-600 bg-emerald-50/50">{formatNumberWithCommas(c.units)}</td>
                    <td className="p-4">{formatNumberWithCommas(c.nominalValue)}</td>
                    <td className="p-4 text-center flex items-center justify-center gap-2">
                      <button onClick={() => { setClassForm({ id: idx, type: c.type, totalValue: formatNumberWithCommas(c.totalValue), nominalValue: formatNumberWithCommas(c.nominalValue) }); setShowClassModal(true); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
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
            <div className="p-6 space-y-4">
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
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Total Value for this Class (₦) <span className="text-red-500">*</span></Label>
                <Input type="text" placeholder="E.g. 1,000,000" value={classForm.totalValue} onChange={e => setClassForm({...classForm, totalValue: formatNumberWithCommas(e.target.value)})} className="h-12 font-bold" />
                <p className="text-[10px] font-black text-indigo-500 uppercase mt-1">{numberToWordsNaira(parseNumber(classForm.totalValue))}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Nominal Value Per Share (Price) ₦ <span className="text-red-500">*</span></Label>
                <Input type="text" placeholder="E.g. 1" value={classForm.nominalValue} onChange={e => setClassForm({...classForm, nominalValue: formatNumberWithCommas(e.target.value)})} className="h-12 font-bold" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setShowClassModal(false)} className="h-12 px-6 rounded-xl font-bold bg-white">Cancel</Button>
              <Button onClick={saveShareClass} disabled={!classForm.totalValue || !classForm.nominalValue} className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md">Save Class</Button>
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
            remainingShares < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            {isPerfectMatch ? <CheckCircle className="h-5 w-5" weight="fill" /> : <WarningCircle className="h-5 w-5" weight="fill" />}
            {isPerfectMatch ? "100% Distributed" : remainingShares < 0 ? `${formatNumberWithCommas(Math.abs(remainingShares))} units OVER-distributed!` : `${formatNumberWithCommas(remainingShares)} units unassigned`}
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

                      <button onClick={(e) => openAllotment(e, officer.id)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors z-10 relative flex items-center gap-1.5 shadow-sm">
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
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Select Share Class <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <select value={allotForm.type} onChange={e => setAllotForm({...allotForm, type: e.target.value})} className="w-full h-12 px-4 appearance-none border border-slate-200 rounded-xl text-sm font-bold bg-white focus:border-indigo-500 outline-none">
                    {shareData.shareClasses.map((c: any) => (
                      <option key={c.type} value={c.type}>{c.type} (Available: {formatNumberWithCommas(c.units)} Units)</option>
                    ))}
                  </select>
                  <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Number of Units to Allot <span className="text-red-500">*</span></Label>
                <Input type="text" placeholder="E.g. 500,000" value={allotForm.units} onChange={e => setAllotForm({...allotForm, units: formatNumberWithCommas(e.target.value)})} className="h-12 font-bold text-lg" />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setShowAllotmentModal(false)} className="h-12 px-6 rounded-xl font-bold bg-white">Cancel</Button>
              <Button onClick={saveAllotment} disabled={!allotForm.units} className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md">Assign Shares</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
