"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CaretLeft, CaretDown, CaretUp, Plus, Trash, ArrowRight, UserCircle, CheckCircle } from "@phosphor-icons/react";
import { FileUpload } from "@/components/FileUpload";

// ==========================================
// ZOD SCHEMA VALIDATION
// ==========================================
const proprietorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(11, "Valid phone required"),
  gender: z.enum(["MALE", "FEMALE", ""]),
  dob: z.string().min(1, "Date of birth is required"),
  address: z.string().min(5, "Full address is required"),
  state: z.string().min(1, "State is required"),
  nin: z.string().length(11, "NIN must be exactly 11 digits"),
  passportUrl: z.string().min(1, "Passport photograph is required"),
  signatureUrl: z.string().min(1, "Signature is required"),
  idCardUrl: z.string().min(1, "Valid ID is required"),
});

const formSchema = z.object({
  proprietors: z.array(proprietorSchema).min(1),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProprietorDetailsPage() {
  const params = useParams();
  const router = useRouter();
  
  const [draft, setDraft] = useState<any>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize React Hook Form
  const { register, control, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      proprietors: [
        { firstName: "", lastName: "", email: "", phone: "", gender: "", dob: "", address: "", state: "", nin: "", passportUrl: "", signatureUrl: "", idCardUrl: "" }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    name: "proprietors",
    control,
  });

  // Watch fields to dynamically update accordion headers
  const watchProprietors = watch("proprietors");

  useEffect(() => {
    // Simulated API Call: Fetch the Draft based on the [id]
    const fetchDraft = async () => {
      try {
        // const res = await fetch(`/api/register/draft/${params.id}`);
        // const data = await res.json();
        
        // MOCK DATA for demonstration (Replace with actual fetch)
        const mockDraft = { id: params.id, proposedName: "PEAK PERFORMANCE LOGISTICS", ownershipType: "PARTNERSHIP" };
        setDraft(mockDraft);

        // If it's a partnership, initialize with 2 forms minimum
        if (mockDraft.ownershipType === "PARTNERSHIP" && fields.length < 2) {
          append({ firstName: "", lastName: "", email: "", phone: "", gender: "", dob: "", address: "", state: "", nin: "", passportUrl: "", signatureUrl: "", idCardUrl: "" });
        }
      } catch (error) {
        console.error("Failed to load draft");
      } finally {
        setIsLoadingDraft(false);
      }
    };
    fetchDraft();
  }, [params.id]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // POST the data to your submission API
      // await fetch(`/api/register/submit/${params.id}`, { method: "POST", body: JSON.stringify(data) });
      console.log("FINAL SECURE PAYLOAD TO DB:", data);
      
      // Send them to step 4 (Payment/Summary)
      setTimeout(() => {
        alert("Form saved securely! Moving to payment...");
        setIsSubmitting(false);
      }, 1500);

    } catch (error) {
      alert("Failed to save details.");
      setIsSubmitting(false);
    }
  };

  if (isLoadingDraft) {
    return <div className="h-screen w-full flex items-center justify-center font-bold text-slate-500">Loading secure form...</div>;
  }

  const isPartnership = draft?.ownershipType === "PARTNERSHIP";

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-8 pt-2 flex items-center gap-4">
        <Link href="/dashboard/register/business-name" className="p-2 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm transition-colors">
          <CaretLeft className="h-5 w-5" weight="bold" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Proprietor Details</h1>
          <p className="text-sm font-medium text-slate-500">Step 3 of 4</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full mb-8 overflow-hidden">
        <div className="bg-[#ff3f7a] h-full rounded-full transition-all duration-500 ease-out" style={{ width: `75%` }}></div>
      </div>

      {/* Context Badge */}
      <div className="bg-slate-900 rounded-2xl p-4 mb-8 flex items-center justify-between shadow-lg">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Registering For</p>
          <h2 className="text-white font-bold">{draft?.proposedName}</h2>
        </div>
        <div className="bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          <p className="text-xs font-bold text-[#ff3f7a]">{isPartnership ? "Partnership" : "Sole Proprietor"}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {fields.map((field, index) => {
          const isExpanded = expandedIndex === index;
          const partnerName = watchProprietors[index]?.firstName ? `${watchProprietors[index].firstName} ${watchProprietors[index].lastName}` : `Partner ${index + 1} Details`;
          
          // Check if this specific partner's form has all required images (green checkmark logic)
          const isComplete = watchProprietors[index]?.passportUrl && watchProprietors[index]?.signatureUrl && watchProprietors[index]?.idCardUrl && watchProprietors[index]?.firstName;

          return (
            <div key={field.id} className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden shadow-sm ${isExpanded ? "border-[#ff3f7a] ring-4 ring-[#ff3f7a]/5" : "border-slate-200 hover:border-slate-300"}`}>
              
              {/* ACCORDION HEADER */}
              <div 
                onClick={() => setExpandedIndex(isExpanded ? -1 : index)}
                className="p-6 flex items-center justify-between cursor-pointer bg-white"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${isComplete ? "bg-emerald-50 text-emerald-500" : isExpanded ? "bg-[#ff3f7a]/10 text-[#ff3f7a]" : "bg-slate-50 text-slate-400"}`}>
                    {isComplete ? <CheckCircle className="h-6 w-6" weight="fill" /> : <UserCircle className="h-6 w-6" weight="fill" />}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg">{isPartnership ? partnerName : "Your Information"}</h3>
                    <p className="text-xs font-medium text-slate-500">Provide personal and ID details required by CAC.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {isPartnership && fields.length > 2 && index >= 2 && !isExpanded && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); remove(index); }} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors">
                      <Trash className="h-5 w-5" weight="bold" />
                    </button>
                  )}
                  {isExpanded ? <CaretUp className="h-5 w-5 text-slate-400" weight="bold" /> : <CaretDown className="h-5 w-5 text-slate-400" weight="bold" />}
                </div>
              </div>

              {/* ACCORDION BODY (THE FORM) */}
              {isExpanded && (
                <div className="p-6 pt-0 border-t border-slate-100 bg-slate-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                    
                    {/* Basic Info */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">First Name</label>
                      <input {...register(`proprietors.${index}.firstName`)} className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-[#ff3f7a] outline-none" />
                      {errors.proprietors?.[index]?.firstName && <span className="text-xs text-red-500 font-bold">{errors.proprietors[index]?.firstName?.message}</span>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Last Name</label>
                      <input {...register(`proprietors.${index}.lastName`)} className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-[#ff3f7a] outline-none" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email Address</label>
                      <input type="email" {...register(`proprietors.${index}.email`)} className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-[#ff3f7a] outline-none" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Phone Number</label>
                      <input type="tel" {...register(`proprietors.${index}.phone`)} className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-[#ff3f7a] outline-none" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Gender</label>
                      <select {...register(`proprietors.${index}.gender`)} className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-[#ff3f7a] outline-none bg-white">
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Date of Birth</label>
                      <input type="date" {...register(`proprietors.${index}.dob`)} className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-[#ff3f7a] outline-none bg-white" />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Residential Address</label>
                      <input type="text" {...register(`proprietors.${index}.address`)} className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-[#ff3f7a] outline-none" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">State of Residence</label>
                      <input type="text" {...register(`proprietors.${index}.state`)} className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-[#ff3f7a] outline-none" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">NIN</label>
                      <input type="text" maxLength={11} {...register(`proprietors.${index}.nin`)} className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-[#ff3f7a] outline-none" />
                      {errors.proprietors?.[index]?.nin && <span className="text-xs text-red-500 font-bold">{errors.proprietors[index]?.nin?.message}</span>}
                    </div>

                    {/* THE ASYNC DOCUMENT UPLOADS */}
                    <div className="sm:col-span-2 pt-6 pb-2 border-t border-slate-200">
                      <h4 className="font-black text-slate-900">Required Documents</h4>
                      <p className="text-xs font-medium text-slate-500">Please upload clear, legible images (JPG or PNG).</p>
                    </div>

                    <FileUpload 
                      label="Passport Photograph" 
                      description="Clear face on white background"
                      value={watchProprietors[index]?.passportUrl || ""}
                      onChange={(url) => setValue(`proprietors.${index}.passportUrl`, url, { shouldValidate: true })}
                    />

                    <FileUpload 
                      label="Signature" 
                      description="Signed on plain white paper"
                      value={watchProprietors[index]?.signatureUrl || ""}
                      onChange={(url) => setValue(`proprietors.${index}.signatureUrl`, url, { shouldValidate: true })}
                    />

                    <div className="sm:col-span-2">
                      <FileUpload 
                        label="Government ID Card" 
                        type="document"
                        description="NIN Slip, Voters Card, or Intl Passport"
                        value={watchProprietors[index]?.idCardUrl || ""}
                        onChange={(url) => setValue(`proprietors.${index}.idCardUrl`, url, { shouldValidate: true })}
                      />
                    </div>
                    
                    {/* Error block for documents */}
                    {(errors.proprietors?.[index]?.passportUrl || errors.proprietors?.[index]?.signatureUrl || errors.proprietors?.[index]?.idCardUrl) && (
                      <div className="sm:col-span-2 p-3 bg-red-50 rounded-xl text-xs font-bold text-red-600 border border-red-100">
                        Please ensure Passport, Signature, and ID Card are uploaded.
                      </div>
                    )}
                  </div>

                  {/* Move to next partner button (if partnership) */}
                  {isPartnership && index < fields.length - 1 && (
                    <button type="button" onClick={(e) => { e.preventDefault(); setExpandedIndex(index + 1); }} className="w-full h-12 mt-6 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-transform active:scale-95">
                      Save & Next Partner
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Dynamic Add Partner Button */}
        {isPartnership && (
          <button 
            type="button" 
            onClick={() => {
              append({ firstName: "", lastName: "", email: "", phone: "", gender: "", dob: "", address: "", state: "", nin: "", passportUrl: "", signatureUrl: "", idCardUrl: "" });
              setExpandedIndex(fields.length); // Open the newly added partner
            }}
            className="w-full h-14 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-2 text-slate-500 font-bold hover:border-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Plus className="h-5 w-5" weight="bold" /> Add Another Partner
          </button>
        )}

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full h-14 mt-8 bg-[#ff3f7a] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#ff3f7a]/20 hover:bg-[#e02b62] transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          {isSubmitting ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>Secure Details & Proceed <ArrowRight className="h-5 w-5" weight="bold" /></>
          )}
        </button>

      </form>
    </div>
  );
}
