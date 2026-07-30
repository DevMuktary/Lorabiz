import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

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
        url: '/logo.png',
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
    <html lang="en" suppressHydrationWarning>
      {/* CRITICAL FIX: Removed transition-colors duration-300 from body */}
      <body className="antialiased bg-background text-foreground min-h-[100dvh] flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
