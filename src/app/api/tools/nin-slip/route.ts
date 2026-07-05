import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce Authentication Guard
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }

    const { nin, slipType, attestationsAccepted } = await req.json();

    // 2. Input Validation
    if (!nin || !/^\d{11}$/.test(nin)) {
      return NextResponse.json({ success: false, message: "Please provide a valid 11-digit NIN." }, { status: 400 });
    }

    const validTypes = ["nin_premium", "nin_standard", "nin_regular"];
    if (!slipType || !validTypes.includes(slipType)) {
      return NextResponse.json({ success: false, message: "Invalid slip type selected." }, { status: 400 });
    }

    if (!attestationsAccepted) {
      return NextResponse.json({ success: false, message: "You must accept the legal disclaimers to proceed." }, { status: 400 });
    }

    const apiKey = process.env.DATAVERIFY_API_KEY;
    if (!apiKey) {
      console.error("❌ DataVerify API Key missing from environment variables.");
      return NextResponse.json({ success: false, message: "Server configuration error. Please contact support." }, { status: 500 });
    }

    // 3. Connect to Third-Party Provider (appending .php as required by vendor spec)
    const url = `https://dataverify.com.ng/developers/nin_slips/${slipType}.php`;

    const apiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        nin: nin,
      }),
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok || data.status !== "success" || !data.pdf_base64) {
      return NextResponse.json({ 
        success: false, 
        message: data.message || "Failed to retrieve slip from database. Verify your NIN." 
      }, { status: 422 });
    }

    // 4. Return secure Base64 back to client
    return NextResponse.json({
      success: true,
      pdfBase64: data.pdf_base64
    });

  } catch (error: any) {
    console.error("❌ NIN Slip API Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error occurred." }, { status: 500 });
  }
}
