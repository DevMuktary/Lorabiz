import { NextRequest, NextResponse } from "next/server";
import { getOpenApiSpec } from "@/lib/developer/openapi-spec";

export async function GET(req: NextRequest) {
  try {
    const baseUrl = "https://api.lorabiz.com";
    const spec = getOpenApiSpec(baseUrl);

    return NextResponse.json(spec, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("[OpenAPI Route Error]:", err);
    return NextResponse.json({ error: "Failed to generate OpenAPI specification" }, { status: 500 });
  }
}
