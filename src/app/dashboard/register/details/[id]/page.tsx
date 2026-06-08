"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Buildings, Users, FileImage, CheckCircle, 
  Trash, Pencil, ArrowRight, ArrowLeft, CircleNotch, 
  WarningCircle, Plus, X, FloppyDisk, Check, Warning
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/FileUpload";

// --- NIGERIA DATA (Truncated for brevity, keep your full array here) ---
const NIGERIA_DATA = [
  { state: "Lagos", lgas: ["Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry", "Epe", "Eti Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere"] },
  { state: "Kaduna", lgas: ["Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a", "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura", "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga", "Soba", "Zangon Kataf", "Zaria"] },
  { state: "Oyo", lgas: ["Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East", "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central", "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa", "Kajola", "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa", "Olorunsogo", "Oluyole", "Ona Ara", "Orelope", "Ori Ire", "Oyo East", "Oyo West", "Saki East", "Saki West", "Surulere"] },
  // ... INCLUDE YOUR FULL NIGERIA_DATA ARRAY HERE
];

// --- TYPES & UTILS ---
type CompanyInfo = { email: string; state: string; city: string; streetNo: string; address: string; commencementDate: string; };
type DocumentTypes = { nin: string | null; passport: string | null; signature: string | null; };
type Proprietor = { id: string; surname: string; firstName: string; otherName: string; email: string; phone: string; gender: string; dob: string; state: string; lga: string; city: string; streetNo: string; serviceAddress: string; documents: DocumentTypes; };

