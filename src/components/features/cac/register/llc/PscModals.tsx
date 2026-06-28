"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { WarningCircle, X, UserPlus, PencilSimple } from "@phosphor-icons/react";
import { COUNTRY_CODES, NIGERIA_DATA } from "@/components/features/cac/register/biz-name/schema";

// ==========================================
// 1. EDIT EXISTING PSC MODAL
// ==========================================
export function EditPscModal({ onClose, officer, updateData }: any) {
  const [form, setForm] = useState<any>({
    isPep: officer.pscDetails?.isPep || "",
    hasAffiliation: officer.pscDetails?.hasAffiliation || "",
    holdsSharesIndirect: officer.pscDetails?.holdsSharesIndirect || "No",
    holdsVotingDirect: officer.pscDetails?.holdsVotingDirect?.includes("Yes") ? "Yes" : "No", // Normalized for dropdown
    holdsVotingIndirect: officer.pscDetails?.holdsVotingIndirect || "No",
    canAppointRemove: officer.pscDetails?.canAppointRemove || "No",
    hasSignificantInfluence: officer.pscDetails?.hasSignificantInfluence || "No"
  });

  const isAutoPsc = officer.roles.includes("SHAREHOLDER") && officer.pscDetails?.sharesPercentage;

  const handleSave = () => {
    if (!form.isPep || !form.hasAffiliation) return;

    updateData((prev: any) => ({
      ...prev,
      officers: prev.officers.map((o: any) => {
        if (o.id === officer.id) {
          return {
            ...o,
            pscDetails: {
              ...o.pscDetails,
              ...form,
              // If they selected Yes, append the percentage back for backend
              holdsVotingDirect: form.holdsVotingDirect === "Yes" && officer.pscDetails?.sharesPercentage ? `Yes (${officer.pscDetails.sharesPercentage}%)` : form.holdsVotingDirect
            }
          };
        }
        return o;
      })
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-2"><PencilSimple className="h-6 w-6 text-indigo-500" weight="fill" /> Update PSC Details</h3>
            <p className="text-xs font-bold text-slate-500 mt-1">For {officer.firstName} {officer.surname}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X weight="bold" /></button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase text-slate-500">Is the PSC a Politically Exposed Person? *</Label>
              <select className="w-full h-12 px-4 border border-slate-200 bg-white rounded-xl text-sm font-bold outline-none focus:border-indigo-500" value={form.isPep} onChange={e => setForm({...form, isPep: e.target.value})}>
                <option value="">-- Select --</option><option value="No">No</option><option value="Yes">Yes</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase text-slate-500">Does the PSC have any affiliation? *</Label>
              <select className="w-full h-12 px-4 border border-slate-200 bg-white rounded-xl text-sm font-bold outline-none focus:border-indigo-500" value={form.hasAffiliation} onChange={e => setForm({...form, hasAffiliation: e.target.value})}>
                <option value="">-- Select --</option><option value="No">No</option><option value="Yes">Yes</option>
              </select>
            </div>
          </div>

          <hr className="border-slate-100" />
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Details of Interest Held</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isAutoPsc && (
              <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200 md:col-span-2">
                <Label className="text-[11px] font-bold uppercase text-slate-500">Directly holds &gt;= 5% Shares? (Auto-Calculated)</Label>
                <Input value={`Yes (${officer.pscDetails?.sharesPercentage}%)`} disabled className="h-10 font-bold bg-slate-100 text-slate-500" />
              </div>
            )}
            
            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <Label className="text-[11px] font-bold uppercase text-slate-500">Indirectly holds &gt;= 5% Shares?</Label>
              <select className="w-full h-10 px-4 border border-slate-200 bg-white rounded-lg text-sm font-bold outline-none focus:border-indigo-500" value={form.holdsSharesIndirect} onChange={e => setForm({...form, holdsSharesIndirect: e.target.value})}>
                <option value="No">No</option><option value="Yes">Yes</option>
              </select>
            </div>

            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <Label className="text-[11px] font-bold uppercase text-slate-500">Directly holds &gt;= 5% Voting Rights?</Label>
              <select className="w-full h-10 px-4 border border-slate-200 bg-white rounded-lg text-sm font-bold outline-none focus:border-indigo-500" value={form.holdsVotingDirect} onChange={e => setForm({...form, holdsVotingDirect: e.target.value})} disabled={isAutoPsc} title={isAutoPsc ? "Auto-mirrors your direct shares" : ""}>
                <option value="No">No</option><option value="Yes">Yes</option>
              </select>
            </div>

            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <Label className="text-[11px] font-bold uppercase text-slate-500">Indirectly holds &gt;= 5% Voting Rights?</Label>
              <select className="w-full h-10 px-4 border border-slate-200 bg-white rounded-lg text-sm font-bold outline-none focus:border-indigo-500" value={form.holdsVotingIndirect} onChange={e => setForm({...form, holdsVotingIndirect: e.target.value})}>
                <option value="No">No</option><option value="Yes">Yes</option>
              </select>
            </div>

            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <Label className="text-[11px] font-bold uppercase text-slate-500">Right to Appoint/Remove directors?</Label>
              <select className="w-full h-10 px-4 border border-slate-200 bg-white rounded-lg text-sm font-bold outline-none focus:border-indigo-500" value={form.canAppointRemove} onChange={e => setForm({...form, canAppointRemove: e.target.value})}>
                <option value="No">No</option><option value="Yes">Yes</option>
              </select>
            </div>

            <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200 md:col-span-2">
              <Label className="text-[11px] font-bold uppercase text-slate-500">Exercises Significant Influence or Control?</Label>
              <select className="w-full h-10 px-4 border border-slate-200 bg-white rounded-lg text-sm font-bold outline-none focus:border-indigo-500" value={form.hasSignificantInfluence} onChange={e => setForm({...form, hasSignificantInfluence: e.target.value})}>
                <option value="No">No</option><option value="Yes">Yes</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} className="h-12 px-6 rounded-xl font-bold bg-white">Cancel</Button>
          <Button onClick={handleSave} disabled={!form.isPep || !form.hasAffiliation} className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50">Save PSC Details</Button>
        </div>
      </div>
    </div>
  );
}


// ==========================================
// 2. ADD STANDALONE PSC MODAL (Layout Fixed)
// ==========================================
export function StandalonePscModal({ onClose, updateData }: any) {
  const [form, setForm] = useState<any>({
    surname: "", firstName: "", otherName: "", email: "", phoneCode: "+234", phone: "", gender: "", dob: "", occupation: "", nationality: "Nigeria", idType: "", idNumber: "", taxResidency: "Nigeria", tin: "",
    residentialAddress: { state: "", lga: "", city: "", street: "" },
    pscDetails: { isPep: "", hasAffiliation: "", holdsSharesDirect: "No", holdsSharesIndirect: "No", holdsVotingDirect: "No", holdsVotingIndirect: "No", canAppointRemove: "No", hasSignificantInfluence: "No" }
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const getErr = (field: string, val: string, type: "text" | "email" | "dob" | "phone" | "idNumber" = "text") => {
    if (!touched[field]) return null;
    if (!val || !val.trim()) return "Required.";
    if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Invalid email.";
    if (type === "phone" && val.replace(/\D/g, '').length < 5) return "Invalid phone.";
    if (type === "dob" && Math.abs(new Date(Date.now() - new Date(val).getTime()).getUTCFullYear() - 1970) < 18) return "Must be 18+.";
    if (type === "idNumber" && form.idType === "NIN" && !/^\d{11}$/.test(val)) return "Must be 11 digits.";
    return null;
  };
  const ErrMsg = ({ msg }: { msg: string | null }) => msg ? <div className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-1.5"><WarningCircle weight="fill" /> {msg}</div> : null;

  const handleSave = () => {
    const fieldsToTouch = ["surname", "firstName", "email", "phone", "gender", "dob", "occupation", "idType", "idNumber", "state", "isPep", "hasAffiliation"];
    setTouched(fieldsToTouch.reduce((acc, curr) => ({ ...acc, [curr]: true }), {}));

    const hasErrors = !form.surname || !form.firstName || !form.email || !form.phone || !form.gender || !form.dob || !form.idType || !form.idNumber || !form.residentialAddress.state || !form.pscDetails.isPep || !form.pscDetails.hasAffiliation;
    
    if (hasErrors) {
      document.getElementById('psc-modal-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const newId = crypto.randomUUID();
    const newOfficer = {
      id: newId, roles: ["PSC"], surname: form.surname, firstName: form.firstName, otherName: form.otherName, email: form.email, phoneCode: form.phoneCode, phone: form.phone, gender: form.gender, dob: form.dob, occupation: form.occupation, nationality: form.nationality, idType: form.idType, idNumber: form.idNumber, taxResidency: form.taxResidency, tin: form.tin, residentialAddress: form.residentialAddress, pscDetails: form.pscDetails
    };

    updateData((prev: any) => ({
      ...prev,
      officers: [...(prev.officers || []), newOfficer]
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-amber-50 shrink-0">
          <div>
            <h3 className="font-black text-lg text-amber-900 flex items-center gap-2"><UserPlus className="h-6 w-6 text-amber-500" weight="fill" /> Add Standalone PSC</h3>
            <p className="text-xs font-bold text-amber-700 mt-1">This person will be listed ONLY as a Person with Significant Control.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-amber-200 rounded-full text-amber-800"><X weight="bold" /></button>
        </div>
        <div id="psc-modal-scroll" className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
          <div className="space-y-8">
            
            {/* PERSONAL DETAILS */}
            <div>
              <h3 className="text-sm font-black text-slate-900 border-b pb-2 uppercase tracking-widest mb-4">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Surname *</Label><Input value={form.surname} onChange={e => setForm({...form, surname: e.target.value})} onBlur={() => setTouched({...touched, surname: true})} className="h-12 font-bold" /><ErrMsg msg={getErr("surname", form.surname)} /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">First Name *</Label><Input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} onBlur={() => setTouched({...touched, firstName: true})} className="h-12 font-bold" /><ErrMsg msg={getErr("firstName", form.firstName)} /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Other Name</Label><Input value={form.otherName} onChange={e => setForm({...form, otherName: e.target.value})} className="h-12 font-bold" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Date of Birth *</Label><Input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} onBlur={() => setTouched({...touched, dob: true})} className="h-12 font-bold uppercase" /><ErrMsg msg={getErr("dob", form.dob, "dob")} /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Gender *</Label><select className="w-full h-12 px-4 border border-slate-200 bg-white rounded-xl text-sm font-bold outline-none" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} onBlur={() => setTouched({...touched, gender: true})}><option value="">-- Select --</option><option value="MALE">MALE</option><option value="FEMALE">FEMALE</option></select><ErrMsg msg={getErr("gender", form.gender)} /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Occupation *</Label><Input value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} onBlur={() => setTouched({...touched, occupation: true})} className="h-12 font-bold" /><ErrMsg msg={getErr("occupation", form.occupation)} /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Nationality</Label><select className="w-full h-12 px-4 border border-slate-200 bg-white rounded-xl text-sm font-bold outline-none" value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value, residentialAddress: {...form.residentialAddress, state: "", lga: ""}})}>{COUNTRY_CODES.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}</select></div>
              </div>
            </div>

            {/* CONTACT & ID */}
            <div>
              <h3 className="text-sm font-black text-slate-900 border-b pb-2 uppercase tracking-widest mb-4">Contact & ID</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Email Address *</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} onBlur={() => setTouched({...touched, email: true})} className="h-12 font-bold" /><ErrMsg msg={getErr("email", form.email, "email")} /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Phone Number *</Label><div className="flex"><select value={form.phoneCode} onChange={e => setForm({...form, phoneCode: e.target.value})} className="w-[100px] h-12 px-2 border border-r-0 border-slate-200 rounded-l-xl text-sm font-bold bg-slate-50 outline-none">{COUNTRY_CODES.map(c => <option key={`sc-${c.name}`} value={c.code}>{c.flag} {c.code}</option>)}</select><Input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} onBlur={() => setTouched({...touched, phone: true})} className="h-12 font-bold rounded-l-none flex-1" /></div><ErrMsg msg={getErr("phone", form.phone, "phone")} /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Means of ID *</Label><select className="w-full h-12 px-4 border border-slate-200 bg-white rounded-xl text-sm font-bold outline-none" value={form.idType} onChange={e => setForm({...form, idType: e.target.value})} onBlur={() => setTouched({...touched, idType: true})}><option value="">-- Select --</option><option value="NIN">National ID Card (NIN)</option><option value="PASSPORT">International Passport</option><option value="DRIVERS_LICENSE">Driver's License</option></select><ErrMsg msg={getErr("idType", form.idType)} /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">ID Number *</Label><Input value={form.idNumber} onChange={e => setForm({...form, idNumber: e.target.value})} onBlur={() => setTouched({...touched, idNumber: true})} className="h-12 font-bold" /><ErrMsg msg={getErr("idNumber", form.idNumber, "idNumber")} /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Tax Residency</Label><select className="w-full h-12 px-4 border border-slate-200 bg-white rounded-xl text-sm font-bold outline-none" value={form.taxResidency} onChange={e => setForm({...form, taxResidency: e.target.value})}>{COUNTRY_CODES.map(c => <option key={`tax-${c.name}`} value={c.name}>{c.name}</option>)}</select></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">TIN (Optional)</Label><Input value={form.tin} onChange={e => setForm({...form, tin: e.target.value})} className="h-12 font-bold" /></div>
              </div>
            </div>

            {/* RESIDENTIAL ADDRESS */}
            <div>
              <h3 className="text-sm font-black text-slate-900 border-b pb-2 uppercase tracking-widest mb-4">Residential Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {form.nationality === "Nigeria" ? (
                  <>
                    <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">State *</Label><select value={form.residentialAddress.state} onChange={e => setForm({...form, residentialAddress: {...form.residentialAddress, state: e.target.value, lga: ""}})} onBlur={() => setTouched({...touched, state: true})} className="w-full h-12 px-4 border border-slate-200 bg-white rounded-xl text-sm font-bold outline-none"><option value="">-- Select --</option>{NIGERIA_DATA.map(d => <option key={d.state} value={d.state}>{d.state}</option>)}</select><ErrMsg msg={getErr("state", form.residentialAddress.state)} /></div>
                    <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">LGA *</Label><select value={form.residentialAddress.lga} disabled={!form.residentialAddress.state} onChange={e => setForm({...form, residentialAddress: {...form.residentialAddress, lga: e.target.value}})} className="w-full h-12 px-4 border border-slate-200 bg-white rounded-xl text-sm font-bold outline-none"><option value="">-- Select --</option>{form.residentialAddress.state && NIGERIA_DATA.find(d => d.state === form.residentialAddress.state)?.lgas.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">State/Province *</Label><Input value={form.residentialAddress.state} onChange={e => setForm({...form, residentialAddress: {...form.residentialAddress, state: e.target.value}})} className="h-12 font-bold" /></div>
                    <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">County/Region *</Label><Input value={form.residentialAddress.lga} onChange={e => setForm({...form, residentialAddress: {...form.residentialAddress, lga: e.target.value}})} className="h-12 font-bold" /></div>
                  </>
                )}
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">City / Town *</Label><Input value={form.residentialAddress.city} onChange={e => setForm({...form, residentialAddress: {...form.residentialAddress, city: e.target.value}})} className="h-12 font-bold" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold uppercase text-slate-500">Street Address *</Label><Input value={form.residentialAddress.street} onChange={e => setForm({...form, residentialAddress: {...form.residentialAddress, street: e.target.value}})} className="h-12 font-bold" /></div>
              </div>
            </div>

            {/* PSC DETAILS */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-6">
              <h3 className="text-sm font-black text-slate-900 border-b pb-2 uppercase tracking-widest">Details of PSC Affiliation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Is the PSC a PEP? *</Label>
                  <select className="w-full h-12 px-4 border border-slate-200 bg-white rounded-xl text-sm font-bold outline-none" value={form.pscDetails.isPep} onChange={e => setForm({...form, pscDetails: {...form.pscDetails, isPep: e.target.value}})} onBlur={() => setTouched({...touched, isPep: true})}><option value="">-- Select --</option><option value="No">No</option><option value="Yes">Yes</option></select>
                  <ErrMsg msg={!form.pscDetails.isPep && touched.isPep ? "Required" : null} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Does the PSC have any affiliation? *</Label>
                  <select className="w-full h-12 px-4 border border-slate-200 bg-white rounded-xl text-sm font-bold outline-none" value={form.pscDetails.hasAffiliation} onChange={e => setForm({...form, pscDetails: {...form.pscDetails, hasAffiliation: e.target.value}})} onBlur={() => setTouched({...touched, hasAffiliation: true})}><option value="">-- Select --</option><option value="No">No</option><option value="Yes">Yes</option></select>
                  <ErrMsg msg={!form.pscDetails.hasAffiliation && touched.hasAffiliation ? "Required" : null} />
                </div>
              </div>

              <h3 className="text-sm font-black text-slate-900 border-b pb-2 uppercase tracking-widest mt-6">Details of Interest Held</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-[11px] font-bold uppercase text-slate-500">Directly holds &gt;= 5% Shares?</Label><select className="w-full h-10 px-4 border border-slate-200 bg-white rounded-lg text-sm font-bold outline-none" value={form.pscDetails.holdsSharesDirect} onChange={e => setForm({...form, pscDetails: {...form.pscDetails, holdsSharesDirect: e.target.value}})}><option value="No">No</option><option value="Yes">Yes</option></select></div>
                <div className="space-y-2"><Label className="text-[11px] font-bold uppercase text-slate-500">Indirectly holds &gt;= 5% Shares?</Label><select className="w-full h-10 px-4 border border-slate-200 bg-white rounded-lg text-sm font-bold outline-none" value={form.pscDetails.holdsSharesIndirect} onChange={e => setForm({...form, pscDetails: {...form.pscDetails, holdsSharesIndirect: e.target.value}})}><option value="No">No</option><option value="Yes">Yes</option></select></div>
                <div className="space-y-2"><Label className="text-[11px] font-bold uppercase text-slate-500">Directly holds &gt;= 5% Voting Rights?</Label><select className="w-full h-10 px-4 border border-slate-200 bg-white rounded-lg text-sm font-bold outline-none" value={form.pscDetails.holdsVotingDirect} onChange={e => setForm({...form, pscDetails: {...form.pscDetails, holdsVotingDirect: e.target.value}})}><option value="No">No</option><option value="Yes">Yes</option></select></div>
                <div className="space-y-2"><Label className="text-[11px] font-bold uppercase text-slate-500">Indirectly holds &gt;= 5% Voting Rights?</Label><select className="w-full h-10 px-4 border border-slate-200 bg-white rounded-lg text-sm font-bold outline-none" value={form.pscDetails.holdsVotingIndirect} onChange={e => setForm({...form, pscDetails: {...form.pscDetails, holdsVotingIndirect: e.target.value}})}><option value="No">No</option><option value="Yes">Yes</option></select></div>
                <div className="space-y-2"><Label className="text-[11px] font-bold uppercase text-slate-500">Right to Appoint/Remove majority of directors?</Label><select className="w-full h-10 px-4 border border-slate-200 bg-white rounded-lg text-sm font-bold outline-none" value={form.pscDetails.canAppointRemove} onChange={e => setForm({...form, pscDetails: {...form.pscDetails, canAppointRemove: e.target.value}})}><option value="No">No</option><option value="Yes">Yes</option></select></div>
                <div className="space-y-2 md:col-span-2"><Label className="text-[11px] font-bold uppercase text-slate-500">Exercises Significant Influence or Control?</Label><select className="w-full h-10 px-4 border border-slate-200 bg-white rounded-lg text-sm font-bold outline-none" value={form.pscDetails.hasSignificantInfluence} onChange={e => setForm({...form, pscDetails: {...form.pscDetails, hasSignificantInfluence: e.target.value}})}><option value="No">No</option><option value="Yes">Yes</option></select></div>
              </div>
            </div>

          </div>
        </div>
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} className="h-12 px-6 rounded-xl font-bold bg-white">Cancel</Button>
          <Button onClick={handleSave} className="h-12 px-8 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md">Save PSC</Button>
        </div>
      </div>
    </div>
  );
}
