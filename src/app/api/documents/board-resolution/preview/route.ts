import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { 
  BoardResolutionFormData, 
  generateAIBoardResolution, 
  generateDeterministicResolution 
} from "@/lib/board-resolution-generator";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const formData: BoardResolutionFormData = body?.formData || body;

    if (
      !formData ||
      !formData.companyName?.trim() ||
      !formData.registeredAddress?.trim() ||
      !formData.targetInstitution?.trim()
    ) {
      return NextResponse.json({ 
        success: false, 
        message: "Please provide all required fields (Company Name, Address, and Target Bank/Fintech)." 
      }, { status: 400 });
    }

    if (!formData.directors || !Array.isArray(formData.directors) || formData.directors.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "Please add at least one Director or Company Secretary." 
      }, { status: 400 });
    }

    // Generate structured resolution
    let structuredResolution;
    try {
      structuredResolution = await generateAIBoardResolution(formData);
    } catch (e) {
      console.warn("AI generation failed, fallback to deterministic:", e);
      structuredResolution = generateDeterministicResolution(formData);
    }

    return NextResponse.json({
      success: true,
      preview: structuredResolution,
      data: {
        structuredResolution,
        preview: structuredResolution,
        previewTimestamp: new Date().toISOString(),
        watermark: "PREVIEW COPY • OFFICIAL WATERMARK WILL BE REMOVED UPON FINAL DOWNLOAD"
      }
    });

  } catch (error: any) {
    console.error("Board Resolution Preview Generation Error:", error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Failed to generate preview. Please try again." 
    }, { status: 500 });
  }
}
