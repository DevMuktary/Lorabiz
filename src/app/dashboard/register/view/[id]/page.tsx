"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ArrowLeft, Clock, CheckCircle, WarningCircle, 
  Buildings, Users, FileText, Spinner, MapPin, EnvelopeSimple, X, Phone
} from "@phosphor-icons/react";

export default function ViewApplicationPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // State for the Image Lightbox (to view uploaded documents)
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchDetails = async () => {
      try {
        const res = await fetch(`/api/register/details/${id}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Failed to load application details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Spinner className="animate-spin h-12 w-12 text-[#ff3f7a] mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Loading application data...</p>
      </div>
    );
  }

  if (!data) return null;

  // Dynamic Status Badge Styling
  const getStatusUI = (status: string) => {
    switch (status) {
      case "PENDING":
        return { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: Clock, text: "Awaiting Processing" };
      case "APPROVED":
        return { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle, text: "Approved" };
      case "QUERIED":
        return { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: WarningCircle, text: "Action Required (Queried)" };
      default:
        return { color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", icon: FileText, text: status };
    }
  };

  const StatusUI = getStatusUI(data.status);
  const StatusIcon = StatusUI.icon;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      
      {/* STICKY TOP NAVIGATION */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button 
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors w-fit px-3 py-2 rounded-lg hover:bg-slate-100 -ml-3"
          >
            <ArrowLeft weight="bold" className="h-5 w-5" />
            Back to Dashboard
          </button>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${StatusUI.bg} ${StatusUI.border} ${StatusUI.color} w-fit`}>
            <StatusIcon weight="fill" className="h-5 w-5" />
            <span className="text-sm font-black tracking-wide uppercase">{StatusUI.text}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER SECTION */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Buildings weight="fill" className="h-40 w-40 text-slate-900" />
          </div>
          
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Proposed Entity Name</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">{data.proposedName}</h1>
          
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold text-slate-700 border border-slate-200">
              {data.entityType}
            </span>
            <span className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold text-slate-700 border border-slate-200">
              {data.ownershipType === "SOLE" ? "Sole Proprietorship" : "Partnership"}
            </span>
            <span className="px-4 py-2 bg-[#ff3f7a]/10 rounded-lg text-sm font-bold text-[#ff3f7a] border border-[#ff3f7a]/20">
              Nature: {data.specificNature}
            </span>
          </div>
        </div>

        {/* COMPANY INFORMATION SECTION */}
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
          <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex items-center gap-3">
            <Buildings weight="fill" className="h-6 w-6 text-slate-400" />
            <h2 className="text-lg font-black text-slate-900">Registered Office Details</h2>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Company Email</p>
                <div className="flex items-center gap-2 text-slate-900 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <EnvelopeSimple className="text-slate-400 h-5 w-5" />
                  {data.companyEmail || "N/A"}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Commencement Date</p>
                <div className="text-slate-900 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {data.commencementDate ? new Date(data.commencementDate).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A"}
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Full Service Address</p>
              <div className="flex gap-3 text-slate-900 font-medium bg-slate-50 p-4 rounded-xl border border-slate-100 h-[116px]">
                <MapPin className="text-slate-400 h-5 w-5 shrink-0 mt-0.5" />
                <span>
                  {data.companyStreetNo && `No. ${data.companyStreetNo}, `}
                  {data.companyAddress}<br />
                  {data.companyCity}, {data.companyState} State.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PROPRIETORS SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Users weight="fill" className="h-6 w-6 text-slate-400" />
            <h2 className="text-xl font-black text-slate-900">Proprietors / Partners</h2>
          </div>

          {data.proprietors?.map((p: any, index: number) => (
            <div key={p.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-500 uppercase tracking-widest text-xs">Proprietor 0{index + 1}</span>
                <span className="font-bold text-slate-900">{p.gender}</span>
              </div>
              
              <div className="p-8">
                {/* Personal Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Full Name</p>
                    <p className="font-bold text-slate-900">{p.surname}, {p.firstName} {p.otherName || ""}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Date of Birth</p>
                    <p className="font-bold text-slate-900">{new Date(p.dob).toLocaleDateString('en-NG')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Phone</p>
                    <p className="font-bold text-slate-900 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" /> {p.phoneCode} {p.phone}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Email</p>
                    <p className="font-bold text-slate-900 truncate" title={p.email}>{p.email}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Residential Address</p>
                  <p className="font-medium text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {p.streetNo && `No. ${p.streetNo}, `} {p.serviceAddress}, {p.city}, {p.lga} LGA, {p.state} State.
                  </p>
                </div>

                {/* Documents Grid */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-3 border-b border-slate-100 pb-2">Uploaded Documents</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    
                    {/* Passport */}
                    <div 
                      onClick={() => p.passportUrl && setPreviewImage(p.passportUrl)}
                      className={`relative aspect-square rounded-xl border-2 overflow-hidden group cursor-pointer ${p.passportUrl ? 'border-slate-200 hover:border-[#ff3f7a]' : 'border-dashed border-slate-200 bg-slate-50 flex items-center justify-center'}`}
                    >
                      {p.passportUrl ? (
                        <>
                          <Image src={p.passportUrl} alt="Passport" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">View</span>
                          </div>
                        </>
                      ) : (
                         <span className="text-xs font-bold text-slate-400">No Passport</span>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-[10px] font-bold text-white uppercase">Passport Photo</p>
                      </div>
                    </div>

                    {/* Signature */}
                    <div 
                      onClick={() => p.signatureUrl && setPreviewImage(p.signatureUrl)}
                      className={`relative aspect-square rounded-xl border-2 overflow-hidden group cursor-pointer ${p.signatureUrl ? 'border-slate-200 hover:border-[#ff3f7a]' : 'border-dashed border-slate-200 bg-slate-50 flex items-center justify-center'}`}
                    >
                      {p.signatureUrl ? (
                        <>
                          <Image src={p.signatureUrl} alt="Signature" fill className="object-contain bg-white p-4" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">View</span>
                          </div>
                        </>
                      ) : (
                         <span className="text-xs font-bold text-slate-400">No Signature</span>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-[10px] font-bold text-white uppercase">Signature</p>
                      </div>
                    </div>

                    {/* NIN */}
                    <div 
                      onClick={() => p.ninUrl && setPreviewImage(p.ninUrl)}
                      className={`relative aspect-[4/3] sm:aspect-square sm:col-span-1 col-span-2 rounded-xl border-2 overflow-hidden group cursor-pointer ${p.ninUrl ? 'border-slate-200 hover:border-[#ff3f7a]' : 'border-dashed border-slate-200 bg-slate-50 flex items-center justify-center'}`}
                    >
                      {p.ninUrl ? (
                        <>
                          <Image src={p.ninUrl} alt="NIN Document" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">View Full</span>
                          </div>
                        </>
                      ) : (
                         <span className="text-xs font-bold text-slate-400">No ID Uploaded</span>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-[10px] font-bold text-white uppercase">Gov. ID (NIN)</p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM BACK BUTTON */}
        <div className="pt-8 flex justify-center">
          <button 
            onClick={() => router.push("/dashboard")}
            className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2"
          >
            <ArrowLeft weight="bold" /> Return to Dashboard
          </button>
        </div>

      </div>

      {/* LIGHTBOX MODAL FOR DOCUMENTS */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] flex items-center justify-center">
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-6 w-6" weight="bold" />
            </button>
            <img 
              src={previewImage} 
              alt="Document Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
            />
          </div>
        </div>
      )}

    </div>
  );
}
