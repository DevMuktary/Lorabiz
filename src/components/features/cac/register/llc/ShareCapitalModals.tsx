"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Info, WarningCircle, X, ListMagnifyingGlass, CaretDown, Coins, UserPlus } from "@phosphor-icons/react";
import { DESIGNATED_COMPANIES, numberToWordsNaira } from "@/lib/share-capital-data";
import { COUNTRY_CODES, NIGERIA_DATA } from "@/components/features/cac/register/biz-name/schema";

const formatNum = (val: any) => (val === "" || val === null || isNaN(val)) ? "" : Number(val).toLocaleString("en-US");
const cleanNum = (val: string) => val.replace(/\D/g, "");

// ==========================================
// 1. REFERENCE MODAL
// ==========================================
export function ReferenceModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-t-3xl sm:rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 flex flex-col max-h-[90vh] h-[90vh] sm:h-auto">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-border flex justify-between items-center bg-secondary/50 shrink-0">
          <div>
            <h3 className="font-black text-base sm:text-lg text-foreground flex items-center gap-2">
              <ListMagnifyingGlass className="h-5 w-5 sm:h-6 sm:w-6 text-primary" weight="fill" /> Statutory Share Capital
            </h3>
            <p className="text-[11px] sm:text-xs font-bold text-muted-foreground mt-1">Check minimum requirements based on your industry.</p>
          </div>
          <button onClick={onClose} className="p-2 bg-secondary hover:bg-secondary/80 rounded-full text-foreground transition-colors cursor-pointer"><X weight="bold" className="h-4 w-4 sm:h-5 sm:w-5" /></button>
        </div>
        <div className="p-0 overflow-y-auto custom-scrollbar flex-1 bg-background">
          <div className="min-w-[600px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-secondary/50 sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="p-3 text-[10px] font-black uppercase text-muted-foreground border-b border-border w-16 text-center">S/N</th>
                  <th className="p-3 text-[10px] font-black uppercase text-muted-foreground border-b border-border">Type of Company</th>
                  <th className="p-3 text-[10px] font-black uppercase text-muted-foreground border-b border-border text-right pr-6">Minimum Share Capital (₦)</th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold text-foreground">
                {DESIGNATED_COMPANIES.map((c, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-3 text-muted-foreground text-center">{c.id === 0 ? "-" : c.id}</td>
                    <td className="p-3 text-[11px] sm:text-xs leading-relaxed py-3">{c.type}</td>
                    <td className="p-3 text-right text-primary pr-6">{formatNum(c.min)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="p-4 sm:p-5 border-t border-border bg-secondary/30 flex justify-end shrink-0">
          <Button onClick={onClose} className="h-12 w-full sm:w-auto px-8 bg-foreground hover:opacity-90 text-background font-bold rounded-xl shadow-lg cursor-pointer">Close & Continue</Button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. ADD SHARE CLASS MODAL
// ==========================================
export function ShareClassModal({ onClose, shareData, updateShareData, editingIdx, totalCapital }: any) {
  const [form, setForm] = useState({ type: "EQUITY (ORDINARY)", totalValue: "", units: "" });

  const totalClassesValue = shareData.shareClasses.reduce((acc: number, c: any) => acc + (Number(c.totalValue) || 0), 0);
  let availableCapital = totalCapital - totalClassesValue;
  if (editingIdx !== null) availableCapital += shareData.shareClasses[editingIdx].totalValue;

  useEffect(() => {
    if (editingIdx !== null) {
      const existing = shareData.shareClasses[editingIdx];
      setForm({ type: existing.type, totalValue: existing.totalValue.toString(), units: existing.units.toString() });
    } else {
      const hasEq = shareData.shareClasses.some((c: any) => c.type === "EQUITY (ORDINARY)");
      setForm(f => ({ ...f, type: hasEq ? "PREFERENCE" : "EQUITY (ORDINARY)", totalValue: availableCapital > 0 ? availableCapital.toString() : "" }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getOptions = () => {
    let opts = [];
    if (editingIdx !== null) return [shareData.shareClasses[editingIdx].type];
    if (!shareData.shareClasses.some((c: any) => c.type === "EQUITY (ORDINARY)")) opts.push("EQUITY (ORDINARY)");
    if (!shareData.shareClasses.some((c: any) => c.type === "PREFERENCE")) opts.push("PREFERENCE");
    return opts;
  };

  const formVal = Number(form.totalValue) || 0;
  const isOver = formVal > availableCapital;
  const calcPrice = () => (Number(form.units) > 0 ? (formVal / Number(form.units)).toFixed(2) : 0);

  const handleSave = () => {
    if (!form.units || !form.totalValue || isOver || Number(form.units) <= 0) return;
    const tv = Number(form.totalValue);
    const un = Number(form.units);
    
    let updated = [...shareData.shareClasses];
    const newClass = { type: form.type, totalValue: tv, nominalValue: tv / un, units: un };
    if (editingIdx !== null) updated[editingIdx] = newClass;
    else updated.push(newClass);
    
    updateShareData("shareClasses", updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-secondary/50 shrink-0">
          <h3 className="font-black text-lg text-foreground">{editingIdx !== null ? "Edit" : "Add"} Share Class</h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"><X weight="bold" /></button>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar bg-background">
          <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-start gap-2 mb-4">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" weight="fill" />
            <p className="text-xs font-medium text-blue-500 leading-relaxed">Select the Class Type, assign its Total Value out of your master capital, and define how many Units it is divided into.</p>
          </div>
          <div className="flex justify-between items-center bg-primary/10 p-3 rounded-xl border border-primary/20">
            <span className="text-xs font-bold text-primary">Available Capital</span>
            <span className="text-sm font-black text-primary">₦{formatNum(availableCapital)}</span>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Class of Shares <span className="text-red-500">*</span></Label>
            <div className="relative">
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full h-12 px-4 appearance-none border border-border rounded-xl text-sm font-bold bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors">
                {getOptions().map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" weight="bold" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Total Value for this Class (₦) <span className="text-red-500">*</span></Label>
            <Input type="text" value={formatNum(form.totalValue)} onChange={e => setForm({...form, totalValue: cleanNum(e.target.value)})} className={`h-12 font-black text-lg bg-background text-foreground ${isOver ? 'bg-red-500/10 text-red-500 border-red-500' : 'border-border focus-visible:ring-primary focus-visible:border-primary'}`} />
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-1 rounded self-start">{numberToWordsNaira(Number(form.totalValue) || 0)}</p>
              {isOver && <p className="text-[11px] font-bold text-red-500 flex items-center gap-1 mt-1"><WarningCircle weight="fill" /> Exceeds available capital by ₦{formatNum(formVal - availableCapital)}</p>}
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Divided Into (Number of Units) <span className="text-red-500">*</span></Label>
            <Input type="text" value={formatNum(form.units)} onChange={e => setForm({...form, units: cleanNum(e.target.value)})} className="h-12 font-bold bg-background text-foreground border-border focus-visible:ring-primary focus-visible:border-primary" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Auto-Calculated Nominal Value (Price per Unit) ₦</Label>
            <Input type="text" disabled value={formatNum(calcPrice())} className="h-12 font-black bg-secondary text-muted-foreground border-border opacity-70" />
          </div>
        </div>
        <div className="p-6 border-t border-border bg-secondary/30 flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} className="h-12 px-6 rounded-xl font-bold bg-background border-border text-foreground hover:bg-secondary cursor-pointer">Cancel</Button>
          <Button onClick={handleSave} disabled={!form.totalValue || !form.units || Number(form.units) <= 0 || isOver} className="h-12 px-8 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-md disabled:opacity-50 cursor-pointer">Save Class</Button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. ALLOTMENT MODAL
// ==========================================
export function AllotmentModal({ onClose, shareData, updateShareData, officerId }: any) {
  const existing = shareData.allotments.find((a: any) => a.officerId === officerId);
  const [form, setForm] = useState({ type: existing ? existing.type : (shareData.shareClasses[0]?.type || ""), units: existing ? existing.units.toString() : "" });

  const getAvailableUnits = (type: string) => {
    const classDef = shareData.shareClasses.find((c: any) => c.type === type);
    if (!classDef) return 0;
    let allotted = shareData.allotments.filter((a: any) => a.type === type).reduce((sum: number, a: any) => sum + Number(a.units), 0);
    const currentRec = shareData.allotments.find((a: any) => a.officerId === officerId && a.type === type);
    if (currentRec) allotted -= currentRec.units;
    return classDef.units - allotted;
  };

  const availableUnits = getAvailableUnits(form.type);
  const isOver = Number(form.units) > availableUnits;

  const handleSave = () => {
    if (Number(form.units) <= 0 || isOver) return;
    let updated = [...shareData.allotments];
    const idx = updated.findIndex((a: any) => a.officerId === officerId && a.type === form.type);
    if (idx >= 0) updated[idx].units = Number(form.units);
    else updated.push({ officerId, type: form.type, units: Number(form.units) });
    updateShareData("allotments", updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-emerald-500/10 shrink-0">
          <h3 className="font-black text-lg text-emerald-500 flex items-center gap-2"><Coins className="h-6 w-6 text-emerald-500" weight="fill" /> Allot Shares</h3>
          <button onClick={onClose} className="p-2 hover:bg-emerald-500/20 rounded-full text-emerald-500 transition-colors cursor-pointer"><X weight="bold" /></button>
        </div>
        <div className="p-6 space-y-4 bg-background">
          <div className="flex justify-between items-center bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
            <span className="text-xs font-bold text-emerald-500">Available Units ({form.type})</span>
            <span className="text-sm font-black text-emerald-500">{formatNum(availableUnits)}</span>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Select Share Class <span className="text-red-500">*</span></Label>
            <div className="relative">
              <select value={form.type} onChange={e => {
                const nt = e.target.value;
                const ex = shareData.allotments.find((a: any) => a.officerId === officerId && a.type === nt);
                setForm({ type: nt, units: ex ? ex.units.toString() : "" });
              }} className="w-full h-12 px-4 appearance-none border border-border rounded-xl text-sm font-bold bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors">
                {shareData.shareClasses.map((c: any) => <option key={c.type} value={c.type}>{c.type}</option>)}
              </select>
              <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" weight="bold" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Number of Units to Allot <span className="text-red-500">*</span></Label>
            <Input type="text" value={formatNum(form.units)} onChange={e => setForm({...form, units: cleanNum(e.target.value)})} className={`h-12 font-black text-lg bg-background text-foreground border-border focus-visible:ring-primary focus-visible:border-primary ${isOver ? 'border-red-500 text-red-500 bg-red-500/10' : ''}`} />
            {isOver && <p className="text-[11px] font-bold text-red-500 flex items-center gap-1 mt-1"><WarningCircle weight="fill" /> Cannot allot more units than are available.</p>}
          </div>
        </div>
        <div className="p-6 border-t border-border bg-secondary/30 flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} className="h-12 px-6 rounded-xl font-bold bg-background border-border text-foreground hover:bg-secondary cursor-pointer">Cancel</Button>
          <Button onClick={handleSave} disabled={!form.units || isOver} className="h-12 px-8 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-md disabled:opacity-50 cursor-pointer">Assign Shares</Button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. STANDALONE SHAREHOLDER MODAL
// ==========================================
export function StandaloneShareholderModal({ onClose, shareData, updateData, cleanAllotments }: any) {
  const [form, setForm] = useState<any>({
    surname: "", firstName: "", otherName: "", email: "", phoneCode: "+234", phone: "", gender: "", dob: "", occupation: "", nationality: "Nigeria", idType: "", idNumber: "", residentialAddress: { state: "", lga: "", city: "", street: "" }, allotType: shareData.shareClasses[0]?.type || "", allotUnits: ""
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const getAvailUnits = (type: string) => {
    const classDef = shareData.shareClasses.find((c: any) => c.type === type);
    if (!classDef) return 0;
    const allotted = cleanAllotments.filter((a: any) => a.type === type).reduce((sum: number, a: any) => sum + Number(a.units), 0);
    return classDef.units - allotted;
  };

  const getErr = (field: string, val: string, type: "text" | "email" | "dob" | "phone" | "idNumber" = "text") => {
    if (!touched[field]) return null;
    if (!val || !val.trim()) return "Required.";
    if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Invalid email.";
    if (type === "phone" && val.replace(/\D/g, '').length < 5) return "Invalid phone.";
    if (type === "dob" && Math.abs(new Date(Date.now() - new Date(val).getTime()).getUTCFullYear() - 1970) < 18) return "Must be 18+.";
    if (type === "idNumber" && form.idType === "NIN" && !/^\d{11}$/.test(val)) return "Must be 11 digits.";
    return null;
  };
  const ErrMsg = ({ msg }: { msg: string | null }) => msg ? <div className="text-[10px] font-bold text-red-500 flex items-center gap-1 mt-1.5"><WarningCircle weight="fill" /> {msg}</div> : null;

  const handleSave = () => {
    const fieldsToTouch = ["surname", "firstName", "email", "phone", "gender", "dob", "occupation", "idType", "idNumber", "state", "allotUnits"];
    setTouched(fieldsToTouch.reduce((acc, curr) => ({ ...acc, [curr]: true }), {}));

    const maxUnits = getAvailUnits(form.allotType);
    const un = Number(form.allotUnits) || 0;
    const hasErrors = !form.surname || !form.firstName || !form.email || !form.phone || !form.gender || !form.dob || !form.idType || !form.idNumber || !form.residentialAddress.state || un <= 0 || un > maxUnits;
    
    if (hasErrors) return;

    const newId = crypto.randomUUID();
    const newOfficer = {
      id: newId, roles: ["SHAREHOLDER"], surname: form.surname, firstName: form.firstName, otherName: form.otherName, email: form.email, phoneCode: form.phoneCode, phone: form.phone, gender: form.gender, dob: form.dob, occupation: form.occupation, nationality: form.nationality, idType: form.idType, idNumber: form.idNumber, residentialAddress: form.residentialAddress
    };

    updateData((prev: any) => ({
      ...prev,
      officers: [...(prev.officers || []), newOfficer],
      shareCapital: { ...(prev.shareCapital || {}), allotments: [...cleanAllotments, { officerId: newId, type: form.allotType, units: un }] }
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-emerald-500/10 shrink-0">
          <div>
            <h3 className="font-black text-lg text-emerald-500 flex items-center gap-2"><UserPlus className="h-6 w-6 text-emerald-500" weight="fill" /> Add Standalone Shareholder</h3>
            <p className="text-xs font-bold text-emerald-500/80 mt-1">This person will NOT be listed as a Director.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-emerald-500/20 rounded-full text-emerald-500 transition-colors cursor-pointer"><X weight="bold" /></button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-background">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2"><h3 className="text-sm font-black text-foreground border-b border-border pb-2 uppercase tracking-widest">Personal Details</h3></div>
            <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Surname *</Label><Input value={form.surname} onChange={e => setForm({...form, surname: e.target.value})} onBlur={() => setTouched({...touched, surname: true})} className="h-12 font-bold bg-background text-foreground border-border focus-visible:ring-primary focus-visible:border-primary" /><ErrMsg msg={getErr("surname", form.surname)} /></div>
            <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">First Name *</Label><Input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} onBlur={() => setTouched({...touched, firstName: true})} className="h-12 font-bold bg-background text-foreground border-border focus-visible:ring-primary focus-visible:border-primary" /><ErrMsg msg={getErr("firstName", form.firstName)} /></div>
            <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Other Name</Label><Input value={form.otherName} onChange={e => setForm({...form, otherName: e.target.value})} className="h-12 font-bold bg-background text-foreground border-border focus-visible:ring-primary focus-visible:border-primary" /></div>
            <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Date of Birth *</Label><Input type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} onBlur={() => setTouched({...touched, dob: true})} className="h-12 font-bold uppercase appearance-none bg-background text-foreground border-border focus-visible:ring-primary focus-visible:border-primary" /><ErrMsg msg={getErr("dob", form.dob, "dob")} /></div>
            <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Gender *</Label><select className="w-full h-12 px-4 border border-border bg-background text-foreground rounded-xl text-sm font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} onBlur={() => setTouched({...touched, gender: true})}><option value="">-- Select --</option><option value="MALE">MALE</option><option value="FEMALE">FEMALE</option></select><ErrMsg msg={getErr("gender", form.gender)} /></div>
            <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Occupation *</Label><Input value={form.occupation} onChange={e => setForm({...form, occupation: e.target.value})} onBlur={() => setTouched({...touched, occupation: true})} className="h-12 font-bold bg-background text-foreground border-border focus-visible:ring-primary focus-visible:border-primary" /><ErrMsg msg={getErr("occupation", form.occupation)} /></div>
            
            <div className="md:col-span-2 mt-4"><h3 className="text-sm font-black text-foreground border-b border-border pb-2 uppercase tracking-widest">Contact & ID</h3></div>
            <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Email Address *</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} onBlur={() => setTouched({...touched, email: true})} className="h-12 font-bold bg-background text-foreground border-border focus-visible:ring-primary focus-visible:border-primary" /><ErrMsg msg={getErr("email", form.email, "email")} /></div>
            <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Phone Number *</Label><div className="flex"><select value={form.phoneCode} onChange={e => setForm({...form, phoneCode: e.target.value})} className="w-[100px] h-12 px-2 border-r rounded-none border-border bg-secondary text-foreground text-sm font-bold outline-none"><option value="+234">🇳🇬 +234</option>{COUNTRY_CODES.map(c => <option key={c.name} value={c.code}>{c.flag} {c.code}</option>)}</select><Input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} onBlur={() => setTouched({...touched, phone: true})} className="h-12 font-bold rounded-l-none flex-1 bg-background text-foreground border-border focus-visible:ring-primary focus-visible:border-primary" /></div><ErrMsg msg={getErr("phone", form.phone, "phone")} /></div>
            <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Means of ID *</Label><div className="relative"><select className="w-full h-12 px-4 border border-border bg-background text-foreground rounded-xl text-sm font-bold outline-none appearance-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" value={form.idType} onChange={e => setForm({...form, idType: e.target.value})} onBlur={() => setTouched({...touched, idType: true})}><option value="">-- Select --</option><option value="NIN">National ID Card (NIN)</option><option value="PASSPORT">International Passport</option><option value="DRIVERS_LICENSE">Driver's License</option></select><CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" weight="bold" /></div><ErrMsg msg={getErr("idType", form.idType)} /></div>
            <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">ID Number *</Label><Input value={form.idNumber} onChange={e => setForm({...form, idNumber: e.target.value})} onBlur={() => setTouched({...touched, idNumber: true})} className="h-12 font-bold bg-background text-foreground border-border focus-visible:ring-primary focus-visible:border-primary" /><ErrMsg msg={getErr("idNumber", form.idNumber, "idNumber")} /></div>

            <div className="md:col-span-2 mt-4"><h3 className="text-sm font-black text-foreground border-b border-border pb-2 uppercase tracking-widest">Residential Address</h3></div>
            <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">State *</Label><div className="relative"><select value={form.residentialAddress.state} onChange={e => setForm({...form, residentialAddress: {...form.residentialAddress, state: e.target.value, lga: ""}})} onBlur={() => setTouched({...touched, state: true})} className="w-full h-12 px-4 border appearance-none border-border bg-background text-foreground rounded-xl text-sm font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"><option value="">-- Select --</option>{NIGERIA_DATA.map(d => <option key={d.state} value={d.state}>{d.state}</option>)}</select><CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" weight="bold" /></div><ErrMsg msg={getErr("state", form.residentialAddress.state)} /></div>
            <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">LGA *</Label><div className="relative"><select value={form.residentialAddress.lga} disabled={!form.residentialAddress.state} onChange={e => setForm({...form, residentialAddress: {...form.residentialAddress, lga: e.target.value}})} className="w-full h-12 px-4 border appearance-none border-border bg-background text-foreground rounded-xl text-sm font-bold outline-none disabled:opacity-50 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"><option value="">-- Select --</option>{form.residentialAddress.state && NIGERIA_DATA.find(d => d.state === form.residentialAddress.state)?.lgas.map(l => <option key={l} value={l}>{l}</option>)}</select><CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" weight="bold" /></div></div>
            <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">City / Town *</Label><Input value={form.residentialAddress.city} onChange={e => setForm({...form, residentialAddress: {...form.residentialAddress, city: e.target.value}})} className="h-12 font-bold bg-background text-foreground border-border focus-visible:ring-primary focus-visible:border-primary" /></div>
            <div className="space-y-2"><Label className="text-xs font-bold uppercase text-muted-foreground">Street Address *</Label><Input value={form.residentialAddress.street} onChange={e => setForm({...form, residentialAddress: {...form.residentialAddress, street: e.target.value}})} className="h-12 font-bold bg-background text-foreground border-border focus-visible:ring-primary focus-visible:border-primary" /></div>

            <div className="md:col-span-2 mt-4 p-5 bg-primary/10 border border-primary/20 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-primary">Initial Share Allotment *</Label>
                <div className="relative">
                  <select value={form.allotType} onChange={e => setForm({...form, allotType: e.target.value})} className="w-full h-12 px-4 border appearance-none border-primary/20 bg-background text-foreground rounded-xl text-sm font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"><option value="">-- Select Class --</option>{shareData.shareClasses.map((c: any) => <option key={c.type} value={c.type}>{c.type}</option>)}</select>
                  <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-primary pointer-events-none" weight="bold" />
                </div>
              </div>
              <div className="space-y-2"><Label className="text-xs font-bold uppercase text-primary">Units to Allot *</Label><Input type="text" value={formatNum(form.allotUnits)} onChange={e => setForm({...form, allotUnits: cleanNum(e.target.value)})} onBlur={() => setTouched({...touched, allotUnits: true})} className="h-12 font-black text-lg border-primary/20 bg-background text-foreground focus-visible:ring-primary focus-visible:border-primary" /><ErrMsg msg={!form.allotUnits && touched.allotUnits ? "Required" : Number(form.allotUnits) > getAvailUnits(form.allotType) ? "Exceeds available units." : null} /></div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-border bg-secondary/30 flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} className="h-12 px-6 rounded-xl font-bold bg-background border-border text-foreground hover:bg-secondary cursor-pointer">Cancel</Button>
          <Button onClick={handleSave} className="h-12 px-8 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-md cursor-pointer">Save & Allot</Button>
        </div>
      </div>
    </div>
  );
}
