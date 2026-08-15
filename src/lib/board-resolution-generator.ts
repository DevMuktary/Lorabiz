import { getWorkingAgentRouterClient } from "./ai-client";

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
  companyEmail?: string;
  companyPhone?: string;
  corporateMotto?: string;
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
  savedCurrentStep?: number;
}

export type ResolutionDesignTheme = "classic-royal" | "modern-executive" | "luxury-crest" | "gazette-formal";

export interface StructuredResolutionOutput {
  title: string;
  subtitle?: string; // e.g. "AUTHORIZING THE USE OF MONNIFY PAYMENT SERVICES"
  theme?: ResolutionDesignTheme;
  accentColor?: string;
  letterhead: {
    companyName: string;
    rcNumber: string;
    registeredAddress: string;
    email?: string;
    phone?: string;
  };
  meetingMetadata: {
    date: string;
    venue: string;
    commencementText: string;
  };
  preambleText?: string;
  resolutionLeadIn?: string;
  numberedClauses?: string[];
  validityClause?: string;
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
  corporateMotto?: string;
  logoUrl?: string;
  sealUrl?: string;
  designNotes?: string;
}

/**
 * Fallback deterministic template generator ensuring 100% uptime
 * and full CAMA 2020 compliance even without AI.
 */
export function generateDeterministicResolution(data: BoardResolutionFormData): StructuredResolutionOutput {
  const companyNameUpper = (data.companyName || "THE COMPANY").toUpperCase();
  const rcText = data.rcNumber ? (data.rcNumber.toUpperCase().startsWith("RC") ? data.rcNumber : `RC: ${data.rcNumber.replace(/^RC:?\s*/i, "")}`) : "";
  const instName = data.targetInstitution || "THE FINANCIAL INSTITUTION";
  const currency = data.accountCurrency || "NGN (Nigerian Naira)";
  const venue = data.meetingVenue || data.registeredAddress || "the registered office of the Company";
  
  // Smart default theme based on purpose
  let defaultTheme: ResolutionDesignTheme = "classic-royal";
  let defaultAccent = data.accentColor || "#0f172a";

  if (data.purposeCategory === "PAYMENT_GATEWAY") {
    defaultTheme = "modern-executive";
    defaultAccent = data.accentColor || "#1e3a8a";
  } else if (data.purposeCategory === "LOAN_FACILITY") {
    defaultTheme = "luxury-crest";
    defaultAccent = data.accentColor || "#78350f";
  } else if (data.purposeCategory === "GENERAL_CORPORATE" || data.purposeCategory === "OTHER") {
    defaultTheme = "gazette-formal";
    defaultAccent = data.accentColor || "#334155";
  }

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

  const subtitle = data.purposeCategory === "PAYMENT_GATEWAY"
    ? `AUTHORIZING THE USE OF ${instName.toUpperCase()} PAYMENT SERVICES`
    : `AUTHORIZING THE OPENING OF CORPORATE BANK ACCOUNT WITH ${instName.toUpperCase()}`;

  const preambleText = `This resolution was duly passed by the Board of Directors of ${companyNameUpper} in accordance with the provisions of the Companies and Allied Matters Act (CAMA 2020) and the Company's Articles of Association.`;

  const resolutionLeadIn = data.purposeCategory === "PAYMENT_GATEWAY"
    ? `It is hereby resolved that ${companyNameUpper} is authorized to register, integrate, and utilize the payment collection and settlement services provided by ${instName} for the purpose of supporting its business operations.\n\nThe Board hereby approves the Company to:`
    : `It is hereby resolved that ${companyNameUpper} is authorized to establish, operate, and maintain corporate banking facilities and account(s) with ${instName} (${currency}) for the purpose of supporting its business operations.\n\nThe Board hereby approves the Company to:`;

  const numberedClauses = data.purposeCategory === "PAYMENT_GATEWAY"
    ? [
        "Receive electronic payments from customers, clients, partners, and other third parties across all approved digital channels.",
        "Process payments relating to airtime, data subscriptions, utility bills, digital products, educational services, examination fees, and digital financial services.",
        "Operate and manage Virtual Accounts, settlement accounts, and fintech solutions offered through the payment infrastructure.",
        `Open, manage, and maintain all necessary virtual collection accounts, settlement accounts, and disbursement channels required for the efficient operation of ${instName} services.`,
        `Execute all agreements, documents, integrations, API configurations, and compliance requirements necessary to facilitate the Company's use of ${instName}'s payment infrastructure.`,
        "Authorize the designated executive officers or appointed representatives of the Company to act on behalf of the Company in matters relating to the implementation and administration of these services."
      ]
    : [
        `Open and maintain a corporate banking account (Currency: ${currency}) in the name of the Company with ${instName}${data.institutionBranch ? ` at its ${data.institutionBranch}` : ""}.`,
        "Honor and pay all cheques, drafts, electronic fund transfers, and debit orders drawn upon the said account by authorized signatories.",
        "Submit and execute all mandate cards, corporate indemnities, electronic banking agreements, and KYC documentation required by the Bank.",
        `Empower designated authorized signatories (${mandateDescription}) to operate, manage, and sign on behalf of the Company.`,
        "Authorize the Bank to debit the Company's account for all official charges, statutory fees, and lawful transactions processed in the normal course of business.",
        "Furnish the Bank with a certified copy of the Company's memorandum, articles of association, and directorship extract as required under CAMA 2020."
      ];

  const validityClause = "This resolution shall remain valid unless amended or revoked by a subsequent resolution of the Board.";

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
    title: "BOARD RESOLUTION",
    subtitle: subtitle,
    theme: defaultTheme,
    accentColor: defaultAccent,
    letterhead: {
      companyName: companyNameUpper,
      rcNumber: rcText || "",
      registeredAddress: data.registeredAddress || "Federal Republic of Nigeria",
      email: data.companyEmail || undefined,
      phone: data.companyPhone || undefined,
    },
    meetingMetadata: {
      date: data.meetingDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      venue: venue,
      commencementText: `At an extraordinary meeting of the Board of Directors of ${companyNameUpper} ${rcText}, held on ${data.meetingDate || "the specified date"} at ${venue}, the following resolutions were unanimously passed:`
    },
    preambleText,
    resolutionLeadIn,
    numberedClauses,
    validityClause,
    recitals,
    operativeClauses,
    mandateClause: mandateDescription,
    certificationText: `This resolution is certified as a true and correct copy of the resolution duly passed by the Board of Directors of ${companyNameUpper}.`,
    signatories: (data.directors || []).map(d => ({
      name: d.fullName,
      role: d.designation === "Other" && d.customDesignation ? d.customDesignation : d.designation,
      isSignatory: d.isSignatory,
      signatureUrl: d.signatureUrl
    })),
    corporateMotto: data.corporateMotto || "INNOVATING SOLUTIONS. | EMPOWERING BUSINESSES. | BUILDING TOMORROW.",
    logoUrl: data.logoUrl,
    sealUrl: data.sealUrl
  };
}

