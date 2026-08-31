import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const websiteToken = 
    process.env.CHATWOOT_WEBSITE_TOKEN || 
    process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN || 
    "28Z4dxiy8wsCEXeFpbbSjfuH";

  const baseUrl = 
    process.env.CHATWOOT_BASE_URL || 
    process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 
    "https://app.chatwoot.com";

  return NextResponse.json({
    enabled: Boolean(websiteToken && websiteToken.trim().length > 0),
    websiteToken: websiteToken.trim(),
    baseUrl: baseUrl.trim(),
  });
}