const calculateAge = (dob: string) => {
  if (!dob) return 0;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function RegistrationDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  // --- STATE ---
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  
  // Custom Toast State
  const [toast, setToast] = useState<{show: boolean, msg: string, type: "error" | "success"}>({ show: false, msg: "", type: "success" });

  const [draft, setDraft] = useState({ proposedName: "LOADING...", ownershipType: "SOLE", specificNature: "LOADING..." });
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({ email: "", state: "", city: "", streetNo: "", address: "", commencementDate: "" });
  const [proprietors, setProprietors] = useState<Proprietor[]>([]);
  
  // Side Panel State
  const [isPropPanelOpen, setIsPropPanelOpen] = useState(false);
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  const defaultPropForm: Proprietor = { id: "", surname: "", firstName: "", otherName: "", email: "", phone: "", gender: "", dob: "", state: "", lga: "", city: "", streetNo: "", serviceAddress: "", documents: { nin: null, passport: null, signature: null } };
  const [propForm, setPropForm] = useState<Proprietor>(defaultPropForm);

  const availableLgas = NIGERIA_DATA.find(s => s.state === propForm.state)?.lgas || [];
  const isSoleProprietor = draft.ownershipType === "SOLE";

  const showToast = (msg: string, type: "error" | "success" = "error") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 4000);
  };

  // --- AUTO-SAVE ENGINE ---
  const saveDraftToDB = useCallback(async (silent = true) => {
    if (!id) return;
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/register/details/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyInfo, proprietors, isDraft: true })
      });
      if (res.ok) setSaveStatus("saved");
      else setSaveStatus("error");
    } catch (err) {
      setSaveStatus("error");
    }
  }, [id, companyInfo, proprietors]);

  // Trigger auto-save 2 seconds after user stops typing
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => saveDraftToDB(), 2000);
    return () => clearTimeout(timer);
  }, [companyInfo, proprietors, saveDraftToDB, loading]);


  // --- INITIAL FETCH ---
  useEffect(() => {
    if (!id) return;
    const fetchDraft = async () => {
      try {
        const res = await fetch(`/api/register/details/${id}`);
        const json = await res.json();
        if (json.success) {
          setDraft(json.data);
          setCompanyInfo({
            email: json.data.companyEmail || "", state: json.data.companyState || "", city: json.data.companyCity || "", 
            streetNo: json.data.companyStreetNo || "", address: json.data.companyAddress || "", commencementDate: json.data.commencementDate || ""
          });
          if (json.data.proprietors?.length > 0) {
            setProprietors(json.data.proprietors.map((p: any) => ({
              ...p, documents: { nin: p.ninUrl || null, passport: p.passportUrl || null, signature: p.signatureUrl || null }
            })));
          }
        }
      } catch (err) {
        showToast("Failed to load data.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchDraft();
  }, [id]);


  // --- PROPRIETOR MANAGEMENT ---
  const openProprietorPanel = (prop?: Proprietor) => {
    if (prop) { setPropForm(prop); setEditingPropId(prop.id); } 
    else { setPropForm(defaultPropForm); setEditingPropId(null); }
    setIsPropPanelOpen(true);
  };

  const closeProprietorPanel = () => { setIsPropPanelOpen(false); setPropForm(defaultPropForm); };

  const handleSaveProprietor = () => {
    // 1. Validation
    if (!propForm.surname || !propForm.firstName || !propForm.phone || !propForm.state || !propForm.gender || !propForm.dob || !propForm.serviceAddress) {
      showToast("Please fill all compulsory fields marked with (*).", "error"); return;
    }
    if (propForm.email && !isValidEmail(propForm.email)) {
      showToast("Please enter a valid email address.", "error"); return;
    }
    if (propForm.phone.length < 10) {
      showToast("Please enter a valid phone number.", "error"); return;
    }

    // 2. Age Rule Verification
    const age = calculateAge(propForm.dob);
    if (age < 18) {
      // Check if there are already 2 adults. Exclude the current one if editing.
      const otherAdults = proprietors.filter(p => p.id !== editingPropId && calculateAge(p.dob) >= 18);
      if (otherAdults.length < 2) {
        showToast("A proprietor cannot be under 18 unless there are at least 2 other adult proprietors registered.", "error");
        return;
      }
    }

    // 3. Save
    if (editingPropId) {
      setProprietors(prev => prev.map(p => p.id === editingPropId ? { ...propForm } : p));
    } else {
      setProprietors(prev => [...prev, { ...propForm, id: Date.now().toString() }]);
    }
    closeProprietorPanel();
    showToast("Proprietor saved locally.", "success");
  };


  // --- STEP PROGRESSION ---
  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!companyInfo.state || !companyInfo.address) { showToast("Company State and Address are compulsory.", "error"); return; }
      if (companyInfo.email && !isValidEmail(companyInfo.email)) { showToast("Invalid company email.", "error"); return; }
    }
    if (currentStep === 2) {
      if (isSoleProprietor && proprietors.length !== 1) { showToast("Sole Proprietorship requires exactly 1 proprietor.", "error"); return; }
      if (!isSoleProprietor && proprietors.length < 2) { showToast("Partnerships require at least 2 proprietors.", "error"); return; }
    }
    if (currentStep === 3) {
      const missingDocs = proprietors.some(p => !p.documents.nin || !p.documents.passport || !p.documents.signature);
      if (missingDocs) { showToast("Please upload all documents (NIN, Passport, Signature) for EVERY proprietor.", "error"); return; }
    }
    setCurrentStep(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/register/details/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // isDraft: false enforces strict backend validation
        body: JSON.stringify({ companyInfo, proprietors, isDraft: false }) 
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard?success=true");
      } else {
        showToast(data.message || "Failed to submit.", "error");
        setIsSubmitting(false);
      }
    } catch (error) {
      showToast("Network error. Please check your connection.", "error");
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><CircleNotch className="animate-spin h-10 w-10 text-[#ff3f7a]" /></div>;

  return (
    <div className="max-w-4xl mx-auto pb-16 pt-8 px-4 font-sans relative">
      
      {/* CUSTOM TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 animate-in slide-in-from-right flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl text-white font-bold ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
          {toast.type === "error" ? <WarningCircle size={24} weight="fill" /> : <CheckCircle size={24} weight="fill" />}
          {toast.msg}
        </div>
      )}

      {/* HEADER & AUTO-SAVE STATUS */}
      <div className="flex justify-between items-end mb-10">
        <div className="flex-1">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#ff3f7a] -z-10 rounded-full transition-all duration-500" style={{ width: `${((currentStep - 1) / 3) * 100}%` }}></div>
            {[ { step: 1, title: "Company", icon: Buildings }, { step: 2, title: "Proprietors", icon: Users }, { step: 3, title: "Documents", icon: FileImage }, { step: 4, title: "Preview", icon: CheckCircle }].map((s) => (
              <div key={s.step} className="flex flex-col items-center gap-2">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg border-4 transition-colors duration-300 ${currentStep >= s.step ? "bg-[#ff3f7a] border-white text-white shadow-md" : "bg-white border-slate-100 text-slate-400"}`}>
                  <s.icon className="h-6 w-6" weight={currentStep >= s.step ? "fill" : "bold"} />
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider hidden sm:block ${currentStep >= s.step ? "text-slate-900" : "text-slate-400"}`}>{s.title}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
          {saveStatus === "saving" && <><CircleNotch className="animate-spin" /> Saving draft...</>}
          {saveStatus === "saved" && <><CheckCircle className="text-emerald-500" /> Saved</>}
          {saveStatus === "error" && <><WarningCircle className="text-red-500" /> Save failed</>}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
        
        {/* ========================================== STEP 1 ========================================== */}
        {currentStep === 1 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Company Details</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label>Business Name <span className="text-red-500">*</span></Label><div className="h-12 flex items-center px-4 bg-slate-100 border border-slate-200 rounded-xl font-bold uppercase text-slate-700 opacity-70 cursor-not-allowed">{draft.proposedName}</div></div>
                <div className="space-y-2"><Label>Nature of Business <span className="text-red-500">*</span></Label><div className="h-12 flex items-center px-4 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 opacity-70 cursor-not-allowed">{draft.specificNature}</div></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label>Company Email</Label><Input type="email" placeholder="contact@company.com" value={companyInfo.email} onChange={e => setCompanyInfo({...companyInfo, email: e.target.value})} className="h-12 bg-slate-50 border-slate-200" /></div>
                <div className="space-y-2"><Label>Commencement Date</Label><Input type="date" value={companyInfo.commencementDate} onChange={e => setCompanyInfo({...companyInfo, commencementDate: e.target.value})} className="h-12 bg-slate-50 border-slate-200" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>State of Residence <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <select value={companyInfo.state} onChange={e => setCompanyInfo({...companyInfo, state: e.target.value})} className="appearance-none flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-medium text-slate-700 focus:border-[#ff3f7a] focus:ring-1 focus:ring-[#ff3f7a] outline-none transition-all">
                      <option value="">Select State</option>
                      {NIGERIA_DATA.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2"><Label>City</Label><Input placeholder="e.g. Ikeja" value={companyInfo.city} onChange={e => setCompanyInfo({...companyInfo, city: e.target.value})} className="h-12 bg-slate-50 border-slate-200" /></div>
                <div className="space-y-2"><Label>Street Number</Label><Input placeholder="e.g. 14B" value={companyInfo.streetNo} onChange={e => setCompanyInfo({...companyInfo, streetNo: e.target.value})} className="h-12 bg-slate-50 border-slate-200" /></div>
              </div>
              <div className="space-y-2">
                <Label>Full Street Address <span className="text-red-500">*</span></Label>
                <Input placeholder="E.g. 12 Awolowo Way, Ikeja" value={companyInfo.address} onChange={e => setCompanyInfo({...companyInfo, address: e.target.value})} className="h-12 bg-slate-50 border-slate-200" />
              </div>
            </div>
          </div>
        )}

        {/* ========================================== STEP 2 ========================================== */}
        {currentStep === 2 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Proprietors</h2>
              <Button onClick={() => openProprietorPanel()} className="bg-slate-900 text-white rounded-xl hover:bg-slate-800">
                <Plus weight="bold" className="mr-2" /> Add Proprietor
              </Button>
            </div>
            
            {proprietors.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" weight="fill"/>
                <p className="text-slate-500 font-medium">No proprietors added yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {proprietors.map((prop, idx) => (
                  <div key={prop.id} className="group relative bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-[#ff3f7a]/50 hover:shadow-md transition-all flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 text-lg">{idx + 1}</div>
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{prop.surname} {prop.firstName}</h3>
                        <p className="text-sm text-slate-500 font-medium">{prop.phone} • {prop.state} State • Age: {calculateAge(prop.dob)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => openProprietorPanel(prop)} className="h-10 w-10 rounded-xl text-slate-600 hover:text-blue-600"><Pencil weight="fill" /></Button>
                      <Button variant="outline" size="icon" onClick={() => setProprietors(prev => prev.filter(p => p.id !== prop.id))} className="h-10 w-10 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 border-transparent hover:border-red-200"><Trash weight="fill" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================== STEP 3 ========================================== */}
        {currentStep === 3 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
             <h2 className="text-2xl font-black text-slate-900 mb-2 border-b pb-4">Document Uploads</h2>
             <p className="text-slate-500 mb-8 font-medium">Please upload valid IDs and signatures for each proprietor individually.</p>

             <div className="space-y-10">
               {proprietors.map((p, idx) => (
                 <div key={p.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-[#ff3f7a] text-white h-8 w-8 rounded-full flex items-center justify-center font-bold">{idx + 1}</div>
                      <h3 className="font-black text-xl text-slate-800">{p.surname} {p.firstName}'s Documents</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FileUpload 
                        label="NIN Card/Slip"
                        value={p.documents.nin}
                        onUploadSuccess={(url) => setProprietors(prev => prev.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, nin: url } } : pr))}
                        onRemove={() => setProprietors(prev => prev.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, nin: null } } : pr))}
                      />
                      <FileUpload 
                        label="Passport Photograph"
                        value={p.documents.passport}
                        onUploadSuccess={(url) => setProprietors(prev => prev.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, passport: url } } : pr))}
                        onRemove={() => setProprietors(prev => prev.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, passport: null } } : pr))}
                      />
                      <FileUpload 
                        label="Signature"
                        description="Signed on plain white paper"
                        value={p.documents.signature}
                        onUploadSuccess={(url) => setProprietors(prev => prev.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, signature: url } } : pr))}
                        onRemove={() => setProprietors(prev => prev.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, signature: null } } : pr))}
                      />
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* ========================================== STEP 4 ========================================== */}
        {currentStep === 4 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Final Review</h2>
            {/* Same preview logic as before, just styled better. Keep it clean. */}
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="font-black text-slate-800 uppercase mb-4 flex justify-between">Company Details <Button variant="link" onClick={()=>setCurrentStep(1)} className="text-[#ff3f7a]">Edit</Button></h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500">Name:</span> <span className="font-bold">{draft.proposedName}</span></div>
                  <div><span className="text-slate-500">Nature:</span> <span className="font-bold">{draft.specificNature}</span></div>
                  <div><span className="text-slate-500">Address:</span> <span className="font-bold">{companyInfo.address}, {companyInfo.state}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- GLOBAL BOTTOM NAVIGATION --- */}
        <div className="bg-white border-t border-slate-200 p-6 flex justify-between items-center">
          <Button variant="outline" onClick={() => setCurrentStep(p => p - 1)} disabled={currentStep === 1 || isSubmitting} className="h-12 px-6 rounded-xl font-bold">
            <ArrowLeft className="mr-2" weight="bold" /> Back
          </Button>

          {currentStep < 4 ? (
             <Button onClick={handleNextStep} className="h-12 px-8 bg-[#ff3f7a] hover:bg-[#e02b62] text-white font-bold rounded-xl shadow-md">
               Continue <ArrowRight className="ml-2" weight="bold" />
             </Button>
          ) : (
             <Button onClick={handleFinalSubmit} disabled={isSubmitting} className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-xl shadow-lg">
               {isSubmitting ? <><CircleNotch className="animate-spin h-6 w-6 mr-2" weight="bold" /> Submitting...</> : "Submit Application"}
             </Button>
          )}
        </div>
      </div>

      {/* ========================================== SLIDE-OUT PANEL (SHEET) ========================================== */}
      {isPropPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeProprietorPanel}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-lg text-slate-900">{editingPropId ? "Edit Proprietor" : "New Proprietor"}</h3>
              <Button variant="ghost" size="icon" onClick={closeProprietorPanel} className="rounded-full hover:bg-slate-200"><X weight="bold"/></Button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Surname <span className="text-red-500">*</span></Label><Input value={propForm.surname} onChange={e=>setPropForm({...propForm, surname: e.target.value})} className="h-11"/></div>
                <div className="space-y-1"><Label>First Name <span className="text-red-500">*</span></Label><Input value={propForm.firstName} onChange={e=>setPropForm({...propForm, firstName: e.target.value})} className="h-11"/></div>
              </div>
              <div className="space-y-1"><Label>Other Name</Label><Input value={propForm.otherName} onChange={e=>setPropForm({...propForm, otherName: e.target.value})} className="h-11"/></div>
              
              <div className="space-y-1">
                <Label>Phone Number <span className="text-red-500">*</span></Label>
                <div className="flex">
                  <div className="flex items-center justify-center px-3 bg-slate-100 border border-slate-200 border-r-0 rounded-l-xl text-sm font-bold text-slate-600">🇳🇬 +234</div>
                  <Input type="tel" value={propForm.phone} onChange={e=>setPropForm({...propForm, phone: e.target.value})} className="h-11 rounded-l-none focus-visible:ring-[#ff3f7a]"/>
                </div>
              </div>

              <div className="space-y-1"><Label>Email</Label><Input type="email" value={propForm.email} onChange={e=>setPropForm({...propForm, email: e.target.value})} className="h-11"/></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Gender <span className="text-red-500">*</span></Label>
                  <select value={propForm.gender} onChange={e=>setPropForm({...propForm, gender: e.target.value})} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-[#ff3f7a] focus:ring-1 focus:ring-[#ff3f7a] outline-none">
                    <option value="">Select</option><option value="MALE">MALE</option><option value="FEMALE">FEMALE</option>
                  </select>
                </div>
                <div className="space-y-1"><Label>Date of Birth <span className="text-red-500">*</span></Label><Input type="date" value={propForm.dob} onChange={e=>setPropForm({...propForm, dob: e.target.value})} className="h-11"/></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>State <span className="text-red-500">*</span></Label>
                  <select value={propForm.state} onChange={e=>setPropForm({...propForm, state: e.target.value, lga: ""})} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-[#ff3f7a] focus:ring-1 outline-none">
                    <option value="">Select</option>{NIGERIA_DATA.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>LGA <span className="text-red-500">*</span></Label>
                  <select value={propForm.lga} onChange={e=>setPropForm({...propForm, lga: e.target.value})} disabled={!propForm.state} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-[#ff3f7a] focus:ring-1 disabled:opacity-50 outline-none">
                    <option value="">Select</option>{availableLgas.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>City</Label><Input value={propForm.city} onChange={e=>setPropForm({...propForm, city: e.target.value})} className="h-11"/></div>
                <div className="space-y-1"><Label>Street No.</Label><Input value={propForm.streetNo} onChange={e=>setPropForm({...propForm, streetNo: e.target.value})} className="h-11"/></div>
              </div>
              <div className="space-y-1"><Label>Service Address <span className="text-red-500">*</span></Label><Input value={propForm.serviceAddress} onChange={e=>setPropForm({...propForm, serviceAddress: e.target.value})} className="h-11"/></div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white">
              <Button onClick={handleSaveProprietor} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md">
                <FloppyDisk weight="fill" className="mr-2 h-5 w-5"/> Save Proprietor
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
