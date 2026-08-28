// src/app/dashboard/affidavit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  ListDashes,
  CheckCircle,
  X,
  WarningCircle,
  PencilSimple,
  User,
} from "@phosphor-icons/react";
import { useLoyalty } from "@/lib/useLoyalty";
import { NIGERIA_STATES_LGA } from "@/lib/nigeria-states";
import { FileUpload } from "@/components/FileUpload";
import { SignaturePad } from "@/components/features/affidavit/SignaturePad";
import { AffidavitGuidelinesModal } from "@/components/features/affidavit/AffidavitGuidelinesModal";
import { AffidavitCategoryCards } from "@/components/features/affidavit/AffidavitCategoryCards";
import { AffidavitSealTierSelector } from "@/components/features/affidavit/AffidavitSealTierSelector";
import { AffidavitReviewModal } from "@/components/features/affidavit/AffidavitReviewModal";
import { CacCorporateFacts } from "@/components/features/affidavit/facts/CacCorporateFacts";
import { ChangeOfNameFacts as ChangeOfNameFactsComp } from "@/components/features/affidavit/facts/ChangeOfNameFacts";
import { AgeDeclarationFacts as AgeDeclarationFactsComp } from "@/components/features/affidavit/facts/AgeDeclarationFacts";
import { LossOfItemFacts as LossOfItemFactsComp } from "@/components/features/affidavit/facts/LossOfItemFacts";
import { ProofOfOwnershipFacts as ProofOfOwnershipFactsComp } from "@/components/features/affidavit/facts/ProofOfOwnershipFacts";
import { GeneralPurposeFacts as GeneralPurposeFactsComp } from "@/components/features/affidavit/facts/GeneralPurposeFacts";
import {
  AffidavitCategoryType,
  AffidavitSealTier,
  DeponentInfo,
  CacFacts,
  ChangeOfNameFacts,
  AgeDeclarationFacts,
  LossOfItemFacts,
  ProofOfOwnershipFacts,
  GeneralPurposeFacts,
} from "@/components/features/affidavit/types";

