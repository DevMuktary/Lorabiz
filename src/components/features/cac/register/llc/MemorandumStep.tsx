"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Info, Plus, Trash, PencilSimple, WarningCircle, X, Briefcase } from "@phosphor-icons/react";

export default function MemorandumStep({ data, updateData, showErrors }: any) {
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: "add" | "edit"; idx: number | null }>({ isOpen: false, mode: "add", idx: null });
  const [currentText, setCurrentText] = useState("");
  
  const [objectToDelete, setObjectToDelete] = useState<number | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  const objects: string[] = data.memorandumObjects || [];

  // ==========================================
  // OBJECT LIST MANAGEMENT
  // ==========================================
  const openAddModal = () => {
    setCurrentText("");
    setModalState({ isOpen: true, mode: "add", idx: null });
  };

  const openEditModal = (idx: number) => {
    setCurrentText(objects[idx]);
    setModalState({ isOpen: true, mode: "edit", idx });
  };

  const saveObject = () => {
    if (!currentText.trim()) return;

    let updated = [...objects];
    if (modalState.mode === "edit" && modalState.idx !== null) {
      updated[modalState.idx] = currentText.trim();
    } else {
      updated.push(currentText.trim());
    }

    updateData({ ...data, memorandumObjects: updated });
    setModalState({ isOpen: false, mode: "add", idx: null });
  };

  const confirmRemove = () => {
    if (objectToDelete === null) return;
    const updated = objects.filter((_, i) => i !== objectToDelete);
    updateData({ ...data, memorandumObjects: updated });
    setObjectToDelete(null);
  };

  const confirmClearAll = () => {
    updateData({ ...data, memorandumObjects: [] });
    setShowClearAllModal(false);
  };

  const ErrorMessage = ({ msg }: { msg: string | null }) => {
    if (!msg) return null;
    return (
      <div className="text-[11px] font-bold text-red-500 bg-red-500/10 px-3 py-2 rounded-lg flex items-center gap-1.5 mt-4 border border-red-500/20 animate-in fade-in slide-in-from-top-1 inline-flex mx-auto">
        <WarningCircle weight="fill" className="h-4 w-4 shrink-0" /> {msg}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-10 space-y-10 animate-in fade-in duration-500 w-full overflow-hidden relative">
      
      {/* ========================================== */}
      {/* 1. ADD / EDIT OBJECT MODAL */}
      {/* ========================================== */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-amber-500/5 shrink-0">
              <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-amber-500" weight="fill" />
                {modalState.mode === "add" ? "Define Business Object" : "Edit Business Object"}
              </h3>
              <button onClick={() => setModalState({ isOpen: false, mode: "add", idx: null })} className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors cursor-pointer hover:text-foreground">
                <X weight="bold" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Nature of Business <span className="text-red-500">*</span></Label>
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2 mb-4">
                  <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" weight="fill" />
                  <p className="text-xs font-medium text-amber-500 leading-relaxed">
                    Start with "To carry on the business of..." and clearly describe the specific activities the company will engage in.
                  </p>
                </div>
                <textarea 
                  rows={8}
                  placeholder="E.g. To carry on the business of software development, IT consulting, and digital marketing services..."
                  value={currentText} 
                  onChange={e => setCurrentText(e.target.value)}
                  className="w-full p-4 border rounded-xl font-medium text-[15px] outline-none border-border resize-none focus:ring-2 focus:ring-amber-500 bg-background text-foreground transition-colors"
                />
              </div>
            </div>

            <div className="p-6 border-t border-border bg-secondary/30 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setModalState({ isOpen: false, mode: "add", idx: null })} className="h-12 px-6 rounded-xl font-bold bg-background border-border text-foreground hover:bg-secondary cursor-pointer">Cancel</Button>
              <Button onClick={saveObject} disabled={!currentText.trim()} className="h-12 px-8 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md cursor-pointer">
                {modalState.mode === "add" ? "Save Object" : "Update Object"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. DELETE CONFIRMATION MODAL */}
      {/* ========================================== */}
      {objectToDelete !== null && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash className="h-8 w-8" weight="fill" />
              </div>
              <h3 className="font-black text-xl text-foreground mb-2">Delete Object?</h3>
              <p className="text-muted-foreground font-medium text-sm leading-relaxed mb-6">
                Are you sure you want to remove this object of memorandum? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setObjectToDelete(null)} className="flex-1 h-12 rounded-xl font-bold bg-background border-border text-foreground hover:bg-secondary cursor-pointer">Cancel</Button>
                <Button onClick={confirmRemove} className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg cursor-pointer">Yes, Delete</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. CLEAR ALL CONFIRMATION MODAL */}
      {/* ========================================== */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <WarningCircle className="h-8 w-8" weight="fill" />
              </div>
              <h3 className="font-black text-xl text-foreground mb-2">Clear All Objects?</h3>
              <p className="text-muted-foreground font-medium text-sm leading-relaxed mb-6">
                This will delete every single object in the list. You will have to start over. Proceed?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowClearAllModal(false)} className="flex-1 h-12 rounded-xl font-bold bg-background border-border text-foreground hover:bg-secondary cursor-pointer">Cancel</Button>
                <Button onClick={confirmClearAll} className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg cursor-pointer">Clear All</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MAIN UI: OBJECTS GRID */}
      {/* ========================================== */}
      <section>
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-black text-foreground">Objects of Memorandum</h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              What will the company do? Define the core business activities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
            {objects.length > 0 && (
              <Button variant="outline" onClick={() => setShowClearAllModal(true)} className="flex-1 md:flex-none h-10 border-border text-red-500 hover:bg-red-500/10 font-bold rounded-xl text-xs px-3 bg-background cursor-pointer hover:text-red-600">
                Clear All
              </Button>
            )}
            <Button onClick={openAddModal} className="flex-1 md:flex-none h-10 font-bold rounded-xl text-xs px-5 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-md cursor-pointer">
              <Plus weight="bold" className="shrink-0" /> Add Object
            </Button>
          </div>
        </div>

        {/* GRID LAYOUT (SQUARE CARDS, FULL VISIBILITY) */}
        <div>
          {objects.length === 0 ? (
            <div className="text-center py-16 bg-secondary/30 border-2 border-dashed border-border rounded-3xl mx-1 sm:mx-0">
              <div className="h-16 w-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-border">
                <Briefcase className="h-8 w-8 text-amber-500" weight="duotone" />
              </div>
              <p className="text-sm font-bold text-foreground">No business objects defined yet.</p>
              <p className="text-xs font-black text-amber-500 mt-1 uppercase tracking-widest">Click "Add Object" to begin.</p>
              {showErrors && <ErrorMessage msg="You must add at least one Object of Memorandum to proceed." />}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {objects.map((text, idx) => (
                <div 
                  key={`object-${idx}`}
                  className="flex flex-col bg-card border border-border rounded-3xl p-6 transition-all hover:shadow-lg hover:border-amber-500/50 group relative min-h-[200px]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-amber-500/10 text-amber-500 text-xs font-black">
                      {idx + 1}
                    </span>
                    
                    {/* Corner Actions */}
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(idx)} className="p-2 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-full transition-colors cursor-pointer" title="Edit">
                        <PencilSimple className="h-4 w-4" weight="bold" />
                      </button>
                      <button onClick={() => setObjectToDelete(idx)} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors cursor-pointer" title="Delete">
                        <Trash className="h-4 w-4" weight="bold" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Full Text Display */}
                  <p className="text-[14px] text-foreground font-medium leading-relaxed flex-1 whitespace-pre-wrap">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
