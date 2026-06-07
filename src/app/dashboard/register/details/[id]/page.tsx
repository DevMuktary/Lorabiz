"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Buildings, Users, FileImage, CheckCircle, UploadSimple, 
  Trash, Pencil, ArrowRight, ArrowLeft, Spinner, WarningCircle
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NIGERIA_DATA } from "@/lib/nigeria-data"; // Assuming you abstract the state/LGA array here to save space

// --- TYPES ---
type CompanyInfo = {
  email: string;
  state: string;
  city: string;
  streetNo: string;
  address: string;
  commencementDate: string;
};

type Proprietor = {
  id: string;
  surname: string;
  firstName: string;
  otherName: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  state: string;
  lga: string;
  city: string;
  streetNo: string;
  serviceAddress: string;
  documents: {
    nin: string | null;
    passport: string | null;
    signature: string | null;
  };
};

export default function RegistrationDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  // --- WIZARD STATE ---
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- DRAFT DATA (Fetched from DB) ---
  const [draft, setDraft] = useState({
    proposedName: "LOADING...",
    entityType: "Sole Proprietorship",
    specificNature: "LOADING..."
  });

  // --- STEP 1: COMPANY INFO STATE ---
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    email: "", state: "", city: "", streetNo: "", address: "", commencementDate: ""
  });

  // --- STEP 2: PROPRIETOR STATE ---
  const [proprietors, setProprietors] = useState<Proprietor[]>([]);
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  
  // Active Proprietor Form
  const [propForm, setPropForm] = useState<Proprietor>({
    id: "", surname: "", firstName: "", otherName: "", email: "", phone: "", 
    gender: "", dob: "", state: "", lga: "", city: "", streetNo: "", serviceAddress: "",
    documents: { nin: null, passport: null, signature: null }
  });

  // --- STEP 3: DOCUMENTS STATE ---
  const [selectedDocProprietor, setSelectedDocProprietor] = useState<string>("");
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // MOCK FETCH DRAFT DATA
  useEffect(() => {
    // In reality, fetch `/api/register/draft/${id}` here.
    setTimeout(() => {
      setDraft({
        proposedName: "AYINLA SUCCESS ART AND SIGN VENTURE",
        entityType: "Sole Proprietorship",
        specificNature: "General merchandise/procurement"
      });
      setLoading(false);
    }, 800);
  }, [id]);

  // --- HANDLERS: PROPRIETORS ---
  const handleSaveProprietor = () => {
    if (!propForm.surname || !propForm.firstName || !propForm.phone || !propForm.state) {
      alert("Please fill all required proprietor fields.");
      return;
    }

    if (editingPropId) {
      setProprietors(prev => prev.map(p => p.id === editingPropId ? { ...propForm } : p));
      setEditingPropId(null);
    } else {
      setProprietors(prev => [...prev, { ...propForm, id: Date.now().toString() }]);
    }
    
    // Reset Form
    setPropForm({
      id: "", surname: "", firstName: "", otherName: "", email: "", phone: "", 
      gender: "", dob: "", state: "", lga: "", city: "", streetNo: "", serviceAddress: "",
      documents: { nin: null, passport: null, signature: null }
    });
  };

  const handleEditProprietor = (prop: Proprietor) => {
    setPropForm(prop);
    setEditingPropId(prop.id);
  };

  const handleRemoveProprietor = (id: string) => {
    setProprietors(prev => prev.filter(p => p.id !== id));
  };

  // --- HANDLERS: FILE UPLOADS (Secure Cloud Setup) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: "nin" | "passport" | "signature") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation Rules
    if (file.size > 4 * 1024 * 1024) {
      alert("File size exceeds 4MB limit.");
      return;
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      alert("Only JPEG and PNG formats are allowed.");
      return;
    }

    setUploadingDoc(docType);

    try {
      // TODO: Replace this timeout with actual Cloudinary API fetch
      /*
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "your_hidden_preset");
      const res = await fetch("https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload", { method: "POST", body: formData });
      const data = await res.json();
      const secureUrl = data.secure_url;
      */
      
      // Simulating network upload delay
      await new Promise(res => setTimeout(res, 1500));
      const secureUrl = `https://mock-cloud-storage.com/${file.name}`; // Fake URL for UI

      // Update the specific proprietor's document state
      setProprietors(prev => prev.map(p => {
        if (p.id === selectedDocProprietor) {
          return { ...p, documents: { ...p.documents, [docType]: secureUrl } };
        }
        return p;
      }));
    } catch (error) {
      alert("Upload failed. Please try again.");
    } finally {
      setUploadingDoc(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="animate-spin h-10 w-10 text-[#ff3f7a]" /></div>;
  }

  const isSoleProprietor = draft.entityType === "Sole Proprietorship";
  const hideProprietorForm = isSoleProprietor && proprietors.length >= 1 && !editingPropId;

  return (
    <div className="max-w-4xl mx-auto pb-16 pt-8 px-4 font-sans selection:bg-[#ff3f7a] selection:text-white">
      
      {/* WIZARD NAVIGATION HEADER */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10 rounded-full"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#ff3f7a] -z-10 rounded-full transition-all duration-500" style={{ width: `${((currentStep - 1) / 3) * 100}%` }}></div>
          
          {[
            { step: 1, title: "Company", icon: Buildings },
            { step: 2, title: "Proprietors", icon: Users },
            { step: 3, title: "Documents", icon: FileImage },
            { step: 4, title: "Preview", icon: CheckCircle },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center gap-2">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg border-4 transition-colors duration-300 ${
                currentStep >= s.step ? "bg-[#ff3f7a] border-white text-white shadow-md" : "bg-white border-slate-100 text-slate-400"
              }`}>
                <s.icon className="h-6 w-6" weight={currentStep >= s.step ? "fill" : "bold"} />
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${currentStep >= s.step ? "text-slate-900" : "text-slate-400"}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* ========================================== */}
        {/* STEP 1: COMPANY INFORMATION                */}
        {/* ========================================== */}
        {currentStep === 1 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Company Information</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-500">Business Name (Not Editable)</Label>
                  <div className="h-12 flex items-center px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 uppercase">
                    {draft.proposedName}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-500">Nature of Business (Not Editable)</Label>
                  <div className="h-12 flex items-center px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900">
                    {draft.specificNature}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Company Email</Label>
                  <Input 
                    type="email" 
                    value={companyInfo.email} 
                    onChange={e => setCompanyInfo({...companyInfo, email: e.target.value})} 
                    placeholder="contact@company.com" 
                    className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-[#ff3f7a]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Commencement Date</Label>
                  <Input 
                    type="date" 
                    value={companyInfo.commencementDate} 
                    onChange={e => setCompanyInfo({...companyInfo, commencementDate: e.target.value})} 
                    className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-[#ff3f7a]" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Company State of Residence</Label>
                  <select 
                    value={companyInfo.state} 
                    onChange={e => setCompanyInfo({...companyInfo, state: e.target.value})}
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium focus-visible:ring-[#ff3f7a]"
                  >
                    <option value="">-- Select State --</option>
                    {NIGERIA_DATA.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Company City</Label>
                  <Input value={companyInfo.city} onChange={e => setCompanyInfo({...companyInfo, city: e.target.value})} className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-[#ff3f7a]" />
                </div>
                <div className="space-y-2">
                  <Label>Company Street Number</Label>
                  <Input value={companyInfo.streetNo} onChange={e => setCompanyInfo({...companyInfo, streetNo: e.target.value})} className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-[#ff3f7a]" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Company Street Address</Label>
                <Input value={companyInfo.address} onChange={e => setCompanyInfo({...companyInfo, address: e.target.value})} className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-[#ff3f7a]" />
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 2: PROPRIETOR INFORMATION             */}
        {/* ========================================== */}
        {currentStep === 2 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h2 className="text-2xl font-black text-slate-900">Proprietor Information</h2>
            </div>
            
            {isSoleProprietor && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl mb-6 flex gap-3 text-sm font-medium">
                <WarningCircle className="h-5 w-5 shrink-0" weight="fill" />
                As a Sole Proprietorship, this business can only have one (1) proprietor affiliated with it.
              </div>
            )}

            {/* PROPRIETORS TABLE */}
            {proprietors.length > 0 && (
              <div className="mb-8 border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">State</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {proprietors.map(prop => (
                      <tr key={prop.id} className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-900">{prop.surname} {prop.firstName}</td>
                        <td className="p-4 text-slate-600">{prop.phone}</td>
                        <td className="p-4 text-slate-600">{prop.state}</td>
                        <td className="p-4 flex justify-end gap-2">
                          <button onClick={() => handleEditProprietor(prop)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"><Pencil className="h-4 w-4" weight="bold" /></button>
                          <button onClick={() => handleRemoveProprietor(prop.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"><Trash className="h-4 w-4" weight="bold" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ADD/EDIT PROPRIETOR FORM */}
            {!hideProprietorForm && (
              <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-6 space-y-6">
                <h3 className="font-bold text-slate-900 border-b pb-2">{editingPropId ? "Edit Proprietor" : "Add New Proprietor"}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2"><Label>Surname</Label><Input value={propForm.surname} onChange={e => setPropForm({...propForm, surname: e.target.value})} className="h-12" /></div>
                  <div className="space-y-2"><Label>First Name</Label><Input value={propForm.firstName} onChange={e => setPropForm({...propForm, firstName: e.target.value})} className="h-12" /></div>
                  <div className="space-y-2"><Label>Other Name (Optional)</Label><Input value={propForm.otherName} onChange={e => setPropForm({...propForm, otherName: e.target.value})} className="h-12" /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={propForm.email} onChange={e => setPropForm({...propForm, email: e.target.value})} className="h-12" /></div>
                  <div className="space-y-2"><Label>Phone Number</Label><Input type="tel" placeholder="+234..." value={propForm.phone} onChange={e => setPropForm({...propForm, phone: e.target.value})} className="h-12" /></div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <select value={propForm.gender} onChange={e => setPropForm({...propForm, gender: e.target.value})} className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm">
                      <option value="">-- Select --</option>
                      <option value="MALE">MALE</option>
                      <option value="FEMALE">FEMALE</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label>State</Label>
                    <select value={propForm.state} onChange={e => setPropForm({...propForm, state: e.target.value})} className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm">
                      <option value="">-- Select --</option>
                      {NIGERIA_DATA.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2"><Label>LGA</Label><Input value={propForm.lga} onChange={e => setPropForm({...propForm, lga: e.target.value})} className="h-12" /></div>
                  <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={propForm.dob} onChange={e => setPropForm({...propForm, dob: e.target.value})} className="h-12" /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr] gap-5">
                  <div className="space-y-2"><Label>City</Label><Input value={propForm.city} onChange={e => setPropForm({...propForm, city: e.target.value})} className="h-12" /></div>
                  <div className="space-y-2"><Label>Street No.</Label><Input value={propForm.streetNo} onChange={e => setPropForm({...propForm, streetNo: e.target.value})} className="h-12" /></div>
                  <div className="space-y-2"><Label>Service Address</Label><Input value={propForm.serviceAddress} onChange={e => setPropForm({...propForm, serviceAddress: e.target.value})} className="h-12" /></div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveProprietor} type="button" className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 px-8 rounded-xl">
                    {editingPropId ? "Update Proprietor" : "Add Proprietor"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 3: DOCUMENT UPLOADS                   */}
        {/* ========================================== */}
        {currentStep === 3 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-2 border-b pb-4">Document Uploads</h2>
            <p className="text-slate-500 mb-6 text-sm">Documents must be in JPEG or PNG format and should not exceed 4MB.</p>
            
            <div className="space-y-8">
              <div className="space-y-2 max-w-md">
                <Label className="font-bold text-slate-900 text-base">Select Proprietor to Upload Documents For:</Label>
                <select 
                  value={selectedDocProprietor} 
                  onChange={e => setSelectedDocProprietor(e.target.value)}
                  className="flex h-14 w-full rounded-xl border-2 border-[#ff3f7a]/30 bg-[#ff3f7a]/5 px-4 text-base font-bold text-slate-900 focus-visible:outline-none focus-visible:border-[#ff3f7a]"
                >
                  <option value="" disabled>-- Select Proprietor --</option>
                  {proprietors.map(p => (
                    <option key={p.id} value={p.id}>{p.surname} {p.firstName}</option>
                  ))}
                </select>
              </div>

              {selectedDocProprietor && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                  {[
                    { id: "nin", label: "NIN Card/Slip" },
                    { id: "passport", label: "Passport Photograph" },
                    { id: "signature", label: "Signature" }
                  ].map((doc) => {
                    const prop = proprietors.find(p => p.id === selectedDocProprietor);
                    // @ts-ignore - indexing documents securely
                    const hasDoc = prop?.documents[doc.id];
                    const isUploading = uploadingDoc === doc.id;

                    return (
                      <div key={doc.id} className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors h-48">
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-3 text-[#ff3f7a]">
                            <Spinner className="animate-spin h-8 w-8" weight="bold" />
                            <span className="font-bold text-sm">Uploading securely...</span>
                          </div>
                        ) : hasDoc ? (
                          <div className="flex flex-col items-center gap-3 text-emerald-600">
                            <CheckCircle className="h-10 w-10" weight="fill" />
                            <span className="font-bold text-sm">Uploaded Successfully</span>
                            <button onClick={() => {
                               // Quick delete logic
                               setProprietors(prev => prev.map(p => p.id === selectedDocProprietor ? { ...p, documents: { ...p.documents, [doc.id]: null } } : p));
                            }} className="text-xs text-red-500 font-bold mt-2 hover:underline z-10">Remove</button>
                          </div>
                        ) : (
                          <>
                            <UploadSimple className="h-10 w-10 text-slate-400 mb-3" weight="bold" />
                            <Label htmlFor={`upload-${doc.id}`} className="font-bold text-slate-700 cursor-pointer hover:text-[#ff3f7a]">
                              Upload {doc.label}
                            </Label>
                            <input 
                              id={`upload-${doc.id}`} 
                              type="file" 
                              accept="image/jpeg, image/png" 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => handleFileUpload(e, doc.id as "nin" | "passport" | "signature")}
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* STEP 4: PREVIEW                            */}
        {/* ========================================== */}
        {currentStep === 4 && (
          <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Preview & Submit</h2>
            
            <div className="space-y-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-lg text-slate-800 uppercase tracking-widest">Company Details</h3>
                  <button onClick={() => setCurrentStep(1)} className="text-[#ff3f7a] font-bold text-sm flex items-center gap-1 hover:underline"><Pencil className="h-4 w-4"/> Edit</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-slate-400 font-medium">Business Name</p><p className="font-bold text-slate-900">{draft.proposedName}</p></div>
                  <div><p className="text-slate-400 font-medium">Email</p><p className="font-bold text-slate-900">{companyInfo.email || "-"}</p></div>
                  <div><p className="text-slate-400 font-medium">State</p><p className="font-bold text-slate-900">{companyInfo.state || "-"}</p></div>
                  <div><p className="text-slate-400 font-medium">Date</p><p className="font-bold text-slate-900">{companyInfo.commencementDate || "-"}</p></div>
                </div>
              </div>

              <div className="border-t border-slate-200"></div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-lg text-slate-800 uppercase tracking-widest">Proprietors ({proprietors.length})</h3>
                  <button onClick={() => setCurrentStep(2)} className="text-[#ff3f7a] font-bold text-sm flex items-center gap-1 hover:underline"><Pencil className="h-4 w-4"/> Edit</button>
                </div>
                {proprietors.map((p, idx) => (
                  <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 mb-3 shadow-sm">
                    <p className="font-black text-slate-900 mb-2">{idx + 1}. {p.surname} {p.firstName} {p.otherName}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><p className="text-slate-400 font-medium">Phone</p><p className="font-bold text-slate-700">{p.phone}</p></div>
                      <div><p className="text-slate-400 font-medium">Gender</p><p className="font-bold text-slate-700">{p.gender}</p></div>
                      <div><p className="text-slate-400 font-medium">State</p><p className="font-bold text-slate-700">{p.state}</p></div>
                      <div>
                        <p className="text-slate-400 font-medium">Docs Attached</p>
                        <div className="flex gap-1 mt-1">
                          <span className={`h-3 w-3 rounded-full ${p.documents.nin ? 'bg-emerald-500' : 'bg-red-200'}`} title="NIN"></span>
                          <span className={`h-3 w-3 rounded-full ${p.documents.passport ? 'bg-emerald-500' : 'bg-red-200'}`} title="Passport"></span>
                          <span className={`h-3 w-3 rounded-full ${p.documents.signature ? 'bg-emerald-500' : 'bg-red-200'}`} title="Signature"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* --- GLOBAL BOTTOM NAVIGATION --- */}
        <div className="bg-slate-50 border-t border-slate-200 p-6 flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 1 || isSubmitting}
            className="h-12 px-6 font-bold text-slate-600 rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" weight="bold" /> Back
          </Button>

          {currentStep < 4 ? (
             <Button 
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="h-12 px-8 bg-[#ff3f7a] hover:bg-[#e02b62] text-white font-bold rounded-xl shadow-lg shadow-[#ff3f7a]/30"
             >
               Next Step <ArrowRight className="ml-2 h-4 w-4" weight="bold" />
             </Button>
          ) : (
             <Button 
              onClick={() => setIsSubmitting(true)}
              disabled={isSubmitting}
              className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
             >
               {isSubmitting ? <Spinner className="animate-spin h-6 w-6" weight="bold" /> : "Submit to CAC"}
             </Button>
          )}
        </div>

      </div>
    </div>
  );
}
