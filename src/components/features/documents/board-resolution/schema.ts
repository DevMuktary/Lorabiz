import { 
  BoardResolutionFormData, 
  DirectorSignatory,
  StructuredResolutionOutput,
  ResolutionDesignTheme 
} from "@/lib/board-resolution-generator";

export const LOCAL_STORAGE_DRAFT_KEY = "lorabiz_board_res_draft";

export const NIGERIAN_PAYMENT_GATEWAYS = [
  "Paystack Payments Limited",
  "Flutterwave Technology Solutions",
  "Monnify (TeamApt / Moniepoint)",
  "Squad (HabariPay / GTCO)",
  "Interswitch Group / Quickteller",
  "Remita (SystemSpecs)",
  "Payaza Africa",
  "Korapay Technologies",
  "Nomba (Kudi)",
  "Kuda Business Gateway"
];

export const PRESET_ACCENT_COLORS = [
  { name: "Royal Navy", hex: "#0f172a" },
  { name: "Executive Indigo", hex: "#1e3a8a" },
  { name: "Forest Emerald", hex: "#064e3b" },
  { name: "Corporate Burgundy", hex: "#881337" },
  { name: "Classic Slate", hex: "#334155" },
  { name: "Bronze Gold", hex: "#78350f" },
  { name: "Regal Purple", hex: "#581c87" },
  { name: "Crimson Red", hex: "#991b1b" },
  { name: "Deep Teal", hex: "#115e59" },
];

export const DIRECTOR_DESIGNATIONS = [
  "Managing Director / CEO",
  "Director",
  "Company Secretary",
  "Chairman",
  "Executive Director",
  "Proprietor",
  "Other"
] as const;

export const ACCOUNT_CURRENCIES = [
  "NGN (Nigerian Naira / ₦)",
  "USD (United States Dollar / $)",
  "GBP (British Pound / £)",
  "EUR (Euro / €)",
  "Multi-Currency (NGN, USD, GBP, EUR)"
];

export const PURPOSE_CATEGORIES = [
  {
    id: "BANK_ACCOUNT",
    title: "Commercial Bank Account",
    desc: "Open, operate, or update accounts with any CBN-licensed commercial bank."
  },
  {
    id: "PAYMENT_GATEWAY",
    title: "Payment Gateway / Fintech KYC",
    desc: "Authorize integration with Paystack, Flutterwave, Monnify, Squad, etc."
  },
  {
    id: "LOAN_FACILITY",
    title: "Credit / Loan / Overdraft",
    desc: "Authorize credit lines, business loans, or asset financing applications."
  },
  {
    id: "GENERAL_CORPORATE",
    title: "Corporate Mandate / Operations",
    desc: "Authorize contract signing, asset disposal, or statutory representations."
  },
  {
    id: "OTHER",
    title: "Custom Specific Purpose",
    desc: "Specify bespoke board decisions, special resolutions, or regulatory filings."
  }
] as const;

export const MANDATE_RULES = [
  {
    id: "ANY_ONE",
    title: "Any One (1) Director / Proprietor Alone",
    desc: "Sole signatory mandate (Managing Director, designated Director, or Sole Proprietor)"
  },
  {
    id: "ANY_TWO",
    title: "Any Two (2) Directors Jointly",
    desc: "Standard corporate governance check (e.g. Any 2 executive officers)"
  },
  {
    id: "CHAIRMAN_AND_SECRETARY",
    title: "Chairman AND Company Secretary Jointly",
    desc: "Formal statutory corporate secretarial signing combination"
  },
  {
    id: "ALL_DIRECTORS",
    title: "All Named Directors Jointly",
    desc: "Unanimous signature required across all board members"
  },
  {
    id: "CUSTOM",
    title: "Custom Designated Combination",
    desc: "Specify exact signatories (e.g., 'Director A' plus any one other)"
  }
] as const;

