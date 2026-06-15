"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash, WarningCircle } from "@phosphor-icons/react";

export default function MemorandumStep({ data, updateData }: any) {
  const [currentObject, setCurrentObject] = useState("");
  const [warning, setWarning] = useState<string | null>(null);

  const objects: string[] = data.memorandumObjects || [];

  // Keywords that usually trigger CAC queries if the share capital isn't massive
  const RESTRICTED_KEYWORDS = ["banking", "insurance", "finance", "hire purchase", "security", "investment", "crypto", "aviation"];

  const handleAddObject = () => {
    if (!currentObject.trim()) return;

    // Check for restricted keywords to warn the user
    const hasRestricted = RESTRICTED_KEYWORDS.some(kw => currentObject.toLowerCase().includes(kw));
    if (hasRestricted) {
      setWarning(`Warning: The phrase contains a restricted keyword. Financial, security, or aviation objects usually require highly specialized licenses and massive minimum share capital. Unless you have authorization, the CAC may reject this.`);
    } else {
      setWarning(null);
    }

    updateData((prev: any) => ({
      ...prev,
      memorandumObjects: [...(prev.memorandumObjects || []), currentObject.trim()]
    }));
    
    setCurrentObject("");
  };

  const handleRemoveObject = (indexToRemove: number) => {
    updateData((prev: any) => ({
      ...prev,
      memorandumObjects: prev.memorandumObjects.filter((_: any, idx: number) => idx !== indexToRemove)
    }));
  };

  return (
    <div className="p-6 sm:p-10 space-y-8 animate-in fade-in duration-500">
      
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-900">Objects of Memorandum</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            This specifies exactly what your company is legally permitted to do. You must add at least one (1) object.
          </p>
        </div>

        {/* Input Area */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8">
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase text-slate-500">Add a New Object</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <textarea 
                rows={2}
                placeholder="E.g. To carry on the business of general merchandise, trading, and logistics..."
                value={currentObject} 
                onChange={e => {
                  setCurrentObject(e.target.value);
                  if (warning) setWarning(null); // Clear warning on typing
                }}
                className="w-full p-4 border rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none border-slate-200 resize-none"
              />
              <Button 
                onClick={handleAddObject}
                disabled={!currentObject.trim()}
                className="h-auto sm:w-32 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shrink-0"
              >
                <Plus weight="bold" /> Add
              </Button>
            </div>
            
            {warning && (
              <div className="flex items-start gap-2 mt-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200 animate-in fade-in">
                <WarningCircle className="h-5 w-5 shrink-0 mt-0.5" weight="fill" />
                <p className="text-xs font-medium leading-relaxed">{warning}</p>
              </div>
            )}
          </div>
        </div>

        {/* List of Added Objects */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-4 border-b pb-2">
            Added Objects ({objects.length})
          </h3>
          
          {objects.length === 0 ? (
            <div className="text-center py-10 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
              <p className="text-sm font-medium text-slate-400">No objects added yet.</p>
              <p className="text-xs font-bold text-red-500 mt-1 uppercase tracking-widest">At least 1 required to proceed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {objects.map((obj, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl group hover:border-indigo-200 transition-colors shadow-sm">
                  <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-sm font-medium text-slate-700 flex-1 leading-relaxed">
                    {obj}
                  </p>
                  <button 
                    onClick={() => handleRemoveObject(idx)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    title="Remove Object"
                  >
                    <Trash className="h-5 w-5" weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      
    </div>
  );
}
