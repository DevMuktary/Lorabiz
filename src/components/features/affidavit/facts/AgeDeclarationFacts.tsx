"use client";

import { NIGERIA_STATES_LGA } from "@/lib/nigeria-states";
import { AgeDeclarationFacts as IAgeDeclarationFacts } from "../types";

interface AgeDeclarationFactsProps {
  facts: IAgeDeclarationFacts;
  onChange: (updated: Partial<IAgeDeclarationFacts>) => void;
}

const AGE_REASONS = [
  "Birth Certificate Not Issued / Unavailable at Birth",
  "Loss of Original NPC Birth Certificate",
  "Correction of Discrepancies on Bank / BVN Records",
  "NIN Regularization & Date of Birth Alignment",
  "Civil Service / Pension / Employment Requirement",
  "School / NYSC / Academic Clearance",
  "Other Legal & Statutory Reasons",
];

export function AgeDeclarationFacts({ facts, onChange }: AgeDeclarationFactsProps) {
  const isCustomReason = facts.reason && !AGE_REASONS.includes(facts.reason);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Declared Date of Birth */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">
          Correct Date of Birth <span className="text-rose-500">*</span>
        </label>
        <input
          type="date"
          value={facts.declaredDob}
          onChange={(e) => onChange({ declaredDob: e.target.value })}
          className="w-full min-w-0 max-w-full appearance-none px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
        />
      </div>

      {/* Place of Birth */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">
          Place of Birth (Town / City) <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={facts.placeOfBirth}
          onChange={(e) => onChange({ placeOfBirth: e.target.value })}
          placeholder="e.g. Ikeja, Lagos"
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
        />
      </div>

      {/* State of Birth */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">
          State of Birth <span className="text-rose-500">*</span>
        </label>
        <select
          value={facts.stateOfBirth}
          onChange={(e) => onChange({ stateOfBirth: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
        >
          <option value="">-- Select State of Birth --</option>
          {Object.keys(NIGERIA_STATES_LGA).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Compulsory Reason for Age Declaration */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">
          Reason for Age Declaration <span className="text-rose-500">*</span>
        </label>
        <select
          value={isCustomReason ? "Other Legal & Statutory Reasons" : facts.reason || ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "Other Legal & Statutory Reasons") {
              onChange({ reason: "" });
            } else {
              onChange({ reason: val });
            }
          }}
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
        >
          <option value="">-- Select Compulsory Reason --</option>
          {AGE_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Custom Reason Text if other selected */}
      {(isCustomReason || facts.reason === "" || facts.reason === "Other Legal & Statutory Reasons") && (
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Specify Legal Reason in Detail <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={facts.reason}
            onChange={(e) => onChange({ reason: e.target.value })}
            placeholder="State the exact reason why this age declaration affidavit is being sworn..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
          />
        </div>
      )}
    </div>
  );
}
