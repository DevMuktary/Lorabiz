import { getAIClient } from "./ai-client";

export interface DirectorSignatory {
  id: string;
  fullName: string;
  designation: "Managing Director / CEO" | "Director" | "Company Secretary" | "Chairman" | "Executive Director" | "Other";
  customDesignation?: string;
  isSignatory: boolean;
  bvnOrNin?: string;
  signatureUrl?: string;
}

export interface BoardResolutionFormData {
  companyName: string;
  rcNumber?: string;
  registeredAddress: string;
  meetingDate: string;
  meetingVenue?: string;
  
  // Purpose
  purposeCategory: "BANK_ACCOUNT" | "PAYMENT_GATEWAY" | "LOAN_FACILITY" | "GENERAL_CORPORATE" | "OTHER";
  targetInstitution: string; // e.g., "Access Bank Plc" or "Paystack Payments Limited"
  institutionBranch?: string; // e.g., "Victoria Island Branch"
  accountCurrency?: string; // e.g., "NGN (Nigerian Naira)" | "USD" | "Multi-Currency"
  customPurposeDescription?: string; // User notes or details in plain English
  
  // Mandate Rule
  signingMandate: "ANY_ONE" | "ANY_TWO" | "CHAIRMAN_AND_SECRETARY" | "ALL_DIRECTORS" | "CUSTOM";
  customMandateText?: string;
  
  // Directors / Officers
  directors: DirectorSignatory[];
  
  // Design & Letterhead
  accentColor?: string; // e.g. "#0f172a" or brand color
  logoUrl?: string;
  sealUrl?: string; // Company stamp/seal image URL
}

export interface StructuredResolutionOutput {
  title: string;
  letterhead: {
    companyName: string;
    rcNumber: string;
    registeredAddress: string;
  };
  meetingMetadata: {
    date: string;
    venue: string;
    commencementText: string;
  };
  recitals: string[]; // "WHEREAS..." clauses
  operativeClauses: Array<{
    heading: string;
    text: string;
  }>; // "RESOLVED THAT..." clauses
  mandateClause: string;
  certificationText: string;
  signatories: Array<{
    name: string;
    role: string;
    isSignatory: boolean;
    signatureUrl?: string;
  }>;
  logoUrl?: string;
  sealUrl?: string;
}

/**
 * Fallback deterministic template generator ensuring 100% uptime
 * and full CAMA 2020 compliance even without AI.
 */
