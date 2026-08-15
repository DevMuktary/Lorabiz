"use client";

import React, { useState } from "react";
import { 
  Users, 
  User, 
  Plus, 
  Trash, 
  Pen, 
  UploadSimple, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Eye,
  Info
} from "@phosphor-icons/react";
import { 
  BoardResolutionFormData, 
  DirectorSignatory 
} from "@/lib/board-resolution-generator";
import CanvasSignatureModal from "@/components/features/documents/CanvasSignatureModal";
import { 
  MANDATE_RULES, 
  DIRECTOR_DESIGNATIONS, 
  uploadFileWithProgress, 
  validateStep3 
} from "./schema";

interface DirectorsStepProps {
  formData: BoardResolutionFormData;
  setFormData: React.Dispatch<React.SetStateAction<BoardResolutionFormData>>;
  onBack: () => void;
  onContinue: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function DirectorsStep({
  formData,
  setFormData,
  onBack,
  onContinue,
  showToast
}: DirectorsStepProps) {
  // Signature Drawing Modal State
  const [drawingSignatureDirectorId, setDrawingSignatureDirectorId] = useState<string | null>(null);

  // Upload Progress States (Per director ID)
  const [uploadingSignatureId, setUploadingSignatureId] = useState<string | null>(null);
  const [signatureUploadPercent, setSignatureUploadPercent] = useState<Record<string, number>>({});

  const handleMandateChange = (mandate: typeof MANDATE_RULES[number]["id"]) => {
    setFormData(prev => ({
      ...prev,
      signingMandate: mandate
    }));
  };

  const handleAddDirector = () => {
    const newId = `dir_${Date.now()}`;
    const newDirector: DirectorSignatory = {
      id: newId,
      fullName: "",
      designation: "Director",
      isSignatory: true
    };

    setFormData(prev => ({
      ...prev,
      directors: [...prev.directors, newDirector]
    }));
  };

  const handleRemoveDirector = (id: string) => {
    if (formData.directors.length <= 1) {
      showToast("At least one (1) director or proprietor is required.", "error");
      return;
    }

    setFormData(prev => ({
      ...prev,
      directors: prev.directors.filter(d => d.id !== id)
    }));
  };

  const handleUpdateDirector = (id: string, updates: Partial<DirectorSignatory>) => {
    setFormData(prev => ({
      ...prev,
      directors: prev.directors.map(d => d.id === id ? { ...d, ...updates } : d)
    }));
  };

  const handleSignatureUpload = async (directorId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Signature image must be under 5MB.", "error");
      return;
    }

    setUploadingSignatureId(directorId);
    setSignatureUploadPercent(prev => ({ ...prev, [directorId]: 0 }));

    try {
      const result = await uploadFileWithProgress(file, (percent) => {
        setSignatureUploadPercent(prev => ({ ...prev, [directorId]: percent }));
      });

      if (result.success && result.url) {
        handleUpdateDirector(directorId, { signatureUrl: result.url });
        showToast("Signature image uploaded successfully!", "success");
      } else {
        showToast(result.error || "Failed to upload signature.", "error");
      }
    } catch {
      showToast("An unexpected error occurred during signature upload.", "error");
    } finally {
      setUploadingSignatureId(null);
    }
  };