/**
 * Robust JSON extractor that handles markdown code fences, pre/post conversational text,
 * and edge cases in LLM responses.
 */
function extractJSONFromText(text: string): any {
  if (!text || typeof text !== "string") return null;

  // 1. Direct clean parse
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Continue
  }

  // 2. Extract substring between first '{' and last '}'
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const rawSubstring = text.substring(startIdx, endIdx + 1);
    try {
      return JSON.parse(rawSubstring);
    } catch {
      // 3. Try cleaning common JSON syntax quirks (trailing commas, control chars)
      try {
        const sanitized = rawSubstring
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
        return JSON.parse(sanitized);
      } catch (e) {
        console.warn("[extractJSONFromText] Sanitized JSON parse also failed:", e);
      }
    }
  }

  return null;
}

/**
 * Validates and normalizes parsed AI JSON output into a strict StructuredResolutionOutput object.
 * Falls back gracefully to deterministic legal clauses for any missing sections.
 */
function normalizeStructuredResolution(
  parsed: any, 
  formData: BoardResolutionFormData, 
  fallback: StructuredResolutionOutput
): StructuredResolutionOutput {
  if (!parsed || typeof parsed !== "object") return fallback;

  const companyNameUpper = (parsed.letterhead?.companyName || formData.companyName || fallback.letterhead.companyName).toUpperCase();
  const rcText = parsed.letterhead?.rcNumber !== undefined 
    ? String(parsed.letterhead.rcNumber) 
    : fallback.letterhead.rcNumber;
  const registeredAddress = parsed.letterhead?.registeredAddress || formData.registeredAddress || fallback.letterhead.registeredAddress;
  const email = parsed.letterhead?.email || formData.companyEmail || fallback.letterhead.email;
  const phone = parsed.letterhead?.phone || formData.companyPhone || fallback.letterhead.phone;

  const meetingDate = parsed.meetingMetadata?.date || formData.meetingDate || fallback.meetingMetadata.date;
  const meetingVenue = parsed.meetingMetadata?.venue || formData.meetingVenue || formData.registeredAddress || fallback.meetingMetadata.venue;
  const commencementText = parsed.meetingMetadata?.commencementText || fallback.meetingMetadata.commencementText;

  // AI Design Theme Selection
  const validThemes: ResolutionDesignTheme[] = ["classic-royal", "modern-executive", "luxury-crest", "gazette-formal"];
  const selectedTheme: ResolutionDesignTheme = validThemes.includes(parsed.theme) ? parsed.theme : fallback.theme || "classic-royal";
  const selectedAccent = formData.accentColor || parsed.accentColor || fallback.accentColor;

  const title = parsed.title || fallback.title || "BOARD RESOLUTION";
  const subtitle = parsed.subtitle || fallback.subtitle;
  const preambleText = parsed.preambleText || parsed.preamble || fallback.preambleText;
  const resolutionLeadIn = parsed.resolutionLeadIn || parsed.leadIn || fallback.resolutionLeadIn;
  const validityClause = parsed.validityClause || fallback.validityClause;
  const corporateMotto = parsed.corporateMotto || formData.corporateMotto || fallback.corporateMotto;

  // Numbered Clauses
  let numberedClauses: string[] = [];
  const rawNumbered = parsed.numberedClauses || parsed.clausesList || parsed.approvedList;
  if (Array.isArray(rawNumbered) && rawNumbered.length > 0) {
    numberedClauses = rawNumbered.map((c: any) => typeof c === "string" ? c : (c.text || String(c)));
  } else {
    numberedClauses = fallback.numberedClauses || [];
  }

  // Recitals
  let recitals: string[] = [];
  const rawRecitals = parsed.recitals || parsed.whereasClauses;
  if (Array.isArray(rawRecitals) && rawRecitals.length > 0) {
    recitals = rawRecitals.map((r: any) => typeof r === "string" ? r : (r.text || String(r)));
  } else {
    recitals = fallback.recitals;
  }

  // Operative Clauses
  let operativeClauses: Array<{ heading: string; text: string }> = [];
  const rawClauses = parsed.operativeClauses || parsed.operative_clauses || parsed.clauses || parsed.resolutions;
  if (Array.isArray(rawClauses) && rawClauses.length > 0) {
    operativeClauses = rawClauses.map((c: any, i: number) => {
      if (typeof c === "string") {
        return { heading: `${i + 1}. RESOLUTION`, text: c };
      }
      return {
        heading: c.heading || c.title || `${i + 1}. RESOLUTION`,
        text: c.text || c.content || c.body || String(c)
      };
    });
  } else {
    operativeClauses = fallback.operativeClauses;
  }

  // Mandate Clause
  const mandateClause = parsed.mandateClause || parsed.mandate || fallback.mandateClause;

  // Certification Text
  const certificationText = parsed.certificationText || parsed.certification || fallback.certificationText;

  // Signatories matching - prioritize user-configured directors and signatures
  let signatories: Array<{ name: string; role: string; isSignatory: boolean; signatureUrl?: string }> = [];
  if (formData.directors && Array.isArray(formData.directors) && formData.directors.length > 0) {
    signatories = formData.directors.map((d, idx) => {
      const rawSignatories = parsed.signatories || parsed.signatoryList || parsed.directors;
      const aiMatch = Array.isArray(rawSignatories) 
        ? rawSignatories.find((s: any) => {
            const sName = (typeof s === "string" ? s : (s?.name || s?.fullName || "")).toLowerCase().trim();
            const dName = (d.fullName || "").toLowerCase().trim();
            return sName && dName && (sName.includes(dName) || dName.includes(sName));
          }) || rawSignatories[idx]
        : null;

      const role = d.designation === "Other" && d.customDesignation 
        ? d.customDesignation 
        : (d.designation || (aiMatch && typeof aiMatch === "object" ? aiMatch.role : "Director"));

      return {
        name: d.fullName || `Director ${idx + 1}`,
        role: role || "Director",
        isSignatory: d.isSignatory !== undefined ? Boolean(d.isSignatory) : true,
        signatureUrl: d.signatureUrl || undefined
      };
    });
  } else if (Array.isArray(parsed.signatories) && parsed.signatories.length > 0) {
    signatories = parsed.signatories.map((sig: any, idx: number) => ({
      name: typeof sig === "string" ? sig : (sig.name || sig.fullName || `Director ${idx + 1}`),
      role: typeof sig === "object" ? (sig.role || sig.designation || "Director") : "Director",
      isSignatory: typeof sig === "object" ? (sig.isSignatory !== undefined ? Boolean(sig.isSignatory) : true) : true,
      signatureUrl: undefined
    }));
  } else {
    signatories = fallback.signatories;
  }

  return {
    title,
    subtitle,
    theme: selectedTheme,
    accentColor: selectedAccent,
    letterhead: {
      companyName: companyNameUpper,
      rcNumber: rcText,
      registeredAddress: registeredAddress,
      email,
      phone
    },
    meetingMetadata: {
      date: meetingDate,
      venue: meetingVenue,
      commencementText: commencementText,
    },
    preambleText,
    resolutionLeadIn,
    numberedClauses,
    validityClause,
    recitals,
    operativeClauses,
    mandateClause,
    certificationText,
    signatories,
    corporateMotto,
    logoUrl: formData.logoUrl || parsed.logoUrl || fallback.logoUrl || undefined,
    sealUrl: formData.sealUrl || parsed.sealUrl || fallback.sealUrl || undefined,
    designNotes: parsed.designNotes || undefined
  };
}

