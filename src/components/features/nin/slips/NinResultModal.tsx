"use client";

import { useEffect } from "react";
import { CircleNotch, Check, Trash, DownloadSimple, WarningCircle, User, Phone, MapPin, Calendar, IdentificationBadge, Sparkle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export interface DemographicData {
  nin?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  gender?: string;
  date_of_birth?: string;
  dob?: string;
  phone_number?: string;
  phone?: string;
  address?: string;
  fullName?: string;
  [key: string]: unknown;
}

interface NinResultModalProps {
  isOpen: boolean;
  status: "loading" | "success" | "error";
  identifier?: string;
  searchType?: "NIN" | "PHONE";
  slipLabel?: string;
  pdfBase64?: string;
  pdfUrl?: string;
  userData?: DemographicData;
  fullName?: string;
  errorMsg?: string;
  onClose: () => void;
}

export default function NinResultModal({
  isOpen,
  status,
  identifier,
  searchType = "NIN",
  slipLabel,
  pdfBase64,
  pdfUrl,
  userData,
  fullName: propFullName,
  errorMsg,
  onClose,
}: NinResultModalProps) {
  if (!isOpen) return null;

  const triggerPdfDownload = (base64Data?: string, url?: string, idNum?: string) => {
    if (base64Data) {
      const linkSource = `data:application/pdf;base64,${base64Data}`;
      const downloadLink = document.createElement("a");
      downloadLink.href = linkSource;
      downloadLink.download = `NIMC_${slipLabel?.replace(/\s+/g, "_") || "Slip"}_${idNum || "Download"}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } else if (url) {
      window.open(url, "_blank");
    }
  };

  // Extract demographic fields nicely
  const resolvedFullName =
    propFullName ||
    [
      userData?.first_name || (userData as any)?.firstname || (userData as any)?.firstName || (userData as any)?.given_name,
      userData?.middle_name || (userData as any)?.middlename || (userData as any)?.middleName,
      userData?.last_name || (userData as any)?.surname || (userData as any)?.lastname || (userData as any)?.lastName || (userData as any)?.family_name,
    ].filter(Boolean).join(" ") ||
    (userData?.fullName as string) ||
    (userData as any)?.fullname ||
    (userData as any)?.name ||
    (userData as any)?.applicant_name ||
    "Verified Citizen (Enclosed in Official Slip)";

  const resolvedDob = userData?.date_of_birth || userData?.dob || (userData as any)?.birthdate || (userData as any)?.birth_date;
  const resolvedGender = userData?.gender || (userData as any)?.sex;
  const resolvedPhone = userData?.phone_number || userData?.phone || (userData as any)?.telephoneno || (userData as any)?.mobile;
  const resolvedNin = userData?.nin || (userData as any)?.vnin || (searchType === "NIN" ? identifier : undefined);
  const resolvedAddress = userData?.address || (userData as any)?.residence_address || (userData as any)?.residential_address;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-card border border-border rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center relative space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* LOADING STATE */}
        {status === "loading" && (
          <div className="py-8 space-y-5">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <CircleNotch size={64} className="animate-spin text-[#ff3f7a]" weight="bold" />
              <Sparkle size={24} className="absolute text-[#ff3f7a] animate-pulse" weight="fill" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-foreground">Querying NIMC National Database</h3>
              <p className="text-xs font-medium text-muted-foreground">
                Retrieving verified identity & formatting <span className="font-bold text-foreground">{slipLabel || "Slip"}</span>
              </p>
              <p className="text-xs font-mono font-bold text-[#ff3f7a] bg-[#ff3f7a]/10 px-3 py-1 rounded-full inline-block">
                {searchType === "PHONE" ? "Phone" : "NIN"}: {identifier}
              </p>
            </div>
            <div className="bg-secondary/60 p-3.5 rounded-xl border border-border text-[11px] text-muted-foreground font-semibold">
              Please do not close or refresh this window while we format your official slip...
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === "success" && (
          <div className="space-y-5 animate-in zoom-in-95 duration-300 text-left">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="h-12 w-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20 shrink-0">
                <Check size={26} weight="bold" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">Verification Successful!</h3>
                <p className="text-xs text-muted-foreground">
                  Official <span className="font-bold text-foreground">{slipLabel}</span> generated.
                </p>
              </div>
            </div>

            {/* APPLICANT DEMOGRAPHIC SUMMARY CARD */}
            <div className="bg-secondary/40 border border-border/80 rounded-2xl p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <IdentificationBadge size={16} className="text-[#ff3f7a]" weight="bold" />
                  Verified NIMC Record
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                  AUTHENTICATED
                </span>
              </div>

              {/* Full Name */}
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Applicant Full Name</span>
                <p className="text-base font-black text-foreground tracking-tight">{resolvedFullName}</p>
              </div>

              {/* Grid with Details */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {resolvedNin && (
                  <div className="bg-background/80 p-2.5 rounded-xl border border-border/60">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <User size={12} className="text-[#ff3f7a]" /> National ID (NIN)
                    </span>
                    <p className="text-xs font-mono font-bold text-foreground mt-0.5">{resolvedNin}</p>
                  </div>
                )}

                {resolvedDob && (
                  <div className="bg-background/80 p-2.5 rounded-xl border border-border/60">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <Calendar size={12} className="text-[#ff3f7a]" /> Date of Birth
                    </span>
                    <p className="text-xs font-bold text-foreground mt-0.5">{resolvedDob}</p>
                  </div>
                )}

                {resolvedGender && (
                  <div className="bg-background/80 p-2.5 rounded-xl border border-border/60">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Gender</span>
                    <p className="text-xs font-bold text-foreground mt-0.5 uppercase">{resolvedGender}</p>
                  </div>
                )}

                {resolvedPhone && (
                  <div className="bg-background/80 p-2.5 rounded-xl border border-border/60">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <Phone size={12} className="text-[#ff3f7a]" /> Phone Number
                    </span>
                    <p className="text-xs font-mono font-bold text-foreground mt-0.5">{resolvedPhone}</p>
                  </div>
                )}
              </div>

              {resolvedAddress && (
                <div className="bg-background/80 p-2.5 rounded-xl border border-border/60">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <MapPin size={12} className="text-[#ff3f7a]" /> Residential Address
                  </span>
                  <p className="text-xs font-medium text-foreground mt-0.5 leading-relaxed">{resolvedAddress}</p>
                </div>
              )}
            </div>

            {/* 24-HOUR DATA RETENTION NOTICE */}
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-start gap-2.5">
              <Trash size={16} className="text-amber-500 shrink-0 mt-0.5" weight="fill" />
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 leading-tight">
                24-Hour Print Window: You can view these details and re-download this slip anytime from your history for the next 24 hours.
              </p>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                onClick={() => triggerPdfDownload(pdfBase64, pdfUrl, identifier)}
                className="flex-1 h-12 font-black bg-[#ff3f7a] text-white hover:bg-[#e02b62] rounded-xl cursor-pointer shadow-lg shadow-[#ff3f7a]/20"
              >
                <DownloadSimple size={18} className="mr-2" weight="bold" /> Download Official PDF
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="h-12 px-5 font-bold bg-secondary/60 border-border text-foreground hover:bg-secondary rounded-xl cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {status === "error" && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto border border-destructive/20">
              <WarningCircle size={34} weight="bold" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-foreground">Generation Unsuccessful</h3>
              <p className="text-xs text-muted-foreground leading-relaxed px-2">{errorMsg || "Unable to retrieve slip from the identity provider."}</p>
            </div>

            <Button
              onClick={onClose}
              className="w-full h-12 font-black bg-secondary text-foreground hover:bg-secondary/80 rounded-xl cursor-pointer border border-border"
            >
              Dismiss & Try Again
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
