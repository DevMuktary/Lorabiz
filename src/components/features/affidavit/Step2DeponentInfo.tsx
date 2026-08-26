"use client";

import { useEffect } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { FileUpload } from "@/components/FileUpload";
import { NIGERIA_STATES_LGA } from "@/lib/nigeria-states";
import { SignaturePad } from "./SignaturePad";
import { DeponentInfo } from "./types";

interface Step2DeponentInfoProps {
  deponent: DeponentInfo;
  onChange: (updated: Partial<DeponentInfo>) => void;
  onBack: () => void;
  onNext: () => void;
}

export function Step2DeponentInfo({
  deponent,
  onChange,
  onBack,
  onNext,
}: Step2DeponentInfoProps) {
  // Real-time Age Calculation
  useEffect(() => {
    if (!deponent.dob) {
      onChange({ calculatedAge: null });
      return;
    }
    const birthDate = new Date(deponent.dob);
    if (isNaN(birthDate.getTime())) {
      onChange({ calculatedAge: null });
      return;
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    onChange({ calculatedAge: age });
  }, [deponent.dob]);

  // Set default LGA when state changes
  useEffect(() => {
    const lgas = NIGERIA_STATES_LGA[deponent.stateOfResidence] || [];
    if (lgas.length > 0 && (!deponent.lgaOfResidence || !lgas.includes(deponent.lgaOfResidence))) {
      onChange({ lgaOfResidence: lgas[0] });
    }
  }, [deponent.stateOfResidence, deponent.lgaOfResidence]);

  return (
    <div className="space-y-6 animate-in fade-in bg-card border border-border p-5 sm:p-7 rounded-3xl shadow-xs">
      <div className="border-b border-border pb-3">
        <h2 className="text-base font-black text-foreground">
          Deponent Information (Person Swearing Oath)
        </h2>
        <p className="text-xs text-muted-foreground">
          These personal details will appear officially on the preamble of the Court Affidavit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Deponent Full Legal Name (First, Middle, Surname) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={deponent.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            placeholder="e.g. Ibrahim Chukwuma Adeleke"
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
          />
        </div>

        {/* Passport Photo Upload */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Deponent Passport Photograph (Plain Background)
          </label>
          <FileUpload
            label="Upload Passport Photo"
            description="Clear portrait photograph for official court seal"
            value={deponent.passportUrl}
            accept="image/jpeg, image/png"
            aspectRatio={1}
            onUploadSuccess={(url) => onChange({ passportUrl: url })}
            onRemove={() => onChange({ passportUrl: null })}
          />
        </div>

        {/* Gender */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Gender <span className="text-rose-500">*</span>
          </label>
          <select
            value={deponent.gender}
            onChange={(e) => onChange({ gender: e.target.value as "MALE" | "FEMALE" })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>

        {/* Date of Birth & Auto Age Calculation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground">
              Date of Birth <span className="text-rose-500">*</span>
            </label>
            {deponent.calculatedAge !== null && (
              <span
                className={`text-[10px] font-black px-2 py-0.2 rounded-md ${
                  deponent.calculatedAge >= 18
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                }`}
              >
                {deponent.calculatedAge} Years ({deponent.calculatedAge >= 18 ? "Adult Verified" : "Minor"})
              </span>
            )}
          </div>
          <input
            type="date"
            value={deponent.dob}
            onChange={(e) => onChange({ dob: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
          />
        </div>

        {/* Religion */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Religion (Court Oath Formula) <span className="text-rose-500">*</span>
          </label>
          <select
            value={deponent.religion}
            onChange={(e) => onChange({ religion: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
          >
            <option value="Christianity">Christianity (Holy Bible)</option>
            <option value="Islam">Islam (Holy Quran)</option>
            <option value="Others">Affirmation (Non-Religious)</option>
          </select>
        </div>

        {/* Nationality */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">Nationality</label>
          <input
            type="text"
            value={deponent.nationality}
            onChange={(e) => onChange({ nationality: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
          />
        </div>

        {/* State of Residence */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            State of Residence <span className="text-rose-500">*</span>
          </label>
          <select
            value={deponent.stateOfResidence}
            onChange={(e) => onChange({ stateOfResidence: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
          >
            {Object.keys(NIGERIA_STATES_LGA).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* LGA of Residence */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            LGA of Residence <span className="text-rose-500">*</span>
          </label>
          <select
            value={deponent.lgaOfResidence}
            onChange={(e) => onChange({ lgaOfResidence: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
          >
            {(NIGERIA_STATES_LGA[deponent.stateOfResidence] || []).map((lga) => (
              <option key={lga} value={lga}>
                {lga}
              </option>
            ))}
          </select>
        </div>

        {/* Street Address */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Street Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={deponent.streetAddress}
            onChange={(e) => onChange({ streetAddress: e.target.value })}
            placeholder="e.g. Plot 14, Admiralty Way, Lekki Phase 1"
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
          />
        </div>

        {/* Occupation */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-foreground">Occupation / Profession</label>
          <input
            type="text"
            value={deponent.occupation}
            onChange={(e) => onChange({ occupation: e.target.value })}
            placeholder="e.g. Business Executive, Civil Servant, Trader, Student"
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
          />
        </div>

        {/* Signature Pad */}
        <div className="md:col-span-2 pt-2 border-t border-border">
          <SignaturePad
            label="Deponent Legal Signature"
            description="Sign on the digital pad or upload signature image (compulsory for court swearing)"
            value={deponent.signatureUrl}
            onChange={(url) => onChange({ signatureUrl: url })}
            required={true}
          />
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-border">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft size={14} weight="bold" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          <span>Continue to Sworn Facts</span>
          <ArrowRight size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
}
