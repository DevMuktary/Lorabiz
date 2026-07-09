import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
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
        if (role === "STAFF") return NextResponse.redirect(new URL("/quadrox-lorabiz-team/staff/dashboard", req.url));
        if (role === "USER") return NextResponse.redirect(new URL("/dashboard", req.url));
        return NextResponse.redirect(new URL("/quadrox-lorabiz-team/mds/login", req.url));
      }

      // MFA Gate: Enforce 2FA completion before granting access to executive routes
      if (mfaVerified === false) {
        return NextResponse.redirect(new URL(`/quadrox-lorabiz-team/verify-2fa?callbackUrl=${encodeURIComponent(pathname)}`, req.url));
      }
    }

    // =========================================================================
    // 2. STAFF PORTAL: /quadrox-lorabiz-team/staff/*
    // =========================================================================
    if (pathname.startsWith("/quadrox-lorabiz-team/staff/dashboard")) {
      if (role !== "STAFF") {
        if (role === "ADMIN") return NextResponse.redirect(new URL("/quadrox-lorabiz-team/mds/dashboard", req.url));
        if (role === "USER") return NextResponse.redirect(new URL("/dashboard", req.url));
        return NextResponse.redirect(new URL("/quadrox-lorabiz-team/staff/login", req.url));
      }

      // MFA Gate: Enforce 2FA completion before granting access to staff operational desk
      if (mfaVerified === false) {
        return NextResponse.redirect(new URL(`/quadrox-lorabiz-team/verify-2fa?callbackUrl=${encodeURIComponent(pathname)}`, req.url));
      }
    }

    // =========================================================================
    // 3. CLIENT USER PORTAL: /dashboard/*
    // =========================================================================
    if (pathname.startsWith("/dashboard")) {
      if (role !== "USER") {
        if (role === "ADMIN") return NextResponse.redirect(new URL("/quadrox-lorabiz-team/mds/dashboard", req.url));
        if (role === "STAFF") return NextResponse.redirect(new URL("/quadrox-lorabiz-team/staff/dashboard", req.url));
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/quadrox-lorabiz-team/:path*",
  ],
};
