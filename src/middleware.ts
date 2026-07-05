import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const role = token?.role as string | undefined;

    // =========================================================================
    // 1. MANAGING DIRECTOR (ADMIN) PORTAL: /quadrox-lorabiz-team/mds/*
    // =========================================================================
    if (pathname.startsWith("/quadrox-lorabiz-team/mds")) {
      // Allow access to the login page itself without redirecting loops
      if (pathname === "/quadrox-lorabiz-team/mds/login") {
        return NextResponse.next();
      }
      
      // If logged in but NOT an ADMIN, kick them to their own correct portal
      if (role !== "ADMIN") {
        if (role === "STAFF") return NextResponse.redirect(new URL("/quadrox-lorabiz-team/staff", req.url));
        if (role === "USER") return NextResponse.redirect(new URL("/dashboard", req.url));
        return NextResponse.redirect(new URL("/quadrox-lorabiz-team/mds/login", req.url));
      }
    }

    // =========================================================================
    // 2. STAFF PORTAL: /quadrox-lorabiz-team/staff/*
    // =========================================================================
    if (pathname.startsWith("/quadrox-lorabiz-team/staff")) {
      if (pathname === "/quadrox-lorabiz-team/staff/login") {
        return NextResponse.next();
      }

      // If logged in but NOT a STAFF member, kick them to their correct portal
      if (role !== "STAFF") {
        if (role === "ADMIN") return NextResponse.redirect(new URL("/quadrox-lorabiz-team/mds", req.url));
        if (role === "USER") return NextResponse.redirect(new URL("/dashboard", req.url));
        return NextResponse.redirect(new URL("/quadrox-lorabiz-team/staff/login", req.url));
      }
    }

    // =========================================================================
    // 3. CLIENT USER PORTAL: /dashboard/*
    // =========================================================================
    if (pathname.startsWith("/dashboard")) {
      // Prevent internal staff or admins from browsing regular user dashboards
      if (role !== "USER") {
        if (role === "ADMIN") return NextResponse.redirect(new URL("/quadrox-lorabiz-team/mds", req.url));
        if (role === "STAFF") return NextResponse.redirect(new URL("/quadrox-lorabiz-team/staff", req.url));
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // By returning true here, we let our custom routing logic inside middleware() 
      // handle exact redirects based on path and role rather than a single default fallback.
      authorized: () => true,
    },
  }
);

export const config = {
  // Inspect all paths inside the three secured domains
  matcher: [
    "/dashboard/:path*",
    "/quadrox-lorabiz-team/mds/:path*",
    "/quadrox-lorabiz-team/staff/:path*",
  ],
};
