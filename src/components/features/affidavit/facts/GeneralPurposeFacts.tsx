"use client";

import { GeneralPurposeFacts as IGeneralPurposeFacts } from "../types";

interface GeneralPurposeFactsProps {
  facts: IGeneralPurposeFacts;
  onChange: (updated: Partial<IGeneralPurposeFacts>) => void;
}

export function GeneralPurposeFacts({ facts, onChange }: GeneralPurposeFactsProps) {
  const handleStatementChange = (index: number, value: string) => {
    const copy = [...facts.statements];
    copy[index] = value;
    onChange({ statements: copy });
  };

  const handleAddStatement = () => {
    onChange({ statements: [...facts.statements, ""] });
  };

  const handleRemoveStatement = (index: number) => {
    if (facts.statements.length <= 1) return;
    const copy = facts.statements.filter((_, i) => i !== index);
    onChange({ statements: copy });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">
          Affidavit Title / Matter <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={facts.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Affidavit of Bachelorhood / Good Character / Non-Indebtedness"
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-foreground">
          Sworn Statements (Clause by Clause)
        </label>
        {facts.statements.map((stmt, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span className="text-xs font-black text-muted-foreground pt-2.5 shrink-0">
              {idx + 1}.
            </span>
            <input
              type="text"
              value={stmt}
              onChange={(e) => handleStatementChange(idx, e.target.value)}
              placeholder={`Statement clause ${idx + 1}`}
              className="flex-1 px-3.5 py-2 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
            />
            {facts.statements.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveStatement(idx)}
                className="text-xs text-rose-500 hover:text-rose-700 pt-2 px-1 font-bold"
                title="Remove clause"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddStatement}
          className="text-xs font-bold text-primary hover:underline pt-1 block cursor-pointer"
        >
          + Add Another Statement Clause
        </button>
      </div>
    </div>
  );
}
