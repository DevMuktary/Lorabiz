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

    const cacApiKey = process.env.CAC_API_KEY;
    if (!cacApiKey) throw new Error("Missing CAC API Key.");

    // ==========================================
    // MODE: INSTANT SUGGESTION GENERATOR (PRE-VERIFIED LOOP)
    // ==========================================
    if (mode === "SUGGEST") {
      let attempts = 0;
      let validAlternative = "";

      while (attempts < 3) {
        attempts++;
        
        const aiSuggestion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a Senior Corporate Naming Specialist under the Nigerian Companies and Allied Matters Act (CAMA).
              Generate exactly ONE highly professional, creative, and unique alternative name for a "${entityType}".
              Base theme to modify: "${proposedName}". 
              Industry vertical: "${lineOfBusiness}".
              
              CRITICAL CAC RULES:
              - DO NOT just append a word to the exact same highly unique root (e.g., if QUADROX failed, change the root to QUADRA, NEXUS, or VORTEX).
              - IF entityType is 'Company (LLC)': The name MUST end with exactly the word "LIMITED" or "LTD".
              - IF entityType is 'Business Name': The name MUST end with a qualifier like VENTURES, CONCEPTS, SERVICES, GLOBAL (DO NOT USE LTD OR LIMITED).
              - Output ONLY the raw name string. Do not use quotes.`
            }
          ],
          temperature: 0.9, 
        });

        const generatedName = (aiSuggestion.choices[0].message.content || "").trim().toUpperCase();

        const cacVerify = await fetch("https://vasapp.cac.gov.ng/api/vas/engine/pre/bn-compliance", {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json", "X_API_KEY": cacApiKey },
          body: JSON.stringify({ proposedName: generatedName, lineOfBusiness }),
        });

        if (cacVerify.ok) {
          const verifyJson = await cacVerify.json();
          
          if (verifyJson.message !== "Name exist") {
            const simStr = verifyJson.data?.similarityScore || "0%";
            const simVal = parseInt(simStr);
            const mostSim = verifyJson.data?.mostSimilarName || "N/A";

            if (simVal < 75) {
              validAlternative = generatedName;
              break;
            } else {
              const semanticCheck = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "system",
                    content: `You are a CAC Examiner. Are these names confusingly similar based on unique root word collision?
                    - If they share a highly unique root, return isConflict: true.
                    - If they only share generic words/prefixes, return isConflict: false.`
                  },
                  { role: "user", content: `Proposed: "${generatedName}"\nConflict: "${mostSim}"` }
                ],
                response_format: { type: "json_schema", json_schema: { name: "check", schema: { type: "object", properties: { isConflict: { type: "boolean" } }, required: ["isConflict"], additionalProperties: false }, strict: true } },
                temperature: 0.1,
              });

              const semanticResult = JSON.parse(semanticCheck.choices[0].message.content || "{}");
              if (!semanticResult.isConflict) {
                validAlternative = generatedName;
                break;
              }
            }
          }
        }
      }

      if (!validAlternative) {
         const fallbackRoot = proposedName.split(" ")[0].substring(0, 5);
         const fallbackSuffix = entityType === "Company (LLC)" ? "LIMITED" : "CONCEPTS";
         validAlternative = `${fallbackRoot} ${Math.floor(Math.random() * 900 + 100)} ${fallbackSuffix}`.toUpperCase();
      }

      return NextResponse.json({ success: true, alternativeName: validAlternative });
    }

    // ==========================================
    // MODE: STANDARD CHECK (Pre-Flight Gatekeeper)
    // ==========================================
    if (!proposedName) {
      return NextResponse.json({ success: false, message: "Proposed name is required." }, { status: 400 });
    }

    const uppercaseName = proposedName.trim().toUpperCase();

    const preFlightCheck = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a legal compliance gatekeeper for the Nigerian Corporate Affairs Commission (CAC).
          Analyze the user's proposed name for a "${entityType}":
          
          1. LLC COMPLIANCE: If entityType is 'Company (LLC)', the name MUST end with 'LTD', 'LIMITED', 'PLC', 'GTE', or 'ULC'. If it doesn't, return status "MISSING_LLC_SUFFIX" and reason "A Company must end with LIMITED or LTD."
          2. BUSINESS NAME COMPLIANCE: If entityType is 'Business Name' and contains 'LTD', 'LIMITED', 'PLC', 'INCORPORATED', or 'INC', return status "ILLEGAL_SUFFIX".
          3. RESTRICTED WORD: If it contains 'FEDERAL', 'NATIONAL', 'GOVERNMENT', 'STATE', 'REGIONAL', 'COOPERATIVE', 'CHAMBER OF COMMERCE', or 'NIGERIAN'. NOTE: 'NIGERIA' is ALLOWED. Only block 'NIGERIAN'.
          4. DANGEROUS WORD: If it contains offensive, illicit, or globally sanctioned terminology.
          5. MISSING SUFFIX (Business Name): If 'Business Name' lacks a standard descriptor at the end, flag as "MISSING_SUFFIX".
          6. If it passes all rules, flag as "PASSED".`
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
              status: { type: "string", enum: ["MISSING_LLC_SUFFIX", "ILLEGAL_SUFFIX", "RESTRICTED_WORD", "DANGEROUS_WORD", "MISSING_SUFFIX", "PASSED"] },
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
    let uiWarningMessage = "";

    if (preFlightResult.status === "MISSING_SUFFIX") {
      uiWarningMessage = "This name might not have a good suffix to be acceptable by CAC. While we keep on working to improve on our name search engine, if the name is queried by CAC, you will receive an SMS/email to update the name.";
    } 
    else if (preFlightResult.status !== "PASSED") {
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
        warningMessage: uiWarningMessage, 
        data: { mostSimilarName: "N/A", cleansedNameUsed: uppercaseName }
      });
    }

    const cacJson = await cacResponse.json();

    if (cacJson.success === false || cacJson.message?.includes("QUALIFIER") || cacJson.error?.includes("QUALIFIER")) {
        return NextResponse.json({
          success: true,
          isBlocked: false, 
          rejectionType: "PASSED_WITH_WARNING",
          reasonMessage: "Name is available and ready for registration.",
          warningMessage: uiWarningMessage || "Proceed with caution. The CAC examiner might query the chosen words.",
          data: { mostSimilarName: "N/A", cleansedNameUsed: uppercaseName }
        });
    }
    
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
    // PHASE 3: THE AI SEMANTIC ARBITER
    // ==========================================
    let finalIsBlocked = false;
    let finalReasonMessage = "Name is available and ready for registration.";

    if (similarityVal >= 75 && mostSimilarName !== "N/A") {
      const semanticCheck = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a Senior Examiner at the Nigerian Corporate Affairs Commission (CAC). A basic text-matching algorithm flagged these two names as highly similar. 
            Determine if a human examiner would REJECT the proposed name for being confusingly similar to the existing one. Be slightly lenient if the entity type is different, but strict on root words.
            
            CRITICAL CAC GUIDELINES:
            1. UNIQUE ROOT COLLISION (REJECT): If both names share a highly unique, invented, or distinct root word (e.g., 'QUADROX', 'ZINOX', 'XELLER') and only differ by a letter or by adding a word after (e.g., 'HOMES' vs 'TECHNOLOGIES LIMITED'), the CAC WILL REJECT IT. Return isConflict: true.
            2. GENERIC WORD SHARING (APPROVE): If they share generic everyday words, Islamic/Christian names, or standard nouns (e.g., 'HALAL', 'MUKHTAR', 'OLIVIA', 'SERVICES', 'NIGERIA') but the distinct prefixes or accompanying words differ (e.g., 'NMY HALAH HUB' vs 'HALAL HOMES HUB'), the CAC will APPROVE it. Return isConflict: false.
            3. EXACT PHONETIC COPY (REJECT): If they are very identical like 99% or pluralized versions of the exact same full name, REJECT IT.`
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
                reason: { type: "string" }
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
      warningMessage: uiWarningMessage, 
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
