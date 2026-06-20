"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldCheck, WarningCircle, User, PencilSimple, X } from "@phosphor-icons/react";

export default function PscStep({ data, updateData, showErrors }: any) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPscData, setTempPscData] = useState<any>(null);

  const officers = data.officers || [];
  
  const rawShareData = data.shareCapital || {};
  const shareClasses = Array.isArray(rawShareData.shareClasses) ? rawShareData.shareClasses : [];
  const allotments = Array.isArray(rawShareData.allotments) ? rawShareData.allotments : [];

  // Correctly sum up total created units
  const totalUnits = shareClasses.reduce((acc: number, c: any) => acc + (Number(c.units) || 0), 0);

  // Auto-detect PSCs based on >= 5% share unit ownership
  useEffect(() => {
    if (totalUnits === 0) return;

    let needsUpdate = false;
    const updatedOfficers = officers.map((officer: any) => {
      
      // Correctly sum units for this officer from the array
      const officerUnits = allotments
        .filter((a: any) => a.officerId === officer.id)
        .reduce((sum: number, a: any) => sum + (Number(a.units) || 0), 0);

      const percentage = (officerUnits / totalUnits) * 100;
      const isAutoPsc = percentage >= 5;
      const hasPscRole = officer.roles.includes("PSC");

      // Scenario 1: They hit 5% but don't have the role yet
      if (isAutoPsc && !hasPscRole) {
        needsUpdate = true;
        return {
          ...officer,
          roles: [...officer.roles, "PSC"],
          pscDetails: {
            ...officer.pscDetails,
            isPep: "", // Force them to answer
            hasAffiliation: "", // Force them to answer
            holdsShares: "Yes",
            sharesPercentage: percentage.toFixed(2),
            holdsVotingRights: "Yes", 
            votingPercentage: percentage.toFixed(2), // Mirrors shares by default
            canAppointRemove: officer.pscDetails?.canAppointRemove || "No",
            hasSignificantInfluence: officer.pscDetails?.hasSignificantInfluence || "No"
          }
        };
      }
      
      // Scenario 2: They have the role but dropped below 5% (maybe they edited allotments)
      if (!isAutoPsc && hasPscRole) {
        needsUpdate = true;
        return {
          ...officer,
          roles: officer.roles.filter((r: string) => r !== "PSC"),
          pscDetails: null
        };
      }

      // Scenario 3: Update percentage if it changed but they are still a PSC
      if (isAutoPsc && hasPscRole && officer.pscDetails?.sharesPercentage !== percentage.toFixed(2)) {
         needsUpdate = true;
         return {
           ...officer,
           pscDetails: {
             ...officer.pscDetails,
             sharesPercentage: percentage.toFixed(2),
             votingPercentage: percentage.toFixed(2)
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

  // Only list active PSCs
  const pscList = officers.filter((o: any) => o.roles.includes("PSC"));

  const handleEditClick = (officer: any) => {
    setTempPscData(officer.pscDetails || {});
    setEditingId(officer.id);
  };

  const handleSavePsc = () => {
    // Validate required fields
    if (!tempPscData.isPep || !tempPscData.hasAffiliation) return;

    const updatedOfficers = officers.map((o: any) => {
      if (o.id === editingId) {
        return { ...o, pscDetails: tempPscData };
      }
      return o;
    });
    updateData((prev: any) => ({ ...prev, officers: updatedOfficers }));
    setEditingId(null);
  };

  return (
    <div className="p-4 sm:p-10 space-y-8 animate-in fade-in duration-500">
      
      {!editingId ? (
        <section>
          <div className="mb-6 flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-6 w-6" weight="fill" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Persons with Significant Control (PSC)</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Anyone holding 5% or more of the shares or voting rights is automatically listed here. Please review and confirm their details.
              </p>
            </div>
          </div>

          <div className="space-y-4 mt-8">
            {pscList.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl mx-1 sm:mx-0">
                <WarningCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" weight="duotone" />
                <p className="text-sm font-medium text-slate-500">No PSCs detected.</p>
                <p className="text-xs font-bold text-amber-500 mt-1 uppercase tracking-widest">Ensure shares were distributed in Step 5.</p>
              </div>
            ) : (
              pscList.map((person: any) => {
                const details = person.pscDetails || {};
                const isComplete = details.isPep && details.hasAffiliation;

                return (
                  <div key={person.id} className={`p-4 sm:p-5 bg-white border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors shadow-[0_2px_10px_rgb(0,0,0,0.02)] ${isComplete ? 'border-emerald-200 hover:border-emerald-300' : 'border-amber-300 ring-2 ring-amber-50'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isComplete ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                        <User className="h-5 w-5" weight="fill" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{person.firstName} {person.surname}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          Shares: <span className="text-indigo-600">{details.sharesPercentage || "0"}%</span> • Voting: <span className="text-indigo-600">{details.votingPercentage || "0"}%</span>
                        </p>
                        {showErrors && !isComplete && (
                           <div className="text-[10px] font-bold text-red-600 flex items-center gap-1 mt-1.5">
                             <WarningCircle weight="fill" /> You must complete details.
                           </div>
                        )}
                      </div>
                    </div>
                    
                    <Button onClick={() => handleEditClick(person)} className={`h-10 px-6 font-bold rounded-xl flex-1 md:flex-none ${isComplete ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'}`}>
                      {isComplete ? <><PencilSimple weight="bold" className="mr-2"/> Edit</> : "Complete Details"}
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </section>
      ) : (
        /* ========================================== */
        /* EDIT PSC DETAILS FORM                      */
        /* ========================================== */
        <section className="animate-in fade-in duration-300">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 bg-slate-50 -mx-4 sm:-mx-10 px-4 sm:px-10 pt-4 -mt-4 sm:-mt-10 rounded-t-3xl sm:rounded-none">
            <div>
              <h2 className="text-xl font-black text-slate-900">Update PSC Details</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Confirm affiliations and political exposure.</p>
            </div>
            <Button variant="ghost" onClick={() => setEditingId(null)} className="text-slate-500 font-bold bg-white border border-slate-200">
              <X weight="bold" />
            </Button>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Is the PSC a Politically Exposed Person (PEP)? <span className="text-red-500">*</span></Label>
                <select className={`w-full h-12 px-4 border rounded-xl text-sm font-bold bg-white outline-none ${!tempPscData.isPep && showErrors ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-indigo-500'}`} value={tempPscData.isPep || ""} onChange={e => setTempPscData({...tempPscData, isPep: e.target.value})}>
                  <option value="">-- Select --</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
                {!tempPscData.isPep && showErrors && <span className="text-[10px] font-bold text-red-500">Required</span>}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Does the PSC have any affiliation? <span className="text-red-500">*</span></Label>
                <select className={`w-full h-12 px-4 border rounded-xl text-sm font-bold bg-white outline-none ${!tempPscData.hasAffiliation && showErrors ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 focus:border-indigo-500'}`} value={tempPscData.hasAffiliation || ""} onChange={e => setTempPscData({...tempPscData, hasAffiliation: e.target.value})}>
                  <option value="">-- Select --</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
                {!tempPscData.hasAffiliation && showErrors && <span className="text-[10px] font-bold text-red-500">Required</span>}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 border-b pb-2 uppercase tracking-widest">Interest Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Holds &gt;= 5% of Shares?</Label>
                  <Input value={`${tempPscData.holdsShares || "No"} (${tempPscData.sharesPercentage || "0"}%)`} disabled className="h-12 font-black bg-slate-100 text-slate-500 border-slate-200" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Holds &gt;= 5% Voting Rights?</Label>
                  <Input value={`${tempPscData.holdsVotingRights || "No"} (${tempPscData.votingPercentage || "0"}%)`} disabled className="h-12 font-black bg-slate-100 text-slate-500 border-slate-200" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Right to Appoint/Remove Directors?</Label>
                  <select className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm font-bold bg-white outline-none focus:border-indigo-500" value={tempPscData.canAppointRemove || "No"} onChange={e => setTempPscData({...tempPscData, canAppointRemove: e.target.value})}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Exercises Significant Influence?</Label>
                  <select className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm font-bold bg-white outline-none focus:border-indigo-500" value={tempPscData.hasSignificantInfluence || "No"} onChange={e => setTempPscData({...tempPscData, hasSignificantInfluence: e.target.value})}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100">
              <Button onClick={handleSavePsc} disabled={!tempPscData.isPep || !tempPscData.hasAffiliation} className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl w-full sm:w-auto shadow-md disabled:opacity-50">
                Save PSC Details
              </Button>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
