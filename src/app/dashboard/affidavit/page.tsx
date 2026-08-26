"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Gavel,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  Clock,
  ShieldCheck,
  Warning,
  Sparkle,
  Spinner,
  UploadSimple,
  PencilSimple,
  Eraser,
  Buildings,
  TextT,
  Cake,
  FileText,
  Car,
  Scales,
  User,
  Wallet,
  Receipt,
  Info,
} from "@phosphor-icons/react";
import { NIGERIA_STATES_LGA } from "@/lib/nigeria-states";
import { useLoyalty } from "@/lib/useLoyalty";
import { FileUpload } from "@/components/FileUpload";

// ==========================================
// CATEGORY DEFINITIONS
// ==========================================
interface AffidavitCategoryDef {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  badge?: string;
  popular?: boolean;
}

const CATEGORIES: AffidavitCategoryDef[] = [
  {
    id: "CAC_CORPORATE",
    title: "CAC Corporate Affidavits",
    subtitle: "Loss of Certificate / MEMART, Signature Variation, Director / Shareholder correction",
    icon: Buildings,
    badge: "Official CAC",
    popular: true,
  },
  {
    id: "CHANGE_OF_NAME",
    title: "Change / Correction of Name",
    subtitle: "For NIN, BVN, Bank accounts, NYSC, International Passport, and Academic credentials",
    icon: TextT,
    badge: "Most Popular",
    popular: true,
  },
  {
    id: "AGE_DECLARATION",
    title: "Age Declaration / DOB Correction",
    subtitle: "Official declaration of age or date of birth correction for NIN, pension, or employment",
    icon: Cake,
    badge: "High Demand",
  },
  {
    id: "LOSS_OF_ITEM",
    title: "Loss of Document / SIM Card",
    subtitle: "Sworn affidavit for lost MTN/Airtel/Glo SIM, original certificates, or vehicle papers",
    icon: FileText,
  },
  {
    id: "PROOF_OF_OWNERSHIP",
    title: "Proof of Ownership / Next of Kin",
    subtitle: "Vehicle ownership, property, electronics, or declaration of marital/single status",
    icon: Car,
  },
  {
    id: "GENERAL_PURPOSE",
    title: "General Purpose Sworn Affidavit",
    subtitle: "Custom sworn legal statement of facts stamped by the Commissioner for Oaths",
    icon: Scales,
  },
];

const BASE_PRICE = 3500;

