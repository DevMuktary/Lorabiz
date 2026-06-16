"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Info, Plus, Trash, PencilSimple, ListDashes, CheckCircle, Eye, X, WarningCircle } from "@phosphor-icons/react";
import { CAMA_ARTICLES_DEFAULT } from "@/lib/cama-articles";

export default function ArticlesStep({ data, updateData, showErrors }: any) {
  // Modal States
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: "add" | "edit"; idx: number | null }>({ isOpen: false, mode: "add", idx: null });
  const [currentArticle, setCurrentArticle] = useState({ articleNo: "", title: "", content: "" });
  
  const [viewingArticle, setViewingArticle] = useState<any>(null);
  const [articleToDelete, setArticleToDelete] = useState<number | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Validation State
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const articles: any[] = data.customArticles || [];
  const witness = data.witnessDetails || {};

  // ==========================================
  // VALIDATION ENGINE
  // ==========================================
  const handleBlur = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const getError = (fieldKey: string, value: string, type: "text" | "email" | "dob" = "text") => {
    if (!touched[fieldKey] && !showErrors) return null;
    
    if (!value || !value.trim()) {
      return "This field is required.";
    }
    
    if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return "Please enter a valid email address.";
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
      <div className="text-[11px] font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-1.5 mt-2 border border-red-100 animate-in fade-in slide-in-from-top-1">
        <WarningCircle weight="fill" className="h-4 w-4 shrink-0" /> {msg}
      </div>
    );
  };

  const errSur = getError("w-surname", witness.surname);
  const errFirst = getError("w-first", witness.firstName);
  const errDob = getError("w-dob", witness.dob, "dob");
  const errGen = getError("w-gender", witness.gender);
  const errOcc = getError("w-occ", witness.occupation);
  const errPhone = getError("w-phone", witness.phone);
  const errEmail = getError("w-email", witness.email, "email");
  const errState = getError("w-state", witness.state);
  const errLga = getError("w-lga", witness.lga);
  const errStreet = getError("w-street", witness.street);

  // ==========================================
  // ARTICLE LIST MANAGEMENT
  // ==========================================
  const handleLoadDefaults = () => {
    const parsedDefaults = CAMA_ARTICLES_DEFAULT.map(str => {
      const firstNewline = str.indexOf('\n');
      if (firstNewline === -1) return { articleNo: "", title: "Article", content: str };

      const firstLine = str.substring(0, firstNewline);
      const content = str.substring(firstNewline + 1).trim();
      const [no, ...titleParts] = firstLine.split(':');

      return {
        articleNo: no ? no.trim() : "",
        title: titleParts.length > 0 ? titleParts.join(':').trim() : "Article",
        content: content
      };
    });

    updateData({ ...data, customArticles: parsedDefaults, useDefaultArticles: true });
  };

  const openAddModal = () => {
    setCurrentArticle({ articleNo: `${articles.length + 1}`, title: "", content: "" });
    setModalState({ isOpen: true, mode: "add", idx: null });
  };

  const openEditModal = (idx: number, article: any) => {
    if (typeof article === "string") {
      setCurrentArticle({ articleNo: `${idx + 1}`, title: "Custom Clause", content: article });
    } else {
      setCurrentArticle({ articleNo: article.articleNo || "", title: article.title || "", content: article.content || "" });
    }
    setModalState({ isOpen: true, mode: "edit", idx });
  };

  const saveArticle = () => {
    if (!currentArticle.content.trim() || !currentArticle.title.trim()) return;

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

  const handleWitnessChange = (field: string, value: string) => {
    updateData((prev: any) => ({
      ...prev,
      witnessDetails: { ...(prev.witnessDetails || {}), [field]: value }
    }));
  };

  return (
    <div className="p-4 sm:p-10 space-y-10 animate-in fade-in duration-500 w-full overflow-hidden relative">
      
      {/* ========================================== */}
      {/* MODALS SECTION (Fixed Z-Index + Viewport locks) */}
      {/* ========================================== */}
      
      {/* 1. ADD / EDIT ARTICLE MODAL */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-black text-lg text-slate-900">
                {modalState.mode === "add" ? "Add New Article" : "Edit Article"}
              </h3>
              <button onClick={() => setModalState({ isOpen: false, mode: "add", idx: null })} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X weight="bold" />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2 md:col-span-1">
                  <Label className="text-xs font-bold uppercase text-slate-500">Article No. <span className="text-red-500">*</span></Label>
                  <Input placeholder="E.g. 1" value={currentArticle.articleNo} onChange={e => setCurrentArticle({...currentArticle, articleNo: e.target.value})} className="h-12 font-bold" />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label className="text-xs font-bold uppercase text-slate-500">Clause Title <span className="text-red-500">*</span></Label>
                  <Input placeholder="E.g. DIRECTORS’ POWERS" value={currentArticle.title} onChange={e => setCurrentArticle({...currentArticle, title: e.target.value})} className="h-12 font-bold" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Main Content / Clauses <span className="text-red-500">*</span></Label>
                <textarea 
                  rows={10}
                  placeholder="Type the full legal clauses here..."
                  value={currentArticle.content} 
                  onChange={e => setCurrentArticle({...currentArticle, content: e.target.value})}
                  className="w-full p-4 border rounded-xl font-medium text-sm outline-none border-slate-200 resize-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={() => setModalState({ isOpen: false, mode: "add", idx: null })} className="h-12 px-6 rounded-xl font-bold bg-white">Cancel</Button>
              <Button onClick={saveArticle} disabled={!currentArticle.title.trim() || !currentArticle.content.trim()} className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md">
                {modalState.mode === "add" ? "Save Article" : "Update Article"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. READ-ONLY VIEW MODAL */}
      {viewingArticle && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-slate-50 shrink-0 gap-4">
              <div>
                <span className="inline-block px-2.5 py-1 bg-indigo-100 text-indigo-700 font-black text-[10px] uppercase tracking-widest rounded-md mb-2">
                  Article {viewingArticle.articleNo || "-"}
                </span>
                <h3 className="font-black text-xl text-slate-900 leading-tight">
                  {viewingArticle.title || "Custom Article"}
                </h3>
              </div>
              <button onClick={() => setViewingArticle(null)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 transition-colors shrink-0">
                <X weight="bold" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar bg-white">
              <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                {viewingArticle.content || viewingArticle}
              </p>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <Button onClick={() => setViewingArticle(null)} className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl">Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. DELETE CONFIRMATION MODAL */}
      {articleToDelete !== null && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
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
                <Button variant="outline" onClick={() => setArticleToDelete(null)} className="flex-1 h-12 rounded-xl font-bold bg-white">Cancel</Button>
                <Button onClick={confirmRemove} className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg">Yes, Delete</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CLEAR ALL CONFIRMATION MODAL */}
      {showClearAllModal && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <WarningCircle className="h-8 w-8" weight="fill" />
              </div>
              <h3 className="font-black text-xl text-slate-900 mb-2">Clear All Articles?</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                This will delete every single article in the list. You will have to start over. Proceed?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowClearAllModal(false)} className="flex-1 h-12 rounded-xl font-bold bg-white">Cancel</Button>
                <Button onClick={confirmClearAll} className="flex-1 h-12 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg">Clear All</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MAIN UI: ARTICLES LIST */}
      {/* ========================================== */}
      <section>
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Articles of Association</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Internal rules of the company. Drag to reorder, view, edit, or add clauses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
            {articles.length > 0 && (
              <Button variant="outline" onClick={() => setShowClearAllModal(true)} className="flex-1 md:flex-none h-10 border-slate-200 text-red-500 hover:bg-red-50 font-bold rounded-xl text-xs px-3 bg-white">
                Clear All
              </Button>
            )}
            <Button 
              onClick={handleLoadDefaults} 
              className={`flex-1 md:flex-none h-10 font-bold rounded-xl text-xs px-3 flex items-center justify-center gap-2 transition-colors ${data.useDefaultArticles && articles.length > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              {data.useDefaultArticles && articles.length > 0 ? <><CheckCircle weight="fill" className="h-4 w-4 shrink-0" /> <span className="truncate">Defaults Loaded</span></> : "Load CAMA Defaults"}
            </Button>
            <Button onClick={openAddModal} className="flex-1 md:flex-none h-10 font-bold rounded-xl text-xs px-3 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
              <Plus weight="bold" className="shrink-0" /> Add Custom
            </Button>
          </div>
        </div>

        {/* DRAGGABLE LIST */}
        <div>
          {articles.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl mx-1 sm:mx-0">
              <p className="text-sm font-bold text-slate-500">No articles added yet.</p>
              <p className="text-xs font-black text-indigo-500 mt-1 uppercase tracking-widest">Load Defaults or Add a Custom Article to begin.</p>
              {showErrors && <ErrorMessage msg="You must add at least one article to proceed." />}
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article, idx) => {
                const isString = typeof article === "string";
                const no = isString ? `${idx + 1}` : (article.articleNo || `${idx + 1}`);
                const title = isString ? "Custom Clause" : (article.title || "Custom Clause");
                const contentText = isString ? article : (article.content || "");

                return (
                  <div 
                    key={`article-${idx}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 pr-4 bg-white border rounded-2xl transition-all shadow-[0_2px_10px_rgb(0,0,0,0.02)] ${draggedIndex === idx ? "opacity-50 border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-300"}`}
                  >
                    <div className="hidden sm:flex cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500 px-2 py-3">
                      <ListDashes className="h-5 w-5" weight="bold" />
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-1 overflow-hidden py-1 w-full">
                      <div className="flex items-center gap-3">
                        <div className="sm:hidden cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-500">
                          <ListDashes className="h-5 w-5" weight="bold" />
                        </div>
                        <span className="shrink-0 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                          Art. {no}
                        </span>
                        <h4 className="text-sm font-black text-slate-800 truncate">
                          {title}
                        </h4>
                      </div>
                      {/* BUMPED TO line-clamp-5 */}
                      <p className="text-xs text-slate-500 font-medium line-clamp-5 pr-2 sm:pr-4 leading-relaxed mt-1">
                        {contentText}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 sm:pl-3 sm:border-l border-slate-100 w-full sm:w-auto">
                      <button onClick={() => setViewingArticle(article)} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center flex-1 sm:flex-none">
                        <Eye className="h-5 w-5" weight="bold" />
                      </button>
                      <button onClick={() => openEditModal(idx, article)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center justify-center flex-1 sm:flex-none">
                        <PencilSimple className="h-5 w-5" weight="bold" />
                      </button>
                      <button onClick={() => setArticleToDelete(idx)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center flex-1 sm:flex-none">
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

      <hr className="border-slate-100" />

      {/* SECTION 3: WITNESS DETAILS */}
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
            <Label className={`text-xs font-bold uppercase ${errSur ? "text-red-500" : "text-slate-500"}`}>Surname <span className="text-red-500">*</span></Label>
            <Input id="field-w-surname" placeholder="E.g. Doe" value={witness.surname || ""} onChange={e => { handleWitnessChange("surname", e.target.value); setTouched(p => ({...p, "w-surname": true})); }} onBlur={() => handleBlur("w-surname")} className={`h-12 font-bold ${errSur ? "border-red-500 bg-red-50/30" : ""}`} />
            <ErrorMessage msg={errSur} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errFirst ? "text-red-500" : "text-slate-500"}`}>First Name <span className="text-red-500">*</span></Label>
            <Input id="field-w-first" placeholder="E.g. John" value={witness.firstName || ""} onChange={e => { handleWitnessChange("firstName", e.target.value); setTouched(p => ({...p, "w-first": true})); }} onBlur={() => handleBlur("w-first")} className={`h-12 font-bold ${errFirst ? "border-red-500 bg-red-50/30" : ""}`} />
            <ErrorMessage msg={errFirst} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Other Name (Optional)</Label>
            <Input value={witness.otherName || ""} onChange={e => handleWitnessChange("otherName", e.target.value)} className="h-12 font-bold" />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errDob ? "text-red-500" : "text-slate-500"}`}>Date of Birth <span className="text-red-500">*</span></Label>
            <Input id="field-w-dob" type="date" value={witness.dob || ""} onChange={e => { handleWitnessChange("dob", e.target.value); setTouched(p => ({...p, "w-dob": true})); }} onBlur={() => handleBlur("w-dob")} className={`h-12 font-bold uppercase ${errDob ? "border-red-500 bg-red-50/30" : ""}`} />
            <ErrorMessage msg={errDob} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errGen ? "text-red-500" : "text-slate-500"}`}>Gender <span className="text-red-500">*</span></Label>
            <select 
              id="field-w-gender"
              className={`w-full h-12 px-4 border rounded-xl text-sm font-bold outline-none ${errGen ? "border-red-500 bg-red-50/30" : "border-slate-200 bg-white focus:border-indigo-500"}`}
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
            <Label className={`text-xs font-bold uppercase ${errOcc ? "text-red-500" : "text-slate-500"}`}>Occupation <span className="text-red-500">*</span></Label>
            <Input id="field-w-occ" placeholder="E.g. Teacher, Engineer" value={witness.occupation || ""} onChange={e => { handleWitnessChange("occupation", e.target.value); setTouched(p => ({...p, "w-occ": true})); }} onBlur={() => handleBlur("w-occ")} className={`h-12 font-bold ${errOcc ? "border-red-500 bg-red-50/30" : ""}`} />
            <ErrorMessage msg={errOcc} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errPhone ? "text-red-500" : "text-slate-500"}`}>Phone Number <span className="text-red-500">*</span></Label>
            <div className="flex">
              <span className={`flex items-center justify-center px-4 border border-r-0 rounded-l-xl text-sm font-black ${errPhone ? "bg-red-100 border-red-500 text-red-500" : "bg-slate-100 border-slate-200 text-slate-500"}`}>+234</span>
              <Input id="field-w-phone" placeholder="8012345678" value={witness.phone || ""} onChange={e => { handleWitnessChange("phone", e.target.value); setTouched(p => ({...p, "w-phone": true})); }} onBlur={() => handleBlur("w-phone")} className={`h-12 font-bold rounded-l-none ${errPhone ? "border-red-500 bg-red-50/30" : ""}`} />
            </div>
            <ErrorMessage msg={errPhone} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errEmail ? "text-red-500" : "text-slate-500"}`}>Email Address <span className="text-red-500">*</span></Label>
            <Input id="field-w-email" type="email" placeholder="witness@example.com" value={witness.email || ""} onChange={e => { handleWitnessChange("email", e.target.value); setTouched(p => ({...p, "w-email": true})); }} onBlur={() => handleBlur("w-email")} className={`h-12 font-bold ${errEmail ? "border-red-500 bg-red-50/30" : ""}`} />
            <ErrorMessage msg={errEmail} />
          </div>

          <div className="md:col-span-2 mt-4">
             <h3 className="text-sm font-black text-slate-900 mb-4 border-b pb-2">Witness Residential Address</h3>
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errState ? "text-red-500" : "text-slate-500"}`}>State <span className="text-red-500">*</span></Label>
            <Input id="field-w-state" placeholder="E.g. LAGOS" value={witness.state || ""} onChange={e => { handleWitnessChange("state", e.target.value); setTouched(p => ({...p, "w-state": true})); }} onBlur={() => handleBlur("w-state")} className={`h-12 font-bold ${errState ? "border-red-500 bg-red-50/30" : ""}`} />
            <ErrorMessage msg={errState} />
          </div>
          
          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errLga ? "text-red-500" : "text-slate-500"}`}>LGA <span className="text-red-500">*</span></Label>
            <Input id="field-w-lga" placeholder="Local Government Area" value={witness.lga || ""} onChange={e => { handleWitnessChange("lga", e.target.value); setTouched(p => ({...p, "w-lga": true})); }} onBlur={() => handleBlur("w-lga")} className={`h-12 font-bold ${errLga ? "border-red-500 bg-red-50/30" : ""}`} />
            <ErrorMessage msg={errLga} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className={`text-xs font-bold uppercase ${errStreet ? "text-red-500" : "text-slate-500"}`}>Full Street Address <span className="text-red-500">*</span></Label>
            <Input id="field-w-street" placeholder="E.g. 12 Awolowo Way, Ikeja" value={witness.street || ""} onChange={e => { handleWitnessChange("street", e.target.value); setTouched(p => ({...p, "w-street": true})); }} onBlur={() => handleBlur("w-street")} className={`h-12 font-bold ${errStreet ? "border-red-500 bg-red-50/30" : ""}`} />
            <ErrorMessage msg={errStreet} />
          </div>

        </div>
      </section>
    </div>
  );
}
