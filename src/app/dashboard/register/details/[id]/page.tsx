"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner, CheckCircle, MapPin, IdentificationBadge } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegistrationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [draftData, setDraftData] = useState<any>(null);

  // You will fetch the draft from your database to ensure they own it
  useEffect(() => {
    // Simulated fetch for now - we will build the GET API next
    setTimeout(() => {
      setDraftData({
        proposedName: "QUADROX FOODS",
        entityType: "sole",
        category: "AGRICULTURE",
      });
      setLoading(false);
    }, 1000);
  }, [draftId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner className="animate-spin h-10 w-10 text-[#ff3f7a] mb-4" />
        <p className="font-semibold text-slate-500">Loading your approved name...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 antialiased">
      
      {/* HEADER SECTION */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold mb-4 border border-emerald-200">
          <CheckCircle weight="fill" className="h-4 w-4" />
          Name Reserved & Verified
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {draftData?.proposedName}
        </h1>
        <p className="text-slate-500 mt-2 text-[15px] font-medium">
          Step 2: Complete your statutory business address and proprietor details for final submission to CAC.
        </p>
      </div>

      <div className="space-y-6">
        {/* WE WILL BUILD THE FORMS HERE IN THE NEXT STEP */}
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm">
           <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
             <MapPin weight="fill" className="text-[#ff3f7a]" />
             Principal Place of Business
           </h2>
           <p className="text-sm text-slate-500 mt-1 mb-6">Where will this business be primarily located?</p>
           {/* Form fields will go here */}
           <div className="h-32 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 font-semibold text-sm">
              Address form fields incoming...
           </div>
        </div>

        <Button className="w-full h-14 text-lg font-bold bg-[#ff3f7a] hover:bg-[#e02b62] text-white shadow-xl shadow-[#ff3f7a]/25 rounded-xl">
          Save & Proceed to Payment
        </Button>
      </div>

    </div>
  );
}
