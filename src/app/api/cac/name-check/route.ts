import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { proposedName, lineOfBusiness, entityType, mode } = await req.json();

    if (!lineOfBusiness || !entityType) {
      return NextResponse.json({ success: false, message: "Missing required meta parameters." }, { status: 400 });
    }

    const cacApiKey = process.env.CAC_API_KEY;
    if (!cacApiKey) throw new Error("Missing CAC API Key");

    // --- MODE: SUGGEST (The Smart Checked Loop) ---
    if (mode === "SUGGEST") {
      let attempts = 0;
      let validAlternative = "";
      
      while (attempts < 3) {
        attempts++;
        // Ask AI for a single clever variant based on their input text
        const aiSuggestion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a strict legal name generator for the Nigerian Corporate Affairs Commission (CAC).
              Generate exactly ONE highly creative, unique alternative name for a ${entityType} based on the base theme: "${proposedName}".
              Industry sector context: "${lineOfBusiness}".
              Do not append any conversational filler, quotes, or punctuation. Return ONLY the string name.`
            }
          ],
          temperature: 0.8,
        });

        const testName = (aiSuggestion.choices[0].message.content || "").trim().toUpperCase();

        // Cross-verify this suggestion live against CAC servers
        const cacVerify = await fetch("https://vasapp.cac.gov.ng/api/vas/engine/pre/bn-compliance", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X_API_KEY": cacApiKey,
          },
          body: JSON.stringify({ proposedName: testName, lineOfBusiness }),
        });

        if (cacVerify.ok) {
          const verifyJson = await cacVerify.json();
          const score = parseFloat(verifyJson.data?.similarityScore || "0");
          const compliance = parseFloat(verifyJson.data?.complianceScore || "100");

          // Ensure it passes your exact thresholds natively before returning
          if (score < 70 && compliance >= 50 && verifyJson.message !== "Name exist") {
            validAlternative = testName;
            break;
          }
        }
      }

      return NextResponse.json({
        success: true,
        alternativeName: validAlternative || `${proposedName.toUpperCase()} GLOBAL`
      });
    }

    // --- MODE: STANDARD CHECK ---
    // AI Cleansing block runs first to remove bad suffixes (LTD on business names etc.)
    const aiCleanse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Clean the company name for a Nigerian CAC "${entityType}". 
          If Business Name, drop LTD, LIMITED, PLC, INC, FOUNDATION. 
          If LLC, force it to end with LTD. 
          Return ONLY the final string name with no extra characters.`
        },
        { role: "user", content: proposedName }
      ],
      temperature: 0.1,
    });

    const safeName = (aiCleanse.choices[0].message.content || proposedName).trim().toUpperCase();

    const cacResponse = await fetch("https://vasapp.cac.gov.ng/api/vas/engine/pre/bn-compliance", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X_API_KEY": cacApiKey,
      },
      body: JSON.stringify({ proposedName: safeName, lineOfBusiness }),
    });

    if (!cacResponse.ok) {
      return NextResponse.json({
        success: true,
        isBlocked: true,
        message: "Name validation check returned structural conflicts.",
        data: { similarityScore: "100%", complianceScore: "0%", mostSimilarName: "CONFLICT DETECTED", cleansedNameUsed: safeName }
      });
    }

    const cacJson = await cacResponse.json();
    
    // Setup clean fallbacks
    const scoreStr = cacJson.data?.similarityScore || "0%";
    const complianceStr = cacJson.data?.complianceScore || "100%";
    const scoreVal = parseFloat(scoreStr);
    const complianceVal = parseFloat(complianceStr);
    
    // Explicit condition matching user rules: Score >= 70% OR Compliance < 50% OR explicit existence flag
    const isBlocked = scoreVal >= 70 || complianceVal < 50 || cacJson.message === "Name exist";

    return NextResponse.json({
      success: true,
      isBlocked,
      message: cacJson.message,
      data: {
        similarityScore: scoreStr,
        complianceScore: complianceStr,
        mostSimilarName: cacJson.data?.mostSimilarName || "N/A",
        cleansedNameUsed: safeName
      }
    });

  } catch (error) {
    console.error("Gateway Error Instance:", error);
    return NextResponse.json({ success: false, message: "Internal application engine failure." }, { status: 500 });
  }
}
