// src/components/features/affidavit/facts/ChangeOfNameFacts.tsx
"use client";

import { ChangeOfNameFacts as IChangeOfNameFacts } from "../types";

interface ChangeOfNameFactsProps {
  facts: IChangeOfNameFacts;
  onChange: (updated: Partial<IChangeOfNameFacts>) => void;
}

export function ChangeOfNameFacts({ facts, onChange }: ChangeOfNameFactsProps) {
  const handleFormerChange = (field: "formerFirstName" | "formerMiddleName" | "formerLastName", val: string) => {
    const updated = {
      ...facts,
      [field]: val,
    };
    const combinedOld = [updated.formerFirstName, updated.formerMiddleName, updated.formerLastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    onChange({ [field]: val, oldName: combinedOld });
  };

  const handleNewChange = (field: "newFirstName" | "newMiddleName" | "newLastName", val: string) => {
    const updated = {
      ...facts,
      [field]: val,
    };
    const combinedNew = [updated.newFirstName, updated.newMiddleName, updated.newLastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    onChange({ [field]: val, newName: combinedNew });
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. Former Name Block */}
      <div className="p-4 sm:p-5 rounded-2xl bg-secondary/30 border border-border space-y-3">
        <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block">
          Former / Current Name (As in Old Records)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">
              Former First Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={facts.formerFirstName || ""}
              onChange={(e) => handleFormerChange("formerFirstName", e.target.value)}
              placeholder="e.g. Mary"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">
              Former Middle Name <span className="text-muted-foreground text-[10px] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={facts.formerMiddleName || ""}
              onChange={(e) => handleFormerChange("formerMiddleName", e.target.value)}
              placeholder="e.g. Ngozi"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">
              Former Surname / Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={facts.formerLastName || ""}
              onChange={(e) => handleFormerChange("formerLastName", e.target.value)}
              placeholder="e.g. Okafor"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* 2. New Name Block */}
      <div className="p-4 sm:p-5 rounded-2xl bg-secondary/30 border border-border space-y-3">
        <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block">
          New Desired Legal Name (To be Sworn)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">
              New First Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={facts.newFirstName || ""}
              onChange={(e) => handleNewChange("newFirstName", e.target.value)}
              placeholder="e.g. Mary"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">
              New Middle Name <span className="text-muted-foreground text-[10px] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={facts.newMiddleName || ""}
              onChange={(e) => handleNewChange("newMiddleName", e.target.value)}
              placeholder="e.g. Ngozi"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">
              New Surname / Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={facts.newLastName || ""}
              onChange={(e) => handleNewChange("newLastName", e.target.value)}
              placeholder="e.g. Adeleke"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* 3. Reason and Destination */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Reason for Name Change <span className="text-rose-500">*</span>
          </label>
          <select
            value={facts.reason}
            onChange={(e) => onChange({ reason: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
          >
            <option value="Marriage">Marriage (Change of Marital Surname)</option>
            <option value="Correction of Typographical Error">Correction of Typographical Error on Records</option>
            <option value="Personal Decision / Re-arrangement">Personal Decision / Name Re-arrangement</option>
            <option value="Religious Conversion">Religious Conversion</option>
            <option value="Other Legal Reasons">Other Legal Reasons</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Where It Will Be Presented <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={facts.usageDestination}
            onChange={(e) => onChange({ usageDestination: e.target.value })}
            placeholder="e.g. Banks, NIN, BVN, Employer, Passport, NYSC"
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}
