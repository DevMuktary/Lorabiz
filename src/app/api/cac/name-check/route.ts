import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to add this to Railway
});

export async function POST(req: Request) {
  try {
    const { proposedName, lineOfBusiness, entityType } = await req.json();

    if (!proposedName || !lineOfBusiness || !entityType) {
      return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
    }

    const cacApiKey = process.env.CAC_API_KEY;
    if (!cacApiKey) throw new Error("Missing CAC API Key");

    // --- PHASE 1: OPENAI CLEANSING & SUGGESTIONS ---
    // Using gpt-4o-mini for instant speed and fractions-of-a-cent pricing
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert Nigerian Corporate Affairs Commission (CAC) legal parser. 
          The user wants to register a ${entityType === 'llc' ? 'Limited Liability Company' : entityType === 'ngo' ? 'Incorporated Trustee (NGO)' : 'Business Name'}.
          
          RULES:
          1. If entity is 'Business Name', REMOVE 'LTD', 'LIMITED', 'PLC', 'INC', 'FOUNDATION', 'INITIATIVE' or related CAC unacceptable word for business name. Keep 'VENTURES', 'ENTERPRISES', 'CONCEPTS', etc.
          2. If entity is 'Limited Liability Company', it MUST end in 'LTD' or 'LIMITED'.
          3. If entity is 'NGO', it MUST end in 'FOUNDATION', 'INITIATIVE', 'MINISTRY', etc.
          4. Generate 5 highly unique, professional alternative names based on the root word and line of business.`
        },
        {
          role: "user",
          content: `Proposed Name: "${proposedName}". Line of Business: "${lineOfBusiness}".`
        }
      ],
      // This forces OpenAI to strictly output the exact JSON format we need
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "cac_name_parser",
          schema: {
            type: "object",
            properties: {
              cleansedName: {
                type: "string",
                description: "The legally cleansed name ready for CAC."
              },
              suggestedNames: {
                type: "array",
                items: { type: "string" },
                description: "5 professional alternative names."
              }
            },
            required: ["cleansedName", "suggestedNames"],
            additionalProperties: false
          },
          strict: true
        }
      },
      temperature: 0.2, // Keeps the AI highly deterministic and logical
    });

    const parsedAiResult = JSON.parse(aiResponse.choices[0].message.content || "{}");
    const safeName = (parsedAiResult.cleansedName || proposedName).toUpperCase();

    // --- PHASE 2: CAC VALIDATION ---
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
            success: false,
            message: "CAC Gateway Error",
            data: { similarityScore: "100%", complianceScore: "0%", aiSuggestedNames: parsedAiResult.suggestedNames, cleansedNameUsed: safeName }
        }, { status: cacResponse.status });
    }

    const cacJson = await cacResponse.json();
    
    // Inject the AI suggestions and the exact cleansed name we used into the payload
    cacJson.data = cacJson.data || {};
    cacJson.data.aiSuggestedNames = parsedAiResult.suggestedNames || [];
    cacJson.data.cleansedNameUsed = safeName;

    // Handle CAC's 403 "Name Exist" embedded inside a 200/403 response
    if (cacJson.message === "Name exist" || cacJson.error === "permission denied") {
        cacJson.data.similarityScore = "100%";
    }

    return NextResponse.json(cacJson, { status: 200 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
