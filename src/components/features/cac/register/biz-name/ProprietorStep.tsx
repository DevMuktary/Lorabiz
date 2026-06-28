"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Proprietor, NIGERIA_DATA, COUNTRY_CODES, isValidEmail, isValidPhone, calculateAge, defaultPropForm } from "./schema";

// --- HELPER COMPONENTS & FUNCTIONS ---
const getFlag = (code: string | undefined) => {
  const safeCode = code || "+234"; // Fallback for older database drafts
  const country = COUNTRY_CODES.find(c => c.code === safeCode);
  return country ? country.flag : "🇳🇬";
};

// Custom responsive row for the collapsed view to prevent mobile overlap
const FieldRow = ({ label, value }: { label: string, value: any }) => (
  <div className="flex flex-col sm:flex-row sm:items-center border-b border-border py-3 last:border-0 gap-1 sm:gap-4">
     <span className="text-muted-foreground text-xs font-black uppercase tracking-wider w-full sm:w-[160px] md:w-[200px] shrink-0">{label}</span>
     <span className="font-bold text-foreground break-words w-full">{value || "-"}</span>
  </div>
);

export default function ProprietorStep({ 
  proprietors, setProprietors, isSoleProprietor 
}: { 
  proprietors: Proprietor[], setProprietors: (p: Proprietor[]) => void, isSoleProprietor: boolean 
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // --- AUTO-OPEN LOGIC FIX ---
  useEffect(() => {
    if (proprietors.length === 0) {
      // If totally empty, create one and open it
      const newId = Date.now().toString();
      setProprietors([{ ...defaultPropForm, id: newId }]);
      setExpandedId(newId);
    } else {
      // Only auto-open if there is an INCOMPLETE proprietor. 
      // If all are completed (e.g. loaded from draft), leave them collapsed for a clean view.
      const incompleteProp = proprietors.find(p => !isProprietorValid(p));
      if (incompleteProp && !expandedId) {
        setExpandedId(incompleteProp.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProprietor = (id: string, field: keyof Proprietor, value: any) => {
    setValidationError(null); // Clear errors when typing
    setProprietors(proprietors.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleAddPartner = () => {
    // Only allow adding a new partner if the current expanded one is fully valid
    if (expandedId) {
      const currentProp = proprietors.find(p => p.id === expandedId);
      if (currentProp && !isProprietorValid(currentProp)) {
        setValidationError("Please complete this proprietor's required fields before adding another.");
        return;
      }
    }
    const newId = Date.now().toString();
    setProprietors([...proprietors, { ...defaultPropForm, id: newId }]);
    setExpandedId(newId);
    setValidationError(null);
  };

  const isProprietorValid = (prop: Proprietor) => {
    return prop.surname && prop.firstName && prop.email && prop.phone && 
           prop.gender && prop.dob && prop.state && prop.lga && 
           prop.city && prop.streetNo && prop.serviceAddress && 
           isValidEmail(prop.email) && isValidPhone(prop.phone);
  };

  const handleSaveAndCollapse = (prop: Proprietor) => {
    if (!isProprietorValid(prop)) {
      setValidationError("Please fill all required fields correctly to save and collapse.");
      return;
    }
    setValidationError(null);
    setExpandedId(null); // Close the form
  };

  const removeProprietor = (id: string) => {
    const filtered = proprietors.filter(p => p.id !== id);
    setProprietors(filtered);
    if (expandedId === id) {
       // If they removed the one they were editing, open the next incomplete one or close.
       const nextIncomplete = filtered.find(p => !isProprietorValid(p));
       setExpandedId(nextIncomplete ? nextIncomplete.id : null);
    }
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
        <h2 className="text-2xl font-black text-foreground">Proprietors</h2>
        {!isSoleProprietor && (
          <Button onClick={handleAddPartner} className="bg-foreground hover:opacity-90 text-background font-bold rounded-xl cursor-pointer transition-opacity">
            + Add Partner
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {proprietors.map((prop, idx) => {
          const isOpen = expandedId === prop.id;
          const availableLgas = NIGERIA_DATA.find(s => s.state === prop.state)?.lgas || [];
          const age = calculateAge(prop.dob);
          
          // Secure the phone code fallback for old drafts
          const pCode = prop.phoneCode || "+234"; 

          return (
            <div key={prop.id} className="border border-border rounded-2xl bg-card overflow-hidden shadow-sm transition-colors duration-300">
              
              {/* --- THE SHARP LINE-BY-LINE VIEW (COLLAPSED) --- */}
              {!isOpen && (
                <div className="bg-card relative">
                  <div className="bg-secondary/50 px-5 py-4 border-b border-border flex justify-between items-center">
                     <span className="font-black text-foreground text-lg">{idx + 1} | Proprietor ({prop.surname || "Pending"} {prop.firstName})</span>
                     <div className="flex gap-4">
                        <button onClick={() => setExpandedId(prop.id)} className="text-primary font-bold text-sm hover:underline cursor-pointer">Edit</button>
                        {proprietors.length > 1 && (
                          <button onClick={() => removeProprietor(prop.id)} className="text-red-500 font-bold text-sm hover:underline cursor-pointer">Remove</button>
                        )}
                     </div>
                  </div>
                  
                  <div className="px-5 py-2">
                     <FieldRow label="Surname" value={prop.surname} />
                     <FieldRow label="First Name" value={prop.firstName} />
                     {prop.otherName && <FieldRow label="Other Name" value={prop.otherName} />}
                     <FieldRow label="Email" value={prop.email} />
                     {/* FIXED THE UNDEFINED COUNTRY CODE HERE */}
                     <FieldRow label="Phone Number" value={`${getFlag(pCode)} ${pCode} ${prop.phone || ""}`} />
                     <FieldRow label="Gender" value={prop.gender} />
                     <FieldRow label="Date of Birth" value={prop.dob} />
                     <FieldRow label="Service Address" value={prop.serviceAddress} />
                     <FieldRow label="State" value={prop.state} />
                     <FieldRow label="LGA" value={prop.lga} />
                     <FieldRow label="City" value={prop.city} />
                     <FieldRow label="Street No." value={prop.streetNo} />
                  </div>
                </div>
              )}

              {/* --- EXPANDED EDIT FORM --- */}
              {isOpen && (
                <div className="p-5 md:p-8 space-y-6 bg-card">
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <h3 className="font-black text-xl text-foreground">Editing Proprietor {idx + 1}</h3>
                    {proprietors.length > 1 && (
                      <button onClick={() => removeProprietor(prop.id)} className="text-red-500 font-bold text-sm hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">Remove</button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-foreground">Surname <span className="text-red-500">*</span></Label>
                      <Input value={prop.surname} onChange={e=>updateProprietor(prop.id, 'surname', e.target.value)} className="h-12 bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-xl" />
                      {!prop.surname && <p className="text-red-500 text-xs font-bold">Required</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-foreground">First Name <span className="text-red-500">*</span></Label>
                      <Input value={prop.firstName} onChange={e=>updateProprietor(prop.id, 'firstName', e.target.value)} className="h-12 bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-xl" />
                      {!prop.firstName && <p className="text-red-500 text-xs font-bold">Required</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-foreground">Other Name</Label>
                      <Input value={prop.otherName} onChange={e=>updateProprietor(prop.id, 'otherName', e.target.value)} className="h-12 bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-foreground">Email <span className="text-red-500">*</span></Label>
                      <Input type="email" value={prop.email} onChange={e=>updateProprietor(prop.id, 'email', e.target.value)} className="h-12 bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-xl" />
                      {prop.email.length > 0 && !isValidEmail(prop.email) && <p className="text-red-500 text-xs font-bold">Invalid email</p>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-foreground">Phone <span className="text-red-500">*</span></Label>
                      <div className="flex border border-border rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary bg-background transition-colors">
                        {/* FALLBACK VALUE IMPLEMENTED HERE AS WELL */}
                        <select 
                          value={pCode} 
                          onChange={e=>updateProprietor(prop.id, 'phoneCode', e.target.value)}
                          className="bg-secondary border-r border-border px-2 outline-none text-foreground text-sm w-28 shrink-0 font-medium cursor-pointer hover:bg-secondary/80 transition-colors"
                        >
                          {COUNTRY_CODES.map(c => <option key={c.name} value={c.code}>{c.flag} {c.code}</option>)}
                        </select>
                        <Input type="tel" value={prop.phone} onChange={e=>updateProprietor(prop.id, 'phone', e.target.value)} className="h-12 border-0 bg-transparent text-foreground rounded-none focus-visible:ring-0 shadow-none px-3 w-full"/>
                      </div>
                      {prop.phone.length > 0 && !isValidPhone(prop.phone) && <p className="text-red-500 text-xs font-bold">Invalid phone</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-foreground">Gender <span className="text-red-500">*</span></Label>
                      <select value={prop.gender} onChange={e=>updateProprietor(prop.id, 'gender', e.target.value)} className="flex h-12 w-full rounded-xl border border-border bg-background text-foreground px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors">
                        <option value="">Select</option><option value="MALE">MALE</option><option value="FEMALE">FEMALE</option>
                      </select>
                      {!prop.gender && <p className="text-red-500 text-xs font-bold">Required</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-foreground">Date of Birth <span className="text-red-500">*</span></Label>
                      <Input type="date" value={prop.dob} onChange={e=>updateProprietor(prop.id, 'dob', e.target.value)} className="h-12 bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-xl appearance-none" />
                      {prop.dob && age < 18 && <p className="text-amber-500 text-xs font-bold">Under 18 detected. CAC requires at least 2 adult partners for a minor.</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-foreground">State <span className="text-red-500">*</span></Label>
                      <select value={prop.state} onChange={e=>updateProprietor(prop.id, 'state', e.target.value)} className="flex h-12 w-full rounded-xl border border-border bg-background text-foreground px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors">
                        <option value="">Select</option>{NIGERIA_DATA.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                      </select>
                      {!prop.state && <p className="text-red-500 text-xs font-bold">Required</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-foreground">LGA <span className="text-red-500">*</span></Label>
                      <select value={prop.lga} onChange={e=>updateProprietor(prop.id, 'lga', e.target.value)} disabled={!prop.state} className="flex h-12 w-full rounded-xl border border-border bg-background text-foreground px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 outline-none transition-colors">
                        <option value="">Select</option>{availableLgas.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      {!prop.lga && <p className="text-red-500 text-xs font-bold">Required</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-foreground">City <span className="text-red-500">*</span></Label>
                      <Input value={prop.city} onChange={e=>updateProprietor(prop.id, 'city', e.target.value)} className="h-12 bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-xl" />
                      {!prop.city && <p className="text-red-500 text-xs font-bold">Required</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-foreground">Street No. <span className="text-red-500">*</span></Label>
                      <Input value={prop.streetNo} onChange={e=>updateProprietor(prop.id, 'streetNo', e.target.value)} className="h-12 bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-xl" />
                      {!prop.streetNo && <p className="text-red-500 text-xs font-bold">Required</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-bold text-foreground">Service Address <span className="text-red-500">*</span></Label>
                      <Input value={prop.serviceAddress} onChange={e=>updateProprietor(prop.id, 'serviceAddress', e.target.value)} className="h-12 bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary rounded-xl" />
                      {!prop.serviceAddress && <p className="text-red-500 text-xs font-bold">Required</p>}
                    </div>
                  </div>
                  
                  {validationError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-bold flex items-center">
                      <span className="mr-2">⚠️</span> {validationError}
                    </div>
                  )}

                  <div className="pt-6 flex justify-end border-t border-border">
                    <Button onClick={() => handleSaveAndCollapse(prop)} className="bg-primary hover:opacity-90 text-primary-foreground h-12 px-8 rounded-xl font-bold shadow-md shadow-primary/20 transition-all cursor-pointer">
                      Save & Collapse
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
