"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, User, IdentificationCard, Trash, Buildings } from "@phosphor-icons/react";

export default function OfficersStep({ data, updateData }: any) {
  const [isAdding, setIsAdding] = useState(false);
  const [officerType, setOfficerType] = useState<"DIRECTOR" | "SECRETARY_INDIVIDUAL" | "SECRETARY_CORPORATE" | null>(null);

  // Temporary state for the modal/form
  const [currentOfficer, setCurrentOfficer] = useState<any>({
    roles: [], surname: "", firstName: "", email: "", phone: "", gender: "", 
    dob: "", occupation: "", nationality: "NIGERIA", idType: "", idNumber: "", 
    isAlsoShareholder: true // Default to true as it's the most common scenario for small LLCs
  });

  const officers: any[] = data.officers || [];

  const handleSaveOfficer = () => {
    // 1. Assign Roles based on toggles
    let finalRoles = [];
    if (officerType === "DIRECTOR") finalRoles.push("DIRECTOR");
    if (officerType?.includes("SECRETARY")) finalRoles.push("SECRETARY");
    if (currentOfficer.isAlsoShareholder) finalRoles.push("SHAREHOLDER");

    const newOfficer = {
      // FIX: Using the native browser crypto API instead of the external 'uuid' package
      id: crypto.randomUUID(), 
      ...currentOfficer,
      roles: finalRoles
    };

    updateData((prev: any) => ({
      ...prev,
      officers: [...(prev.officers || []), newOfficer]
    }));

    setIsAdding(false);
    setOfficerType(null);
    
    // Reset form
    setCurrentOfficer({
      roles: [], surname: "", firstName: "", email: "", phone: "", gender: "", 
      dob: "", occupation: "", nationality: "NIGERIA", idType: "", idNumber: "", 
      isAlsoShareholder: true
    });
  };

  const removeOfficer = (idToRemove: string) => {
    updateData((prev: any) => ({
      ...prev,
      officers: prev.officers.filter((o: any) => o.id !== idToRemove)
    }));
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 animate-in fade-in duration-500">
      
      {!isAdding ? (
        <section>
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Company Officers</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Private companies must have at least one (1) Director. A Secretary is optional for small companies.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => { setOfficerType("DIRECTOR"); setIsAdding(true); setCurrentOfficer({...currentOfficer, isAlsoShareholder: true}); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-12">
                <Plus weight="bold" className="mr-2" /> Add Director
              </Button>
              <Button variant="outline" onClick={() => { setOfficerType("SECRETARY_INDIVIDUAL"); setIsAdding(true); setCurrentOfficer({...currentOfficer, isAlsoShareholder: false}); }} className="border-slate-200 text-slate-700 font-bold rounded-xl h-12 bg-white">
                <Plus weight="bold" className="mr-2" /> Add Secretary
              </Button>
            </div>
          </div>

          {/* List of Officers */}
          <div className="space-y-4">
            {officers.length === 0 ? (
               <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                 <User className="h-10 w-10 text-slate-300 mx-auto mb-3" weight="duotone" />
                 <p className="text-sm font-medium text-slate-500">No officers added yet.</p>
                 <p className="text-xs font-bold text-red-500 mt-1 uppercase tracking-widest">You need at least 1 Director.</p>
               </div>
            ) : (
              officers.map((officer, idx) => (
                <div key={officer.id} className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-indigo-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                      <User className="h-6 w-6" weight="fill" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{officer.firstName} {officer.surname}</h3>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {officer.roles.map((role: string) => (
                          <span key={role} className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                            role === 'DIRECTOR' ? 'bg-indigo-100 text-indigo-700' : 
                            role === 'SHAREHOLDER' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeOfficer(officer.id)} className="p-2.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
                    <Trash className="h-5 w-5" weight="bold" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      ) : (
        /* ========================================== */
        /* ADD OFFICER FORM                           */
        /* ========================================== */
        <section className="animate-in slide-in-from-right-8 duration-300">
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Add {officerType === "DIRECTOR" ? "Director" : "Secretary"}
              </h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Enter their personal and identification details.</p>
            </div>
            <Button variant="ghost" onClick={() => setIsAdding(false)} className="text-slate-500 font-bold">Cancel</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Surname <span className="text-red-500">*</span></Label>
              <Input placeholder="E.g. Doe" value={currentOfficer.surname} onChange={e => setCurrentOfficer({...currentOfficer, surname: e.target.value})} className="h-12" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">First Name <span className="text-red-500">*</span></Label>
              <Input placeholder="E.g. Jane" value={currentOfficer.firstName} onChange={e => setCurrentOfficer({...currentOfficer, firstName: e.target.value})} className="h-12" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Email Address <span className="text-red-500">*</span></Label>
              <Input type="email" placeholder="jane@example.com" value={currentOfficer.email} onChange={e => setCurrentOfficer({...currentOfficer, email: e.target.value})} className="h-12" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Phone Number <span className="text-red-500">*</span></Label>
              <Input placeholder="08012345678" value={currentOfficer.phone} onChange={e => setCurrentOfficer({...currentOfficer, phone: e.target.value})} className="h-12" />
            </div>

            {/* Smart Toggle: Add as Shareholder */}
            {officerType === "DIRECTOR" && (
              <div className="md:col-span-2 mt-4 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between cursor-pointer" onClick={() => setCurrentOfficer({...currentOfficer, isAlsoShareholder: !currentOfficer.isAlsoShareholder})}>
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">Is this Director also a Shareholder?</h3>
                  <p className="text-xs font-medium text-emerald-700 mt-1">If yes, they will automatically be added to the Share Distribution table.</p>
                </div>
                <div className="relative shrink-0">
                  <div className={`block w-12 h-7 rounded-full transition-colors ${currentOfficer.isAlsoShareholder ? "bg-emerald-500" : "bg-slate-300"}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${currentOfficer.isAlsoShareholder ? "translate-x-5" : ""}`}></div>
                </div>
              </div>
            )}

            <div className="md:col-span-2 mt-4"><hr className="border-slate-100" /></div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Means of Identification <span className="text-red-500">*</span></Label>
              <select className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm font-medium bg-white focus:border-indigo-500 focus:ring-1 outline-none" value={currentOfficer.idType} onChange={e => setCurrentOfficer({...currentOfficer, idType: e.target.value})}>
                <option value="">-- Select Option --</option>
                <option value="NIN">National ID Card (NIN)</option>
                <option value="PASSPORT">International Passport</option>
                <option value="DRIVERS_LICENSE">Driver's License</option>
                <option value="VOTERS_CARD">Permanent Voters' Card</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Identity Number <span className="text-red-500">*</span></Label>
              <Input placeholder="Enter ID Number" value={currentOfficer.idNumber} onChange={e => setCurrentOfficer({...currentOfficer, idNumber: e.target.value})} className="h-12" />
            </div>

            <div className="md:col-span-2 mt-6 flex justify-end">
              <Button onClick={handleSaveOfficer} className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl w-full sm:w-auto">
                Save & Add {officerType === "DIRECTOR" ? "Director" : "Secretary"}
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
