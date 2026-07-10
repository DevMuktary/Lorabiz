import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Helper to destroy session cookies and force a logout
function forceLogoutAndRedirect(req: any, path: string) {
  const response = NextResponse.redirect(new URL(path, req.url));
  response.cookies.delete("next-auth.session-token");
  response.cookies.delete("__Secure-next-auth.session-token");
  return response;
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    
    // If there's no token at all, NextAuth handles it, but we can safely extract properties
    const role = token?.role as string | undefined;
    const mfaVerified = token?.mfaVerified as boolean | undefined;

    // =========================================================================
    // 0. ALLOW PUBLIC MFA & LOGIN PATHS TO PREVENT REDIRECTION LOOPS
    // =========================================================================
    const isAuthCheckpoint = 
      pathname === "/quadrox-lorabiz-team/mds/login" ||
      pathname === "/quadrox-lorabiz-team/staff/login" ||
      pathname.startsWith("/quadrox-lorabiz-team/verify-2fa") ||
      pathname.startsWith("/quadrox-lorabiz-team/setup-2fa");

    if (isAuthCheckpoint) {
      return NextResponse.next();
    }

    // =========================================================================
    // 1. MANAGING DIRECTOR (ADMIN) PORTAL: /quadrox-lorabiz-team/mds/*
    // =========================================================================
    if (pathname.startsWith("/quadrox-lorabiz-team/mds/dashboard")) {
      if (role !== "ADMIN") {
        if (role === "USER") return NextResponse.redirect(new URL("/dashboard", req.url)); // Send users back to safety
        return forceLogoutAndRedirect(req, "/quadrox-lorabiz-team/mds/login"); // Spoil Staff cookie
      }

      if (mfaVerified === false) {
        return NextResponse.redirect(new URL(`/quadrox-lorabiz-team/verify-2fa?callbackUrl=${encodeURIComponent(pathname)}`, req.url));
      }
    }

    // =========================================================================
    // 2. STAFF PORTAL: /quadrox-lorabiz-team/staff/*
    // =========================================================================
    if (pathname.startsWith("/quadrox-lorabiz-team/staff/dashboard")) {
      if (role !== "STAFF") {
        if (role === "USER") return NextResponse.redirect(new URL("/dashboard", req.url)); // Send users back to safety
        return forceLogoutAndRedirect(req, "/quadrox-lorabiz-team/staff/login"); // Spoil Admin cookie
      }

      if (mfaVerified === false) {
        return NextResponse.redirect(new URL(`/quadrox-lorabiz-team/verify-2fa?callbackUrl=${encodeURIComponent(pathname)}`, req.url));
      }
    }

    // =========================================================================
    // 3. CLIENT USER PORTAL: /dashboard/*
    // =========================================================================
    if (pathname.startsWith("/dashboard")) {
      if (role !== "USER") {
        // If Staff or Admin tries to access the user dashboard, spoil cookies and kick to user login
        return forceLogoutAndRedirect(req, "/auth/login");
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/quadrox-lorabiz-team/:path*",
  ],
};
