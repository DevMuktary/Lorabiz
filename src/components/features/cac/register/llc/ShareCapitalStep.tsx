"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChartPieSlice, Info, Plus, Trash, PencilSimple, WarningCircle, User, CaretDown, CaretUp, Coins, CheckCircle, UserPlus } from "@phosphor-icons/react";
import { DESIGNATED_COMPANIES, numberToWordsNaira } from "@/lib/share-capital-data";
import { ReferenceModal, ShareClassModal, AllotmentModal, StandaloneShareholderModal } from "./ShareCapitalModals";

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-start py-2.5 border-b border-slate-200/60 last:border-0 gap-4">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0 mt-0.5">{label}</span>
    <span className="text-[13px] font-black text-slate-900 text-right break-words">{value || "-"}</span>
  </div>
);

const formatNum = (val: any) => (val === "" || val === null || isNaN(val)) ? "" : Number(val).toLocaleString("en-US");
const cleanNum = (val: string) => val.replace(/\D/g, "");

export default function ShareCapitalStep({ data, updateData, showErrors }: any) {
  const [modals, setModals] = useState({ ref: true, class: false, allot: false, sh: false });
  const [editingClassIdx, setEditingClassIdx] = useState<number | null>(null);
  const [allottingOfficerId, setAllottingOfficerId] = useState<string | null>(null);
  const [expandedOfficerId, setExpandedId] = useState<string | null>(null);

  const rawShareData = data.shareCapital || {};
  const allOfficers = data.officers || [];
  
  const activeShareholders = allOfficers.filter((o: any) => o.roles.includes("SHAREHOLDER"));
  const validIds = new Set(activeShareholders.map((o: any) => o.id));

  // The Master Allotments Array (safe from ghost wipes)
  const cleanAllotments = (Array.isArray(rawShareData.allotments) ? rawShareData.allotments : []).filter((a: any) => validIds.has(a.officerId));

  const shareData = {
    companyType: rawShareData.companyType || "ENTITY WITH SHARES BELOW FIVE MILLION",
    totalIssuedCapital: rawShareData.totalIssuedCapital !== undefined ? rawShareData.totalIssuedCapital : "1000000",
    shareClasses: Array.isArray(rawShareData.shareClasses) ? rawShareData.shareClasses : [],
    allotments: cleanAllotments 
  };

  const updateShareData = (field: string, value: any) => {
    updateData((prev: any) => ({ ...prev, shareCapital: { ...shareData, [field]: value } }));
  };

  // CORE MATH
  const selectedCompanyInfo = DESIGNATED_COMPANIES.find(c => c.type === shareData.companyType);
  const minRequired = selectedCompanyInfo ? selectedCompanyInfo.min : 1000000;
  const totalIssuedCapitalNum = Number(shareData.totalIssuedCapital) || 0;

  const totalClassesValue = shareData.shareClasses.reduce((acc: number, c: any) => acc + (Number(c.totalValue) || 0), 0);
  const remainingCapitalValue = totalIssuedCapitalNum - totalClassesValue;
  const classMathError = totalIssuedCapitalNum > 0 && totalClassesValue !== totalIssuedCapitalNum;
  
  const hasOrdinaryShares = shareData.shareClasses.some((c: any) => c.type === "EQUITY (ORDINARY)");
  const ordinaryShareError = shareData.shareClasses.length > 0 && !hasOrdinaryShares;

  const totalRequiredUnits = shareData.shareClasses.reduce((acc: number, c: any) => acc + (Number(c.units) || 0), 0);
  const totalAllotted = cleanAllotments.reduce((acc: number, a: any) => acc + (Number(a.units) || 0), 0);
  const remainingAllotmentUnits = totalRequiredUnits - totalAllotted;
  const isPerfectMatch = totalRequiredUnits > 0 && remainingAllotmentUnits === 0 && !classMathError && !ordinaryShareError;

  const removeClass = (idx: number) => {
    updateShareData("shareClasses", shareData.shareClasses.filter((_: any, i: number) => i !== idx));
  };

  const removeShareholder = (e: any, officerId: string) => {
    e.stopPropagation();
    const officer = allOfficers.find((o: any) => o.id === officerId);
    if (!officer) return;

    if (officer.roles.includes("DIRECTOR")) {
      const newOfficers = allOfficers.map((o: any) => o.id === officerId ? { ...o, roles: o.roles.filter((r: string) => r !== "SHAREHOLDER") } : o);
      updateData((prev: any) => ({ ...prev, officers: newOfficers, shareCapital: { ...shareData, allotments: cleanAllotments.filter((a: any) => a.officerId !== officerId) } }));
    } else {
      const newOfficers = allOfficers.filter((o: any) => o.id !== officerId);
      updateData((prev: any) => ({ ...prev, officers: newOfficers, shareCapital: { ...shareData, allotments: cleanAllotments.filter((a: any) => a.officerId !== officerId) } }));
    }
  };

  const getAllottedUnitsForOfficer = (officerId: string) => {
    const records = cleanAllotments.filter((a: any) => a.officerId === officerId);
    if (records.length === 0) return { text: "None Allotted", error: true };
    return { text: records.map((r: any) => `${formatNum(r.units)} ${r.type}`).join(" | "), error: false };
  };

  return (
    <div className="p-4 sm:p-10 space-y-10 animate-in fade-in duration-500 w-full overflow-hidden relative">
      
      {modals.ref && <ReferenceModal onClose={() => setModals({ ...modals, ref: false })} />}
      {modals.class && <ShareClassModal onClose={() => setModals({ ...modals, class: false })} shareData={shareData} updateShareData={updateShareData} editingIdx={editingClassIdx} totalCapital={totalIssuedCapitalNum} />}
      {modals.allot && <AllotmentModal onClose={() => setModals({ ...modals, allot: false })} shareData={shareData} updateShareData={updateShareData} officerId={allottingOfficerId} />}
      {modals.sh && <StandaloneShareholderModal onClose={() => setModals({ ...modals, sh: false })} shareData={shareData} updateData={updateData} cleanAllotments={cleanAllotments} />}

      {/* CAPITAL DECLARATION */}
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
              <select className="w-full h-12 px-4 appearance-none border border-slate-200 rounded-xl text-[13px] sm:text-sm font-bold bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none" value={shareData.companyType} onChange={e => updateShareData("companyType", e.target.value)}>
                {DESIGNATED_COMPANIES.map(c => <option key={c.type} value={c.type}>{c.type}</option>)}
              </select>
              <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500 flex items-center justify-between">Required Minimum Capital <span className="text-indigo-600">₦</span></Label>
            <Input type="text" value={formatNum(minRequired)} disabled className="h-12 font-black text-indigo-900 bg-indigo-50/50 border-indigo-100" />
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{numberToWordsNaira(minRequired)}</p>
          </div>
          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase flex items-center justify-between ${showErrors && totalIssuedCapitalNum < minRequired ? 'text-red-500' : 'text-slate-500'}`}>Total Company Issued Share Capital <span className={showErrors && totalIssuedCapitalNum < minRequired ? 'text-red-500' : 'text-slate-400'}>₦</span></Label>
            <Input type="text" value={formatNum(shareData.totalIssuedCapital)} onChange={e => updateShareData("totalIssuedCapital", cleanNum(e.target.value))} className={`h-12 font-black text-lg ${showErrors && totalIssuedCapitalNum < minRequired ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-300 focus:border-indigo-500'}`} />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 bg-slate-100 px-3 py-1.5 rounded-md inline-block">{numberToWordsNaira(totalIssuedCapitalNum)}</p>
            {showErrors && totalIssuedCapitalNum < minRequired && <div className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-1"><WarningCircle weight="fill" className="shrink-0" /> Must be at least {formatNum(minRequired)}</div>}
          </div>
        </div>
      </section>

      <hr className="border-slate-100" />

      {/* SHARE CLASSES TABLE */}
      <section>
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Share Details Breakdown</h2>
            <div className="flex items-start gap-2 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" weight="fill" />
              <p className="text-xs font-medium text-slate-600 leading-relaxed"><span className="font-bold text-slate-900">Preference shares</span> means a share which does not entitle the holder to participate beyond a specified amount. <br/><span className="font-bold text-slate-900">Equity (ordinary) shares</span> means any share other than a preference share.</p>
            </div>
          </div>
          <Button onClick={() => { setEditingClassIdx(null); setModals({ ...modals, class: true }); }} disabled={remainingCapitalValue <= 0 || shareData.shareClasses.length >= 2} className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shrink-0 shadow-md disabled:opacity-50">
            <Plus weight="bold" className="mr-2" /> Add Share Class
          </Button>
        </div>

        {showErrors && classMathError && (
          <div className="mb-4 bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3">
            <WarningCircle className="h-6 w-6 text-red-500 shrink-0" weight="fill" />
            <div>
              <p className="text-sm font-black text-red-900">Mismatch in Capital Breakdown</p>
              <p className="text-xs font-medium text-red-700">The total sum of your share classes (₦{formatNum(totalClassesValue)}) does not match your declared capital. You have ₦{formatNum(remainingCapitalValue)} remaining.</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto bg-white border border-slate-200 rounded-2xl shadow-sm custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500">S/N</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500">Class Of Share</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500">Divided Into (Units)</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500">Price per Unit (₦)</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500">Calculated Total (₦)</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-100">
              {shareData.shareClasses.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-medium">No share classes added. Click "Add Share Class" to begin.</td></tr>
              ) : (
                shareData.shareClasses.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-4 text-slate-400">{idx + 1}</td>
                    <td className="p-4 text-indigo-600">{c.type}</td>
                    <td className="p-4 text-emerald-600 bg-emerald-50/50">{formatNum(c.units)}</td>
                    <td className="p-4">{formatNum(c.nominalValue)}</td>
                    <td className="p-4 font-black">{formatNum(c.totalValue)}<p className="text-[9px] text-slate-400 font-medium mt-0.5">{numberToWordsNaira(c.totalValue)}</p></td>
                    <td className="p-4 text-center flex items-center justify-center gap-2">
                      <button onClick={() => { setEditingClassIdx(idx); setModals({ ...modals, class: true }); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><PencilSimple className="h-4 w-4" weight="bold" /></button>
                      <button onClick={() => removeClass(idx)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash className="h-4 w-4" weight="bold" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <hr className="border-slate-100" />

      {/* SHAREHOLDERS TABLE */}
      <section>
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Shareholders Allotment</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Assign the created shares to the owners.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold text-sm ${isPerfectMatch ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
              {isPerfectMatch ? <CheckCircle className="h-5 w-5" weight="fill" /> : <WarningCircle className="h-5 w-5" weight="fill" />}
              {isPerfectMatch ? "100% Distributed" : `${formatNum(Math.abs(remainingAllotmentUnits))} units unassigned`}
            </div>
            <Button onClick={() => setModals({ ...modals, sh: true })} className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md">
              <UserPlus weight="bold" className="mr-2 h-4 w-4" /> Add Standalone Shareholder
            </Button>
          </div>
        </div>

        {activeShareholders.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
            <User className="h-10 w-10 text-slate-300 mx-auto mb-3" weight="duotone" />
            <p className="text-sm font-medium text-slate-500">No Shareholders found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeShareholders.map((officer: any, idx: number) => {
              const allotmentCheck = getAllottedUnitsForOfficer(officer.id);
              return (
                <div key={officer.id} className="bg-white border border-slate-200 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all overflow-hidden hover:border-indigo-300">
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedId(expandedOfficerId === officer.id ? null : officer.id)}>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0"><User className="h-6 w-6" weight="fill" /></div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">{officer.firstName} {officer.surname}</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">S/N: {idx + 1} | {officer.roles.includes("DIRECTOR") ? "DIRECTOR & SHAREHOLDER" : "SHAREHOLDER ONLY"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 w-full md:w-auto">
                      <div className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mr-auto md:mr-2 ${allotmentCheck.error ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>{allotmentCheck.text}</div>
                      <div className={`hidden sm:flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-lg transition-colors ${expandedOfficerId === officer.id ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-600'}`}>
                        {expandedOfficerId === officer.id ? "Hide Details" : "View Details"}
                        {expandedOfficerId === officer.id ? <CaretUp weight="bold" /> : <CaretDown weight="bold" />}
                      </div>
                      <button onClick={(e) => { setAllottingOfficerId(officer.id); setModals({ ...modals, allot: true }); }} disabled={shareData.shareClasses.length === 0} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors z-10 relative flex items-center gap-1.5 shadow-sm disabled:opacity-50"><Coins className="h-4 w-4" weight="fill" /> Allot</button>
                      <button onClick={(e) => removeShareholder(e, officer.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors z-10 relative"><Trash className="h-5 w-5" weight="bold" /></button>
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
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 border-b border-indigo-100 pb-1">Contact & ID</h4>
                          <DetailRow label="Phone" value={`${officer.phoneCode} ${officer.phone}`} />
                          <DetailRow label="Email" value={officer.email} />
                          <DetailRow label="ID Type" value={officer.idType} />
                          <DetailRow label="ID Number" value={officer.idNumber} />
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
    </div>
  );
}
