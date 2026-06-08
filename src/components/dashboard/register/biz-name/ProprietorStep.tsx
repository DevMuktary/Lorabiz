"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Proprietor, NIGERIA_DATA, isValidEmail, isValidPhone, calculateAge, defaultPropForm } from "./schema";

export default function ProprietorStep({ 
  proprietors, setProprietors, isSoleProprietor 
}: { 
  proprietors: Proprietor[], setProprietors: (p: Proprietor[]) => void, isSoleProprietor: boolean 
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Auto-create and open first proprietor if empty
  useEffect(() => {
    if (proprietors.length === 0) {
      const newId = Date.now().toString();
      setProprietors([{ ...defaultPropForm, id: newId }]);
      setExpandedId(newId);
    } else if (!expandedId) {
      setExpandedId(proprietors[0].id);
    }
  }, []);

  const updateProprietor = (id: string, field: keyof Proprietor, value: any) => {
    setProprietors(proprietors.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleAddPartner = () => {
    const newId = Date.now().toString();
    setProprietors([...proprietors, { ...defaultPropForm, id: newId }]);
    setExpandedId(newId);
  };

  const removeProprietor = (id: string) => {
    const filtered = proprietors.filter(p => p.id !== id);
    setProprietors(filtered);
    if (expandedId === id) setExpandedId(filtered.length > 0 ? filtered[0].id : null);
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-black text-slate-900">Proprietors</h2>
        {!isSoleProprietor && (
          <Button onClick={handleAddPartner} className="bg-slate-900 text-white rounded-xl">
            + Add Partner
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {proprietors.map((prop, idx) => {
          const isOpen = expandedId === prop.id;
          const availableLgas = NIGERIA_DATA.find(s => s.state === prop.state)?.lgas || [];
          const age = calculateAge(prop.dob);

          return (
            <div key={prop.id} className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
              
              {/* COLLAPSED HEADER / SIDE-BY-SIDE VIEW */}
              <div 
                className={`p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer transition-colors ${isOpen ? 'bg-slate-50 border-b border-slate-200' : 'hover:bg-slate-50'}`}
                onClick={() => setExpandedId(isOpen ? null : prop.id)}
              >
                <div className="flex items-center gap-4 w-full md:w-auto mb-3 md:mb-0">
                  <div className="h-10 w-10 bg-[#ff3f7a]/10 text-[#ff3f7a] rounded-full flex items-center justify-center font-black">{idx + 1}</div>
                  {!isOpen ? (
                    <div className="grid grid-cols-2 md:flex md:gap-8 w-full">
                      <div><p className="text-xs text-slate-400 font-bold uppercase">Name</p><p className="font-bold text-slate-900">{prop.surname || "Pending"} {prop.firstName}</p></div>
                      <div><p className="text-xs text-slate-400 font-bold uppercase">Phone</p><p className="font-bold text-slate-700">{prop.phone || "-"}</p></div>
                      <div className="hidden md:block"><p className="text-xs text-slate-400 font-bold uppercase">State</p><p className="font-bold text-slate-700">{prop.state || "-"}</p></div>
                    </div>
                  ) : (
                    <h3 className="font-black text-lg text-slate-900">Editing Proprietor {idx + 1}</h3>
                  )}
                </div>

                <div className="flex gap-4 self-end md:self-auto">
                  <button onClick={(e) => { e.stopPropagation(); setExpandedId(prop.id); }} className="text-blue-600 font-bold text-sm hover:underline">Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); removeProprietor(prop.id); }} className="text-red-500 font-bold text-sm hover:underline">Remove</button>
                </div>
              </div>

              {/* EXPANDED FORM */}
              {isOpen && (
                <div className="p-4 md:p-6 space-y-5 bg-white" onClick={(e) => e.stopPropagation()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1"><Label>Surname <span className="text-red-500">*</span></Label><Input value={prop.surname} onChange={e=>updateProprietor(prop.id, 'surname', e.target.value)} className="h-11"/>{!prop.surname && <p className="text-red-500 text-xs font-bold">Required</p>}</div>
                    <div className="space-y-1"><Label>First Name <span className="text-red-500">*</span></Label><Input value={prop.firstName} onChange={e=>updateProprietor(prop.id, 'firstName', e.target.value)} className="h-11"/>{!prop.firstName && <p className="text-red-500 text-xs font-bold">Required</p>}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1"><Label>Other Name</Label><Input value={prop.otherName} onChange={e=>updateProprietor(prop.id, 'otherName', e.target.value)} className="h-11"/></div>
                    <div className="space-y-1">
                      <Label>Email <span className="text-red-500">*</span></Label>
                      <Input type="email" value={prop.email} onChange={e=>updateProprietor(prop.id, 'email', e.target.value)} className="h-11"/>
                      {prop.email.length > 0 && !isValidEmail(prop.email) && <p className="text-red-500 text-xs font-bold">Invalid email</p>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1">
                      <Label>Phone <span className="text-red-500">*</span></Label>
                      <div className="flex">
                        <div className="flex items-center px-3 bg-slate-100 border border-slate-200 border-r-0 rounded-l-xl text-xs font-bold">🇳🇬 +234</div>
                        <Input type="tel" value={prop.phone} onChange={e=>updateProprietor(prop.id, 'phone', e.target.value)} className="h-11 rounded-l-none"/>
                      </div>
                      {prop.phone.length > 0 && !isValidPhone(prop.phone) && <p className="text-red-500 text-xs font-bold">Invalid phone</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>Gender <span className="text-red-500">*</span></Label>
                      <select value={prop.gender} onChange={e=>updateProprietor(prop.id, 'gender', e.target.value)} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-[#ff3f7a] outline-none">
                        <option value="">Select</option><option value="MALE">MALE</option><option value="FEMALE">FEMALE</option>
                      </select>
                      {!prop.gender && <p className="text-red-500 text-xs font-bold">Required</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>Date of Birth <span className="text-red-500">*</span></Label>
                      <Input type="date" value={prop.dob} onChange={e=>updateProprietor(prop.id, 'dob', e.target.value)} className="h-11"/>
                      {prop.dob && age < 18 && <p className="text-amber-500 text-xs font-bold">Under 18 detected.</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <Label>State <span className="text-red-500">*</span></Label>
                      <select value={prop.state} onChange={e=>updateProprietor(prop.id, 'state', e.target.value)} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-[#ff3f7a] outline-none">
                        <option value="">Select</option>{NIGERIA_DATA.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                      </select>
                      {!prop.state && <p className="text-red-500 text-xs font-bold">Required</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>LGA <span className="text-red-500">*</span></Label>
                      <select value={prop.lga} onChange={e=>updateProprietor(prop.id, 'lga', e.target.value)} disabled={!prop.state} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-[#ff3f7a] outline-none">
                        <option value="">Select</option>{availableLgas.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      {!prop.lga && <p className="text-red-500 text-xs font-bold">Required</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1"><Label>City <span className="text-red-500">*</span></Label><Input value={prop.city} onChange={e=>updateProprietor(prop.id, 'city', e.target.value)} className="h-11"/>{!prop.city && <p className="text-red-500 text-xs font-bold">Required</p>}</div>
                    <div className="space-y-1"><Label>Street No. <span className="text-red-500">*</span></Label><Input value={prop.streetNo} onChange={e=>updateProprietor(prop.id, 'streetNo', e.target.value)} className="h-11"/>{!prop.streetNo && <p className="text-red-500 text-xs font-bold">Required</p>}</div>
                    <div className="space-y-1"><Label>Service Address <span className="text-red-500">*</span></Label><Input value={prop.serviceAddress} onChange={e=>updateProprietor(prop.id, 'serviceAddress', e.target.value)} className="h-11"/>{!prop.serviceAddress && <p className="text-red-500 text-xs font-bold">Required</p>}</div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button onClick={() => setExpandedId(null)} className="bg-[#ff3f7a] text-white">Save & Collapse</Button>
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
