import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If the user is authenticated, allow the request to proceed to their intended URL
    return NextResponse.next();
  },
  {
    callbacks: {
      // This function determines whether the user is authorized to access the matched route.
      // If it returns false, NextAuth automatically redirects to pages.signIn
      // with '?callbackUrl=INTENDED_URL' appended.
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/login", // Redirect destination for unauthenticated requests
    },
  }
);

export const config = {
  // Protects /dashboard and all nested sub-routes (e.g., /dashboard/cac/...)
  // Excludes static files, API routes (unless explicitly added), and Next.js internals
  matcher: [
    "/dashboard/:path*",
  ],
};
