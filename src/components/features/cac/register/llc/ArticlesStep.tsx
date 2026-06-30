"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Info, Plus, Trash, PencilSimple, ListDashes, CheckCircle, Eye, X, WarningCircle, CaretDown } from "@phosphor-icons/react";
import { CAMA_ARTICLES_DEFAULT } from "@/lib/cama-articles";
import { COUNTRY_CODES, NIGERIA_DATA } from "@/components/features/cac/register/biz-name/schema"; 

export default function ArticlesStep({ data, updateData, showErrors }: any) {
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: "add" | "edit"; idx: number | null }>({ isOpen: false, mode: "add", idx: null });
  const [currentArticle, setCurrentArticle] = useState({ part: "", title: "", subtitle: "", content: "" });
  
  const [viewingArticle, setViewingArticle] = useState<any>(null);
  const [articleToDelete, setArticleToDelete] = useState<number | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const articles: any[] = data.customArticles || [];
  
  const witness = {
    country: "Nigeria",
    phoneCode: "+234",
    ...data.witnessDetails
  };

  // ==========================================
  // VALIDATION ENGINE
  // ==========================================
  const handleBlur = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const getError = (fieldKey: string, value: string, type: "text" | "email" | "dob" | "phone" = "text") => {
    if (!touched[fieldKey] && !showErrors) return null;
    
    if (!value || !value.trim()) {
      return "This field is required.";
    }
    
    if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return "Please enter a valid email address.";
    }

    if (type === "phone") {
      if (value.replace(/\D/g, '').length < 5) return "Please enter a valid phone number.";
    }

    if (type === "dob") {
      const dobDate = new Date(value);
      const ageDifMs = Date.now() - dobDate.getTime();
      const ageDate = new Date(ageDifMs); 
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age < 18) return "Witness must be at least 18 years old.";
    }
    return null; 
  };

  const ErrorMessage = ({ msg }: { msg: string | null }) => {
    if (!msg) return null;
    return (
      <div className="text-[11px] font-bold text-red-500 bg-red-500/10 px-3 py-2 rounded-lg flex items-center gap-1.5 mt-2 border border-red-500/20 animate-in fade-in slide-in-from-top-1">
        <WarningCircle weight="fill" className="h-4 w-4 shrink-0" /> {msg}
      </div>
    );
  };

  const errSur = getError("w-surname", witness.surname);
  const errFirst = getError("w-first", witness.firstName);
  const errDob = getError("w-dob", witness.dob, "dob");
  const errGen = getError("w-gender", witness.gender);
  const errOcc = getError("w-occ", witness.occupation);
  const errPhone = getError("w-phone", witness.phone, "phone");
  const errEmail = getError("w-email", witness.email, "email");
  const errCountry = getError("w-country", witness.country);
  const errState = getError("w-state", witness.state);
  const errLga = getError("w-lga", witness.lga);
  const errStreet = getError("w-street", witness.street);

  // ==========================================
  // ARTICLE LIST MANAGEMENT
  // ==========================================
  const handleLoadDefaults = () => {
    const parsedDefaults = CAMA_ARTICLES_DEFAULT.map(str => {
      const lines = str.split('\n');
      const firstLine = lines[0] || "";
      const [no, ...titleParts] = firstLine.split(':');
      
      const part = no ? no.trim() : "";
      const title = titleParts.length > 0 ? titleParts.join(':').trim() : "Article";
      
      let subtitle = "";
      let content = "";
      
      // If there are more than 2 lines, assume line 2 is a subtitle
      if (lines.length > 2) {
        subtitle = lines[1].trim();
        content = lines.slice(2).join('\n').trim();
      } else if (lines.length === 2) {
        content = lines[1].trim();
      } else {
        content = str;
      }

      return { part, title, subtitle, content };
    });

    updateData({ ...data, customArticles: parsedDefaults, useDefaultArticles: true });
  };

  const openAddModal = () => {
    setCurrentArticle({ part: `${articles.length + 1}`, title: "", subtitle: "", content: "" });
    setModalState({ isOpen: true, mode: "add", idx: null });
  };

  const openEditModal = (idx: number, article: any) => {
    if (typeof article === "string") {
      setCurrentArticle({ part: `${idx + 1}`, title: "Custom Clause", subtitle: "", content: article });
    } else {
      setCurrentArticle({ 
        part: article.part || article.articleNo || "", 
        title: article.title || "", 
        subtitle: article.subtitle || "", 
        content: article.content || "" 
      });
    }
    setModalState({ isOpen: true, mode: "edit", idx });
  };

  const saveArticle = () => {
    if (!currentArticle.content.trim() || !currentArticle.title.trim() || !currentArticle.part.trim()) return;

    let updated = [...articles];
    if (modalState.mode === "edit" && modalState.idx !== null) {
      updated[modalState.idx] = { ...currentArticle };
    } else {
      updated.push({ ...currentArticle });
    }

    updateData({ ...data, customArticles: updated, useDefaultArticles: false });
    setModalState({ isOpen: false, mode: "add", idx: null });
  };

  const confirmRemove = () => {
    if (articleToDelete === null) return;
    const updated = articles.filter((_, i) => i !== articleToDelete);
    updateData({ ...data, customArticles: updated, useDefaultArticles: false });
    setArticleToDelete(null);
  };

  const confirmClearAll = () => {
    updateData({ ...data, customArticles: [], useDefaultArticles: false });
    setShowClearAllModal(false);
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
    updateData((prev: any) => {
      let updatedWitness = { ...(prev.witnessDetails || {}), [field]: value };
      
      if (field === "country" && value !== "Nigeria") {
        updatedWitness.state = "";
        updatedWitness.lga = "";
      }
      if (field === "state" && updatedWitness.country === "Nigeria") {
        updatedWitness.lga = "";
      }

      return { ...prev, witnessDetails: updatedWitness };
    });
  };

  const nigerianStates = NIGERIA_DATA.map(d => d.state).sort();
  const getLgasForState = (stateName: string) => {
    const stateObj = NIGERIA_DATA.find(d => d.state === stateName);
    return stateObj ? stateObj.lgas.sort() : [];
  };

  return (
    <div className="p-4 sm:p-10 space-y-10 animate-in fade-in duration-500 w-full overflow-hidden relative">
      
      {/* ========================================== */}
      {/* 1. ADD / EDIT ARTICLE MODAL */}
      {/* ========================================== */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-secondary/50 shrink-0">
              <h3 className="font-black text-lg text-foreground">
                {modalState.mode === "add" ? "Add New Article" : "Edit Article"}
              </h3>
              <button onClick={() => setModalState({ isOpen: false, mode: "add", idx: null })} className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <X weight="bold" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2 md:col-span-1">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Part <span className="text-red-500">*</span></Label>
                  <Input placeholder="E.g. 1" value={currentArticle.part} onChange={e => setCurrentArticle({...currentArticle, part: e.target.value})} className="h-12 font-bold bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary" />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Clause Title <span className="text-red-500">*</span></Label>
                  <Input placeholder="E.g. DIRECTORS’ POWERS" value={currentArticle.title} onChange={e => setCurrentArticle({...currentArticle, title: e.target.value})} className="h-12 font-bold bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary" />
                </div>
                <div className="space-y-2 md:col-span-4">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Subtitle (Optional)</Label>
                  <Input placeholder="E.g. Directors’ General Authority" value={currentArticle.subtitle} onChange={e => setCurrentArticle({...currentArticle, subtitle: e.target.value})} className="h-12 font-bold bg-background border-border text-foreground focus-visible:ring-primary focus-visible:border-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Main Content / Clauses <span className="text-red-500">*</span></Label>
                <textarea 
                  rows={8}
                  placeholder="Type the full legal clauses here..."
                  value={currentArticle.content} 
                  onChange={e => setCurrentArticle({...currentArticle, content: e.target.value})}
                  className="w-full p-4 border rounded-xl font-medium text-sm outline-none bg-background text-foreground border-border resize-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="p-6 border-t border-border bg-secondary/30 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setModalState({ isOpen: false, mode: "add", idx: null })} className="h-12 px-6 rounded-xl font-bold bg-background text-foreground border-border hover:bg-secondary cursor-pointer">Cancel</Button>
              <Button onClick={saveArticle} disabled={!currentArticle.title.trim() || !currentArticle.content.trim() || !currentArticle.part.trim()} className="h-12 px-8 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-md cursor-pointer">
                {modalState.mode === "add" ? "Save Article" : "Update Article"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. READ-ONLY VIEW MODAL */}
      {/* ========================================== */}
      {viewingArticle && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-border flex justify-between items-start bg-secondary/50 shrink-0 gap-4">
              <div>
                <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary font-black text-[10px] uppercase tracking-widest rounded-md mb-2">
                  Part {viewingArticle.part || viewingArticle.articleNo || "-"}
                </span>
                <h3 className="font-black text-xl text-foreground leading-tight">
                  {viewingArticle.title || "Custom Article"}
                </h3>
                {viewingArticle.subtitle && (
                  <p className="text-sm font-bold text-muted-foreground mt-1 uppercase tracking-widest">{viewingArticle.subtitle}</p>
                )}
              </div>
              <button onClick={() => setViewingArticle(null)} className="p-2 bg-secondary hover:bg-secondary/80 rounded-full text-foreground transition-colors shrink-0 cursor-pointer">
                <X weight="bold" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar bg-background">
              <p className="text-sm text-foreground font-medium leading-relaxed whitespace-pre-wrap">
                {viewingArticle.content || viewingArticle}
              </p>
            </div>
            
            <div className="p-5 border-t border-border bg-secondary/30 flex justify-end shrink-0">
              <Button onClick={() => setViewingArticle(null)} className="h-12 px-8 bg-foreground hover:opacity-90 text-background font-bold rounded-xl cursor-pointer">Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. DELETE CONFIRMATION MODAL */}
      {/* ========================================== */}
      {articleToDelete !== null && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash className="h-8 w-8" weight="fill" />
              </div>
              <h3 className="font-black text-xl text-foreground mb-2">Delete Article?</h3>
              <p className="text-muted-foreground font-medium text-sm leading-relaxed mb-6">
                Are you sure you want to remove this clause? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setArticleToDelete(null)} className="flex-1 h-12 rounded-xl font-bold bg-background text-foreground hover:bg-secondary cursor-pointer border-border">Cancel</Button>
                <Button onClick={confirmRemove} className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg cursor-pointer">Yes, Delete</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 4. CLEAR ALL CONFIRMATION MODAL */}
      {/* ========================================== */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <WarningCircle className="h-8 w-8" weight="fill" />
              </div>
              <h3 className="font-black text-xl text-foreground mb-2">Clear All Articles?</h3>
              <p className="text-muted-foreground font-medium text-sm leading-relaxed mb-6">
                This will delete every single article in the list. You will have to start over. Proceed?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowClearAllModal(false)} className="flex-1 h-12 rounded-xl font-bold bg-background text-foreground border-border hover:bg-secondary cursor-pointer">Cancel</Button>
                <Button onClick={confirmClearAll} className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg cursor-pointer">Clear All</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MAIN UI: ARTICLES LIST */}
      {/* ========================================== */}
      <section>
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-black text-foreground">Articles of Association</h2>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Internal rules of the company. Drag to reorder, view, edit, or add clauses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
            {articles.length > 0 && (
              <Button variant="outline" onClick={() => setShowClearAllModal(true)} className="flex-1 md:flex-none h-10 border-border text-red-500 hover:bg-red-500/10 font-bold rounded-xl text-xs px-3 bg-background cursor-pointer">
                Clear All
              </Button>
            )}
            <Button 
              onClick={handleLoadDefaults} 
              className={`flex-1 md:flex-none h-10 font-bold rounded-xl text-xs px-3 flex items-center justify-center gap-2 transition-colors cursor-pointer ${data.useDefaultArticles && articles.length > 0 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
            >
              {data.useDefaultArticles && articles.length > 0 ? <><CheckCircle weight="fill" className="h-4 w-4 shrink-0" /> <span className="truncate">Defaults Loaded</span></> : "Load CAMA Defaults"}
            </Button>
            <Button onClick={openAddModal} className="flex-1 md:flex-none h-10 font-bold rounded-xl text-xs px-3 flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-primary-foreground shadow-md cursor-pointer">
              <Plus weight="bold" className="shrink-0" /> Add Custom
            </Button>
          </div>
        </div>

        {/* DRAGGABLE LIST */}
        <div>
          {articles.length === 0 ? (
            <div className="text-center py-12 bg-secondary/30 border-2 border-dashed border-border rounded-3xl mx-1 sm:mx-0">
              <p className="text-sm font-bold text-muted-foreground">No articles added yet.</p>
              <p className="text-xs font-black text-primary mt-1 uppercase tracking-widest">Load Defaults or Add a Custom Article to begin.</p>
              {showErrors && <ErrorMessage msg="You must add at least one article to proceed." />}
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article, idx) => {
                const isString = typeof article === "string";
                const no = isString ? `${idx + 1}` : (article.part || article.articleNo || `${idx + 1}`);
                const title = isString ? "Custom Clause" : (article.title || "Custom Clause");
                const subtitle = isString ? "" : (article.subtitle || "");
                const contentText = isString ? article : (article.content || "");

                return (
                  <div 
                    key={`article-${idx}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 pr-4 bg-card border rounded-2xl transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)] ${draggedIndex === idx ? "opacity-50 border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                  >
                    <div className="hidden sm:flex cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-primary px-2 py-3">
                      <ListDashes className="h-5 w-5" weight="bold" />
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-1 overflow-hidden py-1 w-full">
                      <div className="flex items-center gap-3">
                        <div className="sm:hidden cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-primary">
                          <ListDashes className="h-5 w-5" weight="bold" />
                        </div>
                        <span className="shrink-0 bg-secondary text-foreground px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-border">
                          Part {no}
                        </span>
                        <div className="flex flex-col overflow-hidden">
                          <h4 className="text-sm font-black text-foreground truncate">{title}</h4>
                          {subtitle && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{subtitle}</span>}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium line-clamp-5 pr-2 sm:pr-4 leading-relaxed mt-1">
                        {contentText}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 sm:pl-3 sm:border-l border-border w-full sm:w-auto">
                      <button onClick={() => setViewingArticle(article)} className="p-2 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors flex items-center justify-center flex-1 sm:flex-none cursor-pointer">
                        <Eye className="h-5 w-5" weight="bold" />
                      </button>
                      <button onClick={() => openEditModal(idx, article)} className="p-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors flex items-center justify-center flex-1 sm:flex-none cursor-pointer">
                        <PencilSimple className="h-5 w-5" weight="bold" />
                      </button>
                      <button onClick={() => setArticleToDelete(idx)} className="p-2 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors flex items-center justify-center flex-1 sm:flex-none cursor-pointer">
                        <Trash className="h-5 w-5" weight="bold" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <hr className="border-border" />

      {/* ========================================== */}
      {/* SECTION 3: WITNESS DETAILS */}
      {/* ========================================== */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-black text-foreground">Details of Witness</h2>
          <div className="flex items-start gap-2 mt-2 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
            <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" weight="fill" />
            <p className="text-xs font-medium text-amber-500 leading-relaxed">
              Legal requirement: The signing of the Articles must be witnessed by a third party who is at least 18 years old. <span className="font-black">Cannot be a director/shareholder.</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errSur ? "text-red-500" : "text-muted-foreground"}`}>Surname <span className="text-red-500">*</span></Label>
            <Input id="field-w-surname" placeholder="E.g. Doe" value={witness.surname || ""} onChange={e => { handleWitnessChange("surname", e.target.value); setTouched(p => ({...p, "w-surname": true})); }} onBlur={() => handleBlur("w-surname")} className={`h-12 font-bold bg-background text-foreground ${errSur ? "border-red-500 bg-red-500/10" : "border-border focus-visible:ring-primary focus-visible:border-primary"}`} />
            <ErrorMessage msg={errSur} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errFirst ? "text-red-500" : "text-muted-foreground"}`}>First Name <span className="text-red-500">*</span></Label>
            <Input id="field-w-first" placeholder="E.g. John" value={witness.firstName || ""} onChange={e => { handleWitnessChange("firstName", e.target.value); setTouched(p => ({...p, "w-first": true})); }} onBlur={() => handleBlur("w-first")} className={`h-12 font-bold bg-background text-foreground ${errFirst ? "border-red-500 bg-red-500/10" : "border-border focus-visible:ring-primary focus-visible:border-primary"}`} />
            <ErrorMessage msg={errFirst} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground">Other Name (Optional)</Label>
            <Input value={witness.otherName || ""} onChange={e => handleWitnessChange("otherName", e.target.value)} className="h-12 font-bold bg-background text-foreground border-border focus-visible:ring-primary focus-visible:border-primary" />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errDob ? "text-red-500" : "text-muted-foreground"}`}>Date of Birth <span className="text-red-500">*</span></Label>
            <Input id="field-w-dob" type="date" value={witness.dob || ""} onChange={e => { handleWitnessChange("dob", e.target.value); setTouched(p => ({...p, "w-dob": true})); }} onBlur={() => handleBlur("w-dob")} className={`h-12 font-bold uppercase bg-background text-foreground appearance-none ${errDob ? "border-red-500 bg-red-500/10" : "border-border focus-visible:ring-primary focus-visible:border-primary"}`} />
            <ErrorMessage msg={errDob} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errGen ? "text-red-500" : "text-muted-foreground"}`}>Gender <span className="text-red-500">*</span></Label>
            <select 
              id="field-w-gender"
              className={`w-full h-12 px-4 border rounded-xl text-sm font-bold outline-none transition-colors ${errGen ? "border-red-500 bg-red-500/10 text-red-500" : "border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary"}`}
              value={witness.gender || ""} 
              onChange={e => { handleWitnessChange("gender", e.target.value); setTouched(p => ({...p, "w-gender": true})); }}
              onBlur={() => handleBlur("w-gender")}
            >
              <option value="">-- Select Gender --</option>
              <option value="MALE">MALE</option>
              <option value="FEMALE">FEMALE</option>
            </select>
            <ErrorMessage msg={errGen} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errOcc ? "text-red-500" : "text-muted-foreground"}`}>Occupation <span className="text-red-500">*</span></Label>
            <Input id="field-w-occ" placeholder="E.g. Teacher, Engineer" value={witness.occupation || ""} onChange={e => { handleWitnessChange("occupation", e.target.value); setTouched(p => ({...p, "w-occ": true})); }} onBlur={() => handleBlur("w-occ")} className={`h-12 font-bold bg-background text-foreground ${errOcc ? "border-red-500 bg-red-500/10" : "border-border focus-visible:ring-primary focus-visible:border-primary"}`} />
            <ErrorMessage msg={errOcc} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className={`text-xs font-bold uppercase ${errEmail ? "text-red-500" : "text-muted-foreground"}`}>Email Address <span className="text-red-500">*</span></Label>
            <Input id="field-w-email" type="email" placeholder="witness@example.com" value={witness.email || ""} onChange={e => { handleWitnessChange("email", e.target.value); setTouched(p => ({...p, "w-email": true})); }} onBlur={() => handleBlur("w-email")} className={`h-12 font-bold bg-background text-foreground ${errEmail ? "border-red-500 bg-red-500/10" : "border-border focus-visible:ring-primary focus-visible:border-primary"}`} />
            <ErrorMessage msg={errEmail} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errCountry ? "text-red-500" : "text-muted-foreground"}`}>Country / Nationality <span className="text-red-500">*</span></Label>
            <div className="relative">
              <select 
                id="field-w-country"
                className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${errCountry ? "border-red-500 bg-red-500/10 text-red-500" : "border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary"}`}
                value={witness.country} 
                onChange={e => { handleWitnessChange("country", e.target.value); setTouched(p => ({...p, "w-country": true})); }}
                onBlur={() => handleBlur("w-country")}
              >
                <option value="">-- Select Country --</option>
                {COUNTRY_CODES.map(c => <option key={c.name} value={c.name}>{c.flag} {c.name}</option>)}
              </select>
              <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" weight="bold" />
            </div>
            <ErrorMessage msg={errCountry} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errPhone ? "text-red-500" : "text-muted-foreground"}`}>Phone Number <span className="text-red-500">*</span></Label>
            <div className={`flex border rounded-xl overflow-hidden focus-within:ring-1 transition-colors ${errPhone ? "border-red-500 focus-within:ring-red-500/20" : "border-border focus-within:border-primary focus-within:ring-primary"}`}>
              <select 
                value={witness.phoneCode} 
                onChange={e => handleWitnessChange("phoneCode", e.target.value)}
                className={`w-[100px] h-12 px-2 border-r rounded-none text-sm font-bold outline-none appearance-none transition-colors cursor-pointer ${errPhone ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-secondary border-border text-foreground hover:bg-secondary/80 focus:bg-background"}`}
              >
                {COUNTRY_CODES.map(c => <option key={`code-${c.name}`} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
              <Input id="field-w-phone" type="tel" placeholder="8012345678" value={witness.phone || ""} onChange={e => { handleWitnessChange("phone", e.target.value); setTouched(p => ({...p, "w-phone": true})); }} onBlur={() => handleBlur("w-phone")} className={`h-12 font-bold rounded-l-none border-0 shadow-none focus-visible:ring-0 flex-1 bg-background text-foreground ${errPhone ? "bg-red-500/10" : ""}`} />
            </div>
            <ErrorMessage msg={errPhone} />
          </div>

          <div className="md:col-span-2 mt-4">
             <h3 className="text-sm font-black text-foreground mb-4 border-b border-border pb-2">Witness Residential Address</h3>
          </div>

          {witness.country === "Nigeria" ? (
            <>
              <div className="space-y-2">
                <Label className={`text-xs font-bold uppercase ${errState ? "text-red-500" : "text-muted-foreground"}`}>State <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <select 
                    id="field-w-state"
                    value={witness.state || ""} 
                    onChange={e => { handleWitnessChange("state", e.target.value); setTouched(p => ({...p, "w-state": true})); }}
                    onBlur={() => handleBlur("w-state")}
                    className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${errState ? "border-red-500 bg-red-500/10 text-red-500" : "border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary"}`}
                  >
                    <option value="">-- Select State --</option>
                    {nigerianStates.map(state => <option key={state} value={state}>{state}</option>)}
                  </select>
                  <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" weight="bold" />
                </div>
                <ErrorMessage msg={errState} />
              </div>
              
              <div className="space-y-2">
                <Label className={`text-xs font-bold uppercase ${errLga ? "text-red-500" : "text-muted-foreground"}`}>LGA <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <select 
                    id="field-w-lga"
                    value={witness.lga || ""} 
                    disabled={!witness.state}
                    onChange={e => { handleWitnessChange("lga", e.target.value); setTouched(p => ({...p, "w-lga": true})); }}
                    onBlur={() => handleBlur("w-lga")}
                    className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${!witness.state ? "bg-secondary border-border text-muted-foreground opacity-60" : errLga ? "border-red-500 bg-red-500/10 text-red-500" : "border-border bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary"}`}
                  >
                    <option value="">-- Select LGA --</option>
                    {getLgasForState(witness.state).map(lga => <option key={lga} value={lga}>{lga}</option>)}
                  </select>
                  <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground pointer-events-none" weight="bold" />
                </div>
                <ErrorMessage msg={errLga} />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label className={`text-xs font-bold uppercase ${errState ? "text-red-500" : "text-muted-foreground"}`}>State / Province <span className="text-red-500">*</span></Label>
                <Input id="field-w-state" placeholder="E.g. Texas, Ontario" value={witness.state || ""} onChange={e => { handleWitnessChange("state", e.target.value); setTouched(p => ({...p, "w-state": true})); }} onBlur={() => handleBlur("w-state")} className={`h-12 font-bold bg-background text-foreground ${errState ? "border-red-500 bg-red-500/10" : "border-border focus-visible:ring-primary focus-visible:border-primary"}`} />
                <ErrorMessage msg={errState} />
              </div>
              
              <div className="space-y-2">
                <Label className={`text-xs font-bold uppercase ${errLga ? "text-red-500" : "text-muted-foreground"}`}>City / County <span className="text-red-500">*</span></Label>
                <Input id="field-w-lga" placeholder="E.g. Austin, Toronto" value={witness.lga || ""} onChange={e => { handleWitnessChange("lga", e.target.value); setTouched(p => ({...p, "w-lga": true})); }} onBlur={() => handleBlur("w-lga")} className={`h-12 font-bold bg-background text-foreground ${errLga ? "border-red-500 bg-red-500/10" : "border-border focus-visible:ring-primary focus-visible:border-primary"}`} />
                <ErrorMessage msg={errLga} />
              </div>
            </>
          )}

          <div className="space-y-2 md:col-span-2">
            <Label className={`text-xs font-bold uppercase ${errStreet ? "text-red-500" : "text-muted-foreground"}`}>Full Street Address <span className="text-red-500">*</span></Label>
            <Input id="field-w-street" placeholder="E.g. 12 Awolowo Way, Ikeja" value={witness.street || ""} onChange={e => { handleWitnessChange("street", e.target.value); setTouched(p => ({...p, "w-street": true})); }} onBlur={() => handleBlur("w-street")} className={`h-12 font-bold bg-background text-foreground ${errStreet ? "border-red-500 bg-red-500/10" : "border-border focus-visible:ring-primary focus-visible:border-primary"}`} />
            <ErrorMessage msg={errStreet} />
          </div>

        </div>
      </section>
    </div>
  );
}
