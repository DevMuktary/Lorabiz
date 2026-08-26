// src/app/dashboard/affidavit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
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
  Spinner,
  WarningCircle,
  Gavel,
  Lock,
} from "@phosphor-icons/react";
import { useLoyalty } from "@/lib/useLoyalty";
import { NIGERIA_STATES_LGA } from "@/lib/nigeria-states";
import { FileUpload } from "@/components/FileUpload";
import { SignaturePad } from "@/components/features/affidavit/SignaturePad";
import { AffidavitGuidelinesModal } from "@/components/features/affidavit/AffidavitGuidelinesModal";
import { AffidavitCategoryCards } from "@/components/features/affidavit/AffidavitCategoryCards";
import { AffidavitReviewModal } from "@/components/features/affidavit/AffidavitReviewModal";
import { CacCorporateFacts } from "@/components/features/affidavit/facts/CacCorporateFacts";
import { ChangeOfNameFacts as ChangeOfNameFactsComp } from "@/components/features/affidavit/facts/ChangeOfNameFacts";
import { AgeDeclarationFacts as AgeDeclarationFactsComp } from "@/components/features/affidavit/facts/AgeDeclarationFacts";
import { LossOfItemFacts as LossOfItemFactsComp } from "@/components/features/affidavit/facts/LossOfItemFacts";
import { ProofOfOwnershipFacts as ProofOfOwnershipFactsComp } from "@/components/features/affidavit/facts/ProofOfOwnershipFacts";
import { GeneralPurposeFacts as GeneralPurposeFactsComp } from "@/components/features/affidavit/facts/GeneralPurposeFacts";
import {
  AffidavitCategoryType,
  DeponentInfo,
  CacFacts,
  ChangeOfNameFacts,
  AgeDeclarationFacts,
  LossOfItemFacts,
  ProofOfOwnershipFacts,
  GeneralPurposeFacts,
} from "@/components/features/affidavit/types";

const BASE_PRICE = 3500;

