"use client";

import React, { useState } from "react";
import { 
  Buildings, 
  UploadSimple, 
  Trash, 
  Stamp, 
  ArrowRight,
  Info,
  CalendarBlank,
  MapPin,
  EnvelopeSimple,
  Phone,
  TextAa
} from "@phosphor-icons/react";
import { BoardResolutionFormData } from "@/lib/board-resolution-generator";
import { uploadFileWithProgress, validateStep1 } from "./schema";

interface CompanyStepProps {
  formData: BoardResolutionFormData;
  setFormData: React.Dispatch<React.SetStateAction<BoardResolutionFormData>>;
  onContinue: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function CompanyStep({
  formData,
  setFormData,
  onContinue,
  showToast
}: CompanyStepProps) {
  // Logo upload progress state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadPercent, setLogoUploadPercent] = useState<number | null>(null);

  // Seal upload progress state
  const [uploadingSeal, setUploadingSeal] = useState(false);
  const [sealUploadPercent, setSealUploadPercent] = useState<number | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Company logo must be under 5MB.", "error");
      return;
    }

    setUploadingLogo(true);
    setLogoUploadPercent(0);

    try {
      const result = await uploadFileWithProgress(file, (percent) => {
        setLogoUploadPercent(percent);
      });

      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, logoUrl: result.url }));
        showToast("Company logo uploaded successfully!", "success");
      } else {
        showToast(result.error || "Failed to upload company logo.", "error");
      }
    } catch {
      showToast("An unexpected error occurred during logo upload.", "error");
    } finally {
      setUploadingLogo(false);
      setLogoUploadPercent(null);
    }
  };

  const handleSealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Company seal/stamp image must be under 5MB.", "error");
      return;
    }

    setUploadingSeal(true);
    setSealUploadPercent(0);

    try {
      const result = await uploadFileWithProgress(file, (percent) => {
        setSealUploadPercent(percent);
      });

      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, sealUrl: result.url }));
        showToast("Official seal uploaded successfully!", "success");
      } else {
        showToast(result.error || "Failed to upload seal/stamp.", "error");
      }
    } catch {
      showToast("An unexpected error occurred during seal upload.", "error");
    } finally {
      setUploadingSeal(false);
      setSealUploadPercent(null);
    }
  };

  const handleNext = () => {
    const check = validateStep1(formData);
    if (!check.isValid) {
      showToast(check.error || "Please fill all required company fields.", "error");
      return;
    }
    onContinue();
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Step Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Buildings className="h-5 w-5" weight="bold" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Company & Entity Details</h2>
          <p className="text-xs text-muted-foreground">
            Provide registered corporate identity details for legal CAMA 2020 verification.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
        {/* Company Name */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-bold text-foreground">
            Registered Company / Business Name <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="e.g. PRIME HORIZON VENTURES LIMITED or ALPHA SOLUTIONS ENT"
            className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* RC / BN / IT Number */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-bold text-foreground">
            CAC Registration Number (RC / BN / IT) <span className="text-muted-foreground font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.rcNumber || ""}
            onChange={(e) => setFormData({ ...formData, rcNumber: e.target.value })}
            placeholder="e.g. RC 1928374 or BN 2847291"
            className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground uppercase"
          />
        </div>

        {/* Meeting / Resolution Date */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <CalendarBlank className="h-3.5 w-3.5 text-primary" />
            <span>Resolution / Meeting Date <span className="text-primary">*</span></span>
          </label>
          <input
            type="date"
            value={formData.meetingDate}
            onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
            className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary text-foreground"
          />
        </div>

        {/* Registered Address */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>Registered Principal Business Address <span className="text-primary">*</span></span>
          </label>
          <input
            type="text"
            value={formData.registeredAddress}
            onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
            placeholder="e.g. Plot 14B, Adeola Odeku Street, Victoria Island, Lagos State, Nigeria"
            className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Company Email */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <EnvelopeSimple className="h-3.5 w-3.5 text-primary" />
            <span>Official Email Address <span className="text-muted-foreground font-normal">(Optional)</span></span>
          </label>
          <input
            type="email"
            value={formData.companyEmail || ""}
            onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
            placeholder="e.g. legal@company.com"
            className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Company Phone */}
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-primary" />
            <span>Official Phone Number <span className="text-muted-foreground font-normal">(Optional)</span></span>
          </label>
          <input
            type="tel"
            value={formData.companyPhone || ""}
            onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
            placeholder="e.g. +234 802 345 6789"
            className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Meeting Venue */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-bold text-foreground">
            Meeting Venue / Jurisdiction <span className="text-muted-foreground font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={formData.meetingVenue || ""}
            onChange={(e) => setFormData({ ...formData, meetingVenue: e.target.value })}
            placeholder="e.g. The Boardroom, Registered Office, Victoria Island, Lagos or Virtual Meeting via Zoom"
            className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Corporate Motto / Slogan */}
        <div className="space-y-1.5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <TextAa className="h-3.5 w-3.5 text-primary" />
              <span>Corporate Motto / Tagline <span className="text-muted-foreground font-normal">(Optional)</span></span>
            </label>
            <span className="text-[10px] text-muted-foreground font-medium">Rendered on letterhead footer banner if provided</span>
          </div>
          <input
            type="text"
            value={formData.corporateMotto || ""}
            onChange={(e) => setFormData({ ...formData, corporateMotto: e.target.value })}
            placeholder="e.g. Innovating for Africa's Digital Economy (leave blank if none)"
            className="w-full h-11 px-4 rounded-xl bg-secondary/50 border border-border text-sm font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Logo & Seal Uploads */}
        <div className="sm:col-span-2 pt-2 border-t border-border space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Logo Upload Card */}
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground block">Company Logo</span>
                  <span className="text-[10px] text-muted-foreground">PNG / JPG up to 5MB</span>
                </div>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logoUrl: undefined })}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                    title="Remove Logo"
                  >
                    <Trash className="h-4 w-4" weight="bold" />
                  </button>
                )}
              </div>

              {formData.logoUrl ? (
                <div className="flex items-center gap-3 p-2 bg-background rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={formData.logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded-lg border border-border/40" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">Logo Active</p>
                    <p className="text-[10px] text-emerald-500 font-bold">Appears on letterhead</p>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-colors group">
                  <UploadSimple className="h-6 w-6 text-muted-foreground group-hover:text-primary mb-1 transition-colors" />
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                  </span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="hidden"
                  />
                </label>
              )}

              {/* Progress bar */}
              {uploadingLogo && logoUploadPercent !== null && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-200"
                      style={{ width: `${logoUploadPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground block text-right font-mono">
                    {logoUploadPercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Seal / Stamp Upload Card */}
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Stamp className="h-4 w-4 text-primary" weight="bold" />
                  <div>
                    <span className="text-xs font-bold text-foreground block">Company Seal / Stamp</span>
                    <span className="text-[10px] text-muted-foreground">Optional (No placeholder if none)</span>
                  </div>
                </div>
                {formData.sealUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, sealUrl: undefined })}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                    title="Remove Seal"
                  >
                    <Trash className="h-4 w-4" weight="bold" />
                  </button>
                )}
              </div>

              {formData.sealUrl ? (
                <div className="flex items-center gap-3 p-2 bg-background rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={formData.sealUrl} alt="Seal" className="h-12 w-12 object-contain rounded-full border border-border/40" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">Seal Active</p>
                    <p className="text-[10px] text-emerald-500 font-bold">Appears on signature docket</p>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-colors group">
                  <UploadSimple className="h-6 w-6 text-muted-foreground group-hover:text-primary mb-1 transition-colors" />
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {uploadingSeal ? "Uploading..." : "Upload Official Seal"}
                  </span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleSealUpload}
                    disabled={uploadingSeal}
                    className="hidden"
                  />
                </label>
              )}

              {/* Progress bar */}
              {uploadingSeal && sealUploadPercent !== null && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-200"
                      style={{ width: `${sealUploadPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground block text-right font-mono">
                    {sealUploadPercent}%
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Step 1 Bottom Navigation Bar */}
      <div className="flex items-center justify-end pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
        >
          <span>Continue to Purpose & Design</span>
          <ArrowRight className="h-4 w-4" weight="bold" />
        </button>
      </div>
    </div>
  );
}
