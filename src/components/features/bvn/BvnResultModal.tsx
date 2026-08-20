"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { 
  CircleNotch, Check, DownloadSimple, WarningCircle, User, Phone, MapPin, 
  Calendar, IdentificationBadge, Sparkle, ClockCounterClockwise, X 
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { parseDemographics } from "@/lib/demographics-parser";

export interface BvnDemographicData {
  bvn?: string;
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
  photo?: string;
  signature?: string;
  [key: string]: unknown;
}

interface BvnResultModalProps {
  isOpen: boolean;
  status: "loading" | "success" | "error";
  bvn?: string;
  slipLabel?: string;
  pdfBase64?: string;
  pdfUrl?: string;
  userData?: BvnDemographicData;
  fullName?: string;
  photo?: string;
  errorMsg?: string;
  onClose: () => void;
}

export default function BvnResultModal({
  isOpen,
  status,
  bvn,
  slipLabel = "BVN Slip",
  pdfBase64,
  pdfUrl,
  userData,
  fullName: propFullName,
  photo: propPhoto,
  errorMsg,
  onClose,
}: BvnResultModalProps) {
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const triggerPdfDownload = (base64Data?: string, url?: string, bvnNum?: string) => {
    setDownloadStarted(true);
    setTimeout(() => setDownloadStarted(false), 5000);

    if (base64Data) {
      const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, "");
      const linkSource = `data:application/pdf;base64,${cleanBase64}`;
      const downloadLink = document.createElement("a");
      downloadLink.href = linkSource;
      downloadLink.download = `NIBSS_${slipLabel.replace(/\s+/g, "_")}_${bvnNum || "Slip"}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } else if (url) {
      if (url.startsWith("data:application/pdf;base64,")) {
        const downloadLink = document.createElement("a");
        downloadLink.href = url;
        downloadLink.download = `NIBSS_${slipLabel.replace(/\s+/g, "_")}_${bvnNum || "Slip"}.pdf`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } else {
        window.open(url, "_blank");
      }
    }
  };

  // Deeply unwrap and normalize all demographic fields
  const demo = parseDemographics(userData, propFullName);
  const resolvedFullName = demo.fullName || (bvn ? `BVN Account Holder (${bvn.slice(0, 3)}...${bvn.slice(-3)})` : "Verified BVN Account Holder");
  const resolvedDob = demo.dob;
  const resolvedGender = demo.gender;
  const resolvedPhone = demo.phone;
  const resolvedBvn = demo.bvn || bvn;
  const resolvedAddress = demo.address;
  const resolvedPhoto = propPhoto ? (propPhoto.startsWith("data:") ? propPhoto : `data:image/jpeg;base64,${propPhoto}`) : demo.photo;

  return createPortal(
    <div 
      className="fixed inset-0 min-h-screen w-screen z-[99999] flex items-center justify-center p-4 bg-background/80 dark:bg-background/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={status !== "loading" ? onClose : undefined}
    >
      <div 
        className="relative w-full max-w-lg bg-card text-card-foreground border border-border rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 text-center p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* DOWNLOAD STARTED BANNER */}
        {downloadStarted && (
          <div className="bg-emerald-500 text-white text-xs font-black py-2.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 animate-in slide-in-from-top-2 duration-300">
            <Check size={18} weight="bold" />
            <span>Download started! Check your device downloads.</span>
          </div>
        )}

        {/* LOADING STATE */}
        {status === "loading" && (
          <div className="py-8 space-y-5">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <CircleNotch size={64} className="animate-spin text-emerald-600" weight="bold" />
              <Sparkle size={24} className="absolute text-emerald-500 animate-pulse" weight="fill" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-foreground">Querying NIBSS Central Database</h3>
              <p className="text-xs font-medium text-muted-foreground">
                Retrieving verified identity & formatting <span className="font-bold text-foreground">{slipLabel}</span>
              </p>
              {bvn && (
                <p className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full inline-block">
                  BVN: {bvn.slice(0, 3)}*****{bvn.slice(-3)}
                </p>
              )}
            </div>
            <div className="bg-secondary/60 p-3.5 rounded-xl border border-border text-[11px] text-muted-foreground font-semibold">
              Please do not close or refresh this window while we format your official BVN verification slip...
            </div>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === "success" && (
          <div className="space-y-5 animate-in zoom-in-95 duration-300 text-left">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
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

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* APPLICANT DEMOGRAPHIC SUMMARY CARD */}
            <div className="bg-secondary/40 border border-border/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <IdentificationBadge size={16} className="text-emerald-600 dark:text-emerald-400" weight="bold" />
                  Verified NIBSS Record
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                  AUTHENTICATED
                </span>
              </div>

              {/* Citizen Photo & Name Row */}
              <div className="flex items-center gap-4">
                {resolvedPhoto ? (
                  <div className="relative shrink-0">
                    <img
                      src={resolvedPhoto}
                      alt={resolvedFullName}
                      className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded-2xl border-2 border-emerald-500/30 shadow-md bg-secondary"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow">
                      <Check size={12} weight="bold" />
                    </span>
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                    <User size={32} weight="bold" />
                  </div>
                )}

                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Account Holder Full Name
                  </span>
                  <p className="text-base sm:text-lg font-black text-foreground tracking-tight leading-snug break-words">
                    {resolvedFullName}
                  </p>
                  {resolvedBvn && (
                    <p className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg inline-block">
                      BVN: {resolvedBvn}
                    </p>
                  )}
                </div>
              </div>

              {/* Grid with Details */}
              <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-border/40">
                {resolvedDob && (
                  <div className="bg-background/80 p-2.5 rounded-xl border border-border/60">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <Calendar size={12} className="text-emerald-600 dark:text-emerald-400" /> Date of Birth
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
                  <div className="bg-background/80 p-2.5 rounded-xl border border-border/60 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <Phone size={12} className="text-emerald-600 dark:text-emerald-400" /> Phone Number
                    </span>
                    <p className="text-xs font-mono font-bold text-foreground mt-0.5">{resolvedPhone}</p>
                  </div>
                )}

                {resolvedAddress && (
                  <div className="bg-background/80 p-2.5 rounded-xl border border-border/60 col-span-2">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <MapPin size={12} className="text-emerald-600 dark:text-emerald-400" /> Residential Address
                    </span>
                    <p className="text-xs font-medium text-foreground mt-0.5 leading-relaxed">{resolvedAddress}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 72-HOUR DATA RETENTION NOTICE */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-start gap-2.5">
              <ClockCounterClockwise size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" weight="bold" />
              <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 leading-tight">
                72-Hour Print Window: You can view these details and re-download this slip anytime from your history for the next 72 hours.
              </p>
            </div>

            {/* ENLARGED PROMINENT ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={() => triggerPdfDownload(pdfBase64, pdfUrl, bvn)}
                className="flex-1 h-13 sm:h-14 font-black text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl cursor-pointer shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <DownloadSimple size={22} weight="bold" />
                <span>Download Official PDF Slip</span>
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="h-13 sm:h-14 px-6 font-bold text-sm bg-secondary/70 border-border text-foreground hover:bg-secondary rounded-2xl cursor-pointer"
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
    </div>,
    document.body
  );
}
