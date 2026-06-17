"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, User, Trash, PencilSimple, WarningCircle, CaretDown, CaretUp } from "@phosphor-icons/react";
import { COUNTRY_CODES, NIGERIA_DATA } from "@/components/dashboard/register/biz-name/schema";

// Helper component for the collapsible "Side by Opposite" view
const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0 gap-4">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">{label}</span>
    <span className="text-[13px] font-black text-slate-900 text-right truncate">{value || "-"}</span>
  </div>
);

export default function OfficersStep({ data, updateData, showErrors }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [officerType, setOfficerType] = useState<"DIRECTOR" | "SECRETARY_INDIVIDUAL" | "SECRETARY_CORPORATE" | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null); // For collapsible view

  const [currentOfficer, setCurrentOfficer] = useState<any>({
    id: "", roles: [], surname: "", firstName: "", otherName: "", email: "", 
    phoneCode: "+234", phone: "", gender: "", dob: "", occupation: "", 
    nationality: "Nigeria", idType: "", idNumber: "", 
    residentialAddress: { state: "", lga: "", city: "", street: "" },
    isAlsoShareholder: false // Defaulted to false as requested
  });

  const officers: any[] = data.officers || [];

  // ==========================================
  // VALIDATION ENGINE
  // ==========================================
  const handleBlur = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const getError = (fieldKey: string, value: string, type: "text" | "email" | "dob" | "phone" | "idNumber" = "text") => {
    if (!touched[fieldKey] && !showErrors) return null;
    if (!value || !value.trim()) return "This field is required.";
    
    if (type === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email address.";
    }
    if (type === "phone") {
      if (value.replace(/\D/g, '').length < 5) return "Invalid phone number.";
    }
    if (type === "dob") {
      const age = Math.abs(new Date(Date.now() - new Date(value).getTime()).getUTCFullYear() - 1970);
      if (age < 18) return "Officer must be at least 18 years old.";
    }
    if (type === "idNumber") {
      // STRICT NIN VALIDATION
      if (currentOfficer.idType === "NIN" && !/^\d{11}$/.test(value)) {
        return "NIN must be exactly 11 digits.";
      }
    }
    return null; 
  };

  const ErrorMessage = ({ msg }: { msg: string | null }) => {
    if (!msg) return null;
    return (
      <div className="text-[11px] font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-1.5 mt-2 border border-red-100 animate-in fade-in slide-in-from-top-1">
        <WarningCircle weight="fill" className="h-4 w-4 shrink-0" /> {msg}
      </div>
    );
  };

  // Run Validations
  const errSur = getError("surname", currentOfficer.surname);
  const errFirst = getError("firstName", currentOfficer.firstName);
  const errEmail = getError("email", currentOfficer.email, "email");
  const errPhone = getError("phone", currentOfficer.phone, "phone");
  const errGender = getError("gender", currentOfficer.gender);
  const errDob = getError("dob", currentOfficer.dob, "dob");
  const errOcc = getError("occupation", currentOfficer.occupation);
  const errNat = getError("nationality", currentOfficer.nationality);
  const errIdType = getError("idType", currentOfficer.idType);
  const errIdNum = getError("idNumber", currentOfficer.idNumber, "idNumber");
  
  const addr = currentOfficer.residentialAddress;
  const errState = getError("state", addr.state);
  const errLga = getError("lga", addr.lga);
  const errCity = getError("city", addr.city);
  const errStreet = getError("street", addr.street);

  const isFormValid = !errSur && !errFirst && !errEmail && !errPhone && !errGender && !errDob && !errOcc && !errNat && !errIdType && !errIdNum && !errState && !errLga && !errCity && !errStreet && currentOfficer.surname;

  // ==========================================
  // FORM HANDLERS
  // ==========================================
  const handleSaveOfficer = () => {
    const allTouched = ["surname", "firstName", "email", "phone", "gender", "dob", "occupation", "nationality", "idType", "idNumber", "state", "lga", "city", "street"].reduce((acc, curr) => ({ ...acc, [curr]: true }), {});
    setTouched(allTouched);

    if (!isFormValid) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    let finalRoles = [];
    if (officerType === "DIRECTOR") finalRoles.push("DIRECTOR");
    if (officerType?.includes("SECRETARY")) finalRoles.push("SECRETARY");
    if (currentOfficer.isAlsoShareholder) finalRoles.push("SHAREHOLDER");

    const officerToSave = {
      ...currentOfficer,
      id: editingId || crypto.randomUUID(),
      roles: finalRoles
    };

    updateData((prev: any) => {
      const existing = prev.officers || [];
      if (editingId) {
        return { ...prev, officers: existing.map((o: any) => o.id === editingId ? officerToSave : o) };
      }
      return { ...prev, officers: [...existing, officerToSave] };
    });

    closeForm();
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setOfficerType(null);
    setTouched({});
    setCurrentOfficer({
      id: "", roles: [], surname: "", firstName: "", otherName: "", email: "", 
      phoneCode: "+234", phone: "", gender: "", dob: "", occupation: "", 
      nationality: "Nigeria", idType: "", idNumber: "", 
      residentialAddress: { state: "", lga: "", city: "", street: "" },
      isAlsoShareholder: false
    });
  };

  const editOfficer = (e: React.MouseEvent, officer: any) => {
    e.stopPropagation(); // Prevent opening the accordion
    setOfficerType(officer.roles.includes("DIRECTOR") ? "DIRECTOR" : "SECRETARY_INDIVIDUAL");
    setEditingId(officer.id);
    setCurrentOfficer({
      ...officer,
      isAlsoShareholder: officer.roles.includes("SHAREHOLDER")
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeOfficer = (e: React.MouseEvent, idToRemove: string) => {
    e.stopPropagation(); // Prevent opening the accordion
    updateData((prev: any) => ({
      ...prev, officers: prev.officers.filter((o: any) => o.id !== idToRemove)
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setCurrentOfficer((prev: any) => {
      let updatedAddr = { ...prev.residentialAddress, [field]: value };
      return { ...prev, residentialAddress: updatedAddr };
    });
  };

  const nigerianStates = NIGERIA_DATA.map(d => d.state).sort();
  const getLgasForState = (stateName: string) => {
    const stateObj = NIGERIA_DATA.find(d => d.state === stateName);
    return stateObj ? stateObj.lgas.sort() : [];
  };

  return (
    <div className="p-4 sm:p-10 space-y-8 animate-in fade-in duration-500 relative">
      
      {!isAdding ? (
        <section>
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Company Officers</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Private companies must have at least one (1) Director. A Secretary is optional for small companies.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Button onClick={() => { setOfficerType("DIRECTOR"); setIsAdding(true); }} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 px-4">
                <Plus weight="bold" className="mr-2" /> Add Director
              </Button>
              <Button variant="outline" onClick={() => { setOfficerType("SECRETARY_INDIVIDUAL"); setIsAdding(true); }} className="flex-1 md:flex-none border-slate-200 text-slate-700 font-bold rounded-xl h-10 px-4 bg-white hover:bg-slate-50">
                <Plus weight="bold" className="mr-2" /> Add Secretary
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {officers.length === 0 ? (
               <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl mx-1 sm:mx-0">
                 <User className="h-10 w-10 text-slate-300 mx-auto mb-3" weight="duotone" />
                 <p className="text-sm font-bold text-slate-500">No officers added yet.</p>
                 <p className="text-xs font-black text-red-500 mt-1 uppercase tracking-widest">You need at least 1 Director to proceed.</p>
               </div>
            ) : (
              officers.map((officer) => (
                <div key={officer.id} className="bg-white border border-slate-200 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all overflow-hidden hover:border-indigo-300">
                  
                  {/* ACCORDION HEADER */}
                  <div 
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedId(expandedId === officer.id ? null : officer.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                        <User className="h-6 w-6" weight="fill" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">{officer.firstName} {officer.surname}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {officer.roles.map((role: string) => (
                            <span key={role} className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              role === 'DIRECTOR' ? 'bg-indigo-100 text-indigo-700' : 
                              role === 'SHAREHOLDER' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-2 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-3">
                      <div className="hidden sm:flex text-slate-400 p-2">
                        {expandedId === officer.id ? <CaretUp weight="bold" /> : <CaretDown weight="bold" />}
                      </div>
                      <button onClick={(e) => editOfficer(e, officer)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex-1 sm:flex-none flex justify-center z-10 relative">
                        <PencilSimple className="h-5 w-5" weight="bold" />
                      </button>
                      <button onClick={(e) => removeOfficer(e, officer.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-1 sm:flex-none flex justify-center z-10 relative">
                        <Trash className="h-5 w-5" weight="bold" />
                      </button>
                    </div>
                  </div>

                  {/* ACCORDION BODY (SIDE-BY-OPPOSITE DATA VIEW) */}
                  {expandedId === officer.id && (
                    <div className="p-5 border-t border-slate-100 bg-slate-50/50 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
                        
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 border-b border-indigo-100 pb-1">Personal Details</h4>
                          <DetailRow label="Gender" value={officer.gender} />
                          <DetailRow label="Date of Birth" value={officer.dob} />
                          <DetailRow label="Nationality" value={officer.nationality} />
                          <DetailRow label="Occupation" value={officer.occupation} />
                        </div>

                        <div className="space-y-1 mt-6 md:mt-0">
                          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 border-b border-indigo-100 pb-1">Contact & ID</h4>
                          <DetailRow label="Phone" value={`${officer.phoneCode} ${officer.phone}`} />
                          <DetailRow label="Email" value={officer.email} />
                          <DetailRow label="ID Type" value={officer.idType} />
                          <DetailRow label="ID Number" value={officer.idNumber} />
                        </div>

                        <div className="md:col-span-2 space-y-1 mt-6">
                          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2 border-b border-indigo-100 pb-1">Residential Address</h4>
                          <DetailRow label="Address" value={`${officer.residentialAddress?.street}, ${officer.residentialAddress?.city}, ${officer.residentialAddress?.lga}, ${officer.residentialAddress?.state}`} />
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              ))
            )}
          </div>
        </section>
      ) : (
        /* ========================================== */
        /* ADD / EDIT OFFICER FORM                    */
        /* ========================================== */
        <section className="animate-in fade-in duration-300">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 bg-slate-50 -mx-4 sm:-mx-10 px-4 sm:px-10 pt-4 -mt-4 sm:-mt-10 rounded-t-3xl sm:rounded-none">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <User className="h-6 w-6 text-indigo-500" weight="fill" />
                {editingId ? "Edit" : "Add"} {officerType === "DIRECTOR" ? "Director" : "Secretary"}
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Enter their personal and identification details.</p>
            </div>
            <Button variant="ghost" onClick={closeForm} className="text-slate-500 font-bold bg-white border border-slate-200">Cancel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2 mt-2">
               <h3 className="text-sm font-black text-slate-900 border-b pb-2 uppercase tracking-widest">Personal Details</h3>
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errSur ? "text-red-500" : "text-slate-500"}`}>Surname <span className="text-red-500">*</span></Label>
              <Input placeholder="E.g. Doe" value={currentOfficer.surname} onChange={e => setCurrentOfficer({...currentOfficer, surname: e.target.value})} onBlur={() => handleBlur("surname")} className={`h-12 font-bold ${errSur ? "border-red-500 bg-red-50/30" : ""}`} />
              <ErrorMessage msg={errSur} />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errFirst ? "text-red-500" : "text-slate-500"}`}>First Name <span className="text-red-500">*</span></Label>
              <Input placeholder="E.g. Jane" value={currentOfficer.firstName} onChange={e => setCurrentOfficer({...currentOfficer, firstName: e.target.value})} onBlur={() => handleBlur("firstName")} className={`h-12 font-bold ${errFirst ? "border-red-500 bg-red-50/30" : ""}`} />
              <ErrorMessage msg={errFirst} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Other Name</Label>
              <Input value={currentOfficer.otherName} onChange={e => setCurrentOfficer({...currentOfficer, otherName: e.target.value})} className="h-12 font-bold" />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errDob ? "text-red-500" : "text-slate-500"}`}>Date of Birth <span className="text-red-500">*</span></Label>
              <Input type="date" value={currentOfficer.dob} onChange={e => setCurrentOfficer({...currentOfficer, dob: e.target.value})} onBlur={() => handleBlur("dob")} className={`h-12 font-bold uppercase ${errDob ? "border-red-500 bg-red-50/30" : ""}`} />
              <ErrorMessage msg={errDob} />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errGender ? "text-red-500" : "text-slate-500"}`}>Gender <span className="text-red-500">*</span></Label>
              <select className={`w-full h-12 px-4 border rounded-xl text-sm font-bold outline-none ${errGender ? "border-red-500 bg-red-50/30" : "border-slate-200 bg-white focus:border-indigo-500"}`} value={currentOfficer.gender} onChange={e => setCurrentOfficer({...currentOfficer, gender: e.target.value})} onBlur={() => handleBlur("gender")}>
                <option value="">-- Select Gender --</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
              </select>
              <ErrorMessage msg={errGender} />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errOcc ? "text-red-500" : "text-slate-500"}`}>Occupation <span className="text-red-500">*</span></Label>
              <Input placeholder="E.g. Engineer" value={currentOfficer.occupation} onChange={e => setCurrentOfficer({...currentOfficer, occupation: e.target.value})} onBlur={() => handleBlur("occupation")} className={`h-12 font-bold ${errOcc ? "border-red-500 bg-red-50/30" : ""}`} />
              <ErrorMessage msg={errOcc} />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errNat ? "text-red-500" : "text-slate-500"}`}>Nationality <span className="text-red-500">*</span></Label>
              <div className="relative">
                <select className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none ${errNat ? "border-red-500 bg-red-50/30 text-red-900" : "border-slate-200 bg-white focus:border-indigo-500"}`} value={currentOfficer.nationality} onChange={e => {
                  setCurrentOfficer((p: any) => {
                    let updated = { ...p, nationality: e.target.value };
                    if (e.target.value !== "Nigeria") { updated.residentialAddress.state = ""; updated.residentialAddress.lga = ""; }
                    return updated;
                  });
                }} onBlur={() => handleBlur("nationality")}>
                  {COUNTRY_CODES.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
                </select>
                <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
              </div>
              <ErrorMessage msg={errNat} />
            </div>

            <div className="md:col-span-2 mt-4">
               <h3 className="text-sm font-black text-slate-900 border-b pb-2 uppercase tracking-widest">Contact Details</h3>
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errEmail ? "text-red-500" : "text-slate-500"}`}>Email Address <span className="text-red-500">*</span></Label>
              <Input type="email" placeholder="jane@example.com" value={currentOfficer.email} onChange={e => setCurrentOfficer({...currentOfficer, email: e.target.value})} onBlur={() => handleBlur("email")} className={`h-12 font-bold ${errEmail ? "border-red-500 bg-red-50/30" : ""}`} />
              <ErrorMessage msg={errEmail} />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errPhone ? "text-red-500" : "text-slate-500"}`}>Phone Number <span className="text-red-500">*</span></Label>
              <div className="flex">
                <select value={currentOfficer.phoneCode} onChange={e => setCurrentOfficer({...currentOfficer, phoneCode: e.target.value})} className="w-[100px] h-12 px-2 border border-r-0 border-slate-200 rounded-l-xl text-sm font-bold bg-slate-50 outline-none focus:bg-white focus:border-indigo-500">
                  {COUNTRY_CODES.map(c => <option key={`code-${c.name}`} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <Input type="tel" placeholder="8012345678" value={currentOfficer.phone} onChange={e => setCurrentOfficer({...currentOfficer, phone: e.target.value})} onBlur={() => handleBlur("phone")} className={`h-12 font-bold rounded-l-none flex-1 ${errPhone ? "border-red-500 bg-red-50/30" : ""}`} />
              </div>
              <ErrorMessage msg={errPhone} />
            </div>

            <div className="md:col-span-2 mt-4">
               <h3 className="text-sm font-black text-slate-900 border-b pb-2 uppercase tracking-widest">Residential Address</h3>
            </div>

            {currentOfficer.nationality === "Nigeria" ? (
              <>
                <div className="space-y-2">
                  <Label className={`text-xs font-bold uppercase ${errState ? "text-red-500" : "text-slate-500"}`}>State <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <select value={addr.state} onChange={e => { handleAddressChange("state", e.target.value); handleAddressChange("lga", ""); }} onBlur={() => handleBlur("state")} className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none ${errState ? "border-red-500 bg-red-50/30 text-red-900" : "border-slate-200 bg-white focus:border-indigo-500"}`}>
                      <option value="">-- Select State --</option>
                      {nigerianStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
                  </div>
                  <ErrorMessage msg={errState} />
                </div>
                <div className="space-y-2">
                  <Label className={`text-xs font-bold uppercase ${errLga ? "text-red-500" : "text-slate-500"}`}>LGA <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <select value={addr.lga} disabled={!addr.state} onChange={e => handleAddressChange("lga", e.target.value)} onBlur={() => handleBlur("lga")} className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none ${!addr.state ? "bg-slate-50 opacity-60" : errLga ? "border-red-500 bg-red-50/30 text-red-900" : "border-slate-200 bg-white focus:border-indigo-500"}`}>
                      <option value="">-- Select LGA --</option>
                      {getLgasForState(addr.state).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
                  </div>
                  <ErrorMessage msg={errLga} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className={`text-xs font-bold uppercase ${errState ? "text-red-500" : "text-slate-500"}`}>State / Province <span className="text-red-500">*</span></Label>
                  <Input placeholder="E.g. Texas" value={addr.state} onChange={e => handleAddressChange("state", e.target.value)} onBlur={() => handleBlur("state")} className={`h-12 font-bold ${errState ? "border-red-500 bg-red-50/30" : ""}`} />
                  <ErrorMessage msg={errState} />
                </div>
                <div className="space-y-2">
                  <Label className={`text-xs font-bold uppercase ${errLga ? "text-red-500" : "text-slate-500"}`}>County / Region <span className="text-red-500">*</span></Label>
                  <Input placeholder="E.g. Travis County" value={addr.lga} onChange={e => handleAddressChange("lga", e.target.value)} onBlur={() => handleBlur("lga")} className={`h-12 font-bold ${errLga ? "border-red-500 bg-red-50/30" : ""}`} />
                  <ErrorMessage msg={errLga} />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errCity ? "text-red-500" : "text-slate-500"}`}>City / Town <span className="text-red-500">*</span></Label>
              <Input placeholder="City Name" value={addr.city} onChange={e => handleAddressChange("city", e.target.value)} onBlur={() => handleBlur("city")} className={`h-12 font-bold ${errCity ? "border-red-500 bg-red-50/30" : ""}`} />
              <ErrorMessage msg={errCity} />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errStreet ? "text-red-500" : "text-slate-500"}`}>Full Street Address <span className="text-red-500">*</span></Label>
              <Input placeholder="E.g. 12 Awolowo Way" value={addr.street} onChange={e => handleAddressChange("street", e.target.value)} onBlur={() => handleBlur("street")} className={`h-12 font-bold ${errStreet ? "border-red-500 bg-red-50/30" : ""}`} />
              <ErrorMessage msg={errStreet} />
            </div>

            <div className="md:col-span-2 mt-4">
               <h3 className="text-sm font-black text-slate-900 border-b pb-2 uppercase tracking-widest">Identification</h3>
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errIdType ? "text-red-500" : "text-slate-500"}`}>Means of Identification <span className="text-red-500">*</span></Label>
              <div className="relative">
                <select className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none ${errIdType ? "border-red-500 bg-red-50/30 text-red-900" : "border-slate-200 bg-white focus:border-indigo-500"}`} value={currentOfficer.idType} onChange={e => setCurrentOfficer({...currentOfficer, idType: e.target.value})} onBlur={() => handleBlur("idType")}>
                  <option value="">-- Select Option --</option>
                  <option value="NIN">National ID Card (NIN)</option>
                  <option value="PASSPORT">International Passport</option>
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                  <option value="VOTERS_CARD">Permanent Voters' Card</option>
                </select>
                <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
              </div>
              <ErrorMessage msg={errIdType} />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errIdNum ? "text-red-500" : "text-slate-500"}`}>Identity Number <span className="text-red-500">*</span></Label>
              <Input placeholder="Enter ID Number" value={currentOfficer.idNumber} onChange={e => setCurrentOfficer({...currentOfficer, idNumber: e.target.value})} onBlur={() => handleBlur("idNumber")} className={`h-12 font-bold ${errIdNum ? "border-red-500 bg-red-50/30" : ""}`} />
              <ErrorMessage msg={errIdNum} />
            </div>

            {officerType === "DIRECTOR" && (
              <div className="md:col-span-2 mt-2 p-4 sm:p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between cursor-pointer shadow-sm hover:shadow-md transition-shadow" onClick={() => setCurrentOfficer({...currentOfficer, isAlsoShareholder: !currentOfficer.isAlsoShareholder})}>
                <div className="pr-4">
                  <h3 className="text-sm font-black text-emerald-900">Is this Director also a Shareholder?</h3>
                  <p className="text-xs font-medium text-emerald-700 mt-1 leading-relaxed">If checked, they will automatically be added to the Share Distribution table later.</p>
                </div>
                <div className="relative shrink-0">
                  <div className={`block w-12 h-7 rounded-full transition-colors ${currentOfficer.isAlsoShareholder ? "bg-emerald-500" : "bg-slate-300"}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${currentOfficer.isAlsoShareholder ? "translate-x-5" : ""}`}></div>
                </div>
              </div>
            )}

            <div className="md:col-span-2 mt-6 flex justify-end gap-3 border-t pt-6 border-slate-100">
              <Button variant="outline" onClick={closeForm} className="h-12 px-6 rounded-xl font-bold">Cancel</Button>
              <Button onClick={handleSaveOfficer} className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md min-w-[140px]">
                {editingId ? "Update" : "Save"} Officer
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
