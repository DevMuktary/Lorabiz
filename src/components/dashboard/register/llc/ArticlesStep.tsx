"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Info, Plus, Trash, PencilSimple, ListDashes, CheckCircle, WarningCircle, X } from "@phosphor-icons/react";
import { CAMA_ARTICLES_DEFAULT } from "@/lib/cama-articles";

export default function ArticlesStep({ data, updateData }: any) {
  const [currentText, setCurrentText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<number | null>(null);

  const articles: string[] = data.customArticles || [];
  const witness = data.witnessDetails || {};

  // ==========================================
  // ARTICLE LIST MANAGEMENT
  // ==========================================
  const handleLoadDefaults = () => {
    updateData({ ...data, customArticles: [...CAMA_ARTICLES_DEFAULT], useDefaultArticles: true });
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
    
    updateData({ ...data, customArticles: updated, useDefaultArticles: false });
    setCurrentText("");
  };

  const handleEdit = (idx: number) => {
    setCurrentText(articles[idx]);
    setEditingIndex(idx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmRemove = () => {
    if (articleToDelete === null) return;
    const updated = articles.filter((_, i) => i !== articleToDelete);
    updateData({ ...data, customArticles: updated, useDefaultArticles: false });
    setArticleToDelete(null);
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
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: any, index: number) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: any, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newArticles = [...articles];
    const itemToMove = newArticles[draggedIndex];
    
    newArticles.splice(draggedIndex, 1); 
    newArticles.splice(dropIndex, 0, itemToMove); 

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
    <div className="p-6 sm:p-10 space-y-10 animate-in fade-in duration-500 w-full overflow-hidden relative">
      
      {/* BEAUTIFUL DELETE CONFIRMATION MODAL */}
      {articleToDelete !== null && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash className="h-8 w-8" weight="fill" />
              </div>
              <h3 className="font-black text-xl text-slate-900 mb-2">Delete Article?</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                Are you sure you want to remove this clause? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setArticleToDelete(null)} className="flex-1 h-12 rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50">
                  Cancel
                </Button>
                <Button onClick={confirmRemove} className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20">
                  Yes, Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: ARTICLES MANAGEMENT */}
      <section>
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Articles of Association</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Internal rules of the company. Drag to reorder, or edit existing clauses.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {articles.length > 0 && (
              <Button variant="outline" onClick={handleClearAll} className="h-10 border-slate-200 text-red-500 hover:bg-red-50 font-bold rounded-xl text-xs">
                Clear All
              </Button>
            )}
            <Button 
              onClick={handleLoadDefaults} 
              className={`h-10 font-bold rounded-xl text-xs px-4 flex items-center gap-2 transition-colors ${data.useDefaultArticles && articles.length > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" : "bg-slate-900 text-white hover:bg-slate-800 shadow-md"}`}
            >
              {data.useDefaultArticles && articles.length > 0 ? <><CheckCircle weight="fill" className="h-4 w-4" /> Defaults Loaded</> : "Load CAMA Defaults"}
            </Button>
          </div>
        </div>

        {/* GORGEOUS INPUT BOX */}
        <div className="bg-white p-2 rounded-2xl border-2 border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all mb-8 shadow-sm">
          <div className="p-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2 block">
              {editingIndex !== null ? `EDITING ARTICLE #${editingIndex + 1}` : "ADD NEW ARTICLE"}
            </Label>
            <textarea 
              rows={3}
              placeholder="Type your custom clause here..."
              value={currentText} 
              onChange={e => setCurrentText(e.target.value)}
              className="w-full font-bold text-sm text-slate-700 placeholder-slate-400 outline-none resize-none bg-transparent leading-relaxed"
            />
          </div>
          <div className="flex justify-end p-2 bg-slate-50 rounded-xl gap-2">
            {editingIndex !== null && (
              <Button variant="ghost" onClick={() => { setEditingIndex(null); setCurrentText(""); }} className="h-10 px-6 font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg">
                Cancel
              </Button>
            )}
            <Button 
              onClick={handleSaveArticle}
              disabled={!currentText.trim()}
              className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm"
            >
              {editingIndex !== null ? "Save Update" : <><Plus weight="bold" className="mr-2 h-4 w-4" /> Add Article</>}
            </Button>
          </div>
        </div>

        {/* DRAGGABLE LIST */}
        <div>
          {articles.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
              <p className="text-sm font-bold text-slate-500">No articles added yet.</p>
              <p className="text-xs font-black text-amber-500 mt-1 uppercase tracking-widest">Click "Load CAMA Defaults" or add your own.</p>
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
                  className={`flex flex-col sm:flex-row sm:items-start gap-4 p-4 bg-white border-2 rounded-2xl transition-all ${draggedIndex === idx ? "opacity-50 border-indigo-500 bg-indigo-50" : "border-slate-100 hover:border-slate-300 shadow-sm"}`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500 transition-colors">
                      <ListDashes className="h-6 w-6" weight="bold" />
                    </div>
                    <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed mt-1">
                      {article}
                    </p>
                  </div>
                  
                  {/* OBVIOUS ACTION BUTTONS */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start mt-4 sm:mt-0">
                    <button 
                      onClick={() => handleEdit(idx)} 
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      <PencilSimple className="h-4 w-4" weight="bold" /> Edit
                    </button>
                    <button 
                      onClick={() => setArticleToDelete(idx)} 
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash className="h-4 w-4" weight="bold" /> Delete
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
