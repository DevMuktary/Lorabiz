"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, WarningCircle, User, PencilSimple, Trash, CaretDown, CaretUp, UserPlus, LockKey } from "@phosphor-icons/react";
import { EditPscModal, StandalonePscModal } from "./PscModals";

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-2.5 border-b border-slate-200/60 last:border-0 gap-1 sm:gap-4">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0 mt-0.5">{label}</span>
    <span className="text-[13px] font-black text-slate-900 sm:text-right break-words">{value || "-"}</span>
  </div>
);

export default function PscStep({ data, updateData, showErrors }: any) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<any>(null);
  
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const officers = data.officers || [];
  
  const rawShareData = data.shareCapital || {};
  const shareClasses = Array.isArray(rawShareData.shareClasses) ? rawShareData.shareClasses : [];
  const allotments = Array.isArray(rawShareData.allotments) ? rawShareData.allotments : [];

  const totalUnits = shareClasses.reduce((acc: number, c: any) => acc + (Number(c.units) || 0), 0);

  // Only list active PSCs
  const pscList = officers.filter((o: any) => o.roles.includes("PSC"));

  // ==========================================
  // AUTO-OPEN ALL PSCS BY DEFAULT
  // ==========================================
  useEffect(() => {
    if (pscList.length > 0) {
      const allPscIds = pscList.map((p: any) => p.id);
      
      setExpandedIds(prev => {
        const newIds = new Set(prev);
        let changed = false;
        allPscIds.forEach((id: string) => {
           if (!newIds.has(id)) {
              newIds.add(id);
              changed = true;
           }
        });
        return changed ? Array.from(newIds) : prev;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pscList.length]); 


  // ==========================================
  // AUTO-DETECT PSCs (>= 5% SHARES) WITH DEFAULTS
  // ==========================================
  useEffect(() => {
    if (totalUnits === 0) return;

    let needsUpdate = false;

    const updatedOfficers = officers.map((officer: any) => {
      
      const officerUnits = allotments
        .filter((a: any) => a.officerId === officer.id)
        .reduce((sum: number, a: any) => sum + (Number(a.units) || 0), 0);

      const percentage = (officerUnits / totalUnits) * 100;
      const isAutoPsc = percentage >= 5;
      const hasPscRole = officer.roles.includes("PSC");

      // Auto-Add PSC Role WITH strict defaults so it is instantly "Complete"
      if (isAutoPsc && !hasPscRole) {
        needsUpdate = true;
        return {
          ...officer,
          roles: [...officer.roles, "PSC"],
          pscDetails: {
            ...officer.pscDetails,
            isPep: "No", // DEFAULT NO
            hasAffiliation: "No", // DEFAULT NO
            holdsSharesDirect: `Yes (${percentage.toFixed(2)}%)`,
            holdsSharesIndirect: officer.pscDetails?.holdsSharesIndirect || "No",
            holdsVotingDirect: officer.pscDetails?.holdsVotingDirect || `Yes (${percentage.toFixed(2)}%)`,
            holdsVotingIndirect: officer.pscDetails?.holdsVotingIndirect || "No",
            canAppointRemove: officer.pscDetails?.canAppointRemove || "No", // DEFAULT NO
            hasSignificantInfluence: officer.pscDetails?.hasSignificantInfluence || "No"
          }
        };
      }
      
      // Auto-Remove PSC Role if they drop below 5% (and aren't manually standalone)
      if (!isAutoPsc && hasPscRole && officer.roles.includes("SHAREHOLDER")) {
        needsUpdate = true;
        return {
          ...officer,
          roles: officer.roles.filter((r: string) => r !== "PSC"),
          pscDetails: null
        };
      }

      // Live Update Percentage for existing Auto-PSCs
      if (isAutoPsc && hasPscRole && officer.pscDetails?.holdsSharesDirect !== `Yes (${percentage.toFixed(2)}%)`) {
         needsUpdate = true;
         return {
           ...officer,
           pscDetails: {
             ...officer.pscDetails,
             sharesPercentage: percentage.toFixed(2), 
             holdsSharesDirect: `Yes (${percentage.toFixed(2)}%)`,
             holdsVotingDirect: officer.pscDetails?.holdsVotingDirect?.includes("Yes") ? `Yes (${percentage.toFixed(2)}%)` : officer.pscDetails?.holdsVotingDirect
           }
         };
      }

      return officer;
    });

    if (needsUpdate) {
      updateData((prev: any) => ({ ...prev, officers: updatedOfficers }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allotments, totalUnits]);


  const removeStandalonePsc = (e: any, officerId: string) => {
    e.stopPropagation();
    const officer = officers.find((o: any) => o.id === officerId);
    if (!officer) return;

    if (officer.roles.length === 1 && officer.roles.includes("PSC")) {
      updateData((prev: any) => ({ ...prev, officers: prev.officers.filter((o: any) => o.id !== officerId) }));
    } else {
      updateData((prev: any) => ({
        ...prev, 
        officers: prev.officers.map((o: any) => o.id === officerId ? { ...o, roles: o.roles.filter((r: string) => r !== "PSC"), pscDetails: null } : o)
      }));
    }
  };

  const toggleAccordion = (id: string) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="p-4 sm:p-10 space-y-8 animate-in fade-in duration-500 relative">
      
      {showEditModal && <EditPscModal onClose={() => setShowEditModal(false)} officer={editingOfficer} updateData={updateData} />}
      {showAddModal && <StandalonePscModal onClose={() => setShowAddModal(false)} updateData={updateData} />}

      <section>
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6" weight="fill" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Persons with Significant Control</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Anyone holding 5% or more shares is auto-listed. You can also add non-shareholding PSCs.
              </p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md shrink-0">
            <UserPlus weight="bold" className="mr-2 h-4 w-4" /> Add Standalone PSC
          </Button>
        </div>

        <div className="space-y-4 mt-8">
          {pscList.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl mx-1 sm:mx-0">
              <WarningCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" weight="duotone" />
              <p className="text-sm font-medium text-slate-500">No PSCs detected.</p>
              <p className="text-xs font-bold text-amber-500 mt-1 uppercase tracking-widest">Ensure shares were distributed in Step 5.</p>
            </div>
          ) : (
            pscList.map((person: any, idx: number) => {
              const details = person.pscDetails || {};
              const isComplete = details.isPep && details.hasAffiliation;
              const isAutoPsc = person.roles.includes("SHAREHOLDER");
              const isExpanded = expandedIds.includes(person.id);

              return (
                <div key={person.id} className={`bg-white border rounded-2xl transition-colors shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden ${isComplete ? 'border-emerald-200 hover:border-emerald-300' : 'border-amber-300 ring-2 ring-amber-50'}`}>
                  
                  {/* ACCORDION HEADER */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50" onClick={() => toggleAccordion(person.id)}>
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isComplete ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                        <User className="h-5 w-5" weight="fill" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{person.firstName} {person.surname}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          S/N: {idx + 1} | {isAutoPsc ? "AUTO-DETECTED PSC" : "STANDALONE PSC"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 w-full md:w-auto">
                      {showErrors && !isComplete && (
                         <div className="text-[10px] font-bold text-red-600 flex items-center gap-1.5 mr-auto md:mr-2 px-2 py-1 bg-red-50 rounded-lg">
                           <WarningCircle weight="fill" /> Missing details
                         </div>
                      )}

                      <div className={`hidden sm:flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-lg transition-colors ${isExpanded ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-600'}`}>
                        {isExpanded ? "Hide" : "View"} {isExpanded ? <CaretUp weight="bold" /> : <CaretDown weight="bold" />}
                      </div>

                      <button onClick={(e) => { e.stopPropagation(); setEditingOfficer(person); setShowEditModal(true); }} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors z-10 relative flex items-center gap-1.5 shadow-sm ${isComplete ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
                        <PencilSimple weight="bold" /> Edit
                      </button>

                      <button 
                        onClick={(e) => isAutoPsc ? e.stopPropagation() : removeStandalonePsc(e, person.id)} 
                        disabled={isAutoPsc}
                        className={`p-2 rounded-lg transition-colors z-10 relative flex items-center justify-center ${isAutoPsc ? 'text-slate-300 bg-slate-50 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                        title={isAutoPsc ? "Cannot delete an auto-detected PSC here. Adjust their shares in Step 5." : "Delete PSC"}
                      >
                        {isAutoPsc ? <LockKey className="h-5 w-5" weight="fill" /> : <Trash className="h-5 w-5" weight="bold" />}
                      </button>
                    </div>
                  </div>

                  {/* ACCORDION BODY */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 border-t border-slate-200 bg-slate-50/50 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 border-b border-indigo-100 pb-1">Personal Details</h4>
                          <DetailRow label="Surname" value={person.surname} />
                          <DetailRow label="First Name" value={person.firstName} />
                          <DetailRow label="Other Name" value={person.otherName} />
                          <DetailRow label="Gender" value={person.gender} />
                          <DetailRow label="Date of Birth" value={person.dob} />
                          <DetailRow label="Nationality" value={person.nationality} />
                          <DetailRow label="Occupation" value={person.occupation} />
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 border-b border-indigo-100 pb-1">Contact & ID</h4>
                          <DetailRow label="Phone" value={`${person.phoneCode} ${person.phone}`} />
                          <DetailRow label="Email" value={person.email} />
                          <DetailRow label="ID Type" value={person.idType} />
                          <DetailRow label="ID Number" value={person.idNumber} />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 border-b border-indigo-100 pb-1">Residential Address</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1">
                            <DetailRow label="State / Province" value={person.residentialAddress?.state} />
                            <DetailRow label="LGA / County" value={person.residentialAddress?.lga} />
                            <DetailRow label="City / Town" value={person.residentialAddress?.city} />
                            <DetailRow label="Street Address" value={person.residentialAddress?.street} />
                          </div>
                        </div>

                        <div className="md:col-span-2 space-y-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm mt-2">
                          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 border-b border-indigo-100 pb-1">Details of PSC Affiliation</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1">
                            <DetailRow label="Politically Exposed Person (PEP)?" value={details.isPep} />
                            <DetailRow label="Has Affiliation?" value={details.hasAffiliation} />
                          </div>
                          
                          <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3 border-b border-indigo-100 pb-1 mt-6">Details of Interest Held</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1">
                            <DetailRow label="Directly holds >= 5% shares?" value={details.holdsSharesDirect} />
                            <DetailRow label="Indirectly holds >= 5% shares?" value={details.holdsSharesIndirect} />
                            <DetailRow label="Directly holds >= 5% Voting Rights?" value={details.holdsVotingDirect} />
                            <DetailRow label="Indirectly holds >= 5% Voting Rights?" value={details.holdsVotingIndirect} />
                            <DetailRow label="Right to Appoint/Remove Directors?" value={details.canAppointRemove} />
                            <DetailRow label="Exercises Significant Influence?" value={details.hasSignificantInfluence} />
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
