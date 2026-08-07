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
    const body = await req.json();

    console.log("\n==============================================");
    console.log("➡️ INCOMING NAME CHECK REQUEST:");
    console.log(JSON.stringify(body, null, 2));
    console.log("==============================================\n");

    const { proposedName, lineOfBusiness, entityType, mode } = body;

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
            - Don't Change the root word entirely, just add distiguisher becauuse that root is the most importsant to people (e.g., if they asked for 'VORTEX TECH', suggest 'VORTEX VENNTURES', 'VORTEX ENTERPRISES', 'VORTEX SYNTHESIS').
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
    // MODE: STANDARD CHECK 
    // ==========================================
    if (!proposedName) {
      return NextResponse.json({ success: false, message: "Proposed name is required." }, { status: 400 });
    }

    const uppercaseName = proposedName.trim().toUpperCase();
    const wordsInName = uppercaseName.split(" ");
    const lastWord = wordsInName[wordsInName.length - 1];

    let uiWarningMessage = "";

    const hasRestrictedWord = RESTRICTED_WORDS.some(restricted => {
      const regex = new RegExp(`\\b${restricted}\\b`, 'i');
      return regex.test(uppercaseName);
    });

    if (hasRestrictedWord) {
      return NextResponse.json({
        success: true, isBlocked: true, rejectionType: "RESTRICTED_WORD", conflicts: [],
        reasonMessage: "This name contains restricted terminology (e.g., Federal, National, State) and requires special consent from the CAC.",
        data: { mostSimilarName: "N/A", cleansedNameUsed: uppercaseName }
      });
    }

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

    if (entityType === "Business Name") {
      const hasIllegalLlcSuffix = LLC_SUFFIXES.includes(lastWord);
      if (hasIllegalLlcSuffix) {
        return NextResponse.json({
          success: true, isBlocked: true, rejectionType: "ILLEGAL_SUFFIX", conflicts: [],
          reasonMessage: "A Business Name cannot end with 'LTD', 'LIMITED', or 'PLC'.",
          data: { mostSimilarName: "N/A", cleansedNameUsed: uppercaseName }
        });
      }

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
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      // Strip "LIMITED" before querying the CAC endpoint so it doesn't throw a 403 error.
      let cacSearchName = uppercaseName;
      if (entityType === "Company (LLC)") {
        const words = cacSearchName.split(" ");
        const lastW = words[words.length - 1];
        if (LLC_SUFFIXES.includes(lastW)) {
          words.pop();
          cacSearchName = words.join(" ").trim();
        }
      }

      const cacResponse = await fetch("https://vasapp.cac.gov.ng/api/vas/engine/pre/bn-compliance", {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json", "X_API_KEY": cacApiKey },
        body: JSON.stringify({ proposedName: cacSearchName, lineOfBusiness }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!cacResponse.ok) {
        const rawErrorText = await cacResponse.text();
        console.error("❌ CAC API HTTP ERROR:", cacResponse.status, rawErrorText);
        throw new Error(`Registry HTTP Error: ${cacResponse.status}`);
      }

      const cacJson = await cacResponse.json();

      console.log("\n==============================================");
      console.log(`🔍 CAC NAME CHECK DEBUG: ${cacSearchName}`);
      console.log("==============================================");
      console.log("RAW PAYLOAD:", JSON.stringify(cacJson, null, 2));
      console.log("==============================================\n");

      const similarityRaw = cacJson.data?.similarityScore || cacJson.data?.similarityScorePercentage || 0;
      const similarityVal = typeof similarityRaw === "string" ? parseFloat(similarityRaw) || 0 : similarityRaw;
      
      const similarNamesArray = cacJson.data?.similarNames || [];
      const mostSimilarName = cacJson.data?.mostSimilarName || (similarNamesArray.length > 0 ? similarNamesArray[0] : "N/A");

      let isRejected = cacJson.success === false || 
                         cacJson.message === "Name exist" || 
                         cacJson.message === "BUSINESS_NAME_EXISTS" ||
                         similarityVal >= 85; 

      let suppressSimilarityWarning = false;

      // AI Interceptor now checks ANY noticeable similarity to suppress fake warnings
      if (similarityVal >= 40 && similarityVal < 100 && similarNamesArray.length > 0) {
        try {
          const aiVerification = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a corporate name similarity examiner for the Corporate Affairs Commission.
                Compare the Proposed Name against the list of Existing Names.
                IGNORE generic descriptors like 'INTERNATIONAL', 'SERVICES', 'CONCEPTS', 'GLOBAL', 'NIGERIA', 'VENTURES', 'ENTERPRISES', 'LIMITED', 'LTD'.
                Only flag as a conflict if the core, distinct identifying root words are identical or differ by only 1-2 letters (e.g., 'QUADROX' vs 'QUADOW' is a conflict, but 'THREEMEALS' vs 'CEEOME' is NOT a conflict).
                Return {"isConflict": true} if there is a genuine risk of confusion. Return {"isConflict": false} if they are distinct enough to be safely registered.`
              },
              {
                role: "user",
                content: `Proposed Name: "${uppercaseName}"\nExisting Names: ${JSON.stringify(similarNamesArray)}`
              }
            ],
            response_format: { type: "json_schema", json_schema: { name: "similarity_check", schema: { type: "object", properties: { isConflict: { type: "boolean" } }, required: ["isConflict"], additionalProperties: false }, strict: true } },
            temperature: 0.1,
          });

          const aiResult = JSON.parse(aiVerification.choices[0].message.content || '{"isConflict": true}');
          
          if (aiResult.isConflict === false) {
            isRejected = false;
            suppressSimilarityWarning = true; // Tell the UI to ignore the warning
            console.log(`🤖 AI OVERRIDE: Suppressed CAC's false-positive similarity score of ${similarityVal}%. Root words are completely distinct.`);
          }
        } catch (aiError) {
          console.error("AI Similarity check failed, proceeding with CAC original assessment.", aiError);
        }
      }

      if (isRejected) {
        return NextResponse.json({
          success: true,
          isBlocked: true,
          rejectionType: "EXACT_MATCH",
          reasonMessage: `This name is already registered or highly similar to an existing business (${mostSimilarName}).`,
          conflicts: similarNamesArray.length > 0 ? similarNamesArray : [uppercaseName], 
          data: { mostSimilarName: mostSimilarName, cleansedNameUsed: uppercaseName }
        });
      }

      // WARNING is now skipped if the AI suppressed it!
      if (similarityVal > 0 && mostSimilarName !== "N/A" && !suppressSimilarityWarning) {
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
        conflicts: (similarityVal > 0 && !suppressSimilarityWarning) ? [mostSimilarName] : [], 
        data: {
          mostSimilarName: suppressSimilarityWarning ? "N/A" : mostSimilarName,
          cleansedNameUsed: uppercaseName
        }
      });

    } catch (networkError) {
      console.error("🚨 FAIL-OPEN CATCH BLOCK TRIGGERED:", networkError);
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
