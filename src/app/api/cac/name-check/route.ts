import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Strict arrays for things that are ILLEGAL by law
const RESTRICTED_WORDS = ["FEDERAL", "NATIONAL", "GOVERNMENT", "STATE", "REGIONAL", "COOPERATIVE", "CHAMBER OF COMMERCE", "NIGERIAN"];
const LLC_SUFFIXES = ["LTD", "LIMITED", "PLC", "GTE", "ULC"];

export async function POST(req: Request) {
  try {
    const { proposedName, lineOfBusiness, entityType, mode } = await req.json();

    if (!entityType) {
      return NextResponse.json({ success: false, message: "Missing required entity type." }, { status: 400 });
    }

    // ==========================================
    // LAYER 1: API GATEKEEPER (Global Maintenance Check)
    // ==========================================
    const cacServices = await prisma.servicePricing.findMany();
    
    let isEnabled = true;
    let maintenanceReason = "This registration service is currently disabled for scheduled maintenance.";

    if (entityType === "Company (LLC)") {
      const llcSetting = cacServices.find(s => s.serviceKey === "LLC");
      if (llcSetting && llcSetting.isActive === false) {
        isEnabled = false;
        maintenanceReason = llcSetting.maintenanceMsg || maintenanceReason;
      }
    } else if (entityType === "Business Name") {
      const bnSetting = cacServices.find(s => s.serviceKey === "BUSINESS_NAME");
      if (bnSetting && bnSetting.isActive === false) {
        isEnabled = false;
        maintenanceReason = bnSetting.maintenanceMsg || maintenanceReason;
      }
    } else if (entityType === "NGO" || entityType === "Incorporated Trustees") {
      const ngoSetting = cacServices.find(s => s.serviceKey === "NGO");
      if (ngoSetting && ngoSetting.isActive === false) {
        isEnabled = false;
        maintenanceReason = ngoSetting.maintenanceMsg || maintenanceReason;
      }
    }

    if (!isEnabled) {
      return NextResponse.json({
        success: false,
        isBlocked: true,
        rejectionType: "SERVICE_DISABLED",
        reasonMessage: maintenanceReason,
        message: maintenanceReason
      }, { status: 403 });
    }

    // ==========================================
    // MODE: INSTANT SUGGESTION GENERATOR 
    // Generates 4 distinct names instantly for the UI
    // ==========================================
    if (mode === "SUGGEST") {
      if (!lineOfBusiness || !proposedName) {
        return NextResponse.json({ success: false, message: "Missing required metadata parameters for suggestions." }, { status: 400 });
      }

      const suffixRule = entityType === "Company (LLC)" 
        ? "MUST end with 'LIMITED' or 'LTD'." 
        : "MUST end with a generic business qualifier (like VENTURES, STUDIOS, HUB, etc). DO NOT use 'LIMITED'.";

      const aiSuggestion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a Corporate Naming Specialist. The user's proposed name was taken. 
            Generate exactly 4 highly distinct, creative, and professional alternative names for their business.
            - Change the root word entirely (e.g., if they asked for 'QUADROX', suggest 'NEXUS', 'VORTEX', 'SYNTHESIS').
            - ${suffixRule}
            - Output ONLY a JSON array of strings.`
          },
          {
            role: "user",
            content: `Entity Type: ${entityType}\nRejected Name: ${proposedName}\nIndustry Vertical: ${lineOfBusiness}`
          }
        ],
        response_format: { type: "json_schema", json_schema: { name: "suggestions", schema: { type: "object", properties: { names: { type: "array", items: { type: "string" } } }, required: ["names"], additionalProperties: false }, strict: true } },
        temperature: 0.9, 
      });

      const parsedResponse = JSON.parse(aiSuggestion.choices[0].message.content || '{"names": []}');
      
      const fallbackSuffix = entityType === "Company (LLC)" ? "LIMITED" : "CONCEPTS";
      const root = proposedName.split(" ")[0].substring(0, 5);
      const safeNames = parsedResponse.names.length > 0 ? parsedResponse.names : [
        `${root} ${Math.floor(Math.random() * 900 + 100)} ${fallbackSuffix}`.toUpperCase()
      ];

      return NextResponse.json({ success: true, suggestions: safeNames });
    }

    // ==========================================
    // MODE: STANDARD CHECK (Fast Rule Check + AI Qualifier Check)
    // ==========================================
    if (!proposedName) {
      return NextResponse.json({ success: false, message: "Proposed name is required." }, { status: 400 });
    }

    const uppercaseName = proposedName.trim().toUpperCase();
    const wordsInName = uppercaseName.split(" ");
    const lastWord = wordsInName[wordsInName.length - 1];

    let uiWarningMessage = "";

    // Rule 1: Restricted Government/Global Words (INSTANT REJECT)
    if (RESTRICTED_WORDS.some(restricted => uppercaseName.includes(restricted))) {
      return NextResponse.json({
        success: true, isBlocked: true, rejectionType: "RESTRICTED_WORD", conflicts: [],
        reasonMessage: "This name contains restricted terminology (e.g., Federal, National, State) and requires special consent from the CAC.",
        data: { mostSimilarName: "N/A", cleansedNameUsed: uppercaseName }
      });
    }

    // Rule 2: LLC Suffix Check (INSTANT REJECT)
    if (entityType === "Company (LLC)") {
      const hasLlcSuffix = LLC_SUFFIXES.includes(lastWord);
      if (!hasLlcSuffix) {
        return NextResponse.json({
          success: true, isBlocked: true, rejectionType: "MISSING_LLC_SUFFIX", conflicts: [],
          reasonMessage: "A Limited Liability Company must end with 'LTD', 'LIMITED', 'PLC', or 'GTE'.",
          data: { mostSimilarName: "N/A", cleansedNameUsed: uppercaseName }
        });
      }
    }

    // Rule 3: Business Name Rules
    if (entityType === "Business Name") {
      const hasIllegalLlcSuffix = LLC_SUFFIXES.includes(lastWord);
      if (hasIllegalLlcSuffix) {
        return NextResponse.json({
          success: true, isBlocked: true, rejectionType: "ILLEGAL_SUFFIX", conflicts: [],
          reasonMessage: "A Business Name cannot end with 'LTD', 'LIMITED', or 'PLC'.",
          data: { mostSimilarName: "N/A", cleansedNameUsed: uppercaseName }
        });
      }

      // Fast AI Qualifier Check (Just to toggle the warning message, NEVER to block)
      try {
        const qualifierCheck = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a corporate naming classifier. Determine if the proposed name ends with a valid generic business qualifier/suffix (e.g., Ventures, Enterprises, Services, Studios, Dynamics, Creations, Hub, Clinic, Farms, Global, etc.).
              If it has a valid business qualifier, return hasQualifier: true.
              If it is just a pure personal name (e.g., "John Doe") or lacks a descriptor, return hasQualifier: false.`
            },
            { role: "user", content: `Proposed Name: "${uppercaseName}"` }
          ],
          response_format: { type: "json_schema", json_schema: { name: "qualifier_check", schema: { type: "object", properties: { hasQualifier: { type: "boolean" } }, required: ["hasQualifier"], additionalProperties: false }, strict: true } },
          temperature: 0.1,
        });

        const checkResult = JSON.parse(qualifierCheck.choices[0].message.content || '{"hasQualifier": true}');
        
        if (!checkResult.hasQualifier) {
          uiWarningMessage = "Tip: Unless you are registering your exact personal legal name, CAC usually requires a qualifier like 'Ventures' or 'Services' at the end of a Business Name.";
        }
      } catch (aiError) {
        // If OpenAI fails or times out, we just swallow it and move on. Do not interrupt checkout!
        console.warn("AI Qualifier check skipped due to error.");
      }
    }

    // ==========================================
    // PHASE 2: CAC LIVE REGISTRY FETCH
    // ==========================================
    const cacApiKey = process.env.CAC_API_KEY;
    if (!cacApiKey) throw new Error("Missing CAC API Key.");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const cacResponse = await fetch("https://vasapp.cac.gov.ng/api/vas/engine/pre/bn-compliance", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json", "X_API_KEY": cacApiKey },
        body: JSON.stringify({ proposedName: uppercaseName, lineOfBusiness }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!cacResponse.ok) {
        throw new Error("Registry HTTP Error");
      }

      const cacJson = await cacResponse.json();

      // EXACT MATCH FOUND -> BLOCK
      if (cacJson.message === "Name exist") {
        return NextResponse.json({
          success: true,
          isBlocked: true,
          rejectionType: "EXACT_MATCH",
          reasonMessage: "This exact name is already registered by another business.",
          conflicts: [uppercaseName], 
          data: { mostSimilarName: uppercaseName, cleansedNameUsed: uppercaseName }
        });
      }

      // If highly similar -> APPROVE (Let human examiner decide) but add warning
      const similarityStr = cacJson.data?.similarityScore || "0%";
      const similarityVal = parseInt(similarityStr);
      const mostSimilarName = cacJson.data?.mostSimilarName || "N/A";

      if (similarityVal > 0 && mostSimilarName !== "N/A") {
        uiWarningMessage = uiWarningMessage 
          ? `${uiWarningMessage} Also, a similarly named business (${mostSimilarName}) exists, which may cause a CAC query.`
          : `Note: A similarly named business (${mostSimilarName}) exists. We will submit your application, but CAC may query it if the root words conflict.`;
      }

      return NextResponse.json({
        success: true,
        isBlocked: false,
        rejectionType: "PASSED",
        reasonMessage: "Name appears to be available for registration.",
        warningMessage: uiWarningMessage, 
        conflicts: similarityVal > 0 ? [mostSimilarName] : [], 
        data: {
          mostSimilarName: mostSimilarName,
          cleansedNameUsed: uppercaseName
        }
      });

    } catch (networkError) {
      // FAIL-OPEN: If CAC is offline, do NOT block the user.
      return NextResponse.json({
        success: true,
        isBlocked: false,
        rejectionType: "PASSED",
        reasonMessage: "Registry connection is currently slow. You may proceed, and we will verify your name manually during processing.",
        warningMessage: uiWarningMessage, 
        conflicts: [],
        data: { mostSimilarName: "N/A", cleansedNameUsed: uppercaseName }
      });
    }

  } catch (error) {
    console.error("Gateway Error:", error);
    return NextResponse.json({ success: false, message: "Server connection failed." }, { status: 500 });
  }
}
