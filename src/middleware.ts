import { withAuth } from "next-auth/middleware";

export default withAuth({
  // This ensures unauthenticated users are redirected to your custom login page
  // instead of the default NextAuth fallback page.
  pages: {
    signIn: "/auth/login", 
  },
});

export const config = {
  // The matcher dictates which routes require authentication.
  // This protects exactly /dashboard and everything nested inside it.
  matcher: [
    "/dashboard/:path*",
  ],
};
