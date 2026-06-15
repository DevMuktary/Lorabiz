"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldCheck, WarningCircle, User, PencilSimple, X } from "@phosphor-icons/react";

export default function PscStep({ data, updateData }: any) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPscData, setTempPscData] = useState<any>(null);

  const officers = data.officers || [];
  const shareData = data.shareCapital || { totalIssuedCapital: 0, allotments: {} };
  const totalShares = shareData.totalIssuedCapital;

  // Auto-detect PSCs based on 5% share ownership
  useEffect(() => {
    let needsUpdate = false;
    const updatedOfficers = officers.map((officer: any) => {
      const shares = shareData.allotments[officer.id] || 0;
      const percentage = totalShares > 0 ? (shares / totalShares) * 100 : 0;
      
      const isAutoPsc = percentage >= 5;
      const hasPscRole = officer.roles.includes("PSC");

      if (isAutoPsc && !hasPscRole) {
        needsUpdate = true;
        return {
          ...officer,
          roles: [...officer.roles, "PSC"],
          pscDetails: {
            ...officer.pscDetails,
            isPep: "No",
            hasAffiliation: "No",
            holdsShares: "Yes",
            sharesPercentage: percentage.toFixed(1),
            holdsVotingRights: "Yes", 
            votingPercentage: percentage.toFixed(1), // Voting usually mirrors shares for standard LLCs
            canAppointRemove: "No",
            hasSignificantInfluence: "No"
          }
        };
      }
      return officer;
    });

    if (needsUpdate) {
      updateData((prev: any) => ({ ...prev, officers: updatedOfficers }));
    }
  }, [officers, shareData, totalShares, updateData]);

  const pscList = officers.filter((o: any) => o.roles.includes("PSC"));

  const handleEditClick = (officer: any) => {
    setTempPscData(officer.pscDetails || {});
    setEditingId(officer.id);
  };

  const handleSavePsc = () => {
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
    <div className="p-6 sm:p-10 space-y-8 animate-in fade-in duration-500">
      
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
              <div className="text-center py-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                <WarningCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" weight="duotone" />
                <p className="text-sm font-medium text-slate-500">No PSCs detected.</p>
                <p className="text-xs font-bold text-amber-500 mt-1 uppercase tracking-widest">Ensure shares were distributed in Step 5.</p>
              </div>
            ) : (
              pscList.map((person: any) => {
                const details = person.pscDetails || {};
                const isComplete = details.isPep && details.hasAffiliation;

                return (
                  <div key={person.id} className={`p-5 bg-white border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors shadow-[0_2px_10px_rgb(0,0,0,0.02)] ${isComplete ? 'border-emerald-200' : 'border-amber-300 ring-2 ring-amber-50'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isComplete ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                        <User className="h-5 w-5" weight="fill" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{person.firstName} {person.surname}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          Shares: <span className="text-indigo-600">{details.sharesPercentage || "0"}%</span> • Voting: <span className="text-indigo-600">{details.votingPercentage || "0"}%</span>
                        </p>
                      </div>
                    </div>
                    
                    <Button onClick={() => handleEditClick(person)} className={`h-10 px-6 font-bold rounded-xl ${isComplete ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'}`}>
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
        <section className="animate-in slide-in-from-right-8 duration-300">
          <div className="mb-6 flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Update PSC Details</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Confirm affiliations and political exposure.</p>
            </div>
            <Button variant="ghost" onClick={() => setEditingId(null)} className="text-slate-500 font-bold bg-slate-50 hover:bg-slate-100 rounded-full h-10 w-10 p-0">
              <X weight="bold" className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Is the PSC a Politically Exposed Person (PEP)? <span className="text-red-500">*</span></Label>
                <select className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm font-bold bg-white outline-none" value={tempPscData.isPep || "No"} onChange={e => setTempPscData({...tempPscData, isPep: e.target.value})}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Does the PSC have any affiliation? <span className="text-red-500">*</span></Label>
                <select className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm font-bold bg-white outline-none" value={tempPscData.hasAffiliation || "No"} onChange={e => setTempPscData({...tempPscData, hasAffiliation: e.target.value})}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Interest Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Holds &gt;= 5% of Shares?</Label>
                  <Input value={`${tempPscData.holdsShares || "No"} (${tempPscData.sharesPercentage || "0"}%)`} disabled className="h-12 font-bold bg-slate-100" />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Holds &gt;= 5% Voting Rights?</Label>
                  <Input value={`${tempPscData.holdsVotingRights || "No"} (${tempPscData.votingPercentage || "0"}%)`} disabled className="h-12 font-bold bg-slate-100" />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Right to Appoint/Remove Directors?</Label>
                  <select className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm font-medium bg-white outline-none" value={tempPscData.canAppointRemove || "No"} onChange={e => setTempPscData({...tempPscData, canAppointRemove: e.target.value})}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Exercises Significant Influence?</Label>
                  <select className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm font-medium bg-white outline-none" value={tempPscData.hasSignificantInfluence || "No"} onChange={e => setTempPscData({...tempPscData, hasSignificantInfluence: e.target.value})}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSavePsc} className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl w-full sm:w-auto">
                Save PSC Details
              </Button>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
