// src/app/api/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const fileUrl = searchParams.get("url");
    const rawFilename = searchParams.get("filename") || "document.pdf";

    if (!fileUrl) {
      return NextResponse.json({ error: "URL parameter is required." }, { status: 400 });
    }

    // Security check: parse and validate URL before fetching (SSRF hardening)
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(fileUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return NextResponse.json({ error: "Invalid URL scheme." }, { status: 400 });
    }

    // Allowlist trusted hostnames only
    const ALLOWED_HOSTNAMES = new Set([
      "res.cloudinary.com",
      "cloudinary.com",
      "lorabiz.com",
      "www.lorabiz.com",
    ]);

    if (!ALLOWED_HOSTNAMES.has(parsedUrl.hostname)) {
      return NextResponse.json({ error: "URL host is not allowed." }, { status: 400 });
    }

    // Prevent path traversal
    if (parsedUrl.pathname.includes("..")) {
      return NextResponse.json({ error: "Invalid path in URL." }, { status: 400 });
    }

    const response = await fetch(parsedUrl.toString(), {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch resource (${response.statusText})` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const arrayBuffer = await response.arrayBuffer();

    // Clean filename: remove newlines and weird chars
    const sanitizedFilename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, "_");

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${sanitizedFilename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Force Download Proxy Error:", error);
    return NextResponse.json(
      { error: "Failed to download document." },
      { status: 500 }
    );
  }
}
