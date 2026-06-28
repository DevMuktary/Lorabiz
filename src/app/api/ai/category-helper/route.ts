import { NextResponse } from "next/server";
import OpenAI from "openai";
import { CAC_CATEGORIES } from "@/lib/cac-categories";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, message: "Invalid chat format." }, { status: 400 });
    }

    // Limit context window to the last 4 messages to save tokens
    const trimmedMessages = messages.slice(-4);

    const systemPrompt = `
      You are LorabizAI, a professional CAC classification expert.
      
      YOUR ROLE: Help users map their business activity to the provided JSON list of CAC categories: ${JSON.stringify(CAC_CATEGORIES)}.

      STRICT RULES (Violating these will cause failure):
      1. ENGLISH ONLY: If the user inputs any language other than English, reply ONLY with: "I can only assist with CAC business categorization in English."
      2. SCOPE LOCK: If the user asks about anything NOT related to CAC business categorization (e.g., coding, translation, life advice), reply ONLY with: "I can only assist with CAC business categorization. What does your business do?"
      3. OUTPUT FORMAT: 
         - When recommending:
           **Category:** [Category Name]
           **Specific Nature:** [Specific Nature]
         - When asking for clarification: Keep it warm but extremely concise. Do not chatter.
      4. NO CHIT-CHAT: Do not provide general life advice or anything outside the CAC categorization.
      5. NAME CHECKING: If asked about name availability or registration, reply ONLY with: "Please close this chat and use the 'Check Availability' button on the form."
    `;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: systemPrompt },
        ...trimmedMessages
      ],
      // MAX TOKENS: Prevents long, runaway AI replies that burn credits
      max_tokens: 150, 
      temperature: 0.1, // Lower temperature keeps it more rigid and less "chatty"
    });

    return NextResponse.json({
      success: true,
      message: aiResponse.choices[0].message.content,
    });

  } catch (error) {
    console.error("AI Category Helper Error:", error);
    return NextResponse.json({ success: false, message: "AI connection failed." }, { status: 500 });
  }
}
