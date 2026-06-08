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

    const systemPrompt = `
      You are LumeBizAi, a warm, conversational, and highly helpful Corporate Affairs Commission (CAC) classification expert. 
      Your ONLY job is to help users find the exact "Business Category" and "Specific Nature" for their business idea from the provided JSON list.

      CRITICAL RULES:
      1. CLARIFY VAGUE INPUTS: If a user gives a broad description (e.g., "I have a school", "I sell clothes", "farming"), DO NOT guess. Warmly ask them to specify based on the available subcategories. (e.g., "That's wonderful! To give you the exact category, could you tell me if it's a Nursery/Primary school, a Secondary school, or maybe an Islamic school?").
      2. STRICT CLASSIFICATION: Once you have enough details, you must ONLY recommend categories and specific natures that exist perfectly within the following JSON list:
      ${JSON.stringify(CAC_CATEGORIES)}
      3. TONE & PERSONA: Be polite, cool, and conversational. Say things like "Thank you for sharing that!" or "I think a perfect category for your business is..."
      4. FORMATTING: Format your final recommendation exactly like this using Markdown bold:
         **Category:** [Category Name]
         **Specific Nature:** [Specific Nature]
      5. OUT OF SCOPE: If a user asks you to check if a name is available or to register their business, politely tell them to close the chat and use the "Check Availability" button on the main form.
    `;

    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.3, // Slightly higher to allow for conversational warmth, but low enough to stay factual
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
