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

    // ==========================================
    // MODE: INSTANT SUGGESTION GENERATOR (PRE-VERIFIED)
    // ==========================================
    if (mode === "SUGGEST") {
      let attempts = 0;
      let validAlternative = "";
      const cacApiKey = process.env.CAC_API_KEY;

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
              - DO NOT use the exact same unique root word if the previous name failed (e.g., if QUADROX failed, invent a new distinct root like NEXUS, VORTEX, or QUADRA).
              - The name must contain at least two words, ending with an appropriate industry descriptor (e.g., Foods, Tech, Accommodations, Ventures, Logistics, Studio) that matches their line of business.
              - DO NOT use restricted words like FEDERAL, NATIONAL, GOVERNMENT, HOLDINGS, PLC, LTD, or LIMITED.
              - Output ONLY the raw name string. Do not use quotes.`
            }
          ],
          temperature: 0.9,
        });

        const generatedName = (aiSuggestion.choices[0].message.content || "").trim().toUpperCase();

        // Silently verify the generated name
        if (cacApiKey) {
          const cacVerify = await fetch("https://vasapp.cac.gov.ng/api/vas/engine/pre/bn-compliance", {
            method: "POST",
            headers: { "Accept": "application/json", "Content-Type": "application/json", "X_API_KEY": cacApiKey },
            body: JSON.stringify({ proposedName: generatedName, lineOfBusiness }),
          });

          if (cacVerify.ok) {
            const verifyJson = await cacVerify.json();
            if (verifyJson.message !== "Name exist") {
              const simStr = verifyJson.data?.similarityScore || "0%";
              const simVal = parseFloat(simStr);
              if (simVal < 75) {
                validAlternative = generatedName;
                break;
              }
            }
          }
        } else {
          // Fallback if no API key during suggestion
          validAlternative = generatedName;
          break;
        }
      }

      if (!validAlternative) {
         const fallbackRoot = proposedName.split(" ")[0].substring(0, 5);
         validAlternative = `${fallbackRoot} ${Math.floor(Math.random() * 900 + 100)} SERVICES`.toUpperCase();
      }

      return NextResponse.json({ success: true, alternativeName: validAlternative });
    }

    // ==========================================
    // MODE: STANDARD CHECK 
    // ==========================================
    if (!proposedName) {
      return NextResponse.json({ success: false, message: "Proposed name is required." }, { status: 400 });
    }

    const uppercaseName = proposedName.trim().toUpperCase();

    // 1. ZERO-COST NATIVE GATEKEEPER: Ensure at least two words (No hardcoded suffix checks)
    const wordCount = uppercaseName.split(/\s+/).length;
    if (entityType === "Business Name" && wordCount < 2) {
      return NextResponse.json({
        success: true,
        isBlocked: true,
        rejectionType: "MISSING_SUFFIX",
        reasonMessage: "A business name must contain at least two words. Please add a descriptive word or industry identifier to your proposed name.",
        data: { mostSimilarName: "N/A", cleansedNameUsed: uppercaseName }
      });
    }

    // 2. AI PRE-FLIGHT (Strictly checks for illegal/restricted terms only)
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
          4. If none of the above violations occur, flag as "PASSED". DO NOT evaluate the validity of their descriptive words or suffixes. The CAC API will handle that.`
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
              status: { type: "string", enum: ["ILLEGAL_SUFFIX", "RESTRICTED_WORD", "DANGEROUS_WORD", "PASSED"] },
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
    // PHASE 3: CAC LIVE REGISTRY FETCH 
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

    console.log("\n====== CAC API RAW RESPONSE START ======");
    console.log(`PROPOSED NAME: ${uppercaseName}`);
    console.log("FULL PAYLOAD:", JSON.stringify(cacJson, null, 2));
    console.log("====== CAC API RAW RESPONSE END ======\n");

    // Let CAC's explicit Qualifier error shine through untouched
    if (cacJson.success === false || cacJson.message?.includes("QUALIFIER") || cacJson.error?.includes("QUALIFIER")) {
      return NextResponse.json({
        success: true,
        isBlocked: true,
        rejectionType: "QUALIFIER_NOT_FOUND",
        reasonMessage: cacJson.message || "Proposed name does not include a recognized business qualifier or descriptive word. Please modify it.",
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
    const similarityVal = parseFloat(similarityStr);
    const mostSimilarName = cacJson.data?.mostSimilarName || "N/A";

    // ==========================================
    // PHASE 4: THE SUPREME SEMANTIC ARBITER
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
            Determine if a human examiner would actually REJECT the proposed name under CAMA rules.
            
            CRITICAL CAC GUIDELINES:
            1. DIFFERENT UNIQUE ROOTS (APPROVE): If the primary/first words are distinct (e.g., 'QUADROX FOODS' vs 'FASTBEAR FOODS'), the names are NOT conflicting. Sharing generic industry words like 'FOODS', 'SERVICES', 'TECH', or 'ACCOMMODATIONS' is perfectly fine. Return isConflict: false.
            2. UNIQUE ROOT COLLISION (REJECT): If both names share a highly unique, invented, or phonetically identical root word (e.g., 'QUADROX' vs 'QUADRAX', 'ZINOX' vs 'ZINOC') and only differ by generic secondary words, REJECT IT. Return isConflict: true.
            3. EXACT PHONETIC COPY (REJECT): If they are phonetically identical overall, REJECT IT.`
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
                reason: { type: "string", description: "Explain your reasoning based on root-word collision vs shared generic words." }
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
