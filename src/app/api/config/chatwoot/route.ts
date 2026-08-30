import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = 
    process.env.CHATWOOT_BASE_URL || 
    process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 
    "https://support.lorabiz.com";

  const websiteToken = 
    process.env.CHATWOOT_WEBSITE_TOKEN || 
    process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN || 
    "";

  return NextResponse.json({
    enabled: Boolean(websiteToken && websiteToken.trim().length > 0),
    baseUrl: baseUrl.replace(/\/$/, ""),
    websiteToken: websiteToken.trim(),
  });
}