export function generateDeterministicResolution(data: BoardResolutionFormData): StructuredResolutionOutput {
  const companyNameUpper = (data.companyName || "THE COMPANY").toUpperCase();
  const rcText = data.rcNumber ? `(RC: ${data.rcNumber.replace(/^RC:?\s*/i, "")})` : "";
  const instName = data.targetInstitution || "THE FINANCIAL INSTITUTION";
  const currency = data.accountCurrency || "NGN (Nigerian Naira)";
  const venue = data.meetingVenue || data.registeredAddress || "the registered office of the Company";
  
  const signatoriesList = (data.directors || []).filter(d => d.isSignatory);
  const signatoryNames = signatoriesList.map(s => `${s.fullName} (${s.designation})`).join(", ");

  let mandateDescription = "";
  if (data.signingMandate === "ANY_ONE") {
    mandateDescription = "Any one (1) of the authorized signatories listed below is empowered to sign, execute, and deliver all banking and transactional documents on behalf of the Company.";
  } else if (data.signingMandate === "ANY_TWO") {
    mandateDescription = "Any two (2) of the authorized signatories listed below acting jointly are empowered to sign, execute, and operate the said account(s) on behalf of the Company.";
  } else if (data.signingMandate === "CHAIRMAN_AND_SECRETARY") {
    mandateDescription = "The Chairman of the Board acting jointly with the Company Secretary shall be authorized to execute mandates, contracts, and operate transactions on behalf of the Company.";
  } else if (data.signingMandate === "ALL_DIRECTORS") {
    mandateDescription = "All designated directors acting jointly are authorized to operate said account and execute compliance mandates on behalf of the Company.";
  } else {
    mandateDescription = data.customMandateText || "The designated authorized signatories as stipulated herein are authorized to operate on behalf of the Company.";
  }

  const recitals: string[] = [
    `WHEREAS ${companyNameUpper} is a duly incorporated entity under the laws of the Federal Republic of Nigeria (Companies and Allied Matters Act, CAMA 2020);`,
    data.purposeCategory === "PAYMENT_GATEWAY"
      ? `WHEREAS the Company desires to integrate and operate online digital payment collection and merchant acquiring services provided by ${instName};`
      : `WHEREAS the Company in the ordinary course of business desires to establish and maintain corporate banking facilities and account(s) with ${instName} (${currency});`,
    `WHEREAS the Board of Directors convened a meeting at ${venue} on ${data.meetingDate || "the date hereof"} and duly resolved to authorize said operations.`
  ];

  const operativeClauses = [
    {
      heading: data.purposeCategory === "PAYMENT_GATEWAY" ? "1. APPROVAL OF PAYMENT GATEWAY INTEGRATION" : "1. OPENING OF CORPORATE BANK ACCOUNT",
      text: data.purposeCategory === "PAYMENT_GATEWAY"
        ? `RESOLVED THAT the Company be and is hereby authorized to register, establish a merchant account, and integrate payment processing gateways with ${instName}, and that all merchant agreements, KYC documents, and API integrations with ${instName} be executed.`
        : `RESOLVED THAT a corporate bank account (Currency: ${currency}) be opened in the name of "${companyNameUpper}" with ${instName}${data.institutionBranch ? ` at its ${data.institutionBranch}` : ""}, and that the Bank be and is hereby authorized to honor all cheques, bills, orders, electronic transfers, and debits initiated in accordance with the Company's authorized mandate.`
    },
    {
      heading: "2. DESIGNATION OF AUTHORIZED SIGNATORIES & MANDATE",
      text: `FURTHER RESOLVED THAT the following officers/directors of the Company be and are hereby appointed as authorized signatories:\n\n${mandateDescription}\n\nAuthorized Persons: ${signatoryNames || "As designated in the official signing block below"}.`
    },
    {
      heading: "3. EXECUTION OF COMPLIANCE DOCUMENTS",
      text: `FURTHER RESOLVED THAT any of the designated authorized signatories be and are hereby authorized to sign, endorse, execute, and deliver all mandate cards, indemnities, digital banking agreements, KYC forms, and ancillary onboarding instruments required by ${instName}.`
    },
    {
      heading: "4. CERTIFICATION & DELIVERY",
      text: `FURTHER RESOLVED THAT a copy of these resolutions, duly certified under the hand of a Director and the Company Secretary (or two Directors), be delivered to ${instName} and remain in full force and effect until express written notice of variation or revocation is communicated to ${instName}.`
    }
  ];

  if (data.customPurposeDescription && data.customPurposeDescription.trim().length > 0) {
    operativeClauses.splice(1, 0, {
      heading: "SPECIAL DIRECTIVE & BUSINESS PURPOSE",
      text: `RESOLVED FURTHER THAT, in alignment with the operational objectives of the Company: ${data.customPurposeDescription.trim()}`
    });
  }

  return {
    title: `EXTRACT OF THE MINUTES OF THE MEETING OF THE BOARD OF DIRECTORS OF ${companyNameUpper}`,
    letterhead: {
      companyName: companyNameUpper,
      rcNumber: rcText,
      registeredAddress: data.registeredAddress || "Federal Republic of Nigeria",
    },
    meetingMetadata: {
      date: data.meetingDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      venue: venue,
      commencementText: `At an extraordinary meeting of the Board of Directors of ${companyNameUpper} ${rcText}, held on ${data.meetingDate || "the specified date"} at ${venue}, the following resolutions were unanimously passed:`
    },
    recitals,
    operativeClauses,
    mandateClause: mandateDescription,
    certificationText: `We hereby certify that the foregoing is a true, authentic, and correct extract from the Minutes of the Meeting of the Board of Directors of ${companyNameUpper} duly convened and held on the date specified above, and that the said resolutions are in accordance with the Articles of Association and the Companies and Allied Matters Act (CAMA 2020).`,
    signatories: (data.directors || []).map(d => ({
      name: d.fullName,
      role: d.designation === "Other" && d.customDesignation ? d.customDesignation : d.designation,
      isSignatory: d.isSignatory,
      signatureUrl: d.signatureUrl
    })),
    logoUrl: data.logoUrl,
    sealUrl: data.sealUrl
  };
}

