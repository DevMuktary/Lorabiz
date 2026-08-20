import type { Metadata, Viewport } from 'next';
import Script from 'next/script'; // <-- Imported Next.js Script component
import './globals.css';
import { Providers } from '@/components/providers';
import DynamicPageTitle from '@/components/DynamicPageTitle'; 

export const metadata: Metadata = {
  metadataBase: new URL('https://lorabiz.com'),
  title: {
    default: 'Lorabiz | Smart Business Management & Registrations',
    template: '%s | Lorabiz',
  },
  description:
    'Lorabiz is a powerful platform for seamless business management, offering swift CAC registrations, LLC incorporations, NIN slip verifications, airtime services, and secure financial tools.',
  keywords: [
    'Lorabiz',
    'CAC registration Nigeria',
    'LLC incorporation',
    'business name registration',
    'NIN verification',
    'airtime top-up',
    'business management software',
    'startup compliance',
    'Tax ID Generation',
    'Fast Scuml Registration',
    'TradeMark Registration',
  ],
  authors: [{ name: 'QUADROX TECHNOLOGIES LIMITED' }],
  creator: 'QUADROX TECHNOLOGIES LIMITED',
  publisher: 'QUADROX TECHNOLOGIES LIMITED',
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: '/',
    title: 'Lorabiz | Smart  Management & Registrations',
    description:
      'Streamline your business operations with Lorabiz. Expert tools for CAC, Scuml, Tax id, Airtime registrations, verification, and GovTech management.',
    siteName: 'Lorabiz',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Lorabiz Platform Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lorabiz | Smart  Management & Registrations',
    description:
      'Streamline your business operations with Lorabiz. Expert tools for CAC, Scuml, Tax id, Airtime registrations, verification, and GovTech management.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // JSON-LD Organization Schema for Google SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "LoraBiz",
    "legalName": "QUADROX TECHNOLOGIES LIMITED",
    "url": "https://lorabiz.com",
    "logo": "https://lorabiz.com/logo.png",
    "description": "Lorabiz is a powerful platform for seamless business management, offering swift CAC registrations, LLC incorporations, NIN slip verifications, SCUML Certificate registrations, airtime services, and secure financial tools.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Lagos",
      "addressRegion": "Lagos State",
      "addressCountry": "NG"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "support@lorabiz.com",
      "contactType": "customer support"
    },
    "sameAs": [
      "https://x.com/use_lorabiz",
      "https://instagram.com/use_lorabiz",
      "https://linkedin.com/company/use_lorabiz",
      "https://facebook.com/use_lorabiz"
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Injecting the SEO Schema globally */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      {/* CRITICAL FIX: Removed transition-colors duration-300 from body */}
      <body className="antialiased bg-background text-foreground min-h-[100dvh] flex flex-col">
        <DynamicPageTitle /> {/* <-- Auto-manages all Client Page Titles silently! */}
        
        <Providers>
          {children}
        </Providers>

        {/* --- SimpleAnalytics Tracking --- */}
        <Script
          src="https://scripts.simpleanalyticscdn.com/latest.js"
          strategy="afterInteractive"
        />
        {/* Fallback for users with JavaScript disabled */}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://queue.simpleanalyticscdn.com/noscript.gif"
            alt=""
            referrerPolicy="no-referrer-when-downgrade"
          />
        </noscript>

      </body>
    </html>
  );
}
