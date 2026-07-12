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

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const role = token?.role as string | undefined;
  const mfaVerified = token?.mfaVerified as boolean | undefined;

  // ===========================================================================
  // 0. PUBLIC ROUTES (Always Allow)
  // ===========================================================================
  const isPublicRoute =
    pathname === "/auth/login" ||
    pathname === "/auth/register" ||
    pathname === "/quadrox-lorabiz-team/mds/login" ||
    pathname === "/quadrox-lorabiz-team/staff/login" ||
    pathname.startsWith("/quadrox-lorabiz-team/verify-2fa") ||
    pathname.startsWith("/quadrox-lorabiz-team/setup-2fa");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // ===========================================================================
  // 1. CLIENT USER PORTAL
  // ===========================================================================
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    if (role !== "USER") {
      return forceLogoutAndRedirect(req, "/auth/login");
    }

    return NextResponse.next();
  }

  // ===========================================================================
  // 2. ADMIN (MDS) PORTAL
  // ===========================================================================
  if (pathname.startsWith("/quadrox-lorabiz-team/mds")) {
    if (!token) {
      return NextResponse.redirect(
        new URL("/quadrox-lorabiz-team/mds/login", req.url)
      );
    }

    if (role !== "ADMIN") {
      if (role === "USER") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      return forceLogoutAndRedirect(
        req,
        "/quadrox-lorabiz-team/mds/login"
      );
    }

    if (mfaVerified === false) {
      return NextResponse.redirect(
        new URL(
          `/quadrox-lorabiz-team/verify-2fa?callbackUrl=${encodeURIComponent(
            pathname
          )}`,
          req.url
        )
      );
    }

    return NextResponse.next();
  }

  // ===========================================================================
  // 3. STAFF PORTAL
  // ===========================================================================
  if (pathname.startsWith("/quadrox-lorabiz-team/staff")) {
    if (!token) {
      return NextResponse.redirect(
        new URL("/quadrox-lorabiz-team/staff/login", req.url)
      );
    }

    if (role !== "STAFF") {
      if (role === "USER") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      return forceLogoutAndRedirect(
        req,
        "/quadrox-lorabiz-team/staff/login"
      );
    }

    if (mfaVerified === false) {
      return NextResponse.redirect(
        new URL(
          `/quadrox-lorabiz-team/verify-2fa?callbackUrl=${encodeURIComponent(
            pathname
          )}`,
          req.url
        )
      );
    }

    return NextResponse.next();
  }

  // ===========================================================================
  // DEFAULT
  // ===========================================================================
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/quadrox-lorabiz-team/:path*",
  ],
};
