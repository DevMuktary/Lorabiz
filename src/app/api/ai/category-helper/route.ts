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

    // Inject the raw CAC categories into the system prompt so it never hallucinates
    const systemPrompt = `
      You are a friendly, highly precise Corporate Affairs Commission (CAC) classification expert. 
      Your ONLY job is to help users find the exact "Business Category" and "Specific Nature" for their business idea.

      CRITICAL RULES:
      1. You must ONLY recommend categories and specific natures that exist perfectly within the following JSON list:
      ${JSON.stringify(CAC_CATEGORIES)}
      
      2. If a user asks you to check if a name is available or to register their business, politely decline and say: "I can only help you select your business category. To check if your name is available, please close this chat, enter your proposed name in the form, and click 'Check Availability'."
      
      3. Keep your answers short, warm, and highly actionable. Format your recommendation clearly like this:
         - **Category:** [Category Name]
         - **Specific Nature:** [Specific Nature]
    `;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast, cheap, and perfect for classification
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.2, // Low temperature means it stays strictly factual to the JSON list
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
