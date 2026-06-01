import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { proposedName, lineOfBusiness, entityType, mode } = await req.json();

    if (!lineOfBusiness || !entityType) {
      return NextResponse.json({ success: false, message: "Missing required metadata parameters." }, { status: 400 });
    }

    // --- MODE: INSTANT SUGGESTION GENERATOR ---
    if (mode === "SUGGEST") {
      const aiSuggestion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert corporate naming specialist under the Nigerian Companies and Allied Matters Act (CAMA).
            Generate exactly ONE highly professional, creative, and completely unique alternative name for a "${entityType}".
            Base theme to modify: "${proposedName}".
            Industry vertical: "${lineOfBusiness}".
            
            CRITICAL RULES:
            - Must end with a valid business name suffix (e.g., VENTURES, ENTERPRISES, GLOBAL, NIGERIA, STORES, SERVICES, concepts).
            - DO NOT use restricted words like FEDERAL, NATIONAL, GOVERNMENT, HOLDINGS, PLC, LTD, or LIMITED.
            - Output ONLY the raw name string. Do not use quotes, punctuation, or explanations.`
          }
        ],
        temperature: 0.85,
      });

      const generatedName = (aiSuggestion.choices[0].message.content || "").trim().toUpperCase();
      return NextResponse.json({ success: true, alternativeName: generatedName });
    }

    // --- MODE: STANDARD CHECK WITH PRE-FLIGHT GATEKEEPER ---
    if (!proposedName) {
      return NextResponse.json({ success: false, message: "Proposed name is required." }, { status: 400 });
    }

    const uppercaseName = proposedName.trim().toUpperCase();

    // 1. Pre-Flight AI Evaluation Rule Check
    const preFlightCheck = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a legal compliance gatekeeper checking names against Nigerian Corporate Affairs Commission (CAC) rules.
          Analyze the user's proposed company name for a "${entityType}" based on these strict guidelines:
          
          1. REJECTION - ILLEGAL SUFFIX: If entityType is 'Business Name' and the name contains 'LTD', 'LIMITED', 'PLC', 'INCORPORATED', or 'INC', flag as "ILLEGAL_SUFFIX".
          2. REJECTION - RESTRICTED WORD: If the name contains prohibited terms without special permission (e.g., 'FEDERAL', 'NATIONAL', 'GOVERNMENT', 'STATE', 'REGIONAL', 'COOPERATIVE', 'CHAMBER OF COMMERCE', 'AMBASSADOR'), flag as "RESTRICTED_WORD".
          3. WARNING - MISSING SUFFIX: If entityType is 'Business Name' and the name does NOT end with a structure indicator word like 'VENTURES', 'ENTERPRISES', 'GLOBAL', 'SERVICES', 'STORES', 'CONCEPTS', 'INDUSTRIES', 'AGRO', etc., flag as "MISSING_SUFFIX".
          4. If none of these match, flag as "PASSED".`
        },
        {
          role: "user",
          content: `Name: "${uppercaseName}"`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "pre_flight_assessment",
          schema: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["ILLEGAL_SUFFIX", "RESTRICTED_WORD", "MISSING_SUFFIX", "PASSED"] },
              reason: { type: "string", description: "Clear, customer-friendly explanation of why it failed or what is missing." }
            },
            required: ["status", "reason"],
            additionalProperties: false
          },
          strict: true
        }
      },
      temperature: 0.1,
    });

    const preFlightResult = JSON.parse(preFlightCheck.choices[0].message.content || "{}");

    // Intercept upfront rejections immediately before hitting CAC API
    if (preFlightResult.status === "ILLEGAL_SUFFIX" || preFlightResult.status === "RESTRICTED_WORD" || preFlightResult.status === "MISSING_SUFFIX") {
      return NextResponse.json({
        success: true,
        isBlocked: true,
        rejectionType: preFlightResult.status,
        reasonMessage: preFlightResult.reason,
        data: { mostSimilarName: "N/A", cleansedNameUsed: uppercaseName }
      });
    }

    // 2. Registry Live Validation via CAC Gateway
    const cacApiKey = process.env.CAC_API_KEY;
    if (!cacApiKey) throw new Error("Missing CAC API Key configuration variable.");

    const cacResponse = await fetch("https://vasapp.cac.gov.ng/api/vas/engine/pre/bn-compliance", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X_API_KEY": cacApiKey,
      },
      body: JSON.stringify({ proposedName: uppercaseName, lineOfBusiness }),
    });

    if (!cacResponse.ok) {
      // Graceful fallback for API outages or credential changes
      return NextResponse.json({
        success: true,
        isBlocked: false, // Let them proceed to you manually if the government server drops
        reasonMessage: "CAC portal timeout. Proceeding with offline queue verification.",
        data: { mostSimilarName: "N/A", cleansedNameUsed: uppercaseName }
      });
    }

    const cacJson = await cacResponse.json();
    
    const similarityStr = cacJson.data?.similarityScore || "0%";
    const complianceStr = cacJson.data?.complianceScore || "100%";
    const similarityVal = parseFloat(similarityStr);
    const complianceVal = parseFloat(complianceStr);

    // Apply strict business rule parameters set by the system
    const isBlocked = similarityVal >= 70 || complianceVal < 50 || cacJson.message === "Name exist";
    const failureReason = cacJson.message === "Name exist" 
      ? "This exact name is already registered on the CAC index registry." 
      : `High conflict matching parameters discovered in the index database registry.`;

    return NextResponse.json({
      success: true,
      isBlocked,
      rejectionType: isBlocked ? "REGISTRY_CONFLICT" : "PASSED",
      reasonMessage: isBlocked ? failureReason : "Name is fully available and legally unique.",
      data: {
        mostSimilarName: cacJson.data?.mostSimilarName || "N/A",
        cleansedNameUsed: uppercaseName
      }
    });

  } catch (error) {
    console.error("Critical Gateway Crash:", error);
    return NextResponse.json({ success: false, message: "Internal server infrastructure failure." }, { status: 500 });
  }
}
