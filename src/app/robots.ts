import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // Allow Google to crawl the main site, including the specific login and register pages
      allow: [
        '/',
        '/auth/login',
        '/auth/register'
      ],
      // Strictly block Google from indexing logged-in dashboards, APIs, and the staff portal
      disallow: [
        '/dashboard/', 
        '/api/', 
        '/quadrox-lorabiz-team/',
        // Block other auth routes so Google doesn't try to index OTP or reset password links
        '/auth/2fa/',
        '/auth/verify-otp',
        '/auth/resend-login-otp'
      ],
    },
    sitemap: 'https://lorabiz.com/sitemap.xml',
  };
}