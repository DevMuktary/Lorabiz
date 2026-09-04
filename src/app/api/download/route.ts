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

    // Security check: parse and validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(fileUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
    }

    // Only allow HTTPS
    if (parsedUrl.protocol !== "https:") {
      return NextResponse.json(
        { error: "Invalid URL scheme. Only HTTPS is allowed." },
        { status: 400 }
      );
    }

    // Sanitize pathname to prevent directory traversal attacks (CWE-22 / CWE-918)
    const pathname = parsedUrl.pathname;
    if (pathname.includes("..") || !/^\/[a-zA-Z0-9_\-\.\/%@]+$/.test(pathname)) {
      return NextResponse.json({ error: "Invalid URL path." }, { status: 400 });
    }

    // SSRF Prevention: Select fixed trusted origin based on validated hostname
    let trustedOrigin: string;
    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname === "res.cloudinary.com") {
      trustedOrigin = "https://res.cloudinary.com";
    } else if (hostname === "lorabiz.com") {
      trustedOrigin = "https://lorabiz.com";
    } else if (hostname === "www.lorabiz.com") {
      trustedOrigin = "https://www.lorabiz.com";
    } else {
      return NextResponse.json({ error: "URL host is not allowed." }, { status: 400 });
    }

    // Construct the outgoing request URL strictly from the fixed trusted origin
    const safeUrl = `${trustedOrigin}${pathname}${parsedUrl.search}`;

    const response = await fetch(safeUrl, {
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