export default function CourtAffidavitPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { profile: loyaltyProfile } = useLoyalty();

  // Wizard Step (1: Category, 2: Deponent, 3: Facts, 4: Review & Pay)
  const [step, setStep] = useState<number>(1);

  // Loading & Error States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoadingWallet, setIsLoadingWallet] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<string>("CHANGE_OF_NAME");
  const [subCategory, setSubCategory] = useState<string>("CAC_LOSS_OF_CERTIFICATE");

  // Deponent Info
  const [deponentFullName, setDeponentFullName] = useState<string>("");
  const [passportUrl, setPassportUrl] = useState<string | null>(null);
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [dob, setDob] = useState<string>("");
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [religion, setReligion] = useState<string>("Christianity");
  const [nationality, setNationality] = useState<string>("Nigerian");
  const [stateOfResidence, setStateOfResidence] = useState<string>("LAGOS");
  const [lgaOfResidence, setLgaOfResidence] = useState<string>("");
  const [streetAddress, setStreetAddress] = useState<string>("");
  const [occupation, setOccupation] = useState<string>("");

  // Signature (Draw or Upload)
  const [signatureMode, setSignatureMode] = useState<"DRAW" | "UPLOAD">("DRAW");
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Category Specific Facts
  // 1. CAC
  const [cacCompanyName, setCacCompanyName] = useState<string>("");
  const [cacRcBnNumber, setCacRcBnNumber] = useState<string>("");
  const [cacDocLost, setCacDocLost] = useState<string>("Certificate of Incorporation");
  const [cacLossDate, setCacLossDate] = useState<string>("");
  const [cacLossDetails, setCacLossDetails] = useState<string>("");
  const [cacPoliceReportNo, setCacPoliceReportNo] = useState<string>("");
  const [cacDirectorName, setCacDirectorName] = useState<string>("");
  const [cacOldDetail, setCacOldDetail] = useState<string>("");
  const [cacNewDetail, setCacNewDetail] = useState<string>("");

  // 2. Change of Name
  const [oldName, setOldName] = useState<string>("");
  const [newName, setNewName] = useState<string>("");
  const [nameChangeReason, setNameChangeReason] = useState<string>("Marriage");
  const [nameChangeDestination, setNameChangeDestination] = useState<string>("NIMC / NIN & Banking Records");

  // 3. Age Declaration
  const [declaredDob, setDeclaredDob] = useState<string>("");
  const [placeOfBirth, setPlaceOfBirth] = useState<string>("");
  const [stateOfBirth, setStateOfBirth] = useState<string>("LAGOS");
  const [ageDeclarationReason, setAgeDeclarationReason] = useState<string>("Birth Certificate Not Available at Birth");

  // 4. Loss of Item
  const [itemLostName, setItemLostName] = useState<string>("");
  const [itemIdentifyingNo, setItemIdentifyingNo] = useState<string>("");
  const [itemLossDate, setItemLossDate] = useState<string>("");
  const [itemLossLocation, setItemLossLocation] = useState<string>("");
  const [itemPoliceReportNo, setItemPoliceReportNo] = useState<string>("");

  // 5. Proof of Ownership / Status
  const [ownershipSubject, setOwnershipSubject] = useState<string>("Vehicle / Automobile");
  const [ownershipDetails, setOwnershipDetails] = useState<string>("");
  const [ownershipIdNumber, setOwnershipIdNumber] = useState<string>("");

  // 6. General Purpose
  const [generalTitle, setGeneralTitle] = useState<string>("");
  const [generalStatements, setGeneralStatements] = useState<string[]>([
    "That I am the deponent herein and a lawful citizen of the Federal Republic of Nigeria.",
    "That the statements made herein are true, correct, and in accordance with the Oaths Act.",
    "",
  ]);

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

  // Pre-fill Deponent Name if session is active
  useEffect(() => {
    if (session?.user?.name && !deponentFullName) {
      setDeponentFullName(session.user.name);
    }
  }, [session, deponentFullName]);

  // Real-time Age Calculation from DOB
  useEffect(() => {
    if (!dob) {
      setCalculatedAge(null);
      return;
    }
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) {
      setCalculatedAge(null);
      return;
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    setCalculatedAge(age);
  }, [dob]);

  // Set default LGA when state changes
  useEffect(() => {
    const lgas = NIGERIA_STATES_LGA[stateOfResidence] || [];
    if (lgas.length > 0 && (!lgaOfResidence || !lgas.includes(lgaOfResidence))) {
      setLgaOfResidence(lgas[0]);
    }
  }, [stateOfResidence, lgaOfResidence]);

  // Canvas Signature Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureUrl(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureUrl(null);
    }
  };

  // Price Calculation with User's Loyalty Tier
  const tierDiscountPct = loyaltyProfile?.currentTier?.discountPct || 0;
  const discountAmount = Math.round((BASE_PRICE * tierDiscountPct) / 100);
  const finalPrice = Math.max(0, BASE_PRICE - discountAmount);
  const hasEnoughFunds = walletBalance >= finalPrice;

  // Validation before progressing
  const validateStep2 = (): boolean => {
    setErrorMessage(null);
    if (!deponentFullName.trim()) {
      setErrorMessage("Please enter the deponent's full legal name.");
      return false;
    }
    if (!dob) {
      setErrorMessage("Please select the deponent's Date of Birth.");
      return false;
    }
    if (!streetAddress.trim()) {
      setErrorMessage("Please provide a valid residential street address.");
      return false;
    }
    if (!signatureUrl) {
      setErrorMessage("Please provide the deponent signature (draw on canvas or upload image).");
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    setErrorMessage(null);
    if (category === "CAC_CORPORATE") {
      if (!cacCompanyName.trim() || !cacRcBnNumber.trim()) {
        setErrorMessage("Please provide the Registered CAC Company Name and RC/BN Number.");
        return false;
      }
    } else if (category === "CHANGE_OF_NAME") {
      if (!oldName.trim() || !newName.trim()) {
        setErrorMessage("Please provide both the previous name and the new legal name.");
        return false;
      }
    } else if (category === "AGE_DECLARATION") {
      if (!declaredDob || !placeOfBirth.trim()) {
        setErrorMessage("Please provide the correct date of birth and place of birth.");
        return false;
      }
    } else if (category === "LOSS_OF_ITEM") {
      if (!itemLostName.trim()) {
        setErrorMessage("Please specify the item or document that was lost.");
        return false;
      }
    } else if (category === "GENERAL_PURPOSE") {
      if (!generalTitle.trim()) {
        setErrorMessage("Please enter a title or purpose for this affidavit.");
        return false;
      }
    }
    return true;
  };

  // Assemble facts JSON payload
  const buildFactsPayload = () => {
    if (category === "CAC_CORPORATE") {
      return {
        subType: subCategory,
        companyName: cacCompanyName.trim(),
        rcBnNumber: cacRcBnNumber.trim(),
        documentLost: cacDocLost,
        lossDate: cacLossDate,
        lossDetails: cacLossDetails,
        policeReportNo: cacPoliceReportNo,
        directorName: cacDirectorName,
        oldDetail: cacOldDetail,
        newDetail: cacNewDetail,
      };
    }
    if (category === "CHANGE_OF_NAME") {
      return {
        oldName: oldName.trim(),
        newName: newName.trim(),
        reason: nameChangeReason,
        usageDestination: nameChangeDestination,
      };
    }
    if (category === "AGE_DECLARATION") {
      return {
        correctDob: declaredDob,
        placeOfBirth: placeOfBirth.trim(),
        stateOfBirth,
        reason: ageDeclarationReason,
      };
    }
    if (category === "LOSS_OF_ITEM") {
      return {
        itemLost: itemLostName.trim(),
        identifyingNumber: itemIdentifyingNo.trim(),
        lossDate: itemLossDate,
        lossLocation: itemLossLocation.trim(),
        policeReportNo: itemPoliceReportNo.trim(),
      };
    }
    if (category === "PROOF_OF_OWNERSHIP") {
      return {
        subject: ownershipSubject,
        details: ownershipDetails.trim(),
        idNumber: ownershipIdNumber.trim(),
      };
    }
    return {
      title: generalTitle.trim(),
      statements: generalStatements.filter((s) => s.trim().length > 0),
    };
  };

  // Final Submit Handler
  const handleSubmitAffidavit = async () => {
    setErrorMessage(null);
    if (!hasEnoughFunds) {
      setErrorMessage(`Insufficient wallet balance. Please fund your wallet with at least ₦${finalPrice.toLocaleString()}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const fullAddress = `${streetAddress.trim()}, ${lgaOfResidence}, ${stateOfResidence} State, Nigeria`;
      const payload = {
        category,
        subCategory: category === "CAC_CORPORATE" ? subCategory : null,
        deponentFullName: deponentFullName.trim(),
        passportUrl,
        gender,
        dob,
        religion,
        nationality,
        residentialAddress: fullAddress,
        occupation: occupation.trim() || undefined,
        signatureUrl,
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
      
      {/* Top Header */}
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

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="px-3 py-2 rounded-xl bg-secondary/60 border border-border/70 text-center">
            <span className="text-[10px] uppercase font-black text-muted-foreground block">Turnaround</span>
            <span className="text-xs font-black text-foreground flex items-center gap-1 justify-center">
              <Clock size={12} weight="bold" className="text-primary" /> 2–5 Hours
            </span>
          </div>
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

      {/* ========================================================================= */}
      {/* STEP 1: SELECT CATEGORY                                                   */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="border-b border-border pb-3">
            <h2 className="text-base font-black text-foreground">
              Select Affidavit Category
            </h2>
            <p className="text-xs text-muted-foreground">
              Choose the specific type of court affidavit you wish to process.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                      : "border-border bg-card hover:border-border/80 hover:bg-secondary/30"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                      }`}>
                        <Icon size={20} weight={isSelected ? "fill" : "bold"} />
                      </div>
                      {cat.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border text-[9px] font-black uppercase tracking-wider">
                          {cat.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-foreground mb-1">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {cat.subtitle}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground text-[11px]">Court Sworn</span>
                    <span className={isSelected ? "text-primary font-black flex items-center gap-1" : "text-muted-foreground"}>
                      {isSelected ? <><Check size={14} weight="bold" /> Selected</> : "Select ➔"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStep(2);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <span>Continue to Deponent Info</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: DEPONENT PARTICULARS                                              */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in bg-card border border-border p-5 sm:p-7 rounded-3xl shadow-xs">
          <div className="border-b border-border pb-3">
            <h2 className="text-base font-black text-foreground">
              Deponent Information (The Person Swearing Oath)
            </h2>
            <p className="text-xs text-muted-foreground">
              These personal details will appear officially on the preamble of the Court Affidavit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Deponent Full Name */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Deponent Full Name (First, Middle, Surname) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={deponentFullName}
                onChange={(e) => setDeponentFullName(e.target.value)}
                placeholder="e.g. Ibrahim Chukwuma Adeleke"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>

            {/* Passport Photo Upload */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Deponent Passport Photograph (Clear White/Red Background)
              </label>
              <FileUpload
                label="Upload Passport Photo"
                description="High resolution portrait photo for official court seal"
                value={passportUrl}
                accept="image/jpeg, image/png"
                aspectRatio={1}
                onUploadSuccess={(url) => setPassportUrl(url)}
                onRemove={() => setPassportUrl(null)}
              />
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
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
                {calculatedAge !== null && (
                  <span className={`text-[10px] font-black px-2 py-0.2 rounded-md ${
                    calculatedAge >= 18 
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  }`}>
                    {calculatedAge} Years ({calculatedAge >= 18 ? "Adult Verified" : "Minor"})
                  </span>
                )}
              </div>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>

            {/* Religion (Pre-amble Oath Requirement) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Religion (For Court Oath Formula) <span className="text-rose-500">*</span>
              </label>
              <select
                value={religion}
                onChange={(e) => setReligion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
              >
                <option value="Christianity">Christianity (Holy Bible)</option>
                <option value="Islam">Islam (Holy Quran)</option>
                <option value="Others">Affirmation (Non-Religious)</option>
              </select>
            </div>

            {/* Nationality */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Nationality
              </label>
              <input
                type="text"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>

            {/* State of Residence */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                State of Residence <span className="text-rose-500">*</span>
              </label>
              <select
                value={stateOfResidence}
                onChange={(e) => setStateOfResidence(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
              >
                {Object.keys(NIGERIA_STATES_LGA).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* LGA of Residence */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                LGA of Residence <span className="text-rose-500">*</span>
              </label>
              <select
                value={lgaOfResidence}
                onChange={(e) => setLgaOfResidence(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
              >
                {(NIGERIA_STATES_LGA[stateOfResidence] || []).map((lga) => (
                  <option key={lga} value={lga}>{lga}</option>
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
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="e.g. Plot 14, Admiralty Way, Lekki Phase 1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>

            {/* Occupation */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Occupation / Profession
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Business Executive, Civil Servant, Trader, Student"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>

            {/* ========================================================= */}
            {/* SIGNATURE SECTION (CANVAS OR UPLOAD)                      */}
            {/* ========================================================= */}
            <div className="md:col-span-2 space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Deponent Signature <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5 bg-secondary/80 p-1 rounded-xl border border-border text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSignatureMode("DRAW")}
                    className={`px-2.5 py-0.5 rounded-lg font-bold transition-colors ${
                      signatureMode === "DRAW" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground"
                    }`}
                  >
                    Draw Signature
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureMode("UPLOAD")}
                    className={`px-2.5 py-0.5 rounded-lg font-bold transition-colors ${
                      signatureMode === "UPLOAD" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground"
                    }`}
                  >
                    Upload File
                  </button>
                </div>
              </div>

              {signatureMode === "DRAW" ? (
                <div className="space-y-2">
                  <div className="border border-border rounded-2xl bg-white overflow-hidden shadow-inner relative">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={160}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-40 touch-none cursor-crosshair"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground text-[10px] font-bold flex items-center gap-1"
                      >
                        <Eraser size={12} weight="bold" /> Clear
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium text-center">
                    Sign cleanly within the box above using your mouse or finger.
                  </p>
                </div>
              ) : (
                <div>
                  <FileUpload
                    label="Upload Signature Image"
                    description="Upload clean signature on plain white paper"
                    value={signatureUrl}
                    accept="image/jpeg, image/png"
                    aspectRatio={2}
                    onUploadSuccess={(url) => setSignatureUrl(url)}
                    onRemove={() => setSignatureUrl(null)}
                  />
                </div>
              )}
            </div>

          </div>

          <div className="pt-4 flex items-center justify-between border-t border-border">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft size={14} weight="bold" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (validateStep2()) setStep(3);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              <span>Continue to Sworn Facts</span>
              <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: CATEGORY SPECIFIC SWORN FACTS                                     */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in bg-card border border-border p-5 sm:p-7 rounded-3xl shadow-xs">
          <div className="border-b border-border pb-3">
            <h2 className="text-base font-black text-foreground">
              Sworn Affidavit Specifics
            </h2>
            <p className="text-xs text-muted-foreground">
              Provide the exact factual statements and references required for this affidavit category.
            </p>
          </div>

          {/* 1. CAC CORPORATE AFFIDAVITS */}
          {category === "CAC_CORPORATE" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border">
                <label className="text-xs font-bold text-foreground block mb-2">
                  Select Corporate Matter
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "CAC_LOSS_OF_CERTIFICATE", label: "Loss of CAC Certificate / MEMART" },
                    { id: "CAC_SIGNATURE_CHANGE", label: "Change / Variation of Signature" },
                    { id: "CAC_DIRECTOR_CORRECTION", label: "Correction of Director Details" },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSubCategory(sub.id)}
                      className={`p-2.5 rounded-xl text-left text-xs font-bold border transition-all ${
                        subCategory === sub.id
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-background border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Registered Company / Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cacCompanyName}
                    onChange={(e) => setCacCompanyName(e.target.value)}
                    placeholder="e.g. LORABIZ ENTERPRISE LIMITED"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    RC or BN Registration Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cacRcBnNumber}
                    onChange={(e) => setCacRcBnNumber(e.target.value)}
                    placeholder="e.g. RC-1928374 or BN-2839481"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                {subCategory === "CAC_LOSS_OF_CERTIFICATE" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Document Lost</label>
                      <select
                        value={cacDocLost}
                        onChange={(e) => setCacDocLost(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                      >
                        <option value="Certificate of Incorporation">Certificate of Incorporation (Original)</option>
                        <option value="Memorandum and Articles of Association (MEMART)">MEMART (Certified Copy)</option>
                        <option value="CAC Status Report / Form CAC 1.1">Status Report / Form CAC 1.1</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Approximate Date of Loss</label>
                      <input
                        type="date"
                        value={cacLossDate}
                        onChange={(e) => setCacLossDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Police Extract / Report Number (Optional)</label>
                      <input
                        type="text"
                        value={cacPoliceReportNo}
                        onChange={(e) => setCacPoliceReportNo(e.target.value)}
                        placeholder="e.g. DPO/IKJ/CR/2026/91"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                      />
                    </div>
                  </>
                )}

                {subCategory === "CAC_SIGNATURE_CHANGE" && (
                  <>
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Director / Proprietor Name</label>
                      <input
                        type="text"
                        value={cacDirectorName}
                        onChange={(e) => setCacDirectorName(e.target.value)}
                        placeholder="Name of director changing signature"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Reason for Signature Change</label>
                      <input
                        type="text"
                        value={cacLossDetails}
                        onChange={(e) => setCacLossDetails(e.target.value)}
                        placeholder="e.g. Variation from portal record, physical injury, standardization"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                      />
                    </div>
                  </>
                )}

                {subCategory === "CAC_DIRECTOR_CORRECTION" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Erroneous Entry on CAC Portal</label>
                      <input
                        type="text"
                        value={cacOldDetail}
                        onChange={(e) => setCacOldDetail(e.target.value)}
                        placeholder="e.g. John Adebayo (Wrong spelling or DOB)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Correct Legal Entry</label>
                      <input
                        type="text"
                        value={cacNewDetail}
                        onChange={(e) => setCacNewDetail(e.target.value)}
                        placeholder="e.g. John Oluwaseun Adebayo"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 2. CHANGE OF NAME */}
          {category === "CHANGE_OF_NAME" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Former / Old Name (As on Old Records) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={oldName}
                  onChange={(e) => setOldName(e.target.value)}
                  placeholder="e.g. Mary Ngozi Okafor"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  New Desired Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Mary Ngozi Adeleke"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Reason for Name Change</label>
                <select
                  value={nameChangeReason}
                  onChange={(e) => setNameChangeReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                >
                  <option value="Marriage">Marriage (Change of Marital Surname)</option>
                  <option value="Correction of Typographical Error">Correction of Typographical Error on Records</option>
                  <option value="Personal Decision / Re-arrangement">Personal Decision / Name Re-arrangement</option>
                  <option value="Religious Conversion">Religious Conversion</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Where It Will Be Presented</label>
                <input
                  type="text"
                  value={nameChangeDestination}
                  onChange={(e) => setNameChangeDestination(e.target.value)}
                  placeholder="e.g. NIMC/NIN, Commercial Banks/BVN, NYSC, Passport"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* 3. AGE DECLARATION */}
          {category === "AGE_DECLARATION" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Correct Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={declaredDob}
                  onChange={(e) => setDeclaredDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Place of Birth (Town / City) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={placeOfBirth}
                  onChange={(e) => setPlaceOfBirth(e.target.value)}
                  placeholder="e.g. Ikeja"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">State of Birth</label>
                <select
                  value={stateOfBirth}
                  onChange={(e) => setStateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                >
                  {Object.keys(NIGERIA_STATES_LGA).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Reason for Affidavit</label>
                <input
                  type="text"
                  value={ageDeclarationReason}
                  onChange={(e) => setAgeDeclarationReason(e.target.value)}
                  placeholder="e.g. Birth certificate unavailable at time of birth / NIN regularization"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* 4. LOSS OF ITEM */}
          {category === "LOSS_OF_ITEM" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Item or Document Lost <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={itemLostName}
                  onChange={(e) => setItemLostName(e.target.value)}
                  placeholder="e.g. MTN SIM Card, Original WAEC Certificate, Driver License"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Identifying Number (Phone No / Cert No)
                </label>
                <input
                  type="text"
                  value={itemIdentifyingNo}
                  onChange={(e) => setItemIdentifyingNo(e.target.value)}
                  placeholder="e.g. 0803XXXXXXX or WASSCE/2018/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Date of Loss</label>
                <input
                  type="date"
                  value={itemLossDate}
                  onChange={(e) => setItemLossDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Location / Town Where Lost</label>
                <input
                  type="text"
                  value={itemLossLocation}
                  onChange={(e) => setItemLossLocation(e.target.value)}
                  placeholder="e.g. En route Ikeja to Victoria Island, Lagos"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* 5. PROOF OF OWNERSHIP */}
          {category === "PROOF_OF_OWNERSHIP" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Ownership Subject</label>
                <input
                  type="text"
                  value={ownershipSubject}
                  onChange={(e) => setOwnershipSubject(e.target.value)}
                  placeholder="e.g. Toyota Corolla 2018, Land Parcel, Apple iPhone"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Chassis / Engine / Serial / IMEI Number</label>
                <input
                  type="text"
                  value={ownershipIdNumber}
                  onChange={(e) => setOwnershipIdNumber(e.target.value)}
                  placeholder="e.g. JTD123456789 or Serial Number"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-foreground">Acquisition &amp; Ownership Particulars</label>
                <textarea
                  rows={3}
                  value={ownershipDetails}
                  onChange={(e) => setOwnershipDetails(e.target.value)}
                  placeholder="Provide details of purchase, date, vendor, and that you are the lawful owner."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* 6. GENERAL PURPOSE */}
          {category === "GENERAL_PURPOSE" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Affidavit Title / Matter <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={generalTitle}
                  onChange={(e) => setGeneralTitle(e.target.value)}
                  placeholder="e.g. Affidavit of Bachelorhood / Good Character / Non-Indebtedness"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  Sworn Statements (Clause by Clause)
                </label>
                {generalStatements.map((stmt, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-xs font-black text-muted-foreground pt-2.5 shrink-0">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={stmt}
                      onChange={(e) => {
                        const copy = [...generalStatements];
                        copy[idx] = e.target.value;
                        setGeneralStatements(copy);
                      }}
                      placeholder={`Statement clause ${idx + 1}`}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setGeneralStatements([...generalStatements, ""])}
                  className="text-xs font-bold text-primary hover:underline pt-1 block"
                >
                  + Add Another Statement Clause
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-border">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft size={14} weight="bold" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (validateStep3()) setStep(4);
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              <span>Review &amp; Pay</span>
              <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: REVIEW & WALLET CHECKOUT                                          */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Summary Preview Box */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={22} weight="fill" className="text-emerald-500" />
                <h2 className="text-base font-black text-foreground">
                  Review Court Affidavit Particulars
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-black text-[10px]">
                Ready for Stamping
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-2">
                <span className="text-[10px] font-black uppercase text-muted-foreground block">
                  Deponent Particulars
                </span>
                <p className="font-bold text-foreground text-sm">{deponentFullName}</p>
                <p className="text-muted-foreground">{gender} • {calculatedAge} Years Old ({religion})</p>
                <p className="text-muted-foreground truncate">{streetAddress}, {lgaOfResidence}, {stateOfResidence}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-2">
                <span className="text-[10px] font-black uppercase text-muted-foreground block">
                  Affidavit Details
                </span>
                <p className="font-bold text-foreground text-sm">
                  {CATEGORIES.find((c) => c.id === category)?.title}
                </p>
                {category === "CHANGE_OF_NAME" && (
                  <p className="text-muted-foreground">From: <strong>{oldName}</strong> ➔ To: <strong>{newName}</strong></p>
                )}
                {category === "CAC_CORPORATE" && (
                  <p className="text-muted-foreground font-mono">{cacCompanyName} ({cacRcBnNumber})</p>
                )}
                {category === "AGE_DECLARATION" && (
                  <p className="text-muted-foreground">Declared DOB: <strong>{declaredDob}</strong> ({placeOfBirth})</p>
                )}
                {category === "LOSS_OF_ITEM" && (
                  <p className="text-muted-foreground">Lost: <strong>{itemLostName}</strong> {itemIdentifyingNo && `(${itemIdentifyingNo})`}</p>
                )}
                <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <Clock size={12} weight="bold" /> Estimated Fulfillment: 2–5 Hours
                </p>
              </div>
            </div>
          </div>

          {/* Pricing & Checkout Card */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Payment Breakdown
              </span>
              <div className="flex items-center gap-2">
                <Wallet size={14} className="text-primary" />
                <span className="text-xs font-bold text-muted-foreground">
                  Your Balance: <strong className="text-foreground">₦{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground text-xs">
                <span>Standard Court Stamping &amp; Seal Fee</span>
                <span className="font-semibold text-foreground">₦{BASE_PRICE.toLocaleString()}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <span>Level {loyaltyProfile?.currentTier?.name || "VIP"} Discount ({tierDiscountPct}%)</span>
                  <span>-₦{discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-2 border-t border-border flex justify-between items-baseline">
                <span className="font-black text-foreground text-base">Total Amount to Pay</span>
                <span className="text-2xl font-black text-primary">
                  ₦{finalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {!hasEnoughFunds ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-amber-700 dark:text-amber-400 font-medium">
                  <strong>Insufficient Balance:</strong> You need ₦{(finalPrice - walletBalance).toLocaleString()} more to proceed.
                </div>
                <Link
                  href="/dashboard/wallet"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-center shrink-0 shadow-xs"
                >
                  Fund Wallet Now
                </Link>
              </div>
            ) : null}

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-colors"
              >
                Back to Edit
              </button>

              <button
                type="button"
                disabled={isSubmitting || !hasEnoughFunds}
                onClick={handleSubmitAffidavit}
                className="flex-1 max-w-xs inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={18} className="animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Gavel size={18} weight="fill" />
                    <span>Pay ₦{finalPrice.toLocaleString()} &amp; Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
