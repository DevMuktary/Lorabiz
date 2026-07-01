"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, User, Trash, PencilSimple, WarningCircle, CaretDown, CaretUp } from "@phosphor-icons/react";
import { COUNTRY_CODES, NIGERIA_DATA } from "@/components/features/cac/register/biz-name/schema";

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-start py-2.5 border-b border-border/60 last:border-0 gap-4">
    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0 mt-0.5">{label}</span>
    <span className="text-[13px] font-black text-foreground text-right break-words">{value || "-"}</span>
  </div>
);

export default function OfficersStep({ data, updateData, showErrors }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [officerType, setOfficerType] = useState<"DIRECTOR" | "SECRETARY_INDIVIDUAL" | "SECRETARY_CORPORATE" | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null); 

  const [currentOfficer, setCurrentOfficer] = useState<any>({
    id: "", roles: [], surname: "", firstName: "", otherName: "", email: "", 
    phoneCode: "+234", phone: "", gender: "", dob: "", occupation: "", 
    nationality: "Nigeria", idType: "", idNumber: "", 
    residentialAddress: { state: "", lga: "", city: "", street: "" },
    isAlsoShareholder: false 
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
      if (currentOfficer.idType === "NIN" && !/^\d{11}$/.test(value)) {
        return "NIN must be exactly 11 digits.";
      }
    }
    return null; 
  };

  const ErrorMessage = ({ msg }: { msg: string | null }) => {
    if (!msg) return null;
    return (
      <div className="text-[11px] font-bold text-red-500 bg-red-500/10 px-3 py-2 rounded-lg flex items-center gap-1.5 mt-2 border border-red-500/20 animate-in fade-in slide-in-from-top-1">
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
    e.stopPropagation(); 
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
    e.stopPropagation(); 
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
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-black text-foreground">Company Officers</h2>
              <p className="text-sm font-medium text-muted-foreground mt-1">
                Private companies must have at least one (1) Director. A Secretary is optional for small companies.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Button onClick={() => { setOfficerType("DIRECTOR"); setIsAdding(true); }} className="flex-1 md:flex-none bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl h-10 px-4 cursor-pointer">
                <Plus weight="bold" className="mr-2" /> Add Director
              </Button>
              <Button variant="outline" onClick={() => { setOfficerType("SECRETARY_INDIVIDUAL"); setIsAdding(true); }} className="flex-1 md:flex-none border-border text-foreground font-bold rounded-xl h-10 px-4 bg-background hover:bg-secondary cursor-pointer">
                <Plus weight="bold" className="mr-2" /> Add Secretary
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {officers.length === 0 ? (
               <div className="text-center py-12 bg-secondary/30 border-2 border-dashed border-border rounded-3xl mx-1 sm:mx-0">
                 <User className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" weight="duotone" />
                 <p className="text-sm font-bold text-muted-foreground">No officers added yet.</p>
                 <p className="text-xs font-black text-red-500 mt-1 uppercase tracking-widest">You need at least 1 Director to proceed.</p>
               </div>
            ) : (
              officers.map((officer) => (
                <div key={officer.id} className="bg-card border border-border rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all overflow-hidden hover:border-primary/50">
                  
                  {/* ACCORDION HEADER */}
                  <div 
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => setExpandedId(expandedId === officer.id ? null : officer.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <User className="h-6 w-6" weight="fill" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-foreground">{officer.firstName} {officer.surname}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {officer.roles.map((role: string) => (
                            <span key={role} className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                              role === 'DIRECTOR' ? 'bg-primary/10 text-primary' : 
                              role === 'SHAREHOLDER' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-2 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-3 w-full md:w-auto">
                      
                      <div className={`flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-lg mr-auto md:mr-2 transition-colors ${expandedId === officer.id ? 'bg-secondary text-foreground' : 'bg-primary/10 text-primary'}`}>
                        {expandedId === officer.id ? "Hide Details" : "View Details"}
                        {expandedId === officer.id ? <CaretUp weight="bold" className="h-4 w-4" /> : <CaretDown weight="bold" className="h-4 w-4" />}
                      </div>

                      <button onClick={(e) => editOfficer(e, officer)} className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors z-10 relative cursor-pointer">
                        <PencilSimple className="h-5 w-5" weight="bold" />
                      </button>
                      <button onClick={(e) => removeOfficer(e, officer.id)} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors z-10 relative cursor-pointer">
                        <Trash className="h-5 w-5" weight="bold" />
                      </button>
                    </div>
                  </div>

                  {/* ACCORDION BODY (UNMERGED DATA VIEW) */}
                  {expandedId === officer.id && (
                    <div className="p-5 sm:p-6 border-t border-border bg-secondary/30 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        
                        {/* Column 1: Personal Details */}
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 border-b border-border pb-1">Personal Details</h4>
                          <DetailRow label="Surname" value={officer.surname} />
                          <DetailRow label="First Name" value={officer.firstName} />
                          <DetailRow label="Other Name" value={officer.otherName} />
                          <DetailRow label="Gender" value={officer.gender} />
                          <DetailRow label="Date of Birth" value={officer.dob} />
                          <DetailRow label="Nationality" value={officer.nationality} />
                          <DetailRow label="Occupation" value={officer.occupation} />
                        </div>

                        {/* Column 2: Contact & ID */}
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 border-b border-border pb-1">Contact & ID</h4>
                          <DetailRow label="Phone Code" value={officer.phoneCode} />
                          <DetailRow label="Phone Number" value={officer.phone} />
                          <DetailRow label="Email Address" value={officer.email} />
                          <DetailRow label="ID Type" value={officer.idType} />
                          <DetailRow label="ID Number" value={officer.idNumber} />
                        </div>

                        {/* Column 3: Full Address Unmerged */}
                        <div className="md:col-span-2 space-y-1">
                          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 border-b border-border pb-1">Residential Address</h4>
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
              ))
            )}
          </div>
        </section>
      ) : (
        /* ========================================== */
        /* ADD / EDIT OFFICER FORM                    */
        /* ========================================== */
        <section className="animate-in fade-in duration-300">
          <div className="mb-6 flex items-center justify-between border-b border-border pb-4 bg-secondary/50 -mx-4 sm:-mx-10 px-4 sm:px-10 pt-4 -mt-4 sm:-mt-10 rounded-t-3xl sm:rounded-none">
            <div>
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <User className="h-6 w-6 text-primary" weight="fill" />
                {editingId ? "Edit" : "Add"} {officerType === "DIRECTOR" ? "Director" : "Secretary"}
              </h2>
              <p className="text-sm font-medium text-muted-foreground mt-1">Enter their personal and identification details.</p>
            </div>
            <Button variant="ghost" onClick={closeForm} className="text-muted-foreground hover:text-foreground font-bold bg-background border border-border cursor-pointer">Cancel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2 mt-2">
               <h3 className="text-sm font-black text-foreground border-b border-border pb-2 uppercase tracking-widest">Personal Details</h3>
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errSur ? "text-red-500" : "text-muted-foreground"}`}>Surname <span className="text-red-500">*</span></Label>
              <Input placeholder="E.g. Doe" value={currentOfficer.surname} onChange={e => setCurrentOfficer({...currentOfficer, surname: e.target.value})} onBlur={() => handleBlur("surname")} className={`h-12 font-bold bg-background text-foreground ${errSur ? "border-red-500 bg-red-500/10 focus-visible:ring-red-500/20" : "border-border focus-visible:border-primary focus-visible:ring-primary"}`} />
              <ErrorMessage msg={errSur} />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errFirst ? "text-red-500" : "text-muted-foreground"}`}>First Name <span className="text-red-500">*</span></Label>
              <Input placeholder="E.g. Jane" value={currentOfficer.firstName} onChange={e => setCurrentOfficer({...currentOfficer, firstName: e.target.value})} onBlur={() => handleBlur("firstName")} className={`h-12 font-bold bg-background text-foreground ${errFirst ? "border-red-500 bg-red-500/10 focus-visible:ring-red-500/20" : "border-border focus-visible:border-primary focus-visible:ring-primary"}`} />
              <ErrorMessage msg={errFirst} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Other Name</Label>
              <Input value={currentOfficer.otherName} onChange={e => setCurrentOfficer({...currentOfficer, otherName: e.target.value})} className="h-12 font-bold bg-background text-foreground border-border focus-visible:border-primary focus-visible:ring-primary" />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errDob ? "text-red-500" : "text-muted-foreground"}`}>Date of Birth <span className="text-red-500">*</span></Label>
              <Input type="date" value={currentOfficer.dob} onChange={e => setCurrentOfficer({...currentOfficer, dob: e.target.value})} onBlur={() => handleBlur("dob")} className={`h-12 font-bold uppercase appearance-none bg-background text-foreground ${errDob ? "border-red-500 bg-red-500/10 focus-visible:ring-red-500/20" : "border-border focus-visible:border-primary focus-visible:ring-primary"}`} />
              <ErrorMessage msg={errDob} />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errGender ? "text-red-500" : "text-muted-foreground"}`}>Gender <span className="text-red-500">*</span></Label>
              <select 
                className={`w-full h-12 px-4 border rounded-xl text-sm font-bold outline-none transition-colors ${errGender ? "border-red-500 bg-red-500/10 text-red-500" : "border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary"}`} 
                value={currentOfficer.gender} 
                onChange={e => setCurrentOfficer({...currentOfficer, gender: e.target.value})} 
                onBlur={() => handleBlur("gender")}
              >
                <option value="">-- Select Gender --</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
              </select>
              <ErrorMessage msg={errGender} />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errOcc ? "text-red-500" : "text-muted-foreground"}`}>Occupation <span className="text-red-500">*</span></Label>
              <Input placeholder="E.g. Engineer" value={currentOfficer.occupation} onChange={e => setCurrentOfficer({...currentOfficer, occupation: e.target.value})} onBlur={() => handleBlur("occupation")} className={`h-12 font-bold bg-background text-foreground ${errOcc ? "border-red-500 bg-red-500/10 focus-visible:ring-red-500/20" : "border-border focus-visible:border-primary focus-visible:ring-primary"}`} />
              <ErrorMessage msg={errOcc} />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errNat ? "text-red-500" : "text-muted-foreground"}`}>Nationality <span className="text-red-500">*</span></Label>
              <div className="relative">
                <select 
                  className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${errNat ? "border-red-500 bg-red-500/10 text-red-500" : "border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary"}`} 
                  value={currentOfficer.nationality} 
                  onChange={e => {
                    setCurrentOfficer((p: any) => {
                      let updated = { ...p, nationality: e.target.value };
                      if (e.target.value !== "Nigeria") { updated.residentialAddress.state = ""; updated.residentialAddress.lga = ""; }
                      return updated;
                    });
                  }} 
                  onBlur={() => handleBlur("nationality")}
                >
                  {COUNTRY_CODES.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
                </select>
                <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" weight="bold" />
              </div>
              <ErrorMessage msg={errNat} />
            </div>

            <div className="md:col-span-2 mt-4">
               <h3 className="text-sm font-black text-foreground border-b border-border pb-2 uppercase tracking-widest">Contact Details</h3>
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errEmail ? "text-red-500" : "text-muted-foreground"}`}>Email Address <span className="text-red-500">*</span></Label>
              <Input type="email" placeholder="jane@example.com" value={currentOfficer.email} onChange={e => setCurrentOfficer({...currentOfficer, email: e.target.value})} onBlur={() => handleBlur("email")} className={`h-12 font-bold bg-background text-foreground ${errEmail ? "border-red-500 bg-red-500/10 focus-visible:ring-red-500/20" : "border-border focus-visible:border-primary focus-visible:ring-primary"}`} />
              <ErrorMessage msg={errEmail} />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errPhone ? "text-red-500" : "text-muted-foreground"}`}>Phone Number <span className="text-red-500">*</span></Label>
              <div className={`flex border rounded-xl overflow-hidden focus-within:ring-1 transition-colors ${errPhone ? "border-red-500 focus-within:ring-red-500/20" : "border-border focus-within:border-primary focus-within:ring-primary"}`}>
                <select 
                  value={currentOfficer.phoneCode} 
                  onChange={e => setCurrentOfficer({...currentOfficer, phoneCode: e.target.value})} 
                  className={`w-[100px] h-12 px-2 border-r rounded-none text-sm font-bold outline-none appearance-none transition-colors cursor-pointer ${errPhone ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-secondary border-border text-foreground hover:bg-secondary/80 focus:bg-background"}`}
                >
                  {COUNTRY_CODES.map(c => <option key={`code-${c.name}`} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <Input type="tel" placeholder="8012345678" value={currentOfficer.phone} onChange={e => setCurrentOfficer({...currentOfficer, phone: e.target.value})} onBlur={() => handleBlur("phone")} className={`h-12 font-bold rounded-l-none border-0 shadow-none focus-visible:ring-0 flex-1 bg-background text-foreground ${errPhone ? "bg-red-500/10" : ""}`} />
              </div>
              <ErrorMessage msg={errPhone} />
            </div>

            <div className="md:col-span-2 mt-4">
               <h3 className="text-sm font-black text-foreground border-b border-border pb-2 uppercase tracking-widest">Residential Address</h3>
            </div>

            {currentOfficer.nationality === "Nigeria" ? (
              <>
                <div className="space-y-2">
                  <Label className={`text-xs font-bold uppercase ${errState ? "text-red-500" : "text-muted-foreground"}`}>State <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <select 
                      value={addr.state} 
                      onChange={e => { handleAddressChange("state", e.target.value); handleAddressChange("lga", ""); }} 
                      onBlur={() => handleBlur("state")} 
                      className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${errState ? "border-red-500 bg-red-500/10 text-red-500" : "border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary"}`}
                    >
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
                    <select 
                      value={addr.lga} 
                      disabled={!addr.state} 
                      onChange={e => handleAddressChange("lga", e.target.value)} 
                      onBlur={() => handleBlur("lga")} 
                      className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${!addr.state ? "bg-secondary border-border text-muted-foreground opacity-60 cursor-not-allowed" : errLga ? "border-red-500 bg-red-500/10 text-red-500" : "border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary"}`}
                    >
                      <option value="">-- Select LGA --</option>
                      {getLgasForState(addr.state).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" weight="bold" />
                  </div>
                  <ErrorMessage msg={errLga} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className={`text-xs font-bold uppercase ${errState ? "text-red-500" : "text-muted-foreground"}`}>State / Province <span className="text-red-500">*</span></Label>
                  <Input placeholder="E.g. Texas" value={addr.state} onChange={e => handleAddressChange("state", e.target.value)} onBlur={() => handleBlur("state")} className={`h-12 font-bold bg-background text-foreground ${errState ? "border-red-500 bg-red-500/10 focus-visible:ring-red-500/20" : "border-border focus-visible:border-primary focus-visible:ring-primary"}`} />
                  <ErrorMessage msg={errState} />
                </div>
                <div className="space-y-2">
                  <Label className={`text-xs font-bold uppercase ${errLga ? "text-red-500" : "text-muted-foreground"}`}>County / Region <span className="text-red-500">*</span></Label>
                  <Input placeholder="E.g. Travis County" value={addr.lga} onChange={e => handleAddressChange("lga", e.target.value)} onBlur={() => handleBlur("lga")} className={`h-12 font-bold bg-background text-foreground ${errLga ? "border-red-500 bg-red-500/10 focus-visible:ring-red-500/20" : "border-border focus-visible:border-primary focus-visible:ring-primary"}`} />
                  <ErrorMessage msg={errLga} />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errCity ? "text-red-500" : "text-muted-foreground"}`}>City / Town <span className="text-red-500">*</span></Label>
              <Input placeholder="City Name" value={addr.city} onChange={e => handleAddressChange("city", e.target.value)} onBlur={() => handleBlur("city")} className={`h-12 font-bold bg-background text-foreground ${errCity ? "border-red-500 bg-red-500/10 focus-visible:ring-red-500/20" : "border-border focus-visible:border-primary focus-visible:ring-primary"}`} />
              <ErrorMessage msg={errCity} />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errStreet ? "text-red-500" : "text-muted-foreground"}`}>Full Street Address <span className="text-red-500">*</span></Label>
              <Input placeholder="E.g. 12 Awolowo Way" value={addr.street} onChange={e => handleAddressChange("street", e.target.value)} onBlur={() => handleBlur("street")} className={`h-12 font-bold bg-background text-foreground ${errStreet ? "border-red-500 bg-red-500/10 focus-visible:ring-red-500/20" : "border-border focus-visible:border-primary focus-visible:ring-primary"}`} />
              <ErrorMessage msg={errStreet} />
            </div>

            <div className="md:col-span-2 mt-4">
               <h3 className="text-sm font-black text-foreground border-b border-border pb-2 uppercase tracking-widest">Identification</h3>
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errIdType ? "text-red-500" : "text-muted-foreground"}`}>Means of Identification <span className="text-red-500">*</span></Label>
              <div className="relative">
                <select 
                  className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${errIdType ? "border-red-500 bg-red-500/10 text-red-500" : "border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary"}`} 
                  value={currentOfficer.idType} 
                  onChange={e => setCurrentOfficer({...currentOfficer, idType: e.target.value})} 
                  onBlur={() => handleBlur("idType")}
                >
                  <option value="">-- Select Option --</option>
                  <option value="NIN">National ID Card (NIN)</option>
                  <option value="PASSPORT">International Passport</option>
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                  <option value="VOTERS_CARD">Permanent Voters' Card</option>
                </select>
                <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" weight="bold" />
              </div>
              <ErrorMessage msg={errIdType} />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${errIdNum ? "text-red-500" : "text-muted-foreground"}`}>Identity Number <span className="text-red-500">*</span></Label>
              <Input placeholder="Enter ID Number" value={currentOfficer.idNumber} onChange={e => setCurrentOfficer({...currentOfficer, idNumber: e.target.value})} onBlur={() => handleBlur("idNumber")} className={`h-12 font-bold bg-background text-foreground ${errIdNum ? "border-red-500 bg-red-500/10 focus-visible:ring-red-500/20" : "border-border focus-visible:border-primary focus-visible:ring-primary"}`} />
              <ErrorMessage msg={errIdNum} />
            </div>

            {officerType === "DIRECTOR" && (
              <div className="md:col-span-2 mt-2 p-4 sm:p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between cursor-pointer shadow-sm hover:border-emerald-500/40 transition-colors" onClick={() => setCurrentOfficer({...currentOfficer, isAlsoShareholder: !currentOfficer.isAlsoShareholder})}>
                <div className="pr-4">
                  <h3 className="text-sm font-black text-emerald-600">Is this Director also a Shareholder?</h3>
                  <p className="text-xs font-medium text-emerald-600/70 mt-1 leading-relaxed">If checked, they will automatically be added to the Share Distribution table later.</p>
                </div>
                <div className="relative shrink-0">
                  <div className={`block w-12 h-7 rounded-full transition-colors ${currentOfficer.isAlsoShareholder ? "bg-emerald-500" : "bg-secondary border border-border"}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${currentOfficer.isAlsoShareholder ? "translate-x-5" : ""}`}></div>
                </div>
              </div>
            )}

            <div className="md:col-span-2 mt-6 flex justify-end gap-3 border-t pt-6 border-border">
              <Button variant="outline" onClick={closeForm} className="h-12 px-6 rounded-xl font-bold bg-background text-foreground border-border hover:bg-secondary cursor-pointer">Cancel</Button>
              <Button onClick={handleSaveOfficer} className="h-12 px-8 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-md min-w-[140px] cursor-pointer">
                {editingId ? "Update" : "Save"} Officer
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
