import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NIN Slip Verification & Printing Online | Regular, Standard & Premium - Lorabiz',
  description:
    'Instantly verify and print National Identification Number (NIN) slips in Nigeria. Download Regular, Standard, or Premium card layouts accepted for CAC and banking KYC.',
  keywords: [
    'NIN slip verification Nigeria',
    'print NIN slip online',
    'regular NIN slip download',
    'standard NIN slip',
    'premium NIN card layout',
    'NIN verification for CAC',
    'NIMC verification portal',
  ],
  alternates: {
    canonical: 'https://lorabiz.com/services/nin',
  },
  openGraph: {
    title: 'NIN Slip Verification & Printing Online | Lorabiz',
    description:
      'Instant online verification and download of NIN slips in Nigeria. High-resolution Regular, Standard, and Premium card layouts.',
    url: 'https://lorabiz.com/services/nin',
    siteName: 'Lorabiz',
    images: [
      {
        url: 'https://lorabiz.com/logo.png',
        width: 1200,
        height: 630,
        alt: 'NIN Slip Verification Lorabiz',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NIN Slip Verification & Printing Online | Lorabiz',
    description:
      'Instantly verify and download NIN slips in Nigeria. Regular, Standard, and Premium formats accepted nationwide.',
    images: ['https://lorabiz.com/logo.png'],
  },
};

export default function NinLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'NIN Slip Verification and Retrieval Service',
    provider: {
      '@type': 'Organization',
      name: 'LoraBiz',
      legalName: 'QUADROX TECHNOLOGIES LIMITED',
      url: 'https://lorabiz.com',
    },
    serviceType: 'National Identity Verification and Document Retrieval',
    areaServed: {
      '@type': 'Country',
      name: 'Nigeria',
    },
    description:
      'Secure retrieval and formatting of National Identification Number (NIN) slips: Regular demographic format, Standard KYC slip, and Premium card layout.',
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://lorabiz.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Services',
        item: 'https://lorabiz.com/services/nin',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'NIN Verification',
        item: 'https://lorabiz.com/services/nin',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {children}
    </>
  );
}
