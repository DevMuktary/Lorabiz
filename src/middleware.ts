import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// ============================================================================
// Helper to destroy session cookies and force a logout
// ============================================================================
function forceLogoutAndRedirect(req: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, req.url));

  response.cookies.delete("next-auth.session-token");
  response.cookies.delete("__Secure-next-auth.session-token");

  // Optional: Delete legacy CSRF cookie if you ever need a full logout
  // response.cookies.delete("next-auth.csrf-token");
  // response.cookies.delete("__Host-next-auth.csrf-token");

  return response;
}

// ============================================================================
// Middleware
// ============================================================================
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const refCode = req.nextUrl.searchParams.get('ref');

  const host = req.headers.get("host") || req.nextUrl.host || "";
  const isApiHost = host.startsWith("api.");

  // Handle api.* subdomain traffic cleanly
  if (isApiHost) {
    if (pathname === "/") {
      const acceptHeader = req.headers.get("accept") || "";
      if (acceptHeader.includes("application/json")) {
        return NextResponse.json({
          name: "Lorabiz Developer API Gateway",
          status: "operational",
          version: "1.0.0",
          docs: "https://lorabiz.com/docs",
          openapi: "https://api.lorabiz.com/api/openapi.json",
        });
      }
      return NextResponse.redirect(new URL("https://lorabiz.com/docs"));
    }

    // Route dashboard or auth paths accidentally accessed on api.* back to primary domain
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/quadrox-lorabiz-team")
    ) {
      return NextResponse.redirect(
        new URL(`https://lorabiz.com${pathname}${req.nextUrl.search}`)
      );
    }
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const role = token?.role as string | undefined;
  const mfaVerified = token?.mfaVerified as boolean | undefined;

  let response = NextResponse.next();

  // ===========================================================================
  // 0. PUBLIC ROUTES (Always Allow)
  // ===========================================================================
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/auth/login" ||
    pathname === "/auth/register" ||
    pathname === "/quadrox-lorabiz-team/mds/login" ||
    pathname === "/quadrox-lorabiz-team/staff/login" ||
    pathname.startsWith("/quadrox-lorabiz-team/verify-2fa") ||
    pathname.startsWith("/quadrox-lorabiz-team/setup-2fa");

  if (isPublicRoute) {
    // Falls through to the cookie attachment at the end
  }
  // ===========================================================================
  // 1. CLIENT USER PORTAL
  // ===========================================================================
  else if (pathname.startsWith("/dashboard")) {
    if (!token) {
      response = NextResponse.redirect(new URL("/auth/login", req.url));
    } else if (role !== "USER") {
      response = forceLogoutAndRedirect(req, "/auth/login");
    } else if (token.isProfileComplete === false) {
      response = NextResponse.redirect(new URL("/auth/complete-profile", req.url));
    }
  }
  else if (pathname === "/auth/complete-profile") {
    if (!token) {
      response = NextResponse.redirect(new URL("/auth/login", req.url));
    } else if (token.isProfileComplete === true) {
      response = NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }
  // ===========================================================================
  // 2. ADMIN (MDS) PORTAL
  // ===========================================================================
  else if (pathname.startsWith("/quadrox-lorabiz-team/mds")) {
    if (!token) {
      response = NextResponse.redirect(new URL("/quadrox-lorabiz-team/mds/login", req.url));
    } else if (role !== "ADMIN") {
      if (role === "USER") {
        response = NextResponse.redirect(new URL("/dashboard", req.url));
      } else {
        response = forceLogoutAndRedirect(req, "/quadrox-lorabiz-team/mds/login");
      }
    } else if (mfaVerified === false) {
      response = NextResponse.redirect(
        new URL(`/quadrox-lorabiz-team/verify-2fa?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
      );
    }
  }
  // ===========================================================================
  // 3. STAFF PORTAL
  // ===========================================================================
  else if (pathname.startsWith("/quadrox-lorabiz-team/staff")) {
    if (!token) {
      response = NextResponse.redirect(new URL("/quadrox-lorabiz-team/staff/login", req.url));
    } else if (role !== "STAFF") {
      if (role === "USER") {
        response = NextResponse.redirect(new URL("/dashboard", req.url));
      } else {
        response = forceLogoutAndRedirect(req, "/quadrox-lorabiz-team/staff/login");
      }
    } else if (mfaVerified === false) {
      response = NextResponse.redirect(
        new URL(`/quadrox-lorabiz-team/verify-2fa?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
      );
    }
  }

  // ===========================================================================
  // ATTACH REFERRAL COOKIE (If present in URL)
  // ===========================================================================
  if (refCode) {
    response.cookies.set('lorabiz_ref', refCode, { 
      maxAge: 30 * 24 * 60 * 60, // 30 Days
      path: '/'
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/auth/:path*",
    "/dashboard/:path*",
    "/quadrox-lorabiz-team/:path*",
  ],
};
