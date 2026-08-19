"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  User, 
  Phone, 
  MapPin, 
  CheckCircle, 
  WarningCircle, 
  ArrowRight, 
  ShieldCheck, 
  Spinner,
  IdentificationCard,
  CursorClick,
  X,
  Wallet,
  ArrowsClockwise
} from "@phosphor-icons/react";
import { NIGERIA_DATA } from "@/components/features/cac/register/biz-name/schema";

export type ModificationType = "CHANGE_OF_NAME" | "CHANGE_OF_PHONE" | "CHANGE_OF_ADDRESS";

export interface PricingConfig {
  price: number;
  isActive: boolean;
  maintenanceMsg?: string | null;
  label: string;
}

interface ModificationFormProps {
  pricing: Record<string, PricingConfig>;
  walletBalance: number;
  onSuccess: (result: { trackingId: string; type: string; amountPaid: number }) => void;
  onRequireConsent?: () => void;
}

export function ModificationForm({
  pricing,
  walletBalance,
  onSuccess,
  onRequireConsent,
}: ModificationFormProps) {
  // Start with no category selected so no fields are open automatically
  const [selectedType, setSelectedType] = useState<ModificationType | null>(null);

  // Form Fields
  const [nin, setNin] = useState("");
  const [currentPhone, setCurrentPhone] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newMiddleName, setNewMiddleName] = useState("");
  const [currentFullName, setCurrentFullName] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedLga, setSelectedLga] = useState("");

  // Review & Confirmation Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [statutoryConsent, setStatutoryConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Nigerian States and LGAs
  const stateOptions = useMemo(() => {
    return NIGERIA_DATA.map((d) => d.state).sort();
  }, []);

  const lgaOptions = useMemo(() => {
    if (!selectedState) return [];
    const stateObj = NIGERIA_DATA.find((d) => d.state === selectedState);
    return stateObj ? [...stateObj.lgas].sort() : [];
  }, [selectedState]);

  // Current Price Config
  const activePricing = selectedType
    ? pricing[selectedType] || {
        price: selectedType === "CHANGE_OF_NAME" ? 2500 : 2000,
        isActive: true,
        label: selectedType.replace(/_/g, " "),
      }
    : null;

  const currentPrice = activePricing?.price || 0;
  const isInsufficient = walletBalance < currentPrice;
  const shortfall = Math.max(0, currentPrice - walletBalance);
  const remainingBalance = Math.max(0, walletBalance - currentPrice);

  // Validate fields before showing review modal
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedType) {
      setErrorMessage("Please select a modification service first.");
      return;
    }

    const cleanNin = nin.replace(/\D/g, "");
    if (cleanNin.length !== 11) {
      setErrorMessage("Please enter a valid 11-digit NIN.");
      return;
    }

    if (selectedType === "CHANGE_OF_NAME") {
      if (!currentPhone.trim() || currentPhone.replace(/\D/g, "").length < 10) {
        setErrorMessage("Please enter the phone number currently linked to this NIN.");
        return;
      }
      if (!newFirstName.trim()) {
        setErrorMessage("New First Name is required.");
        return;
      }
      if (!newLastName.trim()) {
        setErrorMessage("New Surname (Last Name) is required.");
        return;
      }
    } else if (selectedType === "CHANGE_OF_PHONE") {
      if (!currentFullName.trim()) {
        setErrorMessage("Full Name on the NIN is required.");
        return;
      }
      const cleanNewPhone = newPhoneNumber.replace(/\D/g, "");
      if (cleanNewPhone.length < 10) {
        setErrorMessage("Please enter a valid 11-digit new phone number.");
        return;
      }
    } else if (selectedType === "CHANGE_OF_ADDRESS") {
      if (!currentFullName.trim()) {
        setErrorMessage("Current Full Name on NIN is required.");
        return;
      }
      if (!currentPhone.trim() || currentPhone.replace(/\D/g, "").length < 10) {
        setErrorMessage("Please enter the current phone number.");
        return;
      }
      if (!newAddress.trim()) {
        setErrorMessage("Please enter your new residential street address.");
        return;
      }
      if (!selectedState.trim()) {
        setErrorMessage("Please select your State.");
        return;
      }
    }

    setShowReviewModal(true);
  };

  const handleFinalSubmit = async () => {
    if (!selectedType || !activePricing) return;
    setErrorMessage(null);

    if (!statutoryConsent) {
      setErrorMessage("Please check the statutory consent affirmation.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/nin/modification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          nin: nin.replace(/\D/g, ""),
          currentPhone: currentPhone.trim(),
          newFirstName: newFirstName.trim(),
          newLastName: newLastName.trim(),
          newMiddleName: newMiddleName.trim(),
          currentFullName: currentFullName.trim(),
          newPhoneNumber: newPhoneNumber.replace(/\D/g, ""),
          newAddress: newAddress.trim(),
          newState: selectedState,
          newLga: selectedLga,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowReviewModal(false);
        onSuccess({
          trackingId: data.trackingId,
          type: selectedType,
          amountPaid: data.amountPaid,
        });
      } else {
        if (data.requiresConsent && onRequireConsent) {
          setShowReviewModal(false);
          onRequireConsent();
        } else {
          const msg = data.message || "Failed to submit modification request.";
          setErrorMessage(msg);
        }
      }
    } catch (err) {
      console.error("Submission error:", err);
      setErrorMessage("A network error occurred. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">
      
      {/* 1. Service Selection State */}
      {!selectedType ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
              Select Modification Service
            </label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose the record type you want to modify on your National Identity profile.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            
            {/* Change of Name */}
            <button
              type="button"
              onClick={() => {
                setSelectedType("CHANGE_OF_NAME");
                setErrorMessage(null);
              }}
              className="p-4 sm:p-5 rounded-2xl border border-border bg-card hover:bg-secondary/40 hover:border-primary/50 text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-secondary group-hover:bg-primary group-hover:text-primary-foreground text-foreground flex items-center justify-center font-bold transition-colors">
                  <User weight="duotone" className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ₦{(pricing["CHANGE_OF_NAME"]?.price || 2500).toLocaleString()}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">Change of Name</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Update First Name, Surname, or Middle Name on your NIN record.
                </p>
              </div>
            </button>

            {/* Change of Phone */}
            <button
              type="button"
              onClick={() => {
                setSelectedType("CHANGE_OF_PHONE");
                setErrorMessage(null);
              }}
              className="p-4 sm:p-5 rounded-2xl border border-border bg-card hover:bg-secondary/40 hover:border-primary/50 text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-secondary group-hover:bg-primary group-hover:text-primary-foreground text-foreground flex items-center justify-center font-bold transition-colors">
                  <Phone weight="duotone" className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ₦{(pricing["CHANGE_OF_PHONE"]?.price || 2000).toLocaleString()}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">Change of Phone</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Link a new active phone number to your National Identity record.
                </p>
              </div>
            </button>

            {/* Change of Address */}
            <button
              type="button"
              onClick={() => {
                setSelectedType("CHANGE_OF_ADDRESS");
                setErrorMessage(null);
              }}
              className="p-4 sm:p-5 rounded-2xl border border-border bg-card hover:bg-secondary/40 hover:border-primary/50 text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-secondary group-hover:bg-primary group-hover:text-primary-foreground text-foreground flex items-center justify-center font-bold transition-colors">
                  <MapPin weight="duotone" className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  ₦{(pricing["CHANGE_OF_ADDRESS"]?.price || 2000).toLocaleString()}
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">Change of Address</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Update your registered residential address, State, and LGA.
                </p>
              </div>
            </button>

          </div>

          {/* Prompt Placeholder when no service is active */}
          <div className="p-8 sm:p-12 rounded-3xl bg-card border border-dashed border-border text-center space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-secondary/80 text-muted-foreground flex items-center justify-center mx-auto">
              <CursorClick weight="duotone" className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Please Select a Service Above
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Click on <strong>Change of Name</strong>, <strong>Change of Phone</strong>, or <strong>Change of Address</strong> above to open the application form.
            </p>
          </div>
        </div>
      ) : (
        /* Selected Service Active Banner (Other options hidden) */
        <div className="p-4 sm:p-5 rounded-3xl bg-card border border-primary/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0 shadow-sm">
              {selectedType === "CHANGE_OF_NAME" && <User weight="duotone" className="h-6 w-6" />}
              {selectedType === "CHANGE_OF_PHONE" && <Phone weight="duotone" className="h-6 w-6" />}
              {selectedType === "CHANGE_OF_ADDRESS" && <MapPin weight="duotone" className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                  Active Service
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ₦{currentPrice.toLocaleString()}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-foreground mt-0.5">
                {activePricing?.label}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedType === "CHANGE_OF_NAME" && "Update First Name, Surname, or Middle Name on your NIN record."}
                {selectedType === "CHANGE_OF_PHONE" && "Link a new active phone number to your National Identity record."}
                {selectedType === "CHANGE_OF_ADDRESS" && "Update your registered residential address, State, and LGA."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedType(null);
              setErrorMessage(null);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-xs transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <ArrowsClockwise weight="bold" className="h-4 w-4 text-primary" />
            <span>Change Service</span>
          </button>
        </div>
      )}

      {/* Service Maintenance Banner if Inactive */}
      {selectedType && activePricing && !activePricing.isActive && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-sm flex items-center gap-3">
          <WarningCircle weight="bold" className="h-5 w-5 shrink-0" />
          <span>{activePricing.maintenanceMsg || "This modification service is temporarily suspended for maintenance. Please check back shortly."}</span>
        </div>
      )}

      {/* Dynamic Form: Rendered when a category is selected */}
      {selectedType && activePricing && (
        <form onSubmit={handleProceedToReview} className="p-5 sm:p-8 rounded-3xl bg-card border border-border shadow-sm space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200">
          
          {/* Form Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                {activePricing.label} Application Form
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Provide exact details as registered or desired in the National Identity registry.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Fee:</span>
              <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ₦{activePricing.price.toLocaleString()}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
              <WarningCircle weight="fill" className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 11-Digit NIN Input (Universal) */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              National Identification Number (NIN) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={11}
                value={nin}
                onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
                placeholder="e.g. 12345678901"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background tracking-wider"
                required
              />
              <IdentificationCard weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
              <span>Must be exactly 11 digits</span>
              <span className={nin.length === 11 ? "text-emerald-600 font-bold" : ""}>
                {nin.length}/11 digits
              </span>
            </div>
          </div>

          {/* Dynamic Fields for CHANGE_OF_NAME */}
          {selectedType === "CHANGE_OF_NAME" && (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Current Phone Number linked to this NIN <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    maxLength={11}
                    value={currentPhone}
                    onChange={(e) => setCurrentPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 08012345678"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                    required
                  />
                  <Phone weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    New First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="e.g. Chukwuma"
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    New Surname (Last Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="e.g. Danjuma"
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  New Middle Name <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={newMiddleName}
                  onChange={(e) => setNewMiddleName(e.target.value)}
                  placeholder="e.g. Olawale"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                />
              </div>
            </div>
          )}

          {/* Dynamic Fields for CHANGE_OF_PHONE */}
          {selectedType === "CHANGE_OF_PHONE" && (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Full Name on the NIN <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={currentFullName}
                    onChange={(e) => setCurrentFullName(e.target.value)}
                    placeholder="e.g. Chukwuma Olawale Danjuma"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                    required
                  />
                  <User weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  New Phone Number to Link <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    maxLength={11}
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 08123456789"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                    required
                  />
                  <Phone weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ensure this new SIM card is registered and currently active.
                </p>
              </div>
            </div>
          )}

          {/* Dynamic Fields for CHANGE_OF_ADDRESS */}
          {selectedType === "CHANGE_OF_ADDRESS" && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Current Full Name on NIN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentFullName}
                    onChange={(e) => setCurrentFullName(e.target.value)}
                    placeholder="e.g. Chukwuma Olawale Danjuma"
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Current Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={11}
                    value={currentPhone}
                    onChange={(e) => setCurrentPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 08012345678"
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  New Street Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    State of Residence <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setSelectedLga("");
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background cursor-pointer"
                    required
                  >
                    <option value="">Select State</option>
                    {stateOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Local Government Area (LGA) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedLga}
                    onChange={(e) => setSelectedLga(e.target.value)}
                    disabled={!selectedState}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background disabled:opacity-50 cursor-pointer"
                    required
                  >
                    <option value="">{selectedState ? "Select LGA" : "Select State First"}</option>
                    {lgaOptions.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-end">
            <button
              type="submit"
              disabled={!activePricing.isActive}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Review & Submit Modification</span>
              <ArrowRight weight="bold" className="h-4 w-4" />
            </button>
          </div>

        </form>
      )}

      {/* Review & Confirmation Modal */}
      {showReviewModal && activePricing && (
        <div className="fixed inset-0 z-50 p-3 sm:p-6 py-6 sm:py-10 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-card border border-border shadow-2xl rounded-2xl sm:rounded-3xl max-w-lg w-full overflow-hidden text-foreground max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border bg-card flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                  <ShieldCheck weight="bold" className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {isInsufficient ? "Insufficient Balance" : "Confirm Modification Request"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isInsufficient ? "Wallet top up required" : "Review your details before payment."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X weight="bold" className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              
              {/* If Insufficient Balance: Display Crying Emoji Banner and Shortfall */}
              {isInsufficient ? (
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl select-none">😭</span>
                      <div>
                        <h4 className="font-black text-sm text-foreground">You don&apos;t have enough balance</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Please top up your wallet to submit this modification request.
                        </p>
                      </div>
                    </div>

                    <div className="bg-background/80 dark:bg-background/50 rounded-xl p-3.5 border border-border space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service:</span>
                        <span className="font-bold text-foreground">{activePricing.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Required Fee:</span>
                        <span className="font-bold text-rose-500">₦{currentPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Balance:</span>
                        <span className="font-bold text-foreground">₦{walletBalance.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-1.5 font-bold">
                        <span className="text-amber-600 dark:text-amber-400">Shortfall:</span>
                        <span className="text-amber-600 dark:text-amber-400 font-mono">₦{shortfall.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary of Data entered so the user can verify */}
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2 text-xs">
                    <div className="flex justify-between border-b border-border/60 pb-1.5">
                      <span className="text-muted-foreground">Target NIN:</span>
                      <span className="font-mono font-bold text-foreground">{nin}</span>
                    </div>
                    {selectedType === "CHANGE_OF_NAME" && (
                      <div className="flex justify-between border-b border-border/60 pb-1.5">
                        <span className="text-muted-foreground">New Full Name:</span>
                        <span className="font-bold text-foreground">
                          {[newFirstName, newMiddleName, newLastName].filter(Boolean).join(" ")}
                        </span>
                      </div>
                    )}
                    {selectedType === "CHANGE_OF_PHONE" && (
                      <div className="flex justify-between border-b border-border/60 pb-1.5">
                        <span className="text-muted-foreground">New Phone:</span>
                        <span className="font-mono font-bold text-foreground">{newPhoneNumber}</span>
                      </div>
                    )}
                    {selectedType === "CHANGE_OF_ADDRESS" && (
                      <div className="flex justify-between border-b border-border/60 pb-1.5">
                        <span className="text-muted-foreground">New Address:</span>
                        <span className="font-medium text-foreground text-right">{newAddress} ({selectedState})</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Sufficient Balance - Data Summary & Confirmation */
                <div className="space-y-4">
                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                      <WarningCircle weight="fill" className="h-4 w-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Data Summary Card */}
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-2.5 text-xs sm:text-sm">
                    <div className="flex justify-between border-b border-border/60 pb-1.5">
                      <span className="text-muted-foreground">Service Type:</span>
                      <span className="font-bold text-foreground">{activePricing.label}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/60 pb-1.5">
                      <span className="text-muted-foreground">Target NIN:</span>
                      <span className="font-mono font-bold text-foreground">{nin}</span>
                    </div>

                    {selectedType === "CHANGE_OF_NAME" && (
                      <>
                        <div className="flex justify-between border-b border-border/60 pb-1.5">
                          <span className="text-muted-foreground">Current Linked Phone:</span>
                          <span className="font-medium text-foreground">{currentPhone}</span>
                        </div>
                        <div className="flex justify-between border-b border-border/60 pb-1.5">
                          <span className="text-muted-foreground">New Full Name:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {[newFirstName, newMiddleName, newLastName].filter(Boolean).join(" ")}
                          </span>
                        </div>
                      </>
                    )}

                    {selectedType === "CHANGE_OF_PHONE" && (
                      <>
                        <div className="flex justify-between border-b border-border/60 pb-1.5">
                          <span className="text-muted-foreground">NIN Full Name:</span>
                          <span className="font-medium text-foreground">{currentFullName}</span>
                        </div>
                        <div className="flex justify-between border-b border-border/60 pb-1.5">
                          <span className="text-muted-foreground">New Phone to Link:</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{newPhoneNumber}</span>
                        </div>
                      </>
                    )}

                    {selectedType === "CHANGE_OF_ADDRESS" && (
                      <>
                        <div className="flex justify-between border-b border-border/60 pb-1.5">
                          <span className="text-muted-foreground">Applicant Name:</span>
                          <span className="font-medium text-foreground">{currentFullName}</span>
                        </div>
                        <div className="flex justify-between border-b border-border/60 pb-1.5">
                          <span className="text-muted-foreground">New Address:</span>
                          <span className="font-medium text-foreground text-right max-w-[200px]">{newAddress}</span>
                        </div>
                        <div className="flex justify-between border-b border-border/60 pb-1.5">
                          <span className="text-muted-foreground">State / LGA:</span>
                          <span className="font-medium text-foreground">{selectedState}, {selectedLga}</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between border-t border-border pt-2 text-xs">
                      <span className="text-muted-foreground">Wallet Balance:</span>
                      <span className="font-bold text-foreground">₦{walletBalance.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Balance After Debit:</span>
                      <span className="font-bold text-foreground">₦{remainingBalance.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between pt-1 border-t border-border font-bold">
                      <span className="text-foreground">Total Service Fee:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                        ₦{currentPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Statutory Consent Checkbox */}
                  <div className="pt-2 border-t border-border">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={statutoryConsent}
                        onChange={(e) => setStatutoryConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                      />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        I confirm that the modification details entered above are true and accurate. I voluntarily authorize LoraBiz to perform this modification and understand all service fees are non-refundable once processed.
                      </span>
                    </label>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 border-t border-border bg-card flex items-center justify-end gap-3 shrink-0">
              {isInsufficient ? (
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="py-2.5 px-4 rounded-xl border border-border text-foreground font-bold text-xs hover:bg-secondary/50 transition-all cursor-pointer text-center"
                  >
                    Cancel
                  </button>

                  <Link
                    href="/dashboard/wallet"
                    className="py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer text-center"
                  >
                    <Wallet weight="bold" className="h-4 w-4" />
                    <span>Fund Wallet</span>
                    <ArrowRight weight="bold" className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-border text-foreground font-bold text-xs hover:bg-secondary/50 transition-all cursor-pointer"
                  >
                    Back to Form
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting || !statutoryConsent}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle weight="bold" className="h-4 w-4" />
                        <span>Confirm & Pay ₦{currentPrice.toLocaleString()}</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