export const GENERATION_STAGES = [
  {
    step: "01",
    title: "Analyzing Corporate Structure & CAMA 2020 Mandates",
    desc: "Validating company credentials, directorship quorum, and statutory authority under Nigerian law.",
    badge: "Stage 1/5"
  },
  {
    step: "02",
    title: "Architecting Formal Visual Layout & Typography",
    desc: "Designing tailored heraldic letterhead, security frames, and certified typography archetype.",
    badge: "Stage 2/5"
  },
  {
    step: "03",
    title: "Synthesizing Bank & Fintech Operative Clauses",
    desc: "Drafting watertight resolutions tailored specifically for the target financial institution.",
    badge: "Stage 3/5"
  },
  {
    step: "04",
    title: "Engraving Company Seal, Signatures & Attestation",
    desc: "Binding digital director signatures, corporate seal badge, and verification reference hash.",
    badge: "Stage 4/5"
  },
  {
    step: "05",
    title: "Rendering High-Definition Document Snapshot",
    desc: "Finalizing rasterization for photorealistic presentation and download.",
    badge: "Stage 5/5"
  }
];

/**
 * Robust XHR File Uploader with Live Progress Percentage (0% - 100%)
 */
export function uploadFileWithProgress(
  file: File,
  onProgress: (percent: number) => void
): Promise<{ success: boolean; url?: string; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const uploadData = new FormData();
    uploadData.append("file", file);

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            resolve({ success: true, url: data.url });
          } else {
            resolve({ success: false, error: data.error || "Upload failed." });
          }
        } catch {
          resolve({ success: false, error: "Invalid server response." });
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ success: false, error: data.error || `Upload failed with status ${xhr.status}` });
        } catch {
          resolve({ success: false, error: `Upload failed with status ${xhr.status}` });
        }
      }
    });

    xhr.addEventListener("error", () => {
      resolve({ success: false, error: "Network error during upload." });
    });

    xhr.open("POST", "/api/upload");
    xhr.send(uploadData);
  });
}

// Step 1 Validation (Company Details)
export function validateStep1(data: BoardResolutionFormData): { isValid: boolean; error?: string } {
  if (!data.companyName?.trim()) {
    return { isValid: false, error: "Please enter the registered Company or Business Name." };
  }
  if (!data.registeredAddress?.trim()) {
    return { isValid: false, error: "Please enter the Registered Business Address." };
  }
  if (!data.meetingDate?.trim()) {
    return { isValid: false, error: "Please specify the Meeting / Resolution Date." };
  }
  return { isValid: true };
}

// Step 2 Validation (Purpose & Target Institution)
export function validateStep2(data: BoardResolutionFormData): { isValid: boolean; error?: string } {
  if (!data.targetInstitution?.trim()) {
    return { isValid: false, error: "Please enter or select the Target Bank or Financial Institution." };
  }
  if (data.purposeCategory === "OTHER" && !data.customPurposeDescription?.trim()) {
    return { isValid: false, error: "Please describe the specific resolution purpose for 'Other'." };
  }
  return { isValid: true };
}

// Step 3 Validation (Directors & Signatures)
export function validateStep3(data: BoardResolutionFormData): { isValid: boolean; error?: string } {
  if (!data.directors || data.directors.length === 0) {
    return { isValid: false, error: "Please list at least one (1) Director, Officer, or Proprietor." };
  }
  for (let i = 0; i < data.directors.length; i++) {
    if (!data.directors[i].fullName?.trim()) {
      return { isValid: false, error: `Director #${i + 1} name cannot be empty.` };
    }
  }
  const hasSignatory = data.directors.some((d) => d.isSignatory);
  if (!hasSignatory) {
    return { isValid: false, error: "At least one (1) person must be designated as an authorized signatory." };
  }
  if (data.signingMandate === "CUSTOM" && !data.customMandateText?.trim()) {
    return { isValid: false, error: "Please write the custom signing mandate instructions." };
  }
  return { isValid: true };
}
