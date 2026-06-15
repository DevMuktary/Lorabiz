"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Info, Plus, Trash, PencilSimple, ListDashes, CheckCircle, WarningCircle } from "@phosphor-icons/react";

const STANDARD_CAMA_ARTICLES = [
  "The Company is a Private Company Limited by Shares.",
  "The directors may exercise all the powers of the company to borrow money, and to mortgage or charge its undertaking, property, and uncalled capital.",
  "The business of the company shall be managed by the directors, who may pay all expenses incurred in promoting and registering the company.",
  "No share shall be transferred to a person who is not a member of the company so long as any member is willing to purchase the same at the fair value.",
  "The quorum necessary for the transaction of the business of the directors may be fixed by the directors, and unless so fixed shall be two."
];

export default function ArticlesStep({ data, updateData }: any) {
  const [currentText, setCurrentText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Fallback to empty array if undefined
  const articles: string[] = data.customArticles || [];
  const witness = data.witnessDetails || {};

  // ==========================================
  // ARTICLE LIST MANAGEMENT
  // ==========================================
  const handleLoadDefaults = () => {
    updateData({ ...data, customArticles: [...STANDARD_CAMA_ARTICLES], useDefaultArticles: true });
  };

  const handleSaveArticle = () => {
    if (!currentText.trim()) return;
    
    let updated = [...articles];
    if (editingIndex !== null) {
      updated[editingIndex] = currentText.trim();
      setEditingIndex(null);
    } else {
      updated.push(currentText.trim());
    }
    
    // Once they modify it, it's no longer purely default
    updateData({ ...data, customArticles: updated, useDefaultArticles: false });
    setCurrentText("");
  };

  const handleEdit = (idx: number) => {
    setCurrentText(articles[idx]);
    setEditingIndex(idx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRemove = (idx: number) => {
    const updated = articles.filter((_, i) => i !== idx);
    updateData({ ...data, customArticles: updated, useDefaultArticles: false });
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear all articles?")) {
      updateData({ ...data, customArticles: [], useDefaultArticles: false });
    }
  };

  // ==========================================
  // DRAG AND DROP HANDLERS
  // ==========================================
  const handleDragStart = (e: any, index: number) => {
    setDraggedIndex(index);
    // Required for Firefox drag support
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: any, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: any, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newArticles = [...articles];
    const itemToMove = newArticles[draggedIndex];
    
    newArticles.splice(draggedIndex, 1); // Remove from old position
    newArticles.splice(dropIndex, 0, itemToMove); // Insert at new position

    updateData({ ...data, customArticles: newArticles, useDefaultArticles: false });
    setDraggedIndex(null);
  };

  // ==========================================
  // WITNESS DETAILS HANDLER
  // ==========================================
  const handleWitnessChange = (field: string, value: string) => {
    updateData((prev: any) => ({
      ...prev,
      witnessDetails: { ...(prev.witnessDetails || {}), [field]: value }
    }));
  };

  return (
    <div className="p-6 sm:p-10 space-y-10 animate-in fade-in duration-500 w-full overflow-hidden">
      
      {/* SECTION 1: ARTICLES MANAGEMENT */}
      <section>
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Articles of Association</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Internal rules of the company. Drag to reorder, or edit existing clauses.
            </p>
          </div>

          {/* COMPACT ACTIONS */}
          <div className="flex items-center gap-2 shrink-0">
            {articles.length > 0 && (
              <Button variant="outline" onClick={handleClearAll} className="h-10 border-slate-200 text-red-500 hover:bg-red-50 font-bold rounded-xl text-xs">
                Clear All
              </Button>
            )}
            <Button 
              onClick={handleLoadDefaults} 
              className={`h-10 font-bold rounded-xl text-xs px-4 flex items-center gap-2 transition-colors ${data.useDefaultArticles && articles.length > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" : "bg-slate-900 text-white hover:bg-slate-800"}`}
            >
              {data.useDefaultArticles && articles.length > 0 ? <><CheckCircle weight="fill" className="h-4 w-4" /> Defaults Loaded</> : "Load CAMA Defaults"}
            </Button>
          </div>
        </div>

        {/* INPUT BOX FOR ADDING/EDITING */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-8">
          <Label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
            {editingIndex !== null ? `Editing Article #${editingIndex + 1}` : "Add New Article"}
          </Label>
          <div className="flex flex-col sm:flex-row gap-3">
            <textarea 
              rows={2}
              placeholder="E.g. The company shall have a first and paramount lien on every share..."
              value={currentText} 
              onChange={e => setCurrentText(e.target.value)}
              className="w-full p-3 border rounded-xl font-bold text-sm outline-none border-slate-200 resize-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            <div className="flex flex-col gap-2 shrink-0 sm:w-32">
              <Button 
                onClick={handleSaveArticle}
                disabled={!currentText.trim()}
                className="h-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
              >
                {editingIndex !== null ? "Save Update" : <><Plus weight="bold" className="mr-2" /> Add</>}
              </Button>
              {editingIndex !== null && (
                <Button variant="ghost" onClick={() => { setEditingIndex(null); setCurrentText(""); }} className="h-8 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-200/50">
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* DRAGGABLE LIST */}
        <div>
          {articles.length === 0 ? (
            <div className="text-center py-10 bg-white border-2 border-dashed border-slate-200 rounded-2xl">
              <p className="text-sm font-medium text-slate-400">No articles added yet.</p>
              <p className="text-xs font-bold text-amber-500 mt-1 uppercase tracking-widest">Click "Load CAMA Defaults" or add your own above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article, idx) => (
                <div 
                  key={`article-${idx}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={`flex items-start gap-4 p-4 bg-white border rounded-xl group transition-all ${draggedIndex === idx ? "opacity-50 border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300 shadow-sm"}`}
                >
                  <div className="mt-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500 p-1">
                    <ListDashes className="h-5 w-5" weight="bold" />
                  </div>
                  <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-sm font-bold text-slate-700 flex-1 leading-relaxed">
                    {article}
                  </p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => handleEdit(idx)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <PencilSimple className="h-4 w-4" weight="bold" />
                    </button>
                    <button onClick={() => handleRemove(idx)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash className="h-4 w-4" weight="bold" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <hr className="border-slate-100" />

      {/* SECTION 2: WITNESS DETAILS */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-900">Details of Witness</h2>
          <div className="flex items-start gap-2 mt-2 bg-amber-50 p-3 rounded-xl border border-amber-200">
            <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" weight="fill" />
            <p className="text-xs font-medium text-amber-800 leading-relaxed">
              Legal requirement: The signing of the Articles must be witnessed by a third party who is at least 18 years old. <span className="font-black">Cannot be a director/shareholder.</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Surname <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. Doe" value={witness.surname || ""} onChange={e => handleWitnessChange("surname", e.target.value)} className="h-12 font-bold" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">First Name <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. John" value={witness.firstName || ""} onChange={e => handleWitnessChange("firstName", e.target.value)} className="h-12 font-bold" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Other Name (Optional)</Label>
            <Input value={witness.otherName || ""} onChange={e => handleWitnessChange("otherName", e.target.value)} className="h-12 font-bold" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Date of Birth <span className="text-red-500">*</span></Label>
            <Input type="date" value={witness.dob || ""} onChange={e => handleWitnessChange("dob", e.target.value)} className="h-12 font-bold uppercase" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Gender <span className="text-red-500">*</span></Label>
            <select 
              className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm font-bold bg-white focus:border-indigo-500 outline-none"
              value={witness.gender || ""} 
              onChange={e => handleWitnessChange("gender", e.target.value)}
            >
              <option value="">-- Select Gender --</option>
              <option value="MALE">MALE</option>
              <option value="FEMALE">FEMALE</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Occupation <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. Teacher, Engineer" value={witness.occupation || ""} onChange={e => handleWitnessChange("occupation", e.target.value)} className="h-12 font-bold" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Phone Number <span className="text-red-500">*</span></Label>
            <div className="flex">
              <span className="flex items-center justify-center px-4 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-sm font-black text-slate-500">+234</span>
              <Input placeholder="8012345678" value={witness.phone || ""} onChange={e => handleWitnessChange("phone", e.target.value)} className="h-12 font-bold rounded-l-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Email Address <span className="text-red-500">*</span></Label>
            <Input type="email" placeholder="witness@example.com" value={witness.email || ""} onChange={e => handleWitnessChange("email", e.target.value)} className="h-12 font-bold" />
          </div>

          {/* WITNESS ADDRESS */}
          <div className="md:col-span-2 mt-4">
             <h3 className="text-sm font-black text-slate-900 mb-4 border-b pb-2">Witness Residential Address</h3>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">State <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. LAGOS" value={witness.state || ""} onChange={e => handleWitnessChange("state", e.target.value)} className="h-12 font-bold" />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">LGA <span className="text-red-500">*</span></Label>
            <Input placeholder="Local Government Area" value={witness.lga || ""} onChange={e => handleWitnessChange("lga", e.target.value)} className="h-12 font-bold" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Full Street Address <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. 12 Awolowo Way, Ikeja" value={witness.street || ""} onChange={e => handleWitnessChange("street", e.target.value)} className="h-12 font-bold" />
          </div>

        </div>
      </section>
    </div>
  );
}
