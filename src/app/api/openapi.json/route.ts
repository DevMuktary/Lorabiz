import { NextRequest, NextResponse } from "next/server";
import { getOpenApiSpec } from "@/lib/developer/openapi-spec";

export async function GET(req: NextRequest) {
  try {
    const host = req.headers.get("host") || "api.lorabiz.com";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = `${protocol}://${host}`;

    const spec = getOpenApiSpec(baseUrl);

    return NextResponse.json(spec, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.error("❌ [OpenAPI Route Error]:", err);
    return NextResponse.json({ error: "Failed to generate OpenAPI specification" }, { status: 500 });
  }
}