/**
 * AI-enhanced Resolution Builder using AgentRouter (gpt-5.6-sol) with fallback to CAMA 2020 deterministic template.
 * Enforces Nigerian corporate law standards and produces structured legal output matching verified corporate board resolutions.
 */
export async function generateAIBoardResolution(formData: BoardResolutionFormData): Promise<StructuredResolutionOutput> {
  const fallback = generateDeterministicResolution(formData);
  const { client, model, apiKey } = getWorkingAgentRouterClient();

  if (!apiKey) {
    console.log("[Board Resolution Generator] No AGENTROUTER_API_KEY set. Using CAMA 2020 deterministic template.");
    return fallback;
  }

  const systemPrompt = `You are a Senior Nigerian Corporate Legal Counsel and Master Document Architect specializing in corporate governance under the Companies and Allied Matters Act (CAMA 2020), banking compliance, and fintech onboarding (Paystack, Flutterwave, Monnify, Interswitch, commercial banks).
Your goal is to generate a formal, legally pristine Board Resolution formatted cleanly for Nigerian corporate certification and banking KYC.

Strict Document Formatting Rules:
1. Tone: Formal Nigerian CAMA 2020 legal tone.
2. Title: "BOARD RESOLUTION"
3. Subtitle: All-caps statement like "AUTHORIZING THE USE OF MONNIFY PAYMENT SERVICES" or "AUTHORIZING THE OPENING OF CORPORATE BANK ACCOUNT WITH ACCESS BANK PLC".
4. Preamble: "This resolution was duly passed by the Board of Directors of [COMPANY] in accordance with the provisions of the Companies and Allied Matters Act (CAMA 2020) and the Company's Articles of Association."
5. Resolution Lead-In: "It is hereby resolved that [COMPANY] is authorized to ...\n\nThe Board hereby approves the Company to:"
6. Numbered Clauses: Provide 5 to 6 concise, powerful numbered clauses detailing the specific authorities granted (e.g. receive electronic payments, execute agreements, open virtual accounts, designate authorized signatories).
7. Validity Clause: "This resolution shall remain valid unless amended or revoked by a subsequent resolution of the Board."
8. Certification Text: "This resolution is certified as a true and correct copy of the resolution duly passed by the Board of Directors of [COMPANY]."
9. Corporate Motto: A clean corporate slogan like "INNOVATING SOLUTIONS. | EMPOWERING BUSINESSES. | BUILDING TOMORROW."
10. Output MUST be valid JSON only with NO markdown preamble and NO emojis anywhere.`;

  const userPrompt = `Generate a formal Nigerian Board Resolution based on these verified company details:
- Company Name: ${formData.companyName}
- RC/BN Number: ${formData.rcNumber || "N/A"}
- Registered Office: ${formData.registeredAddress}
- Company Email: ${formData.companyEmail || "N/A"}
- Company Phone: ${formData.companyPhone || "N/A"}
- Meeting Date: ${formData.meetingDate}
- Meeting Venue: ${formData.meetingVenue || formData.registeredAddress}
- Purpose Type: ${formData.purposeCategory}
- Target Financial Institution / Gateway: ${formData.targetInstitution}
- Branch / Details: ${formData.institutionBranch || "Head Office / Digital Channel"}
- Account Currency: ${formData.accountCurrency || "NGN"}
- Signing Mandate Rule: ${formData.signingMandate} (${formData.customMandateText || "Standard"})
- Custom Purpose Notes: ${formData.customPurposeDescription || "Standard account/gateway onboarding"}
- Directors & Signatories:
${(formData.directors || []).map(d => `  * ${d.fullName} - ${d.designation} (Signatory: ${d.isSignatory ? "YES" : "NO"})`).join("\n")}

Respond ONLY with a JSON object matching this schema:
{
  "title": "BOARD RESOLUTION",
  "subtitle": "AUTHORIZING THE USE OF ... SERVICES",
  "theme": "classic-royal" | "modern-executive" | "luxury-crest" | "gazette-formal",
  "accentColor": "${formData.accentColor || "#0f172a"}",
  "letterhead": {
    "companyName": "${formData.companyName.toUpperCase()}",
    "rcNumber": "${formData.rcNumber || ""}",
    "registeredAddress": "${formData.registeredAddress}",
    "email": "${formData.companyEmail || ""}",
    "phone": "${formData.companyPhone || ""}"
  },
  "meetingMetadata": {
    "date": "${formData.meetingDate}",
    "venue": "${formData.meetingVenue || formData.registeredAddress}",
    "commencementText": "..."
  },
  "preambleText": "This resolution was duly passed by the Board of Directors of ... in accordance with the provisions of the Companies and Allied Matters Act (CAMA 2020) and the Company's Articles of Association.",
  "resolutionLeadIn": "It is hereby resolved that ... is authorized to ...\n\nThe Board hereby approves the Company to:",
  "numberedClauses": [
    "Receive electronic payments from customers, clients, partners, and other third parties.",
    "Process payments relating to airtime, data subscriptions, utility bills, and other digital financial services.",
    "Operate and manage Virtual Top-Up (VTU) services and other fintech solutions offered by the Company.",
    "Open, manage, and maintain all necessary virtual accounts, settlement accounts, and payment channels.",
    "Execute all agreements, documents, integrations, API configurations, and compliance requirements.",
    "Authorize the Chief Executive Officer or any duly appointed representative to act on behalf of the Company."
  ],
  "validityClause": "This resolution shall remain valid unless amended or revoked by a subsequent resolution of the Board.",
  "mandateClause": "...",
  "certificationText": "This resolution is certified as a true and correct copy of the resolution duly passed by the Board of Directors of ${formData.companyName.toUpperCase()}.",
  "corporateMotto": "INNOVATING SOLUTIONS. | EMPOWERING BUSINESSES. | BUILDING TOMORROW.",
  "signatories": [
    ${(formData.directors || []).map(d => `{"name": "${d.fullName}", "role": "${d.designation}", "isSignatory": ${Boolean(d.isSignatory)}}`).join(",\n    ")}
  ],
  "designNotes": "Clean executive layout tailored for financial compliance"
}`;

  try {
    console.log(`[AgentRouter AI] Requesting AI resolution for ${formData.companyName} with model ${model}...`);
    const response = await client.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
    });

    const rawText = response?.choices?.[0]?.message?.content || "";
    console.log(`[AgentRouter AI] Received ${rawText.length} characters of response.`);

    if (rawText) {
      const parsed = extractJSONFromText(rawText);
      if (parsed) {
        const normalized = normalizeStructuredResolution(parsed, formData, fallback);
        console.log(`[AgentRouter AI] Successfully parsed and normalized AI resolution for ${formData.companyName}.`);
        return normalized;
      } else {
        console.warn("[AgentRouter AI] JSON parsing failed on raw output preview:", rawText.slice(0, 300));
      }
    }
  } catch (err: any) {
    console.error(`[AgentRouter AI Call Failed (${model})]:`, err?.message || err);
  }

  // Final fallback to CAMA 2020 deterministic generator
  console.log(`[Board Resolution Generator] Falling back to CAMA 2020 deterministic template for ${formData.companyName}.`);
  return fallback;
}
