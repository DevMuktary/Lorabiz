import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { proposedName, lineOfBusiness } = await req.json();

    // 1. Validate parameters arriving from our frontend wizard
    if (!proposedName || !lineOfBusiness) {
      return NextResponse.json(
        { success: false, message: "Proposed name and line of business are required fields." },
        { status: 400 }
      );
    }

    // 2. Safeguard backend credentials check
    const cacApiKey = process.env.CAC_API_KEY; // Ensure this matches your variable name in Railway
    if (!cacApiKey) {
      console.error("CRITICAL ERROR: 'CAC_API_KEY' environment variable is missing on server environment.");
      return NextResponse.json(
        { success: false, message: "Server configuration missing required integration keys." },
        { status: 500 }
      );
    }

    // 3. Dispatch secure transaction payload to Corporate Affairs Commission endpoint
    const cacResponse = await fetch("https://vasapp.cac.gov.ng/api/vas/engine/pre/bn-compliance", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X_API_KEY": cacApiKey, // Injected downstream on server layout context safely
      },
      body: JSON.stringify({
        proposedName: proposedName.trim().toUpperCase(), // Normalizing criteria to uppercase standard
        lineOfBusiness: lineOfBusiness.trim()
      }),
    });

    // 4. Handle unexpected upstream network failures seamlessly
    if (!cacResponse.ok) {
      const errorPayload = await cacResponse.text();
      console.error(`Upstream CAC Gateway Failure Code [${cacResponse.status}]:`, errorPayload);
      return NextResponse.json(
        { success: false, message: "The Corporate Affairs Commission gateway returned an error. Try again later." },
        { status: cacResponse.status }
      );
    }

    const jsonResult = await cacResponse.json();

    // 5. Echo standardized dataset natively back to user component layout
    return NextResponse.json(jsonResult, { status: 200 });

  } catch (error) {
    console.error("CAC Intermediary Gateway Error Exception:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected runtime failure occurred during compliance assessment." },
      { status: 500 }
    );
  }
}
