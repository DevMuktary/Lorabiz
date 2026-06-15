"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChartPieSlice, CheckCircle, WarningCircle } from "@phosphor-icons/react";

export default function ShareCapitalStep({ data, updateData }: any) {
  
  // Setup defaults if empty
  const shareData = data.shareCapital || {
    companyType: "ENTITY WITH SHARES BELOW FIVE MILLION",
    totalIssuedCapital: 1000000,
    classOfShares: "ORDINARY",
    nominalValuePerShare: 1,
    allotments: {} // Will map officer.id -> amount of shares
  };

  // Find all officers that have the 'SHAREHOLDER' role
  const shareholders = (data.officers || []).filter((o: any) => o.roles.includes("SHAREHOLDER"));

  const updateShareData = (field: string, value: any) => {
    updateData((prev: any) => ({
      ...prev,
      shareCapital: { ...shareData, [field]: value }
    }));
  };

  const handleAllotmentChange = (officerId: string, amount: string) => {
    const numAmount = parseInt(amount.replace(/,/g, '')) || 0;
    const newAllotments = { ...shareData.allotments, [officerId]: numAmount };
    updateShareData("allotments", newAllotments);
  };

  // Math checking
  const totalAllotted = Object.values(shareData.allotments).reduce((acc: any, val: any) => acc + val, 0) as number;
  const totalRequired = shareData.totalIssuedCapital;
  const remainingShares = totalRequired - totalAllotted;
  const isPerfectMatch = remainingShares === 0;

  return (
    <div className="p-6 sm:p-10 space-y-10 animate-in fade-in duration-500">
      
      {/* SECTION 1: CAPITAL DECLARATION */}
      <section>
        <div className="mb-6 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ChartPieSlice className="h-6 w-6" weight="fill" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Issued Share Capital</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Define the financial structure of the company. Standard small businesses use 1,000,000 Ordinary shares.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Type of Company <span className="text-red-500">*</span></Label>
            <select 
              className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm font-bold bg-white text-slate-900 focus:border-indigo-500 focus:ring-1 outline-none" 
              value={shareData.companyType} 
              onChange={e => updateShareData("companyType", e.target.value)}
            >
              <option value="ENTITY WITH SHARES BELOW FIVE MILLION">ENTITY WITH SHARES BELOW FIVE MILLION (Standard)</option>
              <option value="GENERAL TRADING">GENERAL TRADING (&gt; 5M Shares)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Total Issued Share Capital (₦) <span className="text-red-500">*</span></Label>
            <Input 
              type="number" 
              value={shareData.totalIssuedCapital} 
              onChange={e => updateShareData("totalIssuedCapital", parseInt(e.target.value) || 0)} 
              className="h-12 font-black text-lg text-indigo-900 border-indigo-200 bg-white" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Nominal Value Per Share (₦) <span className="text-red-500">*</span></Label>
            <Input type="number" value={shareData.nominalValuePerShare} disabled className="h-12 font-bold bg-slate-100" />
          </div>
        </div>
      </section>

      <hr className="border-slate-100" />

      {/* SECTION 2: SHARE DISTRIBUTION (ALLOTMENT) */}
      <section>
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Share Distribution</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Assign these shares to the owners.</p>
          </div>
          
          <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold text-sm ${
            isPerfectMatch ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
            remainingShares < 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            {isPerfectMatch ? <CheckCircle className="h-5 w-5" weight="fill" /> : <WarningCircle className="h-5 w-5" weight="fill" />}
            {isPerfectMatch ? "100% Distributed" : remainingShares < 0 ? `${Math.abs(remainingShares).toLocaleString()} shares OVER-distributed!` : `${remainingShares.toLocaleString()} shares remaining`}
          </div>
        </div>

        {shareholders.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-3xl bg-white">
            <p className="text-sm font-medium text-slate-500">No Shareholders found.</p>
            <p className="text-xs font-bold text-indigo-500 mt-1">Please go back to Step 4 and add at least one Shareholder.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shareholders.map((person: any) => {
              const assigned = shareData.allotments[person.id] || 0;
              const percentage = totalRequired > 0 ? ((assigned / totalRequired) * 100).toFixed(1) : 0;
              
              return (
                <div key={person.id} className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{person.firstName} {person.surname}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">Role: SHAREHOLDER</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ownership</p>
                      <p className="text-sm font-black text-indigo-600">{percentage}%</p>
                    </div>
                    
                    <div className="relative w-full md:w-48">
                      <Input 
                        type="number" 
                        placeholder="0"
                        value={assigned || ""}
                        onChange={e => handleAllotmentChange(person.id, e.target.value)}
                        className="h-12 font-bold text-right pr-4 border-slate-300 focus:border-indigo-500" 
                      />
                      <span className="absolute left-3 top-3.5 text-xs font-bold text-slate-400">Shares:</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </section>

    </div>
  );
}