  const handleNext = () => {
    const check = validateStep3(formData);
    if (!check.isValid) {
      showToast(check.error || "Please verify director details and authorized signatories.", "error");
      return;
    }
    onContinue();
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Step Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Users className="h-5 w-5" weight="bold" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Board of Directors & Signing Mandate</h2>
          <p className="text-xs text-muted-foreground">
            List company directors, officers, or proprietors, designate signatories, and provide signatures.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Mandate Rule Selector */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-foreground">
            Account Signing Mandate Rule <span className="text-primary">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MANDATE_RULES.map((rule) => {
              const isSelected = formData.signingMandate === rule.id;
              return (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => handleMandateChange(rule.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border-primary text-foreground shadow-sm ring-1 ring-primary/20"
                      : "bg-secondary/30 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground">{rule.title}</span>
                    {isSelected && <Check className="h-4 w-4 text-primary" weight="bold" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {rule.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Custom Mandate Description (if chosen) */}
          {formData.signingMandate === "CUSTOM" && (
            <div className="pt-2 animate-in fade-in duration-200">
              <label className="text-xs font-bold text-foreground block mb-1">
                Custom Mandate Instructions <span className="text-primary">*</span>
              </label>
              <textarea
                rows={2}
                value={formData.customMandateText || ""}
                onChange={(e) => setFormData({ ...formData, customMandateText: e.target.value })}
                placeholder="e.g. Any transaction above ₦5,000,000 must be signed jointly by the Managing Director and the Executive Director."
                className="w-full p-3 rounded-xl bg-secondary/50 border border-border text-xs font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}
        </div>

        {/* Directors List */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Directors, Officers & Proprietors</h3>
              <p className="text-[11px] text-muted-foreground">
                All listed individuals will appear in the resolution docket.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddDirector}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" weight="bold" />
              <span>Add Director / Proprietor</span>
            </button>
          </div>

          <div className="space-y-4">
            {formData.directors.map((dir, idx) => (
              <div 
                key={dir.id}
                className="p-5 rounded-2xl bg-secondary/30 border border-border space-y-4 relative"
              >
                {/* Director Header & Remove Button */}
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      {dir.fullName ? dir.fullName : `Director / Officer #${idx + 1}`}
                    </span>
                    {dir.isSignatory && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Authorized Signatory
                      </span>
                    )}
                  </div>

                  {formData.directors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDirector(dir.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                      title="Remove Director"
                    >
                      <Trash className="h-4 w-4" weight="bold" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">
                      Full Legal Name <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={dir.fullName}
                      onChange={(e) => handleUpdateDirector(dir.id, { fullName: e.target.value })}
                      placeholder="e.g. John Chukwuemeka Adebayo"
                      className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* Designation */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground">
                      Corporate Designation <span className="text-primary">*</span>
                    </label>
                    <select
                      value={dir.designation}
                      onChange={(e) => handleUpdateDirector(dir.id, { 
                        designation: e.target.value as DirectorSignatory["designation"] 
                      })}
                      className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs font-bold focus:outline-none focus:border-primary text-foreground"
                    >
                      {DIRECTOR_DESIGNATIONS.map((des) => (
                        <option key={des} value={des}>{des}</option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Designation (if Other) */}
                  {dir.designation === "Other" && (
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-bold text-foreground">
                        Specify Custom Designation <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        value={dir.customDesignation || ""}
                        onChange={(e) => handleUpdateDirector(dir.id, { customDesignation: e.target.value })}
                        placeholder="e.g. Chief Operating Officer (COO) or Trustee"
                        className="w-full h-10 px-3 rounded-xl bg-background border border-border text-xs font-medium focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  )}

                  {/* Signatory Checkbox */}
                  <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id={`sig_${dir.id}`}
                      checked={dir.isSignatory}
                      onChange={(e) => handleUpdateDirector(dir.id, { isSignatory: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <label 
                      htmlFor={`sig_${dir.id}`} 
                      className="text-xs font-bold text-foreground cursor-pointer select-none"
                    >
                      Designate as Bank / Fintech Authorized Signatory
                    </label>
                  </div>

                  {/* Digital Signature Docket Section */}
                  <div className="sm:col-span-2 pt-2 border-t border-border/40">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background p-3 rounded-xl border border-border">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground block">
                          Digital Director Signature
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Draw directly on screen or upload a transparent PNG/JPG
                        </span>
                      </div>

                      {dir.signatureUrl ? (
                        <div className="flex items-center gap-3">
                          <div className="h-10 px-3 bg-secondary/60 rounded-lg border border-border flex items-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                              src={dir.signatureUrl} 
                              alt="Signature" 
                              className="max-h-8 max-w-[100px] object-contain" 
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUpdateDirector(dir.id, { signatureUrl: undefined })}
                            className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setDrawingSignatureDirectorId(dir.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            <Pen className="h-3.5 w-3.5" weight="bold" />
                            <span>Draw Signature</span>
                          </button>

                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded-lg text-xs font-bold transition-all cursor-pointer">
                            <UploadSimple className="h-3.5 w-3.5 text-muted-foreground" weight="bold" />
                            <span>{uploadingSignatureId === dir.id ? "Uploading..." : "Upload Image"}</span>
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/webp"
                              onChange={(e) => handleSignatureUpload(dir.id, e)}
                              disabled={uploadingSignatureId === dir.id}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Signature Upload Progress Bar */}
                    {uploadingSignatureId === dir.id && signatureUploadPercent[dir.id] !== undefined && (
                      <div className="mt-2 space-y-1">
                        <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-200"
                            style={{ width: `${signatureUploadPercent[dir.id]}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground block text-right font-mono">
                          {signatureUploadPercent[dir.id]}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 3 Bottom Navigation Bar */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground font-bold text-xs hover:bg-secondary transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" weight="bold" />
          <span>Back to Purpose & Design</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
        >
          <span>Preview Resolution Document</span>
          <ArrowRight className="h-4 w-4" weight="bold" />
        </button>
      </div>

      {/* Digital Signature Drawing Canvas Modal */}
      {drawingSignatureDirectorId && (
        <CanvasSignatureModal
          isOpen={true}
          onClose={() => setDrawingSignatureDirectorId(null)}
          onSave={(dataUrl) => {
            handleUpdateDirector(drawingSignatureDirectorId, { signatureUrl: dataUrl });
            setDrawingSignatureDirectorId(null);
            showToast("Digital signature captured successfully!", "success");
          }}
        />
      )}
    </div>
  );
}