/**
 * AI-enhanced Resolution Builder using AgentRouter / OpenAI.
 * Enforces Nigerian corporate law standards and produces structured legal output.
 */
export async function generateAIBoardResolution(formData: BoardResolutionFormData): Promise<StructuredResolutionOutput> {
  const fallback = generateDeterministicResolution(formData);
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return fallback;
  }

  try {
    const { client, model } = getAIClient();

    const systemPrompt = `You are a Senior Nigerian Corporate Lawyer and Company Secretary specializing in CAMA 2020 corporate governance, banking compliance (CBN regulations), and fintech onboarding (Paystack, Flutterwave, Monnify KYC).
Your task is to generate a formal, legally watertight Extract of Board Resolution Minutes for a Nigerian registered company.
Strict Requirements:
1. Formal Nigerian CAMA 2020 legal tone.
2. Direct, actionable operative clauses (RESOLVED THAT, FURTHER RESOLVED THAT).
3. Clear mandate authority for financial institutions and payment gateways.
4. Output MUST be valid JSON conforming strictly to the requested schema.`;

    const userPrompt = `Generate a formal Board Resolution Extract based on the following verified company details:
- Company Name: ${formData.companyName}
- RC/BN Number: ${formData.rcNumber || "N/A"}
- Registered Office: ${formData.registeredAddress}
- Meeting Date: ${formData.meetingDate}
- Meeting Venue: ${formData.meetingVenue || formData.registeredAddress}
- Purpose Type: ${formData.purposeCategory}
- Financial Institution / Gateway: ${formData.targetInstitution}
- Branch / Details: ${formData.institutionBranch || "Head Office / Digital Channel"}
- Account Currency: ${formData.accountCurrency || "NGN"}
- Signing Mandate Rule: ${formData.signingMandate} (${formData.customMandateText || "Standard"})
- Custom Purpose Notes: ${formData.customPurposeDescription || "Standard account/gateway onboarding"}
- Directors & Signatories:
${(formData.directors || []).map(d => `  * ${d.fullName} - ${d.designation} (Signatory: ${d.isSignatory ? "YES" : "NO"})`).join("\n")}

Respond ONLY with a JSON object matching this schema:
{
  "title": "EXTRACT OF THE MINUTES OF THE MEETING OF THE BOARD OF DIRECTORS OF...",
  "letterhead": {
    "companyName": "...",
    "rcNumber": "...",
    "registeredAddress": "..."
  },
  "meetingMetadata": {
    "date": "...",
    "venue": "...",
    "commencementText": "..."
  },
  "recitals": ["WHEREAS clause 1", "WHEREAS clause 2"],
  "operativeClauses": [
    { "heading": "1. OPENING OF ACCOUNT / SERVICE", "text": "RESOLVED THAT..." },
    { "heading": "2. AUTHORIZED SIGNATORIES", "text": "FURTHER RESOLVED THAT..." }
  ],
  "mandateClause": "...",
  "certificationText": "...",
  "signatories": [
    { "name": "...", "role": "...", "isSignatory": true }
  ]
}`;

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return fallback;

    const parsed = JSON.parse(content) as StructuredResolutionOutput;
    
    // Ensure all critical sections exist
    if (!parsed.recitals || !parsed.operativeClauses || !parsed.signatories) {
      return fallback;
    }

    // Merge uploaded logo, seal and signature URLs from user form data
    parsed.logoUrl = formData.logoUrl;
    parsed.sealUrl = formData.sealUrl;
    parsed.signatories = parsed.signatories.map((sig, idx) => {
      const match = (formData.directors || []).find(d => d.fullName.toLowerCase().trim() === sig.name.toLowerCase().trim()) || formData.directors[idx];
      return {
        ...sig,
        signatureUrl: match?.signatureUrl
      };
    });

    return parsed;
  } catch (error: any) {
    console.warn("AI Resolution Generation fallback (using CAMA 2020 standard):", error?.message || error);
    return fallback;
  }
}