export default function CourtAffidavitPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { profile: loyaltyProfile } = useLoyalty();

  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [isCategoryCollapsed, setIsCategoryCollapsed] = useState<boolean>(false);

  // Loading & Wallet State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoadingWallet, setIsLoadingWallet] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [successSubmission, setSuccessSubmission] = useState<{
    trackingId: string;
    amountPaid: number;
  } | null>(null);

  // Form State
  const [category, setCategory] = useState<AffidavitCategoryType>("CHANGE_OF_NAME");

  // 1. Deponent Info
  const [deponent, setDeponent] = useState<DeponentInfo>({
    fullName: "",
    passportUrl: null,
    gender: "MALE",
    dob: "",
    calculatedAge: null,
    religion: "Christianity",
    nationality: "Nigerian",
    stateOfResidence: "LAGOS",
    lgaOfResidence: "Ikeja",
    streetAddress: "",
    occupation: "",
    signatureUrl: null,
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
    oldName: "",
    newName: "",
    reason: "Marriage",
    usageDestination: "NIMC / NIN & Banking Records",
  });

  // 4. Age Declaration Facts
  const [ageFacts, setAgeFacts] = useState<AgeDeclarationFacts>({
    declaredDob: "",
    placeOfBirth: "",
    stateOfBirth: "LAGOS",
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Fetch Wallet Balance
  useEffect(() => {
    async function fetchWallet() {
      try {
        const res = await fetch("/api/user/wallet");
        const json = await res.json();
        if (json.success && json.wallet) {
          setWalletBalance(Number(json.wallet.balance));
        }
      } catch (err) {
        console.error("Wallet fetch error:", err);
      } finally {
        setIsLoadingWallet(false);
      }
    }
    fetchWallet();
  }, []);

  // Pre-fill Deponent Name from active session
  useEffect(() => {
    if (session?.user?.name && !deponent.fullName) {
      setDeponent((prev) => ({ ...prev, fullName: session?.user?.name || "" }));
    }
  }, [session, deponent.fullName]);

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

  const handleStateChange = (newState: string) => {
    const lgas = NIGERIA_STATES_LGA[newState] || [];
    setDeponent((prev) => ({
      ...prev,
      stateOfResidence: newState,
      lgaOfResidence: lgas[0] || "",
    }));
  };

  const handleCategorySelect = (selected: AffidavitCategoryType) => {
    setCategory(selected);
    setIsCategoryCollapsed(true);
  };

  // Validate form before opening Review Modal
  const handleOpenReview = () => {
    if (!deponent.fullName.trim()) {
      showToast("Please enter the deponent's full legal name.");
      return;
    }
    if (!deponent.dob) {
      showToast("Please enter the deponent's Date of Birth.");
      return;
    }
    if (!deponent.streetAddress.trim()) {
      showToast("Please provide the residential street address.");
      return;
    }

    // Category specific validations
    if (category === "CAC_CORPORATE") {
      if (!cacFacts.companyName.trim() || !cacFacts.rcBnNumber.trim()) {
        showToast("Please enter Registered Company Name and RC/BN Number.");
        return;
      }
      if (cacFacts.subType === "CAC_SIGNATURE_CHANGE" && (!cacFacts.oldSignatureUrl || !cacFacts.newSignatureUrl)) {
        showToast("Please upload both the old specimen signature and new specimen signature.");
        return;
      }
    } else if (category === "CHANGE_OF_NAME") {
      if (!nameChangeFacts.oldName.trim() || !nameChangeFacts.newName.trim()) {
        showToast("Please provide both former name and new legal name.");
        return;
      }
    } else if (category === "AGE_DECLARATION") {
      if (!ageFacts.declaredDob || !ageFacts.placeOfBirth.trim()) {
        showToast("Please enter the correct date of birth and place of birth.");
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
    setIsSubmitting(true);
    try {
      const fullAddress = `${deponent.streetAddress.trim()}, ${deponent.lgaOfResidence}, ${deponent.stateOfResidence} State, Nigeria`;
      const payload = {
        category,
        subCategory: category === "CAC_CORPORATE" ? cacFacts.subType : null,
        deponentFullName: deponent.fullName.trim(),
        passportUrl: deponent.passportUrl,
        gender: deponent.gender,
        dob: deponent.dob,
        religion: deponent.religion,
        nationality: deponent.nationality,
        residentialAddress: fullAddress,
        occupation: deponent.occupation.trim() || undefined,
        signatureUrl: deponent.signatureUrl,
        details: buildFactsPayload(),
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
          amountPaid: data.affidavit?.amountCharged || BASE_PRICE,
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative pb-16 animate-in fade-in duration-200 font-sans text-left">
      {/* Guidelines Modal */}
      <AffidavitGuidelinesModal
        isOpen={showGuidelines}
        onClose={() => setShowGuidelines(false)}
      />

      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" /> Back to Dashboard
        </Link>
      </div>

      {/* Page Header with Official Court Emblem Logo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center p-1.5 border border-border shrink-0 shadow-sm">
            <Image
              src="/court.png"
              alt="High Court Seal"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-0.5">
              <ShieldCheck weight="bold" className="h-3 w-3" />
              Federal Republic of Nigeria • High Court Registry
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Sworn Court Affidavit</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Official legal affidavits stamped and sealed by the Commissioner for Oaths (2–5 Hours Turnaround).
            </p>
          </div>
        </div>

        {/* Action Button: Affidavit History */}
        <Link
          href="/dashboard/affidavit/history"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground text-sm font-bold rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group shrink-0 shadow-sm cursor-pointer"
        >
          <ListDashes weight="bold" className="h-4 w-4" />
          <span>Affidavit History</span>
          <ArrowRight weight="bold" className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Success Confirmation Banner with Auto Redirect */}
      {successSubmission && (
        <div className="p-5 sm:p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 space-y-3 animate-in fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                <CheckCircle weight="bold" className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">Court Affidavit Successfully Submitted!</h3>
                <p className="text-xs opacity-90">
                  Your application has been queued for registry swearing &amp; stamping. Tracking ID:{" "}
                  <strong className="font-mono">{successSubmission.trackingId}</strong>
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  Redirecting you to Affidavit History...
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-emerald-500/20">
            <Link
              href="/dashboard/affidavit/history"
              className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
            >
              <ListDashes weight="bold" className="h-4 w-4" />
              Track Status in Affidavit History &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* STEP 1: INTERACTIVE COLLAPSIBLE CATEGORY SELECTION */}
      <AffidavitCategoryCards
        selectedCategory={category}
        isCollapsed={isCategoryCollapsed}
        onSelectCategory={handleCategorySelect}
        onToggleCollapse={() => setIsCategoryCollapsed(false)}
      />

      {/* STEP 2: DEPONENT PARTICULARS (PERSON SWEARING OATH) */}
      <div className="p-5 sm:p-7 rounded-3xl bg-card border border-border shadow-xs space-y-5">
        <div className="border-b border-border pb-3">
          <h2 className="text-base font-black text-foreground">
            2. Deponent Information (Person Swearing Oath)
          </h2>
          <p className="text-xs text-muted-foreground">
            These official particulars will form the preamble of the sworn affidavit.
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
              onChange={(e) => setDeponent((prev) => ({ ...prev, fullName: e.target.value }))}
              placeholder="e.g. Ibrahim Chukwuma Adeleke"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
            />
          </div>

          {/* Portrait Photo */}
          <div className="md:col-span-2 space-y-1.5">
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
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Gender <span className="text-rose-500">*</span>
            </label>
            <select
              value={deponent.gender}
              onChange={(e) => setDeponent((prev) => ({ ...prev, gender: e.target.value as "MALE" | "FEMALE" }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              {calculatedAge !== null && (
                <span
                  className={`text-[10px] font-black px-2 py-0.2 rounded-md ${calculatedAge >= 18
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                    }`}
                >
                  {calculatedAge} Yrs ({calculatedAge >= 18 ? "Adult Verified" : "Minor"})
                </span>
              )}
            </div>
            <input
              type="date"
              value={deponent.dob}
              onChange={(e) => setDeponent((prev) => ({ ...prev, dob: e.target.value }))}
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
              onChange={(e) => setDeponent((prev) => ({ ...prev, religion: e.target.value }))}
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
              onChange={(e) => setDeponent((prev) => ({ ...prev, nationality: e.target.value }))}
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
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
            >
              {Object.keys(NIGERIA_STATES_LGA).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* LGA */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              LGA of Residence <span className="text-rose-500">*</span>
            </label>
            <select
              value={deponent.lgaOfResidence}
              onChange={(e) => setDeponent((prev) => ({ ...prev, lgaOfResidence: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
            >
              {(NIGERIA_STATES_LGA[deponent.stateOfResidence] || []).map((lga) => (
                <option key={lga} value={lga}>
                  {lga}
                </option>
              ))}
            </select>
          </div>

          {/* Residential Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Residential Street Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={deponent.streetAddress}
              onChange={(e) => setDeponent((prev) => ({ ...prev, streetAddress: e.target.value }))}
              placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
            />
          </div>

          {/* Occupation */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Occupation / Profession</label>
            <input
              type="text"
              value={deponent.occupation}
              onChange={(e) => setDeponent((prev) => ({ ...prev, occupation: e.target.value }))}
              placeholder="e.g. Business Executive / Civil Servant"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* STEP 3: SWORN CATEGORY FACTS */}
      <div className="p-5 sm:p-7 rounded-3xl bg-card border border-border shadow-xs space-y-5">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-foreground">
              3. Sworn Legal Facts
            </h2>
            <p className="text-xs text-muted-foreground">
              Provide factual details required under court oath for this specific matter.
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-black text-[10px]">
            {category.replace(/_/g, " ")}
          </span>
        </div>

        {category === "CAC_CORPORATE" && (
          <CacCorporateFacts
            facts={cacFacts}
            onChange={(updated) => setCacFacts((prev) => ({ ...prev, ...updated }))}
          />
        )}

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

      {/* STEP 4: DIGITAL SIGNATURE PAD */}
      <div className="p-5 sm:p-7 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-base font-black text-foreground">
            4. Deponent Signature
          </h2>
          <p className="text-xs text-muted-foreground">
            Draw your signature clearly on the touch pad below or upload a photo of your signature on clean white paper.
          </p>
        </div>

        <SignaturePad
          label="Deponent Specimen Signature"
          description="Official signature to be placed on the sealed court affidavit."
          value={deponent.signatureUrl}
          onChange={(url) => setDeponent((prev) => ({ ...prev, signatureUrl: url }))}
          required={true}
        />
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Fee:</span>
            <span className="text-lg font-black text-foreground font-mono">
              ₦{loyaltyProfile?.currentTier?.discountPct ? (
                BASE_PRICE - Math.round((BASE_PRICE * loyaltyProfile.currentTier.discountPct) / 100)
              ).toLocaleString() : BASE_PRICE.toLocaleString()}
            </span>
            {loyaltyProfile?.currentTier?.discountPct && loyaltyProfile.currentTier.discountPct > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20">
                {loyaltyProfile.currentTier.name} ({loyaltyProfile.currentTier.discountPct}% OFF)
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Wallet Balance: <strong className="text-foreground font-mono">₦{walletBalance.toLocaleString()}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenReview}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all cursor-pointer"
        >
          <span>Review &amp; Pay Affidavit</span>
          <ArrowRight size={16} weight="bold" />
        </button>
      </div>

      {/* REVIEW & CHECKOUT MODAL */}
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
        basePrice={BASE_PRICE}
        tierName={loyaltyProfile?.currentTier?.name}
        tierDiscountPct={loyaltyProfile?.currentTier?.discountPct || 0}
        walletBalance={walletBalance}
        isSubmitting={isSubmitting}
        onConfirmSubmit={handleSubmitAffidavit}
      />

      {/* SIDE SLIDE-IN TOAST ERROR NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-card text-foreground border border-border px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-200 max-w-sm">
          <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
            <WarningCircle size={18} weight="fill" />
          </div>
          <p className="text-xs font-bold leading-relaxed flex-1">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}
