"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gavel,
  ArrowLeft,
  Clock,
  Warning,
  Receipt,
} from "@phosphor-icons/react";
import { useLoyalty } from "@/lib/useLoyalty";
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
import { Step1CategorySelect } from "@/components/features/affidavit/Step1CategorySelect";
import { Step2DeponentInfo } from "@/components/features/affidavit/Step2DeponentInfo";
import { Step3SwornFacts } from "@/components/features/affidavit/Step3SwornFacts";
import { Step4ReviewPay } from "@/components/features/affidavit/Step4ReviewPay";

const BASE_PRICE = 3500;

export default function CourtAffidavitPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { profile: loyaltyProfile } = useLoyalty();

  // Wizard Step Tracker (1: Category, 2: Deponent, 3: Facts, 4: Review & Pay)
  const [step, setStep] = useState<number>(1);

  // Loading & Wallet State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoadingWallet, setIsLoadingWallet] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    lgaOfResidence: "",
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

  // Validation before Step 3
  const handleValidateStep2 = () => {
    setErrorMessage(null);
    if (!deponent.fullName.trim()) {
      setErrorMessage("Please enter the deponent's full legal name.");
      return;
    }
    if (!deponent.dob) {
      setErrorMessage("Please select the deponent's Date of Birth.");
      return;
    }
    if (!deponent.streetAddress.trim()) {
      setErrorMessage("Please provide a valid residential street address.");
      return;
    }
    if (!deponent.signatureUrl) {
      setErrorMessage("Deponent signature is required. Please sign on the pad or upload a signature.");
      return;
    }
    setStep(3);
  };

  // Validation before Step 4
  const handleValidateStep3 = () => {
    setErrorMessage(null);
    if (category === "CAC_CORPORATE") {
      if (!cacFacts.companyName.trim() || !cacFacts.rcBnNumber.trim()) {
        setErrorMessage("Please provide Registered Company Name and RC/BN Number.");
        return;
      }
      if (cacFacts.subType === "CAC_SIGNATURE_CHANGE" && (!cacFacts.oldSignatureUrl || !cacFacts.newSignatureUrl)) {
        setErrorMessage("Please upload both the old specimen signature and new specimen signature.");
        return;
      }
    } else if (category === "CHANGE_OF_NAME") {
      if (!nameChangeFacts.oldName.trim() || !nameChangeFacts.newName.trim()) {
        setErrorMessage("Please enter both the previous name and the new legal name.");
        return;
      }
    } else if (category === "AGE_DECLARATION") {
      if (!ageFacts.declaredDob || !ageFacts.placeOfBirth.trim()) {
        setErrorMessage("Please enter the correct date of birth and place of birth.");
        return;
      }
    } else if (category === "LOSS_OF_ITEM") {
      if (!lossFacts.itemLost.trim()) {
        setErrorMessage("Please specify the item or document lost.");
        return;
      }
    } else if (category === "GENERAL_PURPOSE") {
      if (!generalFacts.title.trim()) {
        setErrorMessage("Please enter a title or purpose for this affidavit.");
        return;
      }
    }
    setStep(4);
  };

  // Build facts JSON payload
  const buildFactsPayload = () => {
    if (category === "CAC_CORPORATE") {
      return cacFacts;
    }
    if (category === "CHANGE_OF_NAME") {
      return nameChangeFacts;
    }
    if (category === "AGE_DECLARATION") {
      return ageFacts;
    }
    if (category === "LOSS_OF_ITEM") {
      return lossFacts;
    }
    if (category === "PROOF_OF_OWNERSHIP") {
      return ownershipFacts;
    }
    return {
      title: generalFacts.title.trim(),
      statements: generalFacts.statements.filter((s) => s.trim().length > 0),
    };
  };

  // Final Submit Action
  const handleSubmitAffidavit = async () => {
    setErrorMessage(null);
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
        router.push("/dashboard/affidavit/history");
      } else {
        setErrorMessage(data.message || "Failed to submit court affidavit.");
      }
    } catch (err: any) {
      console.error("Affidavit submission error:", err);
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 animate-in fade-in duration-300 font-sans text-left">
      
      {/* Top Header Breadcrumb */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} weight="bold" />
          <span>Back to Dashboard</span>
        </Link>

        <Link
          href="/dashboard/affidavit/history"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-foreground transition-colors"
        >
          <Receipt size={14} weight="bold" className="text-primary" />
          <span>My Affidavits</span>
        </Link>
      </div>

      {/* Main Title Banner */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Gavel size={24} weight="fill" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                Sworn Court Affidavit
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px]">
                High Court Sealed
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Official court-sworn, sealed, and stamped legal affidavits delivered in 2–5 hours.
            </p>
          </div>
        </div>

        <div className="px-3 py-2 rounded-xl bg-secondary/60 border border-border/70 text-center self-start sm:self-auto shrink-0">
          <span className="text-[10px] uppercase font-black text-muted-foreground block">Turnaround</span>
          <span className="text-xs font-black text-foreground flex items-center gap-1 justify-center">
            <Clock size={12} weight="bold" className="text-primary" /> 2–5 Hours
          </span>
        </div>
      </div>

      {/* Step Tracker */}
      <div className="grid grid-cols-4 gap-2 mb-8">
        {[
          { num: 1, label: "Category" },
          { num: 2, label: "Deponent Info" },
          { num: 3, label: "Sworn Facts" },
          { num: 4, label: "Review & Pay" },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => {
              if (s.num < step) setStep(s.num);
            }}
            className={`p-3 rounded-2xl border transition-all text-center ${
              step === s.num
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : step > s.num
                ? "bg-secondary/60 text-foreground border-border cursor-pointer hover:border-primary/50"
                : "bg-secondary/20 text-muted-foreground border-border/60 opacity-60"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider block">
              Step {s.num}
            </span>
            <span className="text-xs font-bold truncate block">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold mb-6 flex items-start gap-2.5 animate-in fade-in">
          <Warning size={18} weight="fill" className="shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* STEP 1: CATEGORY */}
      {step === 1 && (
        <Step1CategorySelect
          selectedCategory={category}
          onSelectCategory={(cat) => setCategory(cat)}
          onNext={() => {
            setErrorMessage(null);
            setStep(2);
          }}
        />
      )}

      {/* STEP 2: DEPONENT INFO */}
      {step === 2 && (
        <Step2DeponentInfo
          deponent={deponent}
          onChange={(updated) => setDeponent((prev) => ({ ...prev, ...updated }))}
          onBack={() => setStep(1)}
          onNext={handleValidateStep2}
        />
      )}

      {/* STEP 3: SWORN FACTS */}
      {step === 3 && (
        <Step3SwornFacts
          category={category}
          cacFacts={cacFacts}
          nameChangeFacts={nameChangeFacts}
          ageFacts={ageFacts}
          lossFacts={lossFacts}
          ownershipFacts={ownershipFacts}
          generalFacts={generalFacts}
          onUpdateCac={(updated) => setCacFacts((prev) => ({ ...prev, ...updated }))}
          onUpdateNameChange={(updated) => setNameChangeFacts((prev) => ({ ...prev, ...updated }))}
          onUpdateAge={(updated) => setAgeFacts((prev) => ({ ...prev, ...updated }))}
          onUpdateLoss={(updated) => setLossFacts((prev) => ({ ...prev, ...updated }))}
          onUpdateOwnership={(updated) => setOwnershipFacts((prev) => ({ ...prev, ...updated }))}
          onUpdateGeneral={(updated) => setGeneralFacts((prev) => ({ ...prev, ...updated }))}
          onBack={() => setStep(2)}
          onNext={handleValidateStep3}
        />
      )}

      {/* STEP 4: REVIEW & PAY */}
      {step === 4 && (
        <Step4ReviewPay
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
          onBack={() => setStep(3)}
          onSubmit={handleSubmitAffidavit}
        />
      )}

    </div>
  );
}
