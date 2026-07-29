import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

// 1. Comprehensive SEO Metadata Configuration
export const metadata: Metadata = {
  metadataBase: new URL('https://lorabiz.com'), // Replace with your actual production URL
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
  ],
  authors: [{ name: 'QUADROX TECHNOLOGIES LIMITED' }],
  creator: 'QUADROX TECHNOLOGIES LIMITED',
  publisher: 'QUADROX TECHNOLOGIES LIMITED',
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: '/',
    title: 'Lorabiz | Smart Business Management & Registrations',
    description:
      'Streamline your business operations with Lorabiz. Expert tools for CAC registrations, identity verification, and financial management.',
    siteName: 'Lorabiz',
    images: [
      {
        url: '/logo.png', // Ensure this points to a high-res OG image in your public folder
        width: 1200,
        height: 630,
        alt: 'Lorabiz Platform Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lorabiz | Smart Business Management & Registrations',
    description:
      'Streamline your business operations with Lorabiz. Expert tools for CAC registrations, identity verification, and financial management.',
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

// 2. Strict Viewport Configuration
// Notice that `themeColor` is omitted here so our client-side `ThemeColorUpdater` can manage it dynamically.
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
  return (
    // suppressHydrationWarning is strictly required on the html tag when using next-themes
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers attribute="class" defaultTheme="system" enableSystem>
          {children}
        </Providers>
      </body>
    </html>
  );
}
