import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CAC Business Registration Nigeria | Register Business Name, LLC, NGO Online - Lorabiz',
  description:
    'Fast and accredited CAC business registration in Nigeria. Register your Business Name in 2 hours, Limited Liability Company (LLC), or Incorporated Trustees (NGO) with approved certificates, status report, and official Tax ID.',
  keywords: [
    'CAC registration Nigeria',
    'register business name online',
    'LLC incorporation Nigeria',
    'CAMA 2020 compliance',
    'CAC online registration fee',
    'register company in Nigeria',
    'download CAC certificate',
    'corporate affairs commission Nigeria',
  ],
  alternates: {
    canonical: 'https://lorabiz.com/services/cac',
  },
  openGraph: {
    title: 'CAC Business Registration Nigeria | Fast & Approved - Lorabiz',
    description:
      'Fast online CAC registration for Business Names, Limited Liability Companies, and NGOs in Nigeria. Track real-time status and download official certificates.',
    url: 'https://lorabiz.com/services/cac',
    siteName: 'Lorabiz',
    images: [
      {
        url: 'https://lorabiz.com/cac.png',
        width: 800,
        height: 600,
        alt: 'CAC Registration Lorabiz',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CAC Business Registration Nigeria | Lorabiz',
    description:
      'Fast online CAC registration for Business Names, LLCs, and NGOs in Nigeria. Complete filings in 2 hours with instant Tax ID generation.',
    images: ['https://lorabiz.com/cac.png'],
  },
};

export default function CacLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'CAC Business Registration Service',
    provider: {
      '@type': 'Organization',
      name: 'LoraBiz',
      legalName: 'QUADROX TECHNOLOGIES LIMITED',
      url: 'https://lorabiz.com',
    },
    serviceType: 'Corporate Affairs Commission Registration',
    areaServed: {
      '@type': 'Country',
      name: 'Nigeria',
    },
    description:
      'Accredited online registration for Nigerian businesses: Business Names (Sole Proprietorships/Partnerships), Limited Liability Companies (LLC/LTD), and Incorporated Trustees (NGOs).',
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
        item: 'https://lorabiz.com/services/cac',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'CAC Registration',
        item: 'https://lorabiz.com/services/cac',
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
