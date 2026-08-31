import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const websiteId = 
    process.env.CRISP_WEBSITE_ID || 
    process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID || 
    "";

  return NextResponse.json({
    enabled: Boolean(websiteId && websiteId.trim().length > 0),
    websiteId: websiteId.trim(),
  });
}
