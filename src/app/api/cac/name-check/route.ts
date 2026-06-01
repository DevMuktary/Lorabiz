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
            content: `You are a Senior Corporate Naming Specialist under the Nigerian Companies and Allied Matters Act (CAMA).
            Generate exactly ONE highly professional, creative, and completely unique alternative name for a "${entityType}".
            Base theme to modify: "${proposedName}".
            Industry vertical: "${lineOfBusiness}".
            
            CRITICAL RULES:
            - Must end with a valid business name suffix (e.g., VENTURES, ENTERPRISES, GLOBAL, NIGERIA, STORES, SERVICES, CONCEPTS).
            - DO NOT use restricted words like FEDERAL, NATIONAL, GOVERNMENT, HOLDINGS, PLC, LTD, or LIMITED.
            - Output ONLY the raw name string. Do not use quotes, punctuation, or explanations.`
          }
        ],
        temperature: 0.85,
      });

      const generatedName = (aiSuggestion.choices[0].message.content || "").trim().toUpperCase();
      return NextResponse.json({ success: true, alternativeName: generatedName });
    }

    // --- MODE: STANDARD CHECK ---
    if (!proposedName) {
      return NextResponse.json({ success: false, message: "Proposed name is required." }, { status: 400 });
    }

    const uppercaseName = proposedName.trim().toUpperCase();

    // ==========================================
    // PHASE 1: PRE-FLIGHT GATEKEEPER
    // ==========================================
    const preFlightCheck = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a strict legal compliance gatekeeper for the Nigerian Corporate Affairs Commission (CAC).
          Analyze the user's proposed company name for a "${entityType}":
          
          1. REJECTION - ILLEGAL SUFFIX: If entityType is 'Business Name' and contains 'LTD', 'LIMITED', 'PLC', 'INCORPORATED', or 'INC'.
          2. REJECTION - RESTRICTED WORD: If it contains 'FEDERAL', 'NATIONAL', 'GOVERNMENT', 'STATE', 'REGIONAL', 'COOPERATIVE', 'CHAMBER OF COMMERCE'.
          3. REJECTION - DANGEROUS WORD: If it contains offensive, illicit, or globally sanctioned terminology.
          4. WARNING - MISSING SUFFIX: If entityType is 'Business Name' and does NOT end with a standard structural indicator (e.g., 'VENTURES', 'ENTERPRISES', 'GLOBAL', 'SERVICES', 'STORES', 'CONCEPTS', 'INDUSTRIES', 'AGRO', 'SYNERGY').
          5. If none match, flag as "PASSED".`
        },
        { role: "user", content: `Name: "${uppercaseName}"` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "pre_flight_assessment",
          schema: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["ILLEGAL_SUFFIX", "RESTRICTED_WORD", "DANGEROUS_WORD", "MISSING_SUFFIX", "PASSED"] },
              reason: { type: "string" }
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

    if (preFlightResult.status !== "PASSED") {
      return NextResponse.json({
        success: true,
        isBlocked: true,
        rejectionType: preFlightResult.status,
        reasonMessage: preFlightResult.reason,
        data: { mostSimilarName: "N/A", cleansedNameUsed: uppercaseName }
      });
    }

    // ==========================================
    // PHASE 2: CAC LIVE REGISTRY FETCH
    // ==========================================
    const cacApiKey = process.env.CAC_API_KEY;
    if (!cacApiKey) throw new Error("Missing CAC API Key.");

    const cacResponse = await fetch("https://vasapp.cac.gov.ng/api/vas/engine/pre/bn-compliance", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json", "X_API_KEY": cacApiKey },
      body: JSON.stringify({ proposedName: uppercaseName, lineOfBusiness }),
    });

    if (!cacResponse.ok) {
      return NextResponse.json({
        success: true,
        isBlocked: false,
        reasonMessage: "Registry connection is slow. Proceed, and we will verify manually.",
        data: { mostSimilarName: "N/A", cleansedNameUsed: uppercaseName }
      });
    }

    const cacJson = await cacResponse.json();
    
    // Explicit 100% exact match rejection directly from CAC
    if (cacJson.message === "Name exist") {
      return NextResponse.json({
        success: true,
        isBlocked: true,
        rejectionType: "EXACT_MATCH",
        reasonMessage: "This exact name is already registered by another business.",
        data: { mostSimilarName: uppercaseName, cleansedNameUsed: uppercaseName }
      });
    }

    const similarityStr = cacJson.data?.similarityScore || "0%";
    const similarityVal = parseInt(similarityStr);
    const mostSimilarName = cacJson.data?.mostSimilarName || "N/A";

    // ==========================================
    // PHASE 3: THE AI SEMANTIC ARBITER (CAC EXAMINER MODE)
    // ==========================================
    let finalIsBlocked = false;
    let finalReasonMessage = "Name is available and ready for registration.";

    // If CAC's basic text-matching algorithm flags it as highly similar (> 75%), we ask our AI "Examiner" to judge it
    if (similarityVal >= 75 && mostSimilarName !== "N/A") {
      const semanticCheck = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a Senior Examiner at the Nigerian Corporate Affairs Commission (CAC). A basic text-matching algorithm flagged these two names as highly similar. 
            Your job is to determine if a human CAC examiner would actually REJECT the proposed name for being too similar to the existing one under the Companies and Allied Matters Act (CAMA).
            
            GUIDELINES:
            - If they share generic words (like SERVICES, CONCEPTS, VENTURES, NIGERIA) or share a common first name but the core brand identity/other names are distinctly different (e.g., 'OLIVIA REED SERVICES' vs 'REEN OLIVIA CHARLES VENTURES'), the CAC will approve it. Return isConflict: false.
            - If the core distinct words are phonetically identical, pluralized/singular versions of the same word, or clearly deceptive copycats (e.g., 'NMY HALA HL' vs 'NMY HALAH'), the CAC WILL reject it. Return isConflict: true.`
          },
          { role: "user", content: `Proposed Name: "${uppercaseName}"\nExisting Conflict: "${mostSimilarName}"` }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "semantic_conflict_check",
            schema: {
              type: "object",
              properties: {
                isConflict: { type: "boolean" },
                reason: { type: "string", description: "Explain why CAC would accept or reject this based on CAMA similarity rules." }
              },
              required: ["isConflict", "reason"],
              additionalProperties: false
            },
            strict: true
          }
        },
        temperature: 0.1,
      });

      const semanticResult = JSON.parse(semanticCheck.choices[0].message.content || "{}");
      
      finalIsBlocked = semanticResult.isConflict;
      
      if (finalIsBlocked) {
        finalReasonMessage = `This name is too similar to an existing business. ${semanticResult.reason}`;
      }
    }

    return NextResponse.json({
      success: true,
      isBlocked: finalIsBlocked,
      rejectionType: finalIsBlocked ? "SEMANTIC_CONFLICT" : "PASSED",
      reasonMessage: finalReasonMessage,
      data: {
        mostSimilarName: mostSimilarName,
        cleansedNameUsed: uppercaseName
      }
    });

  } catch (error) {
    console.error("Gateway Error:", error);
    return NextResponse.json({ success: false, message: "Server connection failed." }, { status: 500 });
  }
}