export default function CourtAffidavitPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { profile: loyaltyProfile } = useLoyalty();

  const [mounted, setMounted] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);

  // Strict Sequential Step State:
  // Step 1: Court Stamping Format (State Judiciary vs Federal High Court) -> Starts null (no auto-selection)
  // Step 2: Affidavit Matter -> Starts null
  // Step 3: Deponent Particulars
  // Step 4: Legal Facts & Specimen Signature
  const [selectedTier, setSelectedTier] = useState<AffidavitSealTier | null>(null);
  const [isTierCollapsed, setIsTierCollapsed] = useState<boolean>(false);

  const [category, setCategory] = useState<AffidavitCategoryType | null>(null);
  const [isCategoryCollapsed, setIsCategoryCollapsed] = useState<boolean>(false);

  const [currentStep, setCurrentStep] = useState<3 | 4>(3);

  // Live Dynamic Pricing from Database
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>({});
  const [isLoadingPricing, setIsLoadingPricing] = useState<boolean>(true);

  // Lightbox State for "View Example"
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; src: string; label: string }>({
    isOpen: false,
    src: "",
    label: "",
  });

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [successSubmission, setSuccessSubmission] = useState<{
    trackingId: string;
    amountPaid: number;
  } | null>(null);

  // 1. Deponent Info
  const [deponent, setDeponent] = useState<DeponentInfo>({
    firstName: "",
    middleName: "",
    lastName: "",
    fullName: "",
    passportUrl: null,
    gender: "MALE",
    dob: "",
    calculatedAge: null,
    religion: "Islam", // Islam listed first
    nationality: "Nigerian",
    stateOfResidence: "",
    lgaOfResidence: "",
    streetAddress: "",
    occupation: "",
    signatureUrl: null,
    sealTier: "STANDARD",
  });

  // 2. CAC Corporate Facts
  const [cacFacts, setCacFacts] = useState<CacFacts>({
    subType: "CAC_LOSS_OF_CERTIFICATE",
    companyName: "",
    rcBnNumber: "",
    positionInCompany: "Director",
    documentLost: "Certificate of Incorporation",
    lossDate: "",
    lossCircumstances: "",
    policeReportNo: "",
    oldSignatureUrl: null,
    newSignatureUrl: null,
    signatureChangeReason: "",
    erroneousDetail: "",
    correctDetail: "",
  });

  // 3. Change of Name Facts
  const [nameChangeFacts, setNameChangeFacts] = useState<ChangeOfNameFacts>({
    formerFirstName: "",
    formerMiddleName: "",
    formerLastName: "",
    newFirstName: "",
    newMiddleName: "",
    newLastName: "",
    oldName: "",
    newName: "",
    reason: "Marriage",
    usageDestination: "Commercial Banks, NIN, BVN & Official Records",
  });

  // 4. Age Declaration Facts
  const [ageFacts, setAgeFacts] = useState<AgeDeclarationFacts>({
    declaredDob: "",
    placeOfBirth: "",
    stateOfBirth: "",
    reason: "Birth Certificate Not Available at Birth",
  });

  // 5. Loss of Item Facts
  const [lossFacts, setLossFacts] = useState<LossOfItemFacts>({
    itemLost: "",
    identifyingNumber: "",
    lossDate: "",
    lossLocation: "",
    policeReportNo: "",
  });

  // 6. Proof of Ownership Facts
  const [ownershipFacts, setOwnershipFacts] = useState<ProofOfOwnershipFacts>({
    subject: "Vehicle / Automobile",
    identifyingNumber: "",
    details: "",
  });

  // 7. General Purpose Facts
  const [generalFacts, setGeneralFacts] = useState<GeneralPurposeFacts>({
    title: "",
    statements: [
      "That I am the deponent herein and a lawful citizen of the Federal Republic of Nigeria.",
      "That the statements made herein are true, correct, and in accordance with the Oaths Act.",
      "",
    ],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Live Pricing from Database
  useEffect(() => {
    async function fetchPricing() {
      try {
        const res = await fetch("/api/pricing");
        const json = await res.json();
        if (json.success && json.data) {
          setPrices(json.data);
          if (json.activeMap) setActiveMap(json.activeMap);
        }
      } catch (err) {
        console.error("Pricing fetch error:", err);
      } finally {
        setIsLoadingPricing(false);
      }
    }
    fetchPricing();
  }, []);

  // Pre-fill First and Last name if available from session
  useEffect(() => {
    if (session?.user?.name && !deponent.firstName && !deponent.lastName) {
      const parts = session.user.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        setDeponent((prev) => ({
          ...prev,
          firstName: parts[0],
          lastName: parts.slice(1).join(" "),
          fullName: session?.user?.name || "",
        }));
      } else if (parts.length === 1) {
        setDeponent((prev) => ({
          ...prev,
          firstName: parts[0],
          fullName: session?.user?.name || "",
        }));
      }
    }
  }, [session, deponent.firstName, deponent.lastName]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Derived age calculation
  const calculatedAge = (() => {
    if (!deponent.dob) return null;
    const birthDate = new Date(deponent.dob);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  })();

  const handleDeponentNameChange = (
    field: "firstName" | "middleName" | "lastName",
    val: string
  ) => {
    setDeponent((prev) => {
      const updated = { ...prev, [field]: val };
      const combined = [updated.firstName, updated.middleName, updated.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      return { ...updated, fullName: combined };
    });
  };

  const handleStateChange = (newState: string) => {
    setDeponent((prev) => ({
      ...prev,
      stateOfResidence: newState,
      lgaOfResidence: "",
    }));
  };

  // Step 1: Select Format -> Collapses Step 1, reveals Step 2
  const handleTierSelect = (tier: AffidavitSealTier) => {
    setSelectedTier(tier);
    setDeponent((prev) => ({ ...prev, sealTier: tier }));
    setIsTierCollapsed(true);
  };

  // Step 2: Select Matter -> Collapses Step 2, reveals Step 3
  const handleCategorySelect = (selected: AffidavitCategoryType) => {
    setCategory(selected);
    setIsCategoryCollapsed(true);
    setCurrentStep(3);
  };

  // Step 3 Validation -> Proceed to Step 4
  const handleProceedToStep4 = () => {
    if (!deponent.firstName.trim() || !deponent.lastName.trim()) {
      showToast("Please enter both First Name and Last Name of the deponent.");
      return;
    }
    if (!deponent.dob) {
      showToast("Please enter the deponent's Date of Birth.");
      return;
    }
    if (!deponent.stateOfResidence) {
      showToast("Please select the State of Residence.");
      return;
    }
    if (!deponent.lgaOfResidence) {
      showToast("Please select the LGA of Residence.");
      return;
    }
    if (!deponent.streetAddress.trim()) {
      showToast("Please provide the residential street address.");
      return;
    }

    setCurrentStep(4);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  // Current Base Price derived dynamically from ServicePricing
  const currentBasePrice =
    selectedTier === "HIGH_COURT_ATTESTED"
      ? Number(prices.AFFIDAVIT_FEDERAL || 4000)
      : Number(prices.AFFIDAVIT_STATE || 2500);

  // Validate form before opening Review Modal
  const handleOpenReview = () => {
    if (!selectedTier) {
      showToast("Please select a court stamping format first.");
      return;
    }
    if (!category) {
      showToast("Please select an affidavit matter.");
      return;
    }
    if (!deponent.firstName.trim() || !deponent.lastName.trim()) {
      showToast("Please enter both First Name and Last Name of the deponent.");
      setCurrentStep(3);
      return;
    }
    if (!deponent.dob) {
      showToast("Please enter the deponent's Date of Birth.");
      setCurrentStep(3);
      return;
    }
    if (!deponent.stateOfResidence || !deponent.lgaOfResidence || !deponent.streetAddress.trim()) {
      showToast("Please complete the deponent's residential address details.");
      setCurrentStep(3);
      return;
    }

    // Category specific validations
    if (category === "CAC_CORPORATE") {
      if (!cacFacts.companyName.trim() || !cacFacts.rcBnNumber.trim()) {
        showToast("Please enter Registered Company Name and RC/BN Number.");
        return;
      }
      if (
        cacFacts.subType === "CAC_SIGNATURE_CHANGE" &&
        (!cacFacts.oldSignatureUrl || !cacFacts.newSignatureUrl)
      ) {
        showToast("Please upload both the old specimen signature and new specimen signature.");
        return;
      }
    } else if (category === "CHANGE_OF_NAME") {
      if (!nameChangeFacts.oldName.trim() || !nameChangeFacts.newName.trim()) {
        showToast("Please provide both former name and new legal name.");
        return;
      }
    } else if (category === "AGE_DECLARATION") {
      if (!ageFacts.declaredDob || !ageFacts.placeOfBirth.trim() || !ageFacts.stateOfBirth) {
        showToast("Please provide declared date of birth, place of birth, and state of birth.");
        return;
      }
      if (!ageFacts.reason.trim()) {
        showToast("Please select or specify the compulsory reason for age declaration.");
        return;
      }
    } else if (category === "LOSS_OF_ITEM") {
      if (!lossFacts.itemLost.trim()) {
        showToast("Please specify the item or document lost.");
        return;
      }
    } else if (category === "GENERAL_PURPOSE") {
      if (!generalFacts.title.trim()) {
        showToast("Please enter a title or purpose for this affidavit.");
        return;
      }
    }

    if (!deponent.signatureUrl) {
      showToast("Deponent signature is mandatory. Please sign or upload a signature.");
      return;
    }

    setShowReviewModal(true);
  };

  // Build facts JSON payload
  const buildFactsPayload = () => {
    if (category === "CAC_CORPORATE") return cacFacts;
    if (category === "CHANGE_OF_NAME") return nameChangeFacts;
    if (category === "AGE_DECLARATION") return ageFacts;
    if (category === "LOSS_OF_ITEM") return lossFacts;
    if (category === "PROOF_OF_OWNERSHIP") return ownershipFacts;
    return {
      title: generalFacts.title.trim(),
      statements: generalFacts.statements.filter((s) => s.trim().length > 0),
    };
  };

  // Final Submit Action
  const handleSubmitAffidavit = async () => {
    if (!category || !selectedTier) return;
    setIsSubmitting(true);
    try {
      const fullAddress = `${deponent.streetAddress.trim()}, ${deponent.lgaOfResidence}, ${deponent.stateOfResidence} State, Nigeria`;
      const payload = {
        category,
        subCategory: selectedTier,
        deponentFullName: deponent.fullName.trim(),
        passportUrl: deponent.passportUrl,
        gender: deponent.gender,
        dob: deponent.dob,
        religion: deponent.religion,
        nationality: deponent.nationality,
        residentialAddress: fullAddress,
        occupation: deponent.occupation?.trim() || undefined,
        signatureUrl: deponent.signatureUrl,
        details: {
          ...buildFactsPayload(),
          sealTier: selectedTier,
          deponentFirstName: deponent.firstName,
          deponentMiddleName: deponent.middleName,
          deponentLastName: deponent.lastName,
        },
      };

      const res = await fetch("/api/affidavit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowReviewModal(false);
        setSuccessSubmission({
          trackingId: data.trackingId,
          amountPaid: data.affidavit?.amountCharged || currentBasePrice,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
          router.push("/dashboard/affidavit/history");
        }, 2500);
      } else {
        showToast(data.message || "Failed to submit court affidavit.");
      }
    } catch (err: any) {
      console.error("Affidavit submission error:", err);
      showToast("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if step 1 is complete
  const isStep1Done = Boolean(selectedTier && isTierCollapsed);
  // Check if step 2 is complete
  const isStep2Done = Boolean(isStep1Done && category && isCategoryCollapsed);

  return (
    <div className="space-y-5 max-w-4xl mx-auto relative pb-16 animate-in fade-in duration-200 font-sans text-left overflow-x-hidden">
      {/* Guidelines Modal */}
      <AffidavitGuidelinesModal
        isOpen={showGuidelines}
        onClose={() => setShowGuidelines(false)}
      />

      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft weight="bold" className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-white dark:bg-white flex items-center justify-center p-1.5 border border-slate-200/80 dark:border-white/20 shrink-0 shadow-xs">
            <Image
              src="/court.png"
              alt="High Court Seal"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-0.5">
              <ShieldCheck weight="bold" className="h-3 w-3" />
              Federal Republic of Nigeria • Sworn Registry
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Sworn Court Affidavit</h1>
            <p className="text-muted-foreground text-xs">
              Official legal affidavits stamped and sealed by Commissioner for Oaths (2–5 Working Hours • Mon–Fri, Excludes Weekends &amp; Public Holidays).
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/affidavit/history"
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-secondary text-foreground text-xs font-bold rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group shrink-0 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <ListDashes weight="bold" className="h-3.5 w-3.5" />
          <span>Affidavit History</span>
          <ArrowRight weight="bold" className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Success Confirmation Banner with Auto Redirect */}
      {successSubmission && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 space-y-2.5 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <CheckCircle weight="bold" className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Court Affidavit Successfully Submitted!</h3>
              <p className="text-xs opacity-90">
                Tracking ID: <strong className="font-mono">{successSubmission.trackingId}</strong>. Redirecting to history...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: CHOOSE KIND OF AFFIDAVIT (State Judiciary vs Federal High Court) */}
      <AffidavitSealTierSelector
        selectedTier={selectedTier}
        isCollapsed={isTierCollapsed}
        onSelectTier={handleTierSelect}
        onToggleCollapse={() => {
          setIsTierCollapsed(false);
          setIsCategoryCollapsed(false);
        }}
        onViewExample={(src, label) => setLightbox({ isOpen: true, src, label })}
        prices={prices}
        activeMap={activeMap}
        isLoadingPricing={isLoadingPricing}
        discountPct={loyaltyProfile?.currentTier?.discountPct || 0}
      />

      {/* STEP 2: SELECT AFFIDAVIT MATTER -> ONLY SHOWN AFTER STEP 1 IS COMPLETED */}
      {isStep1Done && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          <AffidavitCategoryCards
            selectedCategory={category}
            isCollapsed={isCategoryCollapsed}
            onSelectCategory={handleCategorySelect}
            onToggleCollapse={() => setIsCategoryCollapsed(false)}
            activeMap={activeMap}
          />
        </div>
      )}

      {/* STEP 3 & 4: DEPONENT & FACTS -> ONLY SHOWN AFTER STEP 1 AND STEP 2 ARE COMPLETED */}
      {isStep1Done && isStep2Done && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          {/* STEP 3: DEPONENT INFORMATION (Person Swearing Oath) */}
          {currentStep === 3 ? (
            <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4 text-left w-full overflow-hidden animate-in fade-in">
              <div className="border-b border-border pb-2.5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-foreground">
                    3. Deponent Information (Person Swearing Oath)
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    These legal particulars will form the preamble of the sworn court affidavit.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-black text-[10px]">
                  Step 3 of 4
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* First Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deponent.firstName}
                    onChange={(e) => handleDeponentNameChange("firstName", e.target.value)}
                    placeholder="e.g. Ibrahim"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Middle Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Middle Name <span className="text-muted-foreground text-[10px] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={deponent.middleName || ""}
                    onChange={(e) => handleDeponentNameChange("middleName", e.target.value)}
                    placeholder="e.g. Chukwuma"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Last Name / Surname */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Surname / Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deponent.lastName}
                    onChange={(e) => handleDeponentNameChange("lastName", e.target.value)}
                    placeholder="e.g. Adeleke"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Portrait Photo */}
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Deponent Passport Photograph (Plain Background)
                  </label>
                  <FileUpload
                    label="Upload Portrait Photo"
                    description="Clear photo for official court seal"
                    value={deponent.passportUrl}
                    accept="image/jpeg, image/png"
                    aspectRatio={1}
                    onUploadSuccess={(url) => setDeponent((prev) => ({ ...prev, passportUrl: url }))}
                    onRemove={() => setDeponent((prev) => ({ ...prev, passportUrl: null }))}
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={deponent.gender}
                    onChange={(e) =>
                      setDeponent((prev) => ({
                        ...prev,
                        gender: e.target.value as "MALE" | "FEMALE" | "OTHER",
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <label className="text-xs font-bold text-foreground">
                      Date of Birth <span className="text-rose-500">*</span>
                    </label>
                    {calculatedAge !== null && (
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${
                          calculatedAge >= 18
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {calculatedAge} Yrs ({calculatedAge >= 18 ? "Adult" : "Minor"})
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={deponent.dob}
                    onChange={(e) => setDeponent((prev) => ({ ...prev, dob: e.target.value }))}
                    className="w-full min-w-0 max-w-full appearance-none px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Religion (Islam listed first) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Religion (Court Oath Formula) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={deponent.religion}
                    onChange={(e) => setDeponent((prev) => ({ ...prev, religion: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
                  >
                    <option value="Islam">Islam (Holy Quran)</option>
                    <option value="Christianity">Christianity (Holy Bible)</option>
                    <option value="Others">Affirmation (Non-Religious)</option>
                  </select>
                </div>

                {/* State of Residence */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    State of Residence <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={deponent.stateOfResidence}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Select State --</option>
                    {Object.keys(NIGERIA_STATES_LGA).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* LGA of Residence */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    LGA of Residence <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={deponent.lgaOfResidence}
                    disabled={!deponent.stateOfResidence}
                    onChange={(e) => setDeponent((prev) => ({ ...prev, lgaOfResidence: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary disabled:opacity-50"
                  >
                    <option value="">-- Select LGA --</option>
                    {(NIGERIA_STATES_LGA[deponent.stateOfResidence] || []).map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nationality */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Nationality</label>
                  <input
                    type="text"
                    value={deponent.nationality}
                    onChange={(e) => setDeponent((prev) => ({ ...prev, nationality: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Residential Street Address */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    Residential Street Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={deponent.streetAddress}
                    onChange={(e) => setDeponent((prev) => ({ ...prev, streetAddress: e.target.value }))}
                    placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Occupation */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Occupation / Trade</label>
                  <input
                    type="text"
                    value={deponent.occupation || ""}
                    onChange={(e) => setDeponent((prev) => ({ ...prev, occupation: e.target.value }))}
                    placeholder="e.g. Business Executive / Trader"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-base sm:text-sm font-medium focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Continue to Step 4 button */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsCategoryCollapsed(false)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} weight="bold" />
                  <span>Change Matter</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedToStep4}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <span>Next: Legal Facts &amp; Signature</span>
                  <ArrowRight size={14} weight="bold" />
                </button>
              </div>
            </div>
          ) : (
            /* Collapsed Deponent Summary Box */
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left w-full overflow-hidden animate-in fade-in">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0 text-foreground">
                  <User size={20} weight="bold" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                    3. Deponent Particulars
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                    {deponent.fullName || `${deponent.firstName} ${deponent.lastName}`}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {deponent.gender} • {calculatedAge !== null ? `${calculatedAge} Yrs` : "Age Stated"} ({deponent.religion}) • {deponent.streetAddress}, {deponent.lgaOfResidence}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-foreground transition-all shrink-0 cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <PencilSimple size={13} weight="bold" />
                <span>Edit Deponent Info</span>
              </button>
            </div>
          )}

          {/* STEP 4: SWORN LEGAL FACTS & SPECIMEN SIGNATURE */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Matter Facts Form */}
              <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border shadow-xs space-y-4 text-left w-full overflow-hidden">
                <div className="border-b border-border pb-2.5 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-foreground">
                      4. Sworn Legal Facts
                    </h2>
                    <p className="text-[11px] text-muted-foreground">
                      Provide factual statements required under oath.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-[10px]">
                    {category ? category.replace(/_/g, " ") : ""}
                  </span>
                </div>

                {category === "CHANGE_OF_NAME" && (
                  <ChangeOfNameFactsComp
                    facts={nameChangeFacts}
                    onChange={(updated) => setNameChangeFacts((prev) => ({ ...prev, ...updated }))}
                  />
                )}

                {category === "AGE_DECLARATION" && (
                  <AgeDeclarationFactsComp
                    facts={ageFacts}
                    onChange={(updated) => setAgeFacts((prev) => ({ ...prev, ...updated }))}
                  />
                )}

                {category === "CAC_CORPORATE" && (
                  <CacCorporateFacts
                    facts={cacFacts}
                    onChange={(updated) => setCacFacts((prev) => ({ ...prev, ...updated }))}
                  />
                )}

                {category === "LOSS_OF_ITEM" && (
                  <LossOfItemFactsComp
                    facts={lossFacts}
                    onChange={(updated) => setLossFacts((prev) => ({ ...prev, ...updated }))}
                  />
                )}

                {category === "PROOF_OF_OWNERSHIP" && (
                  <ProofOfOwnershipFactsComp
                    facts={ownershipFacts}
                    onChange={(updated) => setOwnershipFacts((prev) => ({ ...prev, ...updated }))}
                  />
                )}

                {category === "GENERAL_PURPOSE" && (
                  <GeneralPurposeFactsComp
                    facts={generalFacts}
                    onChange={(updated) => setGeneralFacts((prev) => ({ ...prev, ...updated }))}
                  />
                )}
              </div>

              {/* Digital Specimen Signature Pad */}
              <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border shadow-xs space-y-3 text-left w-full overflow-hidden">
                <div className="border-b border-border pb-2.5">
                  <h2 className="text-sm sm:text-base font-black text-foreground">
                    5. Deponent Specimen Signature
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Draw your signature on the pad or upload a photo of your signature.
                  </p>
                </div>

                <SignaturePad
                  label="Deponent Specimen Signature"
                  description="Official signature for the court affidavit."
                  value={deponent.signatureUrl}
                  onChange={(url) => setDeponent((prev) => ({ ...prev, signatureUrl: url }))}
                  required={true}
                />
              </div>

              {/* Step 4 Action Bar (No total fee shown on page as requested) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between gap-3 w-full overflow-hidden">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} weight="bold" />
                  <span>Back to Deponent Info</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenReview}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
                >
                  <span>Review &amp; Pay Affidavit</span>
                  <ArrowRight size={15} weight="bold" />
                </button>
              </div>
            </div>
          )}

          {/* REVIEW & CHECKOUT MODAL */}
          {category && (
            <AffidavitReviewModal
              isOpen={showReviewModal}
              onClose={() => setShowReviewModal(false)}
              category={category}
              deponent={deponent}
              cacFacts={cacFacts}
              nameChangeFacts={nameChangeFacts}
              ageFacts={ageFacts}
              lossFacts={lossFacts}
              ownershipFacts={ownershipFacts}
              generalFacts={generalFacts}
              basePrice={currentBasePrice}
              tierName={loyaltyProfile?.currentTier?.name}
              tierDiscountPct={loyaltyProfile?.currentTier?.discountPct || 0}
              isSubmitting={isSubmitting}
              onConfirmSubmit={handleSubmitAffidavit}
            />
          )}
        </div>
      )}

      {/* Lightbox Specimen Preview Modal for Court Example Affidavits */}
      {mounted && lightbox.isOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setLightbox({ isOpen: false, src: "", label: "" })}
        >
          <div
            className="relative w-full max-w-md flex flex-col items-center bg-card text-card-foreground border border-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 my-auto max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck size={16} weight="fill" className="text-emerald-500" />
                {lightbox.label} Example Specimen
              </span>
              <button
                type="button"
                onClick={() => setLightbox({ isOpen: false, src: "", label: "" })}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="relative w-full h-72 sm:h-80 bg-card overflow-hidden p-2 flex items-center justify-center">
              <div className="relative w-full h-full">
                <Image
                  src={lightbox.src}
                  alt={lightbox.label}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* SIDE SLIDE-IN TOAST ERROR NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-[99999] bg-card text-foreground border border-border px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-4 fade-in duration-200 max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <WarningCircle size={16} weight="fill" />
          </div>
          <p className="text-xs font-bold leading-relaxed flex-1">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X size={13} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}
