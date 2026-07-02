"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, CheckCircle, WarningCircle, CaretDown, Info } from "@phosphor-icons/react";
import { COUNTRY_CODES, NIGERIA_DATA } from "@/components/features/cac/register/biz-name/schema";

export default function ComplianceStep({ data, updateData, showErrors }: any) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const defaultDeclarant = {
    surname: "", firstName: "", accreditationNumber: "", 
    phoneCode: "+234", phone: "", email: "", 
    state: "", lga: "", city: "", street: "", 
    isAcknowledged: false
  };

  const declarant = data.declarantDetails || defaultDeclarant;

  // FIX: Safely merge the previous state so it doesn't overwrite itself
  const handleUpdate = (field: string, value: any) => {
    updateData((prev: any) => ({
      ...prev,
      declarantDetails: { ...(prev.declarantDetails || defaultDeclarant), [field]: value }
    }));
  };

  // FIX: Dedicated handler for State change to safely clear LGA at the same time
  const handleStateChange = (newState: string) => {
    updateData((prev: any) => ({
      ...prev,
      declarantDetails: { 
        ...(prev.declarantDetails || defaultDeclarant), 
        state: newState, 
        lga: "" // Reset LGA safely
      }
    }));
  };

  const handleBlur = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  // ==========================================
  // VALIDATION ENGINE
  // ==========================================
  const getError = (fieldKey: string, value: string, type: "text" | "email" | "phone" = "text") => {
    if (!touched[fieldKey] && !showErrors) return null;
    if (!value || (typeof value === 'string' && !value.trim())) return "Required";
    
    if (type === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address.";
    }
    if (type === "phone") {
      if (value.replace(/\D/g, '').length < 5) return "Invalid phone number.";
    }
    return null; 
  };

  const ErrorMessage = ({ msg }: { msg: string | null }) => {
    if (!msg) return null;
    return (
      <div className="text-[11px] font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 mt-2 border border-red-500/20 animate-in fade-in slide-in-from-top-1">
        <WarningCircle weight="fill" className="h-4 w-4 shrink-0" /> {msg}
      </div>
    );
  };

  const errSur = getError("surname", declarant.surname);
  const errFirst = getError("firstName", declarant.firstName);
  const errEmail = getError("email", declarant.email, "email");
  const errPhone = getError("phone", declarant.phone, "phone");
  const errState = getError("state", declarant.state);
  const errLga = getError("lga", declarant.lga);
  const errCity = getError("city", declarant.city);
  const errStreet = getError("street", declarant.street);
  const errAck = (!declarant.isAcknowledged && showErrors) ? "You must acknowledge this statement to proceed." : null;

  const nigerianStates = NIGERIA_DATA.map(d => d.state).sort();
  const getLgasForState = (stateName: string) => {
    const stateObj = NIGERIA_DATA.find(d => d.state === stateName);
    return stateObj ? stateObj.lgas.sort() : [];
  };

  return (
    <div className="p-4 sm:p-10 space-y-10 animate-in fade-in duration-500">
      
      <section>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <FileText className="h-6 w-6" weight="fill" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">Statement of Compliance</h2>
            <p className="text-sm font-medium text-muted-foreground mt-1 leading-relaxed">
              Statutory declaration under the Companies and Allied Matters Act (CAMA) 2020.
            </p>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-start gap-3 mb-8">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" weight="fill" />
          <p className="text-xs font-medium text-blue-500 leading-relaxed">
            <strong className="font-black text-blue-500 block mb-1">Who should fill this?</strong>
            These should be the details of the person making the statutory declaration—this is usually <span className="font-bold">you</span> (the person registering the company, whether as a personal applicant, a hired agent, or an accredited legal practitioner).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm transition-colors duration-300">
          
          <div className="md:col-span-2">
            <h3 className="text-sm font-black text-foreground border-b border-border pb-2 uppercase tracking-widest">Declarant Details</h3>
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errSur ? "text-red-500" : "text-muted-foreground"}`}>Surname <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. Doe" value={declarant.surname} onChange={e => handleUpdate("surname", e.target.value)} onBlur={() => handleBlur("surname")} className={`h-12 font-bold bg-background text-foreground ${errSur ? "border-red-500 bg-red-500/10 focus-visible:ring-red-500/20" : "border-border focus-visible:border-primary focus-visible:ring-primary"}`} />
            <ErrorMessage msg={errSur} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errFirst ? "text-red-500" : "text-muted-foreground"}`}>First Name <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. Jane" value={declarant.firstName} onChange={e => handleUpdate("firstName", e.target.value)} onBlur={() => handleBlur("firstName")} className={`h-12 font-bold bg-background text-foreground ${errFirst ? "border-red-500 bg-red-500/10 focus-visible:ring-red-500/20" : "border-border focus-visible:border-primary focus-visible:ring-primary"}`} />
            <ErrorMessage msg={errFirst} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Accreditation Number</Label>
            <Input placeholder="E.g. NBA/12345 (Optional)" value={declarant.accreditationNumber} onChange={e => handleUpdate("accreditationNumber", e.target.value)} className="h-12 font-bold bg-background text-foreground border-border focus-visible:border-primary focus-visible:ring-primary" />
            <p className="text-[10px] font-bold text-muted-foreground mt-1">Leave blank if you are not an accredited agent.</p>
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errPhone ? "text-red-500" : "text-muted-foreground"}`}>Phone Number <span className="text-red-500">*</span></Label>
            <div className={`flex border rounded-xl overflow-hidden focus-within:ring-1 transition-colors ${errPhone ? "border-red-500 focus-within:ring-red-500/20" : "border-border focus-within:border-primary focus-within:ring-primary"}`}>
              <select value={declarant.phoneCode} onChange={e => handleUpdate("phoneCode", e.target.value)} className={`w-[100px] h-12 px-2 border-r rounded-none text-sm font-bold outline-none appearance-none transition-colors cursor-pointer ${errPhone ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-secondary border-border text-foreground hover:bg-secondary/80 focus:bg-background"}`}>
                {COUNTRY_CODES.map(c => <option key={`dc-${c.name}`} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
              <Input type="tel" placeholder="8012345678" value={declarant.phone} onChange={e => handleUpdate("phone", e.target.value)} onBlur={() => handleBlur("phone")} className={`h-12 font-bold rounded-l-none flex-1 border-0 shadow-none focus-visible:ring-0 bg-background text-foreground ${errPhone ? "bg-red-500/10" : ""}`} />
            </div>
            <ErrorMessage msg={errPhone} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className={`text-xs font-bold uppercase ${errEmail ? "text-red-500" : "text-muted-foreground"}`}>Email Address <span className="text-red-500">*</span></Label>
            <Input type="email" placeholder="declarant@example.com" value={declarant.email} onChange={e => handleUpdate("email", e.target.value)} onBlur={() => handleBlur("email")} className={`h-12 font-bold bg-background text-foreground ${errEmail ? "border-red-500 bg-red-500/10 focus-visible:ring-red-500/20" : "border-border focus-visible:border-primary focus-visible:ring-primary"}`} />
            <ErrorMessage msg={errEmail} />
          </div>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm transition-colors duration-300">
          <div className="md:col-span-2">
            <h3 className="text-sm font-black text-foreground border-b border-border pb-2 uppercase tracking-widest">Declarant Address</h3>
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errState ? "text-red-500" : "text-muted-foreground"}`}>State <span className="text-red-500">*</span></Label>
            <div className="relative">
              <select value={declarant.state} onChange={e => handleStateChange(e.target.value)} onBlur={() => handleBlur("state")} className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${errState ? "border-red-500 bg-red-500/10 text-red-500" : "border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary"}`}>
                <option value="">-- Select State --</option>
                {nigerianStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" weight="bold" />
            </div>
            <ErrorMessage msg={errState} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errLga ? "text-red-500" : "text-muted-foreground"}`}>LGA <span className="text-red-500">*</span></Label>
            <div className="relative">
              <select value={declarant.lga} disabled={!declarant.state} onChange={e => handleUpdate("lga", e.target.value)} onBlur={() => handleBlur("lga")} className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${!declarant.state ? "bg-secondary border-border text-muted-foreground opacity-60 cursor-not-allowed" : errLga ? "border-red-500 bg-red-500/10 text-red-500" : "border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary"}`}>
                <option value="">-- Select LGA --</option>
                {getLgasForState(declarant.state).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" weight="bold" />
            </div>
            <ErrorMessage msg={errLga} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errCity ? "text-red-500" : "text-muted-foreground"}`}>City / Town <span className="text-red-500">*</span></Label>
            <Input placeholder="City name" value={declarant.city} onChange={e => handleUpdate("city", e.target.value)} onBlur={() => handleBlur("city")} className={`h-12 font-bold bg-background text-foreground ${errCity ? "border-red-500 bg-red-500/10 focus-visible:ring-red-500/20" : "border-border focus-visible:border-primary focus-visible:ring-primary"}`} />
            <ErrorMessage msg={errCity} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errStreet ? "text-red-500" : "text-muted-foreground"}`}>Street Name & Number <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. 12 Awolowo Way" value={declarant.street} onChange={e => handleUpdate("street", e.target.value)} onBlur={() => handleBlur("street")} className={`h-12 font-bold bg-background text-foreground ${errStreet ? "border-red-500 bg-red-500/10 focus-visible:ring-red-500/20" : "border-border focus-visible:border-primary focus-visible:ring-primary"}`} />
            <ErrorMessage msg={errStreet} />
          </div>
        </div>
      </section>

      <div>
        <div 
          onClick={() => handleUpdate("isAcknowledged", !declarant.isAcknowledged)}
          className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
            declarant.isAcknowledged 
              ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" 
              : errAck
              ? "border-red-500 bg-red-500/10"
              : "border-border hover:border-primary/50 bg-card shadow-sm"
          }`}
        >
          <p className={`text-sm font-bold leading-relaxed pr-4 transition-colors ${declarant.isAcknowledged ? "text-emerald-500" : errAck ? "text-red-500" : "text-foreground"}`}>
            I confirm that the requirements of the Companies and Allied Matters Act 2020 as to registration have been complied with.
          </p>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${declarant.isAcknowledged ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"}`}>
            <CheckCircle className="h-5 w-5" weight="bold" />
          </div>
        </div>
        {errAck && (
          <div className="text-[11px] font-bold text-red-500 flex items-center gap-1.5 mt-2 ml-2">
            <WarningCircle weight="fill" className="h-4 w-4 shrink-0" /> {errAck}
          </div>
        )}
      </div>

    </div>
  );
}
